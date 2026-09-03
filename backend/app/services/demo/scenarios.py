"""
Curated Deterministic Demo Scenarios (Phase 15)
Seeds realistic payment failure cases representing diverse failure archetypes,
customer segments, amounts, and policy guardrail conditions.
"""

from typing import List, Dict, Any

CURATED_SCENARIOS: List[Dict[str, Any]] = [
    # Scenario A: Temporary Bank Network Decline (Loyal Customer)
    {
        "case_id": 1,
        "customer_id": "cust_demo_001",
        "customer_name": "Priya Sharma",
        "customer_email": "priya.sharma@example.com",
        "amount": 1999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "BANK_DECLINE",
        "subscription_status": "active",
        "previous_successful_payments": 8,
        "retry_count": 0,
        "status": "RECOVERED",
        "recovered_amount": 1999.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.94,
        "recovery_probability": 0.72,
        "delay_minutes": 60,
        "ai_diagnosis": "Temporary issuer bank routing glitch. Customer has 8 consecutive successful renewals over 240 days.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "RETRY_PAYMENT"
    },
    # Scenario B: Expired Card Credentials
    {
        "case_id": 2,
        "customer_id": "cust_demo_002",
        "customer_name": "Vikram Malhotra",
        "customer_email": "vikram.m@example.com",
        "amount": 2999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "EXPIRED_CARD",
        "subscription_status": "active",
        "previous_successful_payments": 3,
        "retry_count": 0,
        "status": "WAITING",
        "recovered_amount": 0.0,
        "ai_action": "REQUEST_PAYMENT_UPDATE",
        "ai_confidence": 0.91,
        "recovery_probability": 0.52,
        "delay_minutes": 0,
        "ai_diagnosis": "Card expiration date passed. Direct charge retries will fail with 100% certainty. Generated Razorpay payment update link.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "REQUEST_PAYMENT_UPDATE"
    },
    # Scenario C: Cancelled Subscription (Policy Guardrail Stop)
    {
        "case_id": 3,
        "customer_id": "cust_demo_003",
        "customer_name": "Rohan Mehta",
        "customer_email": "rohan.mehta@example.com",
        "amount": 1499.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "BANK_DECLINE",
        "subscription_status": "cancelled",
        "previous_successful_payments": 5,
        "retry_count": 0,
        "status": "STOPPED",
        "recovered_amount": 0.0,
        "ai_action": "STOP",
        "ai_confidence": 0.98,
        "recovery_probability": 0.0,
        "delay_minutes": 0,
        "ai_diagnosis": "Subscription was cancelled by user prior to billing cycle.",
        "policy_decision": "APPROVED",
        "policy_rule": "SUBSCRIPTION_CANCELLED_STOP",
        "final_action": "STOP"
    },
    # Scenario D: High-Value Enterprise Account (Policy Escalation)
    {
        "case_id": 4,
        "customer_id": "cust_demo_004",
        "customer_name": "Arjun Enterprises",
        "customer_email": "billing@arjunenterprises.in",
        "amount": 48000.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "BANK_DECLINE",
        "subscription_status": "active",
        "previous_successful_payments": 4,
        "retry_count": 0,
        "status": "ESCALATED",
        "recovered_amount": 0.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.88,
        "recovery_probability": 0.65,
        "delay_minutes": 60,
        "ai_diagnosis": "High-value enterprise renewal. High lifetime customer.",
        "policy_decision": "ESCALATED",
        "policy_rule": "AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT",
        "final_action": "ESCALATE_HUMAN"
    },
    # Scenario E: Repeat Failure Reaching Retry Ceiling
    {
        "case_id": 5,
        "customer_id": "cust_demo_005",
        "customer_name": "Neha Joshi",
        "customer_email": "neha.joshi@example.com",
        "amount": 3499.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "INSUFFICIENT_FUNDS",
        "subscription_status": "active",
        "previous_successful_payments": 2,
        "retry_count": 2,
        "status": "ESCALATED",
        "recovered_amount": 0.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.60,
        "recovery_probability": 0.25,
        "delay_minutes": 120,
        "ai_diagnosis": "Repeat failure across 2 attempts. Cooldown exhausted.",
        "policy_decision": "ESCALATED",
        "policy_rule": "MAX_RETRIES_EXCEEDED",
        "final_action": "ESCALATE_HUMAN"
    },
    # Scenario F: Low Balance / Salary Cycle Alignment
    {
        "case_id": 6,
        "customer_id": "cust_demo_006",
        "customer_name": "Sneha Reddy",
        "customer_email": "sneha.reddy@example.com",
        "amount": 999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "INSUFFICIENT_FUNDS",
        "subscription_status": "active",
        "previous_successful_payments": 6,
        "retry_count": 0,
        "status": "SCHEDULED",
        "recovered_amount": 0.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.85,
        "recovery_probability": 0.58,
        "delay_minutes": 120,
        "ai_diagnosis": "End-of-month temporary balance shortfall. Scheduled retry with 120-minute cooldown.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "RETRY_PAYMENT"
    },
    # Scenario G: Invalid CVV / Card Re-Authentication
    {
        "case_id": 7,
        "customer_id": "cust_demo_007",
        "customer_name": "Karan Kapoor",
        "customer_email": "karan.k@example.com",
        "amount": 5999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "INVALID_CARD_DETAILS",
        "subscription_status": "active",
        "previous_successful_payments": 1,
        "retry_count": 0,
        "status": "WAITING",
        "recovered_amount": 0.0,
        "ai_action": "REQUEST_PAYMENT_UPDATE",
        "ai_confidence": 0.90,
        "recovery_probability": 0.48,
        "delay_minutes": 0,
        "ai_diagnosis": "Card token rejected due to 3DS mandate re-registration requirement. Emitted payment link.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "REQUEST_PAYMENT_UPDATE"
    },
    # Scenario H: Network Timeout on High Trust Account
    {
        "case_id": 8,
        "customer_id": "cust_demo_008",
        "customer_name": "Anjali Bose",
        "customer_email": "anjali.bose@example.com",
        "amount": 4999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "NETWORK_ERROR",
        "subscription_status": "active",
        "previous_successful_payments": 11,
        "retry_count": 0,
        "status": "RECOVERED",
        "recovered_amount": 4999.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.96,
        "recovery_probability": 0.80,
        "delay_minutes": 30,
        "ai_diagnosis": "Payment gateway handshake timeout during peak traffic window. Successfully recovered upon delayed retry.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "RETRY_PAYMENT"
    },
    # Scenario I: Cancelled Plan on Second Month
    {
        "case_id": 9,
        "customer_id": "cust_demo_009",
        "customer_name": "Deepak Patel",
        "customer_email": "deepak.patel@example.com",
        "amount": 799.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "EXPIRED_CARD",
        "subscription_status": "cancelled",
        "previous_successful_payments": 1,
        "retry_count": 0,
        "status": "STOPPED",
        "recovered_amount": 0.0,
        "ai_action": "STOP",
        "ai_confidence": 0.99,
        "recovery_probability": 0.0,
        "delay_minutes": 0,
        "ai_diagnosis": "Customer opted out of renewal. Strict policy block applied.",
        "policy_decision": "APPROVED",
        "policy_rule": "SUBSCRIPTION_CANCELLED_STOP",
        "final_action": "STOP"
    },
    # Scenario J: Proactive Recovery for VIP Annual Plan
    {
        "case_id": 10,
        "customer_id": "cust_demo_010",
        "customer_name": "Suresh Nair",
        "customer_email": "suresh.nair@example.com",
        "amount": 19999.0,
        "currency": "INR",
        "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
        "failure_reason": "BANK_DECLINE",
        "subscription_status": "active",
        "previous_successful_payments": 3,
        "retry_count": 0,
        "status": "RECOVERED",
        "recovered_amount": 19999.0,
        "ai_action": "RETRY_LATER",
        "ai_confidence": 0.92,
        "recovery_probability": 0.68,
        "delay_minutes": 60,
        "ai_diagnosis": "VIP annual billing cycle temporary decline. Within ₹25k limit.",
        "policy_decision": "APPROVED",
        "policy_rule": "POLICY_APPROVED_STANDARD",
        "final_action": "RETRY_PAYMENT"
    }
]


