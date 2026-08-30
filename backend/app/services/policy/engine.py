from typing import Optional
from app.schemas.schemas import AIDecisionSchema, PolicyEvaluationResult

def evaluate_policy(
    amount: float,
    current_retry_count: int,
    subscription_status: Optional[str],  # active, cancelled, etc.
    proposed_decision: AIDecisionSchema,
    max_retries: int = 2,
    min_retry_interval_minutes: int = 30,
    max_automated_amount: float = 25000.0
) -> PolicyEvaluationResult:
    """
    Deterministic safety policy engine that intercepts the LLM's proposed action
    and either approves, blocks, overrides, or escalates it.
    """
    action = proposed_decision.action
    delay = proposed_decision.delay_minutes

    # Rule 1: Subscription is explicitly cancelled -> Never Retry, STOP.
    if subscription_status == "cancelled" or subscription_status == "halted":
        if action == "RETRY_PAYMENT":
            return PolicyEvaluationResult(
                allowed=True,
                decision="APPROVED",
                reason="Subscription is cancelled or halted. Policy overridden to STOP to avoid unauthorized billing.",
                overridden_action="STOP",
                overridden_delay_minutes=0
            )

    # Rule 2: Exceeded maximum allowed retries -> Force Escalate to Human.
    if current_retry_count >= max_retries:
        if action == "RETRY_PAYMENT":
            return PolicyEvaluationResult(
                allowed=True,
                decision="ESCALATED",
                reason=f"Maximum retry limit ({max_retries}) reached. Escalating to human support.",
                overridden_action="ESCALATE_HUMAN",
                overridden_delay_minutes=0
            )

    # Rule 3: Single transaction amount too high for autonomous recovery -> Escalate.
    if amount > max_automated_amount:
        if action in ["RETRY_PAYMENT", "REQUEST_PAYMENT_UPDATE"]:
            return PolicyEvaluationResult(
                allowed=True,
                decision="ESCALATED",
                reason=f"At-risk amount (₹{amount}) exceeds maximum automated threshold (₹{max_automated_amount}). Escalated for human review.",
                overridden_action="ESCALATE_HUMAN",
                overridden_delay_minutes=0
            )

    # Rule 4: Validate minimum delay for payments. Enforce 30-min window if proposed too short.
    if action == "RETRY_PAYMENT" and delay < min_retry_interval_minutes:
        return PolicyEvaluationResult(
            allowed=True,
            decision="DELAYED",
            reason=f"Proposed delay ({delay}m) is shorter than the minimum safe retry interval ({min_retry_interval_minutes}m). Forcing 30m delay.",
            overridden_action="RETRY_PAYMENT",
            overridden_delay_minutes=min_retry_interval_minutes
        )

    # If action is already Escalate or Stop, approve it immediately.
    if action in ["ESCALATE_HUMAN", "STOP"]:
        return PolicyEvaluationResult(
            allowed=True,
            decision="APPROVED",
            reason="Merchant policy approves immediate escalation or cessation of recovery case."
        )

    # Otherwise, action is within policy limits and approved.
    return PolicyEvaluationResult(
        allowed=True,
        decision="APPROVED",
        reason="Action is within policy retry, amount, and delay limitations."
    )
