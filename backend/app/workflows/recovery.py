import os
import logging
import inngest
from dotenv import load_dotenv

load_dotenv()

# Enable local Inngest development mode
os.environ["INNGEST_DEV"] = "1"

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import RecoveryCase, AIDecision, RecoveryDecision, RecoveryAction, AuditLog, Payment, Subscription, Customer, MerchantPolicy
from app.services.ai.agent import get_ai_decision
from app.services.policy.engine import evaluate_policy
from app.services.razorpay.client import razorpay_client
from app.services.context.builder import build_recovery_context
from app.schemas.schemas import AIDecisionSchema

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
async def payment_recovery_workflow(ctx: inngest.Context, step: inngest.Step) -> str:
    """
    Main event-driven recovery workflow.
    Executes context gathering, AI reasoning, deterministic policy validation,
    pre-execution safety checks, durable execution, and webhook observation.
    """
    event_data = ctx.event.data
    case_id = event_data.get("case_id")
    payment_id = event_data.get("payment_id")
    
    if not case_id:
        raise ValueError("Missing case_id in event payload")

    # Step 1: Gather sanitized context and run AI diagnosis
    async def run_ai_step() -> dict:
        db = get_db_session()
        try:
            case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
            if not case:
                return {"error": "Case not found"}
            
            case.status = "ANALYZING"
            db.commit()

            # Build sanitized, minimized context (no PII)
            context = build_recovery_context(case_id=case_id, db=db)
            
            # Log context built
            audit_ctx = AuditLog(
                recovery_case_id=case_id,
                event_type="CONTEXT_BUILT",
                actor="SYSTEM",
                payload={
                    "customer_segment": context.get("customer_segment"),
                    "failure_category": context.get("failure_category"),
                    "tenure_days": context.get("customer_tenure_days"),
                    "lifetime_value": context.get("lifetime_value")
                }
            )
            db.add(audit_ctx)

            # Call AI Decision Engine
            case.status = "DECIDING"
            db.commit()
            decision = await get_ai_decision(context)
            
            # Save AI Decision in database
            ai_decision_rec = AIDecision(
                recovery_case_id=case_id,
                diagnosis=decision.diagnosis,
                recommended_action=decision.action,
                delay_minutes=decision.delay_minutes,
                confidence=decision.confidence,
                recovery_probability=decision.recovery_probability,
                expected_recovery_value=decision.expected_recovery_value,
                actions_evaluated=[a.model_dump() for a in decision.actions],
                reason=decision.reason,
                model_name="Gemini 3.5 Flash",
                policy_version=context.get("merchant_policy", {}).get("policy_version", 1)
            )
            db.add(ai_decision_rec)
            
            # Add audit log
            audit = AuditLog(
                recovery_case_id=case_id,
                event_type="AI_ANALYSIS_COMPLETED",
                actor="AI",
                payload={
                    "diagnosis": decision.diagnosis,
                    "action": decision.action,
                    "confidence": decision.confidence,
                    "recovery_probability": decision.recovery_probability,
                    "expected_recovery_value": decision.expected_recovery_value,
                    "reason": decision.reason
                }
            )
            db.add(audit)
            db.commit()
            
            return {
                "ai_decision": decision.model_dump(),
                "subscription_status": context["subscription_status"],
                "failure_reason": context["failure_reason"],
                "merchant_policy": context["merchant_policy"]
            }
        finally:
            db.close()

    ai_result = await step.run("ai-diagnosis", run_ai_step)
    if "error" in ai_result:
        return f"Error: {ai_result['error']}"

    ai_decision = ai_result["ai_decision"]
    subscription_status = ai_result["subscription_status"]
    merchant_policy = ai_result.get("merchant_policy", {})

    # Step 2: Policy Engine validation ("AI proposes. Policy decides.")
    async def evaluate_policy_step() -> dict:
        db = get_db_session()
        try:
            case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
            payment = db.query(Payment).filter(Payment.id == case.payment_id).first() if case.payment_id else None
            payment_status = payment.status if payment else "failed"

            proposed = AIDecisionSchema(**ai_decision)
            
            case.status = "VALIDATING"
            db.commit()

            # Run deterministic policy check
            policy_res = evaluate_policy(
                amount=case.amount_at_risk,
                current_retry_count=case.retry_count,
                subscription_status=subscription_status,
                proposed_decision=proposed,
                payment_status=payment_status,
                max_retries=merchant_policy.get("max_retries", 2),
                min_retry_interval_minutes=merchant_policy.get("min_retry_interval_minutes", 30),
                max_automated_amount=merchant_policy.get("max_autonomous_amount", 25000.0),
                policy_version=merchant_policy.get("policy_version", 1)
            )

            # Persist unified RecoveryDecision record
            rec_decision = RecoveryDecision(
                recovery_case_id=case_id,
                diagnosis=proposed.diagnosis,
                ai_action=proposed.action,
                ai_confidence=proposed.confidence,
                recovery_probability=proposed.recovery_probability,
                expected_recovery_value=proposed.expected_recovery_value or 0.0,
                actions_evaluated=[a.model_dump() for a in proposed.actions],
                policy_decision=policy_res.decision,
                policy_rule=policy_res.rule_triggered,
                policy_reason=policy_res.reason,
                final_action=policy_res.overridden_action or proposed.action,
                delay_minutes=policy_res.overridden_delay_minutes if policy_res.overridden_delay_minutes is not None else proposed.delay_minutes,
                policy_version=policy_res.policy_version
            )
            db.add(rec_decision)
            
            # Write policy check to audit logs
            audit = AuditLog(
                recovery_case_id=case_id,
                event_type="POLICY_EVALUATED",
                actor="POLICY_ENGINE",
                payload=policy_res.model_dump()
            )
            db.add(audit)
            db.commit()
            return policy_res.model_dump()
        finally:
            db.close()

    policy_result = await step.run("policy-evaluation", evaluate_policy_step)

    action = policy_result.get("overridden_action") or ai_decision["action"]
    delay_minutes = policy_result.get("overridden_delay_minutes") if policy_result.get("overridden_delay_minutes") is not None else ai_decision["delay_minutes"]

    # Step 3: Execute authorized action
    if action == "STOP":
        async def stop_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                case.status = "STOPPED"
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="RECOVERY_STOPPED",
                    actor="POLICY_ENGINE",
                    payload={"new_status": "STOPPED", "reason": policy_result.get("reason", "Policy engine triggered STOP.")}
                )
                db.add(audit)
                db.commit()
                return "STOPPED"
            finally:
                db.close()
        return await step.run("stop-recovery", stop_case)

    elif action == "ESCALATE_HUMAN":
        async def escalate_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                case.status = "ESCALATED"
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type="HUMAN_ESCALATED",
                    actor="POLICY_ENGINE",
                    payload={"new_status": "ESCALATED", "reason": policy_result.get("reason")}
                )
                db.add(audit)
                db.commit()
                return "ESCALATED"
            finally:
                db.close()
        return await step.run("escalate-recovery", escalate_case)

    elif action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW"]:
        if delay_minutes > 0:
            async def schedule_delay() -> str:
                db = get_db_session()
                try:
                    case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                    case.status = "SCHEDULED"
                    audit = AuditLog(
                        recovery_case_id=case_id,
                        event_type="ACTION_SCHEDULED",
                        actor="SYSTEM",
                        payload={"action": "RETRY_LATER", "delay_minutes": delay_minutes}
                    )
                    db.add(audit)
                    db.commit()
                    return "SCHEDULED"
                finally:
                    db.close()
            await step.run("transition-to-scheduled", schedule_delay)
            
            # Durable sleep
            await step.sleep("retry-delay", timedelta(minutes=delay_minutes))

        # Pre-Execution Safety Check & Razorpay Execution
        async def execute_retry() -> dict:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                payment = db.query(Payment).filter(Payment.id == case.payment_id).first() if case.payment_id else None

                # Pre-execution check: Never execute if payment was captured during sleep
                if payment and payment.status == "captured":
                    case.status = "RECOVERED"
                    case.recovered_amount = case.amount_at_risk
                    db.commit()
                    return {"success": True, "aborted": True, "message": "Payment already captured during cooldown window."}

                case.retry_count += 1
                case.status = "ACTION_PENDING"
                
                # Execute Razorpay charge retry
                res = razorpay_client.trigger_retry(case.payment_id, case.amount_at_risk)
                
                # Save Attempt
                act = RecoveryAction(
                    recovery_case_id=case_id,
                    action_type="RETRY_PAYMENT",
                    attempt_number=case.retry_count,
                    status="EXECUTED" if res.get("success") else "FAILURE",
                    external_reference=res.get("reference"),
                    result_summary=res.get("message"),
                    amount_attempted=case.amount_at_risk,
                    amount_recovered=case.amount_at_risk if res.get("success") else 0.0,
                    customer_friction="LOW",
                    estimated_cost=5.0
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

        retry_res = await step.run("execute-payment-retry", execute_retry)
        if retry_res.get("aborted"):
            return "RECOVERED"

        # Wait for Razorpay capture webhook
        webhook_event = await step.wait_for_event(
            "wait-for-charge-webhook",
            event="razorpay/payment.captured",
            timeout=timedelta(hours=1),
            if_exp=f"async.data.payment_id == '{payment_id}'"
        )
        
        async def process_webhook_result() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                if webhook_event:
                    case.status = "RECOVERED"
                    case.recovered_amount = case.amount_at_risk
                    audit_type = "PAYMENT_RECOVERED"
                else:
                    case.status = "FAILED"
                    audit_type = "RECOVERY_FAILED"
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type=audit_type,
                    actor="RAZORPAY_WEBHOOK" if webhook_event else "SYSTEM",
                    payload={"new_status": case.status, "recovered_amount": case.recovered_amount}
                )
                db.add(audit)
                db.commit()
                return case.status
            finally:
                db.close()
                
        return await step.run("finalize-retry-case", process_webhook_result)

    elif action in ["REQUEST_PAYMENT_UPDATE", "PAYMENT_UPDATE"]:
        async def execute_link_creation() -> dict:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
                case.status = "WAITING"
                
                cust_name = customer.name if customer else "Valued Customer"
                cust_email = customer.email if customer else "customer@example.com"

                res = razorpay_client.create_payment_update_link(
                    customer_name=cust_name,
                    customer_email=cust_email,
                    amount=case.amount_at_risk,
                    case_id=case_id
                )
                
                act = RecoveryAction(
                    recovery_case_id=case_id,
                    action_type="REQUEST_PAYMENT_UPDATE",
                    attempt_number=1,
                    status="EXECUTED" if res.get("success") else "FAILURE",
                    external_reference=res.get("payment_link_id"),
                    result_summary=f"Link created: {res.get('short_url')}",
                    amount_attempted=case.amount_at_risk,
                    amount_recovered=0.0,
                    customer_friction="MEDIUM",
                    estimated_cost=15.0
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

        link_res = await step.run("create-payment-update-link", execute_link_creation)
        payment_link_id = link_res.get("payment_link_id")

        # Wait for customer to complete payment
        payment_event = await step.wait_for_event(
            "wait-for-customer-payment",
            event="razorpay/payment.captured",
            timeout=timedelta(days=3),
            if_exp=f"async.data.payment_link_id == '{payment_link_id}'"
        )
        
        async def finalize_link_case() -> str:
            db = get_db_session()
            try:
                case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
                if payment_event:
                    case.status = "RECOVERED"
                    case.recovered_amount = case.amount_at_risk
                    event_type = "PAYMENT_RECOVERED"
                else:
                    case.status = "FAILED"
                    event_type = "RECOVERY_FAILED"
                
                audit = AuditLog(
                    recovery_case_id=case_id,
                    event_type=event_type,
                    actor="RAZORPAY_WEBHOOK" if payment_event else "SYSTEM",
                    payload={"new_status": case.status, "recovered_amount": case.recovered_amount}
                )
                db.add(audit)
                db.commit()
                return case.status
            finally:
                db.close()

        return await step.run("finalize-link-case", finalize_link_case)
        
    return "UNKNOWN_ACTION"