def seed_demo_database(db):
    """
    Clears current transaction tables and seeds the curated demo scenarios.
    """
    from app.models.models import (
        Merchant, MerchantPolicy, Customer, Subscription, Payment,
        RecoveryCase, AIDecision, RecoveryDecision, RecoveryAction, AuditLog
    )
    from datetime import datetime, timedelta

    # Delete existing test data
    db.query(RecoveryDecision).delete()
    db.query(AIDecision).delete()
    db.query(RecoveryAction).delete()
    db.query(AuditLog).delete()
    db.query(RecoveryCase).delete()
    db.query(Payment).delete()
    db.query(Subscription).delete()
    db.query(Customer).delete()
    db.commit()

    # Merchant and Policy
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="Default Merchant")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant.id).first()
    if not policy:
        policy = MerchantPolicy(
            merchant_id=merchant.id,
            max_retries=2,
            min_retry_interval_minutes=30,
            max_autonomous_amount=25000.0,
            high_value_action="ESCALATE_HUMAN",
            policy_version=1
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)

    now = datetime.utcnow()

    for sc in CURATED_SCENARIOS:
        # 1. Customer
        cust = Customer(
            id=sc["customer_id"],
            name=sc["customer_name"],
            email=sc["customer_email"]
        )
        db.add(cust)
        db.flush()

        # 2. Subscription
        sub = Subscription(
            id=f"sub_{sc['case_id']}",
            merchant_id=merchant.id,
            customer_id=cust.id,
            plan_name="Pro Plan",
            amount=sc["amount"],
            currency=sc["currency"],
            status=sc["subscription_status"],
            created_at=now - timedelta(days=sc["previous_successful_payments"] * 30)
        )
        db.add(sub)
        db.flush()

        # 3. Payment
        pay = Payment(
            id=f"pay_demo_{sc['case_id']}",
            merchant_id=merchant.id,
            customer_id=cust.id,
            subscription_id=sub.id,
            amount=sc["amount"],
            currency=sc["currency"],
            status="captured" if sc["status"] == "RECOVERED" else "failed",
            failure_reason=sc["failure_reason"],
            created_at=now - timedelta(minutes=45)
        )
        db.add(pay)
        db.flush()

        # 4. Recovery Case
        case = RecoveryCase(
            id=sc["case_id"],
            merchant_id=merchant.id,
            customer_id=cust.id,
            payment_id=pay.id,
            subscription_id=sub.id,
            problem_type=sc["problem_type"],
            amount_at_risk=sc["amount"],
            recovered_amount=sc["recovered_amount"],
            currency=sc["currency"],
            status=sc["status"],
            retry_count=sc["retry_count"],
            recovery_window_started_at=now - timedelta(minutes=40),
            created_at=now - timedelta(minutes=40),
            updated_at=now
        )
        db.add(case)
        db.flush()

        # 5. AI Decision
        ai_dec = AIDecision(
            recovery_case_id=case.id,
            diagnosis=sc["ai_diagnosis"],
            recommended_action=sc["ai_action"],
            delay_minutes=sc["delay_minutes"],
            confidence=sc["ai_confidence"],
            recovery_probability=sc["recovery_probability"],
            expected_recovery_value=round(sc["amount"] * sc["recovery_probability"] - 5.0, 2),
            reason=sc["ai_diagnosis"],
            model_name="Gemini 3.5 Flash",
            policy_version=1
        )
        db.add(ai_dec)

        # 6. Recovery Decision
        rec_dec = RecoveryDecision(
            recovery_case_id=case.id,
            diagnosis=sc["ai_diagnosis"],
            ai_action=sc["ai_action"],
            ai_confidence=sc["ai_confidence"],
            recovery_probability=sc["recovery_probability"],
            expected_recovery_value=round(sc["amount"] * sc["recovery_probability"] - 5.0, 2),
            policy_decision=sc["policy_decision"],
            policy_rule=sc["policy_rule"],
            policy_reason=sc["ai_diagnosis"],
            final_action=sc["final_action"],
            delay_minutes=sc["delay_minutes"],
            policy_version=1
        )
        db.add(rec_dec)

        # 7. Recovery Action
        action = RecoveryAction(
            recovery_case_id=case.id,
            action_type=sc["final_action"],
            attempt_number=sc["retry_count"] + 1 if sc["retry_count"] > 0 else 1,
            status="captured" if sc["status"] == "RECOVERED" else "EXECUTED",
            amount_attempted=sc["amount"],
            amount_recovered=sc["recovered_amount"],
            customer_friction="LOW" if sc["final_action"] == "RETRY_PAYMENT" else "MEDIUM",
            estimated_cost=5.0 if sc["final_action"] == "RETRY_PAYMENT" else 15.0,
            result_summary=f"Processed with rule {sc['policy_rule']}"
        )
        db.add(action)

        # 8. Audit Logs
        db.add(AuditLog(
            recovery_case_id=case.id,
            event_type="CONTEXT_BUILT",
            actor="SYSTEM",
            payload={"customer": sc["customer_name"], "amount": sc["amount"]}
        ))
        db.add(AuditLog(
            recovery_case_id=case.id,
            event_type="AI_ANALYSIS_COMPLETED",
            actor="AI",
            payload={"action": sc["ai_action"], "confidence": sc["ai_confidence"]}
        ))
        db.add(AuditLog(
            recovery_case_id=case.id,
            event_type="POLICY_EVALUATED",
            actor="POLICY_ENGINE",
            payload={"decision": sc["policy_decision"], "rule": sc["policy_rule"]}
        ))
        if sc["status"] == "RECOVERED":
            db.add(AuditLog(
                recovery_case_id=case.id,
                event_type="PAYMENT_RECOVERED",
                actor="RAZORPAY_WEBHOOK",
                payload={"amount": sc["recovered_amount"]}
            ))

    db.commit()
    return len(CURATED_SCENARIOS)
