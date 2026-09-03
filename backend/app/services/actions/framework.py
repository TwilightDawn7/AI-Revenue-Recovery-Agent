"""
Recovery Action Framework (Phase 2)
Standardized action catalog, action definitions, and multi-attribute evaluation logic.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from app.schemas.schemas import EvaluatedActionSchema

@dataclass(frozen=True)
class ActionDefinition:
    action: str
    description: str
    customer_friction: str  # LOW, MEDIUM, HIGH
    estimated_cost: float   # in INR
    friction_penalty: float # in INR
    requires_human: bool
    requires_policy_approval: bool

# Standardized Action Catalog
ACTION_CATALOG: Dict[str, ActionDefinition] = {
    "RETRY_NOW": ActionDefinition(
        action="RETRY_NOW",
        description="Immediate retry on payment gateway rails.",
        customer_friction="LOW",
        estimated_cost=5.0,
        friction_penalty=10.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "RETRY_LATER": ActionDefinition(
        action="RETRY_LATER",
        description="Scheduled delayed retry (30m to 120m) after banking rails/network stabilize.",
        customer_friction="LOW",
        estimated_cost=5.0,
        friction_penalty=0.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "RETRY_PAYMENT": ActionDefinition(
        action="RETRY_PAYMENT",
        description="Automated payment charge retry (alias for RETRY_LATER).",
        customer_friction="LOW",
        estimated_cost=5.0,
        friction_penalty=0.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "REQUEST_PAYMENT_UPDATE": ActionDefinition(
        action="REQUEST_PAYMENT_UPDATE",
        description="Generate a secure Razorpay payment update link and notify the customer via email/SMS.",
        customer_friction="MEDIUM",
        estimated_cost=15.0,
        friction_penalty=30.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "PAYMENT_UPDATE": ActionDefinition(
        action="PAYMENT_UPDATE",
        description="Generate a secure Razorpay payment update link (alias for REQUEST_PAYMENT_UPDATE).",
        customer_friction="MEDIUM",
        estimated_cost=15.0,
        friction_penalty=30.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "CUSTOMER_NOTIFICATION": ActionDefinition(
        action="CUSTOMER_NOTIFICATION",
        description="Send reminder notification to customer regarding pending subscription invoice.",
        customer_friction="MEDIUM",
        estimated_cost=5.0,
        friction_penalty=20.0,
        requires_human=False,
        requires_policy_approval=True
    ),
    "ESCALATE_HUMAN": ActionDefinition(
        action="ESCALATE_HUMAN",
        description="Escalate high-value or complex case to Human Operations Desk for white-glove outreach.",
        customer_friction="LOW",
        estimated_cost=150.0,
        friction_penalty=0.0,
        requires_human=True,
        requires_policy_approval=True
    ),
    "STOP": ActionDefinition(
        action="STOP",
        description="Halt all automated recovery workflows (e.g. cancelled subscriptions or merchant block).",
        customer_friction="LOW",
        estimated_cost=0.0,
        friction_penalty=0.0,
        requires_human=False,
        requires_policy_approval=False
    )
}


def evaluate_action(
    action: str,
    amount: float,
    failure_reason: str,
    subscription_status: str,
    retry_count: int,
    previous_successful_payments: int = 0,
    merchant_max_retries: int = 2,
    merchant_max_autonomous_amount: float = 25000.0
) -> EvaluatedActionSchema:
    """
    Evaluates a single recovery action against recovery context.
    Computes recovery_probability, intervention_cost, friction_penalty,
    and Expected Net Recovery Value (EV).
    """
    defn = ACTION_CATALOG.get(action, ACTION_CATALOG["STOP"])
    
    # 1. Base probability calculation
    prob = 0.0
    
    if subscription_status in ["cancelled", "halted"]:
        # If cancelled, non-stop actions have 0 probability
        prob = 0.0 if action != "STOP" else 1.0
    elif action == "STOP":
        prob = 0.0
    elif action in ["RETRY_NOW", "RETRY_LATER", "RETRY_PAYMENT"]:
        if retry_count >= merchant_max_retries:
            prob = 0.05
        elif failure_reason in ["BANK_DECLINE", "INSUFFICIENT_FUNDS", "NETWORK_ERROR", "TEMPORARY_DECLINE", "TEMPORARY_ISSUER_FAILURE"]:
            # Baseline temporary recovery is ~0.35, boosted by loyal history
            prob = 0.35 + min(0.40, previous_successful_payments * 0.05)
            if action == "RETRY_NOW":
                prob *= 0.70  # immediate retry without delay is less effective
        elif failure_reason in ["EXPIRED_CARD", "INVALID_CARD_DETAILS", "INVALID_CVV", "EXPIRED_PAYMENT_METHOD"]:
            prob = 0.0  # Retrying expired card will never succeed
        else:
            prob = 0.15
    elif action in ["REQUEST_PAYMENT_UPDATE", "PAYMENT_UPDATE"]:
        if failure_reason in ["EXPIRED_CARD", "INVALID_CARD_DETAILS", "INVALID_CVV", "EXPIRED_PAYMENT_METHOD"]:
            prob = 0.45 + min(0.25, previous_successful_payments * 0.04)
        else:
            prob = 0.25
    elif action == "CUSTOMER_NOTIFICATION":
        prob = 0.20 + min(0.20, previous_successful_payments * 0.03)
    elif action == "ESCALATE_HUMAN":
        # White glove human support has high success on high value accounts
        prob = 0.60 if amount > merchant_max_autonomous_amount else 0.40

    prob = max(0.0, min(1.0, prob))
    
    # 2. Expected Recovery Value (EV) calculation
    # EV = (Probability * Amount) - Estimated Cost - Friction Penalty
    expected_revenue = prob * amount
    cost = defn.estimated_cost
    friction = defn.friction_penalty
    
    if action == "STOP":
        expected_recovery_value = 0.0
    else:
        expected_recovery_value = round(expected_revenue - cost - friction, 2)
        
    return EvaluatedActionSchema(
        action=action,
        recovery_probability=round(prob, 3),
        expected_recovery_value=expected_recovery_value,
        customer_friction=defn.customer_friction,
        estimated_cost=cost,
        rank=1
    )


def rank_candidate_actions(
    amount: float,
    failure_reason: str,
    subscription_status: str,
    retry_count: int,
    previous_successful_payments: int = 0,
    merchant_max_retries: int = 2,
    merchant_max_autonomous_amount: float = 25000.0
) -> List[EvaluatedActionSchema]:
    """
    Evaluates all standard recovery actions and ranks them in descending order of Expected Recovery Value.
    """
    candidate_keys = ["RETRY_LATER", "REQUEST_PAYMENT_UPDATE", "ESCALATE_HUMAN", "STOP"]
    
    evaluated = [
        evaluate_action(
            action=act,
            amount=amount,
            failure_reason=failure_reason,
            subscription_status=subscription_status,
            retry_count=retry_count,
            previous_successful_payments=previous_successful_payments,
            merchant_max_retries=merchant_max_retries,
            merchant_max_autonomous_amount=merchant_max_autonomous_amount
        )
        for act in candidate_keys
    ]
    
    # Sort descending by expected_recovery_value
    evaluated.sort(key=lambda x: x.expected_recovery_value, reverse=True)
    
    # Assign ranks
    for idx, item in enumerate(evaluated):
        item.rank = idx + 1
        
    return evaluated
