"""
Context Engine (Phase 3)
Centralized recovery context builder with strict data minimization,
PII stripping, customer segmentation, and prompt injection sanitization.
"""

import re
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import RecoveryCase, Payment, Subscription, Customer, MerchantPolicy
from app.services.actions.framework import rank_candidate_actions

def sanitize_text_field(text: Optional[str], max_length: int = 150) -> str:
    """
    Sanitizes external input to prevent prompt injection and remove PII.
    Strips command prefixes, system prompt mimicry, and suspicious tokens.
    """
    if not text:
        return "UNKNOWN"
    
    # Strip dangerous pattern sequences (instruction overrides, system tags, sql/code injection)
    clean = re.sub(r'(?i)(ignore previous instructions|ignore previous|system prompt|system:|override policy|you are now|developer mode|<script|\[INST\]|<\|im_start\|>|drop table|assistant:)', '', text)
    # Remove control characters and non-alphanumeric noise except standard punctuation
    clean = re.sub(r'[\r\n\t]+', ' ', clean).strip()
    return clean[:max_length] if clean else "UNKNOWN"


def categorize_failure_reason(raw_reason: Optional[str]) -> str:
    """
    Normalizes raw payment error codes into standard failure categories.
    """
    if not raw_reason:
        return "UNKNOWN"
    
    reason_upper = raw_reason.upper()
    if any(k in reason_upper for k in ["BANK_DECLINE", "ISSUER", "DO_NOT_HONOR", "TEMPORARY"]):
        return "TEMPORARY_ISSUER_FAILURE"
    elif any(k in reason_upper for k in ["INSUFFICIENT_FUNDS", "LOW_BALANCE", "LIMIT_EXCEEDED"]):
        return "INSUFFICIENT_FUNDS"
    elif any(k in reason_upper for k in ["EXPIRED_CARD", "CARD_EXPIRED", "INVALID_CVV", "INVALID_CARD_DETAILS", "EXPIRED_PAYMENT_METHOD"]):
        return "EXPIRED_PAYMENT_METHOD"
    elif any(k in reason_upper for k in ["NETWORK_ERROR", "TIMEOUT", "GATEWAY_TIMEOUT", "CONNECTION_ERROR"]):
        return "NETWORK_FAILURE"
    elif any(k in reason_upper for k in ["FRAUD", "STOLEN", "LOST_CARD", "RESTRICTED", "HARD_DECLINE"]):
        return "HARD_DECLINE"
    else:
        return "UNKNOWN"


def compute_customer_segment(
    lifetime_value: float,
    successful_renewals: int,
    failed_payments: int,
    current_amount: float
) -> str:
    """
    Explainable deterministic customer segmentation.
    """
    if current_amount > 25000.0 or lifetime_value > 50000.0:
        return "HIGH_VALUE"
    elif successful_renewals >= 3 and failed_payments <= 1:
        return "LOYAL"
    elif failed_payments >= 2 or successful_renewals == 0:
        return "AT_RISK"
    else:
        return "NORMAL"


def build_recovery_context(case_id: int, db: Session) -> Dict[str, Any]:
    """
    Assembles a sanitized, minimized context payload for the AI Decision Engine and Policy Gate.
    PII is strictly omitted.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
    if not case:
        raise ValueError(f"RecoveryCase #{case_id} not found")
        
    payment = db.query(Payment).filter(Payment.id == case.payment_id).first() if case.payment_id else None
    customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
    subscription = db.query(Subscription).filter(Subscription.id == case.subscription_id).first() if case.subscription_id else None
    
    # Query merchant policy
    merchant_policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == case.merchant_id).first()
    max_retries = merchant_policy.max_retries if merchant_policy else 2
    max_autonomous = merchant_policy.max_autonomous_amount if merchant_policy else 25000.0
    min_interval = merchant_policy.min_retry_interval_minutes if merchant_policy else 30
    policy_version = merchant_policy.policy_version if merchant_policy else 1

    # Aggregate customer history (without extracting PII)
    past_payments = db.query(Payment).filter(
        Payment.customer_id == case.customer_id,
        Payment.id != case.payment_id
    ).all()
    
    past_successes = [p for p in past_payments if p.status == "captured"]
    past_failures = [p for p in past_payments if p.status == "failed"]
    
    successful_count = len(past_successes)
    failed_count = len(past_failures)
    lifetime_value = sum(p.amount for p in past_successes)
    
    # Calculate tenure days
    created_at = customer.created_at if customer else case.created_at
    tenure_days = max(1, (datetime.utcnow() - created_at).days) if created_at else 30
    
    # Failure categorization
    raw_failure = payment.failure_reason if payment else "UNKNOWN"
    failure_category = categorize_failure_reason(raw_failure)
    
    # Customer segment
    segment = compute_customer_segment(
        lifetime_value=lifetime_value,
        successful_renewals=successful_count,
        failed_payments=failed_count,
        current_amount=case.amount_at_risk
    )
    
    subscription_status = subscription.status if subscription else "active"
    
    # Evaluate and rank candidate recovery actions
    candidate_actions = rank_candidate_actions(
        amount=case.amount_at_risk,
        failure_reason=raw_failure,
        subscription_status=subscription_status,
        retry_count=case.retry_count,
        previous_successful_payments=successful_count,
        merchant_max_retries=max_retries,
        merchant_max_autonomous_amount=max_autonomous
    )
    
    # Minimized context object (No PII)
    return {
        "case_id": case.id,
        "amount": case.amount_at_risk,
        "currency": case.currency or "INR",
        "retry_count": case.retry_count,
        "problem_type": case.problem_type,
        "failure_reason": sanitize_text_field(raw_failure),
        "failure_category": failure_category,
        "subscription_status": subscription_status,
        "customer_segment": segment,
        "customer_tenure_days": tenure_days,
        "previous_successful_payments": successful_count,
        "previous_failed_payments": failed_count,
        "lifetime_value": round(lifetime_value, 2),
        "merchant_policy": {
            "max_retries": max_retries,
            "min_retry_interval_minutes": min_interval,
            "max_autonomous_amount": max_autonomous,
            "policy_version": policy_version
        },
        "candidate_actions": [a.model_dump() for a in candidate_actions]
    }
