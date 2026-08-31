import logging
import hmac
import hashlib
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import inngest
import inngest.fast_api
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from app.core.config import settings
from app.db.session import engine, Base, get_db
from app.models.models import Merchant, Customer, Payment, Subscription, RecoveryCase, AIDecision, RecoveryAction, AuditLog
from app.schemas.schemas import RecoveryCaseResponse, DashboardMetrics, AuditLogResponse
from app.workflows.recovery import inngest_client, payment_recovery_workflow
from app.services.razorpay.client import razorpay_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# Database auto-creation for PostgreSQL
def create_db_if_not_exists():
    if settings.DATABASE_URL.startswith("sqlite"):
        return
    db_name = settings.DATABASE_URL.rsplit('/', 1)[1]
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
    except psycopg2.OperationalError as e:
        if "does not exist" in str(e) or "database" in str(e):
            try:
                conn = psycopg2.connect(base_url)
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE {db_name}")
                cursor.close()
                conn.close()
                logger.info(f"Database '{db_name}' created successfully.")
            except Exception as ex:
                logger.error(f"Failed to auto-create PostgreSQL database: {ex}")
        else:
            logger.error(f"PostgreSQL connection error: {e}")

create_db_if_not_exists()

# Initialize FastAPI App
app = FastAPI(title="AI Revenue Recovery Agent Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Setup Inngest Route serving
inngest.fast_api.serve(app, inngest_client, [payment_recovery_workflow])


# ==========================================
# Event Processor (Constraint 5, 6, 7)
# Shared by real and simulated webhooks
# ==========================================
async def process_razorpay_event_logic(event: str, payload: dict, db: Session) -> dict:
    """
    Core event processing logic. Implements idempotency checks,
    state transitions, database upserts, and triggers background workflows.
    """
    event_id = payload.get("id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event ID")

    # Idempotency check: Check if event ID is already logged in AuditLog payload
    existing_event = db.query(AuditLog).filter(
        AuditLog.payload.op("->>")("event_id") == event_id
    ).first()
    if existing_event:
        logger.info(f"Idempotency Guard: Event {event_id} already processed. Skipping.")
        return {"status": "ignored", "reason": "duplicate_event"}

    # Extract event entity
    event_data = payload.get("payload", {})
    payment_data = event_data.get("payment", {}).get("entity", {})
    
    # We may also receive payment link status updates
    payment_link_data = event_data.get("payment_link", {}).get("entity", {})
    if payment_link_data and not payment_data:
        # Parse payment from inside payment link if available
        payment_data = payment_link_data.get("payment", {})

    payment_id = payment_data.get("id")
    customer_details = payment_data.get("customer_details", {}) or {}
    
    # Get or create default merchant for simplicity
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="Default Merchant")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    # Process failure
    if event == "payment.failed":
        # Upsert Customer
        cust_id = payment_data.get("customer_id") or f"cust_{payment_id[4:12]}"
        customer = db.query(Customer).filter(Customer.id == cust_id).first()
        if not customer:
            customer = Customer(
                id=cust_id,
                merchant_id=merchant.id,
                name=customer_details.get("name", "Rahul Kumar"),
                email=customer_details.get("email", "rahul.kumar@example.com")
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # Upsert Payment
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            payment = Payment(
                id=payment_id,
                merchant_id=merchant.id,
                customer_id=customer.id,
                amount=float(payment_data.get("amount", 199900)) / 100.0, # paise to rupees
                currency=payment_data.get("currency", "INR"),
                status="failed",
                failure_reason=payment_data.get("error_code", "BANK_DECLINE")
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

        # Upsert Subscription
        subscription_id = payment_data.get("subscription_id")
        subscription = None
        if subscription_id:
            subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
            if not subscription:
                subscription = Subscription(
                    id=subscription_id,
                    merchant_id=merchant.id,
                    customer_id=customer.id,
                    amount=payment.amount,
                    status="active",
                    next_billing_date=datetime.utcnow() + timedelta(days=30)
                )
                db.add(subscription)
                db.commit()
                db.refresh(subscription)

        # Idempotent Case Creation
        case = db.query(RecoveryCase).filter(
            RecoveryCase.payment_id == payment_id
        ).first()
        
        is_new_case = False
        if not case:
            case = RecoveryCase(
                merchant_id=merchant.id,
                customer_id=customer.id,
                payment_id=payment.id,
                subscription_id=subscription.id if subscription else None,
                problem_type="SUBSCRIPTION_PAYMENT_FAILED" if subscription_id else "PAYMENT_FAILED",
                amount_at_risk=payment.amount,
                status="AT_RISK"
            )
            db.add(case)
            db.commit()
            db.refresh(case)
            is_new_case = True
            
            # Log Case Creation
            audit = AuditLog(
                recovery_case_id=case.id,
                event_type="CASE_CREATED",
                actor="SYSTEM",
                payload={"event_id": event_id, "source": "razorpay_webhook"}
            )
            db.add(audit)
            db.commit()

        # Trigger Inngest workflow ONLY for newly created cases to prevent infinite loops
        if is_new_case:
            logger.info(f"Triggering Inngest workflow for case: {case.id}")
            try:
                await inngest_client.send(
                    inngest.Event(
                        name="recovery/payment.failed",
                        data={
                            "case_id": case.id,
                            "payment_id": payment.id
                        }
                    )
                )
            except Exception as ex:
                logger.warning(f"Inngest event dispatch skipped or unavailable: {ex}")
        return {"status": "processed", "case_id": case.id, "action": "created_case"}

    elif event in ["payment.captured", "payment.authorized"]:
        # Mark payment as captured
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if payment:
            payment.status = "captured"
            db.commit()

        # Check if this captured payment belongs to an active recovery case
        # (either matching payment_id directly, or matching subscription_id renewal)
        case = None
        if payment:
            case = db.query(RecoveryCase).filter(
                RecoveryCase.payment_id == payment.id,
                RecoveryCase.status.in_(["ACTION_PENDING", "WAITING", "ANALYZING", "AT_RISK"])
            ).first()
            
            # Or if it's a subscription renewal retry
            if not case and payment_data.get("subscription_id"):
                case = db.query(RecoveryCase).filter(
                    RecoveryCase.subscription_id == payment_data.get("subscription_id"),
                    RecoveryCase.status.in_(["ACTION_PENDING", "WAITING", "ANALYZING", "AT_RISK"])
                ).first()

        # Check if it was from a payment link
        payment_link_id = payment_link_data.get("id") if payment_link_data else None
        if not case and payment_link_id:
            # Query recovery action by link ID
            act = db.query(RecoveryAction).filter(
                RecoveryAction.external_reference == payment_link_id
            ).first()
            if act:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == act.recovery_case_id).first()

        if case:
            # Audit log
            audit = AuditLog(
                recovery_case_id=case.id,
                event_type="WEBHOOK_RECEIVED",
                actor="RAZORPAY_WEBHOOK",
                payload={"event_id": event_id, "event": event, "payment_id": payment_id}
            )
            db.add(audit)
            db.commit()

            # Send event to resume the waiting Inngest step
            logger.info(f"Emitting Inngest event razorpay/payment.captured for case: {case.id}")
            try:
                await inngest_client.send(
                    inngest.Event(
                        name="razorpay/payment.captured",
                        data={
                            "payment_id": payment_id,
                            "payment_link_id": payment_link_id
                        }
                    )
                )
            except Exception as ex:
                logger.warning(f"Inngest event dispatch skipped or unavailable: {ex}")
            return {"status": "processed", "case_id": case.id, "action": "sent_resume_event"}

    # Fallback response for unhandled events
    return {"status": "ignored", "reason": "unhandled_event"}


# ==========================================
# REST API Endpoints
# ==========================================

@app.get("/health")
def health():
    return {"status": "healthy", "time": datetime.now(datetime.timezone.utc).isoformat()}


@app.get("/api/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Calculate high-level recovery metrics.
    """
    cases = db.query(RecoveryCase).all()
    
    revenue_at_risk = sum(c.amount_at_risk for c in cases)
    recovered_revenue = sum(c.recovered_amount for c in cases)
    cases_processed = len(cases)
    
    successful_recoveries = sum(1 for c in cases if c.status == "RECOVERED")
    escalations = sum(1 for c in cases if c.status == "ESCALATED")
    stopped_cases = sum(1 for c in cases if c.status == "STOPPED")
    
    recovery_rate = (recovered_revenue / revenue_at_risk * 100.0) if revenue_at_risk > 0 else 0.0
    
    return DashboardMetrics(
        revenue_at_risk=revenue_at_risk,
        recovered_revenue=recovered_revenue,
        recovery_rate=recovery_rate,
        cases_processed=cases_processed,
        successful_recoveries=successful_recoveries,
        escalations=escalations,
        stopped_cases=stopped_cases
    )


@app.get("/api/recovery-cases", response_model=list[RecoveryCaseResponse])
def list_recovery_cases(status: str = None, db: Session = Depends(get_db)):
    """
    List recovery cases with optional status filter.
    """
    query = db.query(RecoveryCase)
    if status:
        query = query.filter(RecoveryCase.status == status)
    # Order by creation date desc
    return query.order_by(RecoveryCase.created_at.desc()).all()


@app.get("/api/recovery-cases/{id}", response_model=RecoveryCaseResponse)
def get_recovery_case_detail(id: int, db: Session = Depends(get_db)):
    """
    Fetch comprehensive recovery case detail including decisions, actions, and audit logs.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.post("/api/recovery-cases/{id}/analyze")
async def manual_trigger_analysis(id: int, db: Session = Depends(get_db)):
    """
    Manually trigger/force-retry the Inngest workflow for testing.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Emit workflow event
    await inngest_client.send(
        inngest.Event(
            name="recovery/payment.failed",
            data={
                "case_id": case.id,
                "payment_id": case.payment_id
            }
        )
    )
    return {"status": "triggered", "message": f"Durable workflow triggered for Case #{id}"}


@app.post("/api/recovery-cases/{id}/actions/retry")
async def manual_retry_action(id: int, db: Session = Depends(get_db)):
    """
    Trigger an immediate payment charge retry action directly on the case.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.retry_count += 1
    case.status = "ACTION_PENDING"
    
    # Trigger Razorpay client retry
    res = razorpay_client.trigger_retry(case.payment_id, case.amount_at_risk)
    
    # Record action
    action = RecoveryAction(
        recovery_case_id=case.id,
        action_type="RETRY_PAYMENT",
        attempt_number=case.retry_count,
        external_reference=res.get("reference"),
        status=res.get("status", "initiated"),
        result_summary=res.get("message", "Manual payment retry initiated via operator console.")
    )
    db.add(action)
    
    # Record audit log
    audit = AuditLog(
        recovery_case_id=case.id,
        event_type="OPERATOR_MANUAL_RETRY",
        actor="HUMAN_OPERATOR",
        payload={"attempt": case.retry_count, "result": res}
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    return {"status": "success", "message": f"Payment retry attempt #{case.retry_count} dispatched.", "case": case}


@app.post("/api/recovery-cases/{id}/actions/payment-link")
async def generate_payment_link_action(id: int, db: Session = Depends(get_db)):
    """
    Generate or send a Razorpay payment update link for the customer.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    customer = case.customer or db.query(Customer).filter(Customer.id == case.customer_id).first()
    cust_name = customer.name if customer else "Valued Customer"
    cust_email = customer.email if customer else "customer@example.com"
    
    link_res = razorpay_client.create_payment_update_link(
        customer_name=cust_name,
        customer_email=cust_email,
        amount=case.amount_at_risk,
        case_id=case.id
    )
    
    case.status = "WAITING"
    
    action = RecoveryAction(
        recovery_case_id=case.id,
        action_type="REQUEST_PAYMENT_UPDATE",
        attempt_number=case.retry_count,
        external_reference=link_res.get("payment_link_id"),
        status=link_res.get("status", "created"),
        result_summary=f"Payment link generated: {link_res.get('short_url')}"
    )
    db.add(action)
    
    audit = AuditLog(
        recovery_case_id=case.id,
        event_type="PAYMENT_LINK_CREATED",
        actor="HUMAN_OPERATOR",
        payload=link_res
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    return {"status": "success", "link": link_res, "case": case}


@app.post("/api/recovery-cases/{id}/actions/escalate")
async def manual_escalate_action(id: int, db: Session = Depends(get_db)):
    """
    Manually escalate a case to Human Operations.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.status = "ESCALATED"
    
    action = RecoveryAction(
        recovery_case_id=case.id,
        action_type="ESCALATE_HUMAN",
        attempt_number=case.retry_count,
        status="escalated",
        result_summary="Case manually escalated to Tier-2 Operations Desk."
    )
    db.add(action)
    
    audit = AuditLog(
        recovery_case_id=case.id,
        event_type="MANUAL_ESCALATION",
        actor="HUMAN_OPERATOR",
        payload={"reason": "Manual operator override to customer success"}
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    return {"status": "success", "message": "Case escalated to Human Operations.", "case": case}


@app.post("/api/recovery-cases/{id}/actions/stop")
async def manual_stop_action(id: int, db: Session = Depends(get_db)):
    """
    Stop automated recovery workflows for this case.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.status = "STOPPED"
    
    action = RecoveryAction(
        recovery_case_id=case.id,
        action_type="STOP",
        attempt_number=case.retry_count,
        status="stopped",
        result_summary="Recovery workflows permanently halted by operator."
    )
    db.add(action)
    
    audit = AuditLog(
        recovery_case_id=case.id,
        event_type="MANUAL_HALT",
        actor="HUMAN_OPERATOR",
        payload={"reason": "Operator manually stopped case"}
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    return {"status": "success", "message": "Case stopped safely.", "case": case}


@app.post("/api/recovery-cases/{id}/actions/simulate-payment")
async def simulate_payment_resolution(id: int, db: Session = Depends(get_db)):
    """
    Simulate incoming successful payment event that resolves this case to RECOVERED.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.status = "RECOVERED"
    case.recovered_amount = case.amount_at_risk
    case.recovery_window_ended_at = datetime.utcnow()
    
    payment = db.query(Payment).filter(Payment.id == case.payment_id).first()
    if payment:
        payment.status = "captured"
    
    action = RecoveryAction(
        recovery_case_id=case.id,
        action_type="PAYMENT_CAPTURED",
        attempt_number=case.retry_count,
        status="captured",
        result_summary=f"Full recovery confirmed! INR {case.amount_at_risk:,.2f} successfully captured via Razorpay."
    )
    db.add(action)
    
    audit = AuditLog(
        recovery_case_id=case.id,
        event_type="PAYMENT_RECOVERED",
        actor="SIMULATOR",
        payload={"amount": case.amount_at_risk, "payment_id": case.payment_id}
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    return {"status": "success", "message": f"Case #{id} marked as RECOVERED (INR {case.amount_at_risk:,.2f})", "case": case}


# ==========================================
# Real Webhooks Endpoint (Constraint 5)
# ==========================================
@app.post("/api/webhooks/razorpay")
async def real_webhook_endpoint(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Handle real inbound Razorpay Webhooks. Verifies signatures and calls the shared event processor.
    """
    body = await request.body()
    
    # Verify Webhook signature if settings are enabled
    if settings.razorpay_key_secret and x_razorpay_signature:
        expected_signature = hmac.new(
            settings.razorpay_key_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, x_razorpay_signature):
            logger.warning("Invalid Razorpay webhook signature verified. Rejecting.")
            raise HTTPException(status_code=400, detail="Invalid signature")

    payload = await request.json()
    event_type = payload.get("event")
    
    logger.info(f"Webhook received: {event_type} - ID: {payload.get('id')}")
    
    result = await process_razorpay_event_logic(event_type, payload, db)
    return result


# ==========================================
# Webhook Simulator Endpoint (Constraint 5)
# ==========================================
@app.post("/api/test/trigger-webhook")
async def trigger_simulated_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Simulator route to test webhook flows locally without internet tunnels.
    Shares the exact same event processor as the real webhook endpoint.
    """
    payload = await request.json()
    event_type = payload.get("event")
    
    logger.info(f"Simulated webhook trigger: {event_type} - ID: {payload.get('id')}")
    
    result = await process_razorpay_event_logic(event_type, payload, db)
    return result
