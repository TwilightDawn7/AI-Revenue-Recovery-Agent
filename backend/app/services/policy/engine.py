"""
Deterministic Policy Gate 2.0 (Phase 5)
Strict guardrail engine enforcing:
"AI proposes. Policy decides. Executor performs."
Enforces retry ceilings, autonomous caps, subscription status, idempotency, and concurrency limits.
"""

from typing import Optional, Dict, Any
from app.schemas.schemas import AIDecisionSchema, PolicyEvaluationResult

def evaluate_policy(
    amount: float,
    current_retry_count: int,
    subscription_status: Optional[str],  # active, cancelled, halted, pending
    proposed_decision: AIDecisionSchema,
    payment_status: Optional[str] = "failed",
    is_active_recovery_running: bool = False,
    max_retries: int = 2,
    min_retry_interval_minutes: int = 30,
    max_automated_amount: float = 25000.0,
    policy_version: int = 1
) -> PolicyEvaluationResult:
    """
    Deterministic safety policy engine that intercepts the LLM's proposed action
    and strictly validates, approves, modifies, or blocks it.
    """
    action = proposed_decision.action
    delay = proposed_decision.delay_minutes

    # Rule 0: Payment already captured -> Must STOP immediately to prevent duplicate charge
    if payment_status == "captured":
        return PolicyEvaluationResult(
            allowed=False,
            decision="BLOCKED",
            rule_triggered="PAYMENT_ALREADY_CAPTURED",
            reason="Payment is already successfully captured. Halting recovery to prevent duplicate charge.",
            original_ai_action=action,
            overridden_action="STOP",
            overridden_delay_minutes=0,
            policy_version=policy_version
        )

    # Rule 1: Duplicate / Concurrent recovery protection
    if is_active_recovery_running and action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW"]:
        return PolicyEvaluationResult(
            allowed=False,
            decision="BLOCKED",
            rule_triggered="CONCURRENT_RECOVERY_ACTIVE",
            reason="Another recovery execution is currently active for this payment. Blocking duplicate attempt.",
            original_ai_action=action,
            overridden_action="STOP",
            overridden_delay_minutes=0,
            policy_version=policy_version
        )

    # Rule 2: Cancelled or halted subscription -> Never charge, override to STOP
    if subscription_status in ["cancelled", "halted"]:
        if action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW", "REQUEST_PAYMENT_UPDATE", "PAYMENT_UPDATE"]:
            return PolicyEvaluationResult(
                allowed=True,
                decision="APPROVED",
                rule_triggered="SUBSCRIPTION_CANCELLED_STOP",
                reason="Subscription is cancelled or halted. Policy enforces immediate STOP to avoid unauthorized billing.",
                original_ai_action=action,
                overridden_action="STOP",
                overridden_delay_minutes=0,
                policy_version=policy_version
            )

    # Rule 3: Retry ceiling exceeded -> Escalate to human operations
    if current_retry_count >= max_retries:
        if action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW"]:
            return PolicyEvaluationResult(
                allowed=True,
                decision="ESCALATED",
                rule_triggered="MAX_RETRIES_EXCEEDED",
                reason=f"Maximum retry limit ({max_retries}) reached. Automated retries blocked; escalating to customer operations desk.",
                original_ai_action=action,
                overridden_action="ESCALATE_HUMAN",
                overridden_delay_minutes=0,
                policy_version=policy_version
            )

    # Rule 4: Autonomous Amount Ceiling Check -> Escalate high value
    if amount > max_automated_amount:
        if action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW"]:
            return PolicyEvaluationResult(
                allowed=True,
                decision="ESCALATED",
                rule_triggered="AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT",
                reason=f"At-risk amount (₹{amount:,.2f}) exceeds autonomous recovery ceiling (₹{max_automated_amount:,.2f}). Escalated for white-glove manual outreach.",
                original_ai_action=action,
                overridden_action="ESCALATE_HUMAN",
                overridden_delay_minutes=0,
                policy_version=policy_version
            )

    # Rule 5: Minimum Retry Delay Cooldown Enforcement
    if action in ["RETRY_LATER", "RETRY_PAYMENT", "RETRY_NOW"] and delay < min_retry_interval_minutes:
        return PolicyEvaluationResult(
            allowed=True,
            decision="DELAYED",
            rule_triggered="MINIMUM_COOLDOWN_ENFORCED",
            reason=f"Proposed delay ({delay}m) is below the merchant minimum safe interval ({min_retry_interval_minutes}m). Forcing {min_retry_interval_minutes}m cooldown.",
            original_ai_action=action,
            overridden_action="RETRY_LATER",
            overridden_delay_minutes=min_retry_interval_minutes,
            policy_version=policy_version
        )

    # Rule 6: Normal Approved Actions
    if action in ["ESCALATE_HUMAN", "STOP"]:
        return PolicyEvaluationResult(
            allowed=True,
            decision="APPROVED",
            rule_triggered="POLICY_APPROVED_NON_FINANCIAL",
            reason="Merchant policy approves immediate escalation or cessation of recovery workflow.",
            original_ai_action=action,
            overridden_action=action,
            overridden_delay_minutes=0,
            policy_version=policy_version
        )

    # All checks passed
    normalized_action = "RETRY_LATER" if action == "RETRY_PAYMENT" else action
    return PolicyEvaluationResult(
        allowed=True,
        decision="APPROVED",
        rule_triggered="POLICY_APPROVED_STANDARD",
        reason="Action is within merchant policy retry limits, amount thresholds, and delay boundaries.",
        original_ai_action=action,
        overridden_action=normalized_action,
        overridden_delay_minutes=delay,
        policy_version=policy_version
    )
