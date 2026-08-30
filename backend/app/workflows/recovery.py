import os
import logging
import inngest
from dotenv import load_dotenv

load_dotenv()

# Enable local Inngest development mode
os.environ["INNGEST_DEV"] = "1"

from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import RecoveryCase, AIDecision, RecoveryAction, AuditLog, Payment, Subscription, Customer
from app.services.ai.agent import get_ai_decision
from app.services.policy.engine import evaluate_policy
from app.services.razorpay.client import razorpay_client

logger = logging.getLogger("uvicorn")

# Initialize the Inngest client
inngest_client = inngest.Inngest(
    app_id="revenue-recovery-agent",
)

def get_db_session() -> Session:
    return SessionLocal()

@inngest_client.create_function(
    fn_id="payment-recovery-workflow",
    trigger=inngest.TriggerEvent(event="recovery/payment.failed"),
)
async def payment_recovery_workflow(ctx: inngest.Context) -> str:
    """
    Main event-driven recovery workflow. Executes contextual analysis,
    checks policies, runs actions, sleeps, and waits for webhooks durably.
    """
    event_data = ctx.event.data
    case_id = event_data.get("case_id")
    payment_id = event_data.get("payment_id")
    
    if not case_id:
        raise ValueError("Missing case_id in event payload")

    # Step 1: Gather context and run AI diagnosis
    async def run_ai_step() -> dict:
        db = get_db_session()
        try:
            case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
            if not case:
                return {"error": "Case not found"}
            
            customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
            payment = db.query(Payment).filter(Payment.id == case.payment_id).first()
            subscription = db.query(Subscription).filter(Subscription.id == case.subscription_id).first() if case.subscription_id else None
            
            # Fetch past history
            past_success = db.query(Payment).filter(
                Payment.customer_id == case.customer_id,
                Payment.status == "captured",
                Payment.id != case.payment_id
            ).count()
            
            past_failed = db.query(Payment).filter(
                Payment.customer_id == case.customer_id,
                Payment.status == "failed",
                Payment.id != case.payment_id
            ).count()

            context = {
                "amount": case.amount_at_risk,
                "retry_count": case.retry_count,
                "problem_type": case.problem_type,
                "failure_reason": payment.failure_reason if payment else "UNKNOWN",
                "subscription_status": subscription.status if subscription else "active",
                "previous_successful_payments": past_success,
                "previous_failed_payments": past_failed
            }
            
            # Call AI reasoning service (will check Gemini key, fallback if not present)
            decision = await get_ai_decision(context)
            
            # Save AI Decision in database
            ai_decision_rec = AIDecision(
                recovery_case_id=case_id,
                diagnosis=decision.diagnosis,
                recommended_action=decision.action,
                delay_minutes=decision.delay_minutes,
                confidence=decision.confidence,
                reason=decision.reason,
                model_name="Gemini 3.5 Flash"
            )
            db.add(ai_decision_rec)
            
            # Add audit log
            audit = AuditLog(
                recovery_case_id=case_id,
                event_type="AI_DIAGNOSIS",
                actor="AI",
                payload=decision.dict()
            )
            db.add(audit)
            
            # Update status
            case.status = "ANALYZING"
            db.commit()
            
            return {
                "ai_decision": decision.dict(),
                "subscription_status": context["subscription_status"],
                "failure_reason": context["failure_reason"]
            }
        finally:
            db.close()

    ai_result = await ctx.step.run("ai-diagnosis", run_ai_step)
    if "error" in ai_result:
        return f"Error: {ai_result['error']}"

    ai_decision = ai_result["ai_decision"]
    subscription_status = ai_result["subscription_status"]

    # Step 2: Policy Engine validation
    async def evaluate_policy_step() -> dict:
        db = get_db_session()
        try:
            case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
            from app.schemas.schemas import AIDecisionSchema
            proposed = AIDecisionSchema(**ai_decision)
            
            # Run deterministic policy check
            policy_res = evaluate_policy(
                amount=case.amount_at_risk,
                current_retry_count=case.retry_count,
                subscription_status=subscription_status,
                proposed_decision=proposed
            )
            
            # Write policy check to audit logs
            audit = AuditLog(
                recovery_case_id=case_id,
                event_type="POLICY_CHECK",
                actor="POLICY_ENGINE",
                payload=policy_res.dict()
            )
            db.add(audit)
            db.commit()
            return policy_res.dict()
        finally:
            db.close()

    policy_result = await ctx.step.run("policy-evaluation", evaluate_policy_step)

    # Determine action and delay (using policy override if applicable)
    action = policy_result.get("overridden_action") or ai_decision["action"]
    delay_minutes = policy_result.get("overridden_delay_minutes") if policy_result.get("overridden_delay_minutes") is not None else ai_decision["delay_minutes"]

    # Step 3: Handle the authorized action
    if action == "STOP":
        async def stop_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                case.status = "STOPPED"
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="STATUS_CHANGED",
                    actor="SYSTEM",
                    payload={"new_status": "STOPPED", "reason": "Policy engine triggered STOP."}
                )
                db.add(audit)
                db.commit()
                return "STOPPED"
            finally:
                db.close()
        return await ctx.step.run("stop-recovery", stop_case)

    elif action == "ESCALATE_HUMAN":
        async def escalate_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                case.status = "ESCALATED"
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="STATUS_CHANGED",
                    actor="SYSTEM",
                    payload={"new_status": "ESCALATED", "reason": policy_result["reason"]}
                )
                db.add(audit)
                db.commit()
                return "ESCALATED"
            finally:
                db.close()
        return await ctx.step.run("escalate-recovery", escalate_case)

    elif action == "RETRY_PAYMENT":
        # Check if we need to sleep (delay_minutes > 0)
        if delay_minutes > 0:
            async def set_waiting() -> str:
                db = get_db_session()
                try:
                    case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                    case.status = "WAITING"
                    audit = AuditLog(
                        recovery_case_id=case_id,
                        event_type="STATUS_CHANGED",
                        actor="SYSTEM",
                        payload={"new_status": "WAITING", "delay_minutes": delay_minutes}
                    )
                    db.add(audit)
                    db.commit()
                    return "WAITING"
                finally:
                    db.close()
            await ctx.step.run("transition-to-waiting", set_waiting)
            
            # Wait durably
            await ctx.step.sleep("retry-delay", f"{delay_minutes}m")

        # Execute retry
        async def execute_retry() -> dict:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                case.retry_count += 1
                case.status = "ACTION_PENDING"
                
                # Call Razorpay trigger retry
                res = razorpay_client.trigger_retry(case.payment_id, case.amount_at_risk)
                
                # Save Action
                act = RecoveryAction(
                    recovery_case_id=case_id,
                    action_type="RETRY_PAYMENT",
                    attempt_number=case.retry_count,
                    status="EXECUTED" if res["success"] else "FAILURE",
                    external_reference=res.get("reference"),
                    result_summary=res.get("message")
                )
                db.add(act)
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="ACTION_EXECUTED",
                    actor="SYSTEM",
                    payload={"action": "RETRY_PAYMENT", "attempt_number": case.retry_count, "result": res}
                )
                db.add(audit)
                db.commit()
                return res
            finally:
                db.close()

        retry_res = await ctx.step.run("execute-payment-retry", execute_retry)
        
        # In mock or test mode, the simulated payment retry is successful immediately.
        # But in a production setup, we pause and wait for the "razorpay/payment.captured" event.
        # Let's write the wait logic to verify syntax and ensure event-driven flow.
        
        # Wait for the webhook update
        webhook_event = await ctx.step.wait_for_event(
            "wait-for-charge-webhook",
            event="razorpay/payment.captured",
            timeout="1h",
            if_=f"async.data.payment_id == '{payment_id}'"
        )
        
        async def process_webhook_result() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                if webhook_event:
                    case.status = "RECOVERED"
                    case.recovered_amount = case.amount_at_risk
                    event_type = "RECOVERED"
                else:
                    # Timeout reached or failure simulated
                    case.status = "FAILED"
                    event_type = "FAILED"
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="STATUS_CHANGED",
                    actor="SYSTEM",
                    payload={"new_status": case.status, "reason": "Observed webhook outcome of payment charge."}
                )
                db.add(audit)
                db.commit()
                return case.status
            finally:
                db.close()
                
        return await ctx.step.run("finalize-retry-case", process_webhook_result)

    elif action == "REQUEST_PAYMENT_UPDATE":
        async def execute_link_creation() -> dict:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
                case.status = "WAITING"
                
                # Call Razorpay create payment link
                res = razorpay_client.create_payment_update_link(
                    customer_name=customer.name,
                    customer_email=customer.email,
                    amount=case.amount_at_risk,
                    case_id=case_id
                )
                
                # Save Action
                act = RecoveryAction(
                    recovery_case_id=case_id,
                    action_type="REQUEST_PAYMENT_UPDATE",
                    attempt_number=1,
                    status="EXECUTED" if res["success"] else "FAILURE",
                    external_reference=res.get("payment_link_id"),
                    result_summary=f"Link created: {res.get('short_url')}"
                )
                db.add(act)
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="ACTION_EXECUTED",
                    actor="SYSTEM",
                    payload={"action": "REQUEST_PAYMENT_UPDATE", "payment_link_url": res.get("short_url"), "result": res}
                )
                db.add(audit)
                db.commit()
                return res
            finally:
                db.close()

        link_res = await ctx.step.run("create-payment-update-link", execute_link_creation)
        payment_link_id = link_res.get("payment_link_id")

        # Wait for the customer to complete payment via the update link.
        # Listen for the captured payment webhook matching this payment link.
        payment_event = await ctx.step.wait_for_event(
            "wait-for-customer-payment",
            event="razorpay/payment.captured",
            timeout="3d",
            if_=f"async.data.payment_link_id == '{payment_link_id}'"
        )
        
        async def finalize_link_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                if payment_event:
                    case.status = "RECOVERED"
                    case.recovered_amount = case.amount_at_risk
                else:
                    case.status = "FAILED"
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="STATUS_CHANGED",
                    actor="SYSTEM",
                    payload={"new_status": case.status, "reason": "Customer payment link action completed or expired."}
                )
                db.add(audit)
                db.commit()
                return case.status
            finally:
                db.close()

        return await ctx.step.run("finalize-link-case", finalize_link_case)
        
    return "UNKNOWN_ACTION"
