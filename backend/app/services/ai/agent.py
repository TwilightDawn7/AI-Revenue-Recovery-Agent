import os
import json
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.schemas.schemas import AIDecisionSchema, EvaluatedActionSchema
from app.services.actions.framework import rank_candidate_actions
from app.services.context.builder import categorize_failure_reason

logger = logging.getLogger("uvicorn")

CACHE_PATH = os.path.join(os.path.dirname(__file__), "eval_cache.json")

def load_cache() -> dict:
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache: dict):
    try:
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write AI cache: {e}")

def get_fallback_decision(context: dict) -> AIDecisionSchema:
    """
    Deterministic context-aware decision engine.
    Used when GEMINI_API_KEY is not set or as a safe fallback when LLM output fails validation.
    Mandatory safety rule: Never default blindly to a financial retry on unexpected states.
    """
    amount = float(context.get("amount", 0.0))
    raw_failure = context.get("failure_reason", "")
    failure_category = context.get("failure_category") or categorize_failure_reason(raw_failure)
    subscription_status = context.get("subscription_status", "active")
    retry_count = int(context.get("retry_count", 0))
    past_successes = int(context.get("previous_successful_payments", 0))
    
    merchant_policy = context.get("merchant_policy", {})
    max_retries = int(merchant_policy.get("max_retries", 2))
    max_autonomous = float(merchant_policy.get("max_autonomous_amount", 25000.0))
    min_interval = int(merchant_policy.get("min_retry_interval_minutes", 30))

    # Evaluate candidate actions with Expected Recovery Value (EV)
    candidate_actions = rank_candidate_actions(
        amount=amount,
        failure_reason=raw_failure,
        subscription_status=subscription_status,
        retry_count=retry_count,
        previous_successful_payments=past_successes,
        merchant_max_retries=max_retries,
        merchant_max_autonomous_amount=max_autonomous
    )

    # 1. Subscription Cancelled / Halted -> Must STOP
    if subscription_status in ["cancelled", "halted"]:
        stop_action = next((a for a in candidate_actions if a.action == "STOP"), None)
        return AIDecisionSchema(
            diagnosis="Subscription status is cancelled. Retrying payment would violate merchant compliance guidelines.",
            action="STOP",
            delay_minutes=0,
            confidence=0.99,
            recovery_probability=0.0,
            expected_recovery_value=0.0,
            actions=candidate_actions,
            reason="Subscription was terminated by customer. Automated recovery ceased immediately."
        )

    # 2. Hard decline / Fraud suspected -> Force STOP / Escalate
    if failure_category == "HARD_DECLINE":
        return AIDecisionSchema(
            diagnosis="Hard card decline or fraud restriction flagged by card network. Direct automated retries blocked.",
            action="STOP",
            delay_minutes=0,
            confidence=0.95,
            recovery_probability=0.0,
            expected_recovery_value=0.0,
            actions=candidate_actions,
            reason="Card network reported a hard decline or restriction. Halting automated attempts."
        )

    # 3. Maximum Retries Limit Reached -> Escalate to Human Operations
    if retry_count >= max_retries:
        esc_action = next((a for a in candidate_actions if a.action == "ESCALATE_HUMAN"), candidate_actions[0])
        return AIDecisionSchema(
            diagnosis=f"Payment has failed {retry_count} times consecutively. Automated retry ceiling reached.",
            action="ESCALATE_HUMAN",
            delay_minutes=0,
            confidence=0.96,
            recovery_probability=esc_action.recovery_probability,
            expected_recovery_value=esc_action.expected_recovery_value,
            actions=candidate_actions,
            reason="Exceeded maximum automated retry limit. Escalating to human customer operations desk."
        )

    # 4. Expired Payment Credentials / Invalid Card Details
    if failure_category == "EXPIRED_PAYMENT_METHOD":
        link_action = next((a for a in candidate_actions if a.action in ["REQUEST_PAYMENT_UPDATE", "PAYMENT_UPDATE"]), candidate_actions[0])
        return AIDecisionSchema(
            diagnosis="Payment failed due to expired credentials or invalid card details. Direct retries on stale credentials will fail.",
            action="REQUEST_PAYMENT_UPDATE",
            delay_minutes=0,
            confidence=0.94,
            recovery_probability=link_action.recovery_probability,
            expected_recovery_value=link_action.expected_recovery_value,
            actions=candidate_actions,
            reason="Permanent credential error detected. Generated secure Razorpay payment update link for the customer."
        )

    # 5. High At-Risk Amount -> Propose Action (Policy Gate will validate against autonomous ceiling)
    if amount > max_autonomous:
        # AI considers RETRY_LATER or ESCALATE depending on customer trust
        if past_successes >= 3:
            retry_action = next((a for a in candidate_actions if a.action in ["RETRY_LATER", "RETRY_PAYMENT"]), candidate_actions[0])
            return AIDecisionSchema(
                diagnosis=f"High-value transaction (INR {amount:,.2f}) failed due to {failure_category}. Customer has a strong payment history ({past_successes} successful renewals).",
                action="RETRY_LATER",
                delay_minutes=max(min_interval, 60),
                confidence=0.96,
                recovery_probability=retry_action.recovery_probability,
                expected_recovery_value=retry_action.expected_recovery_value,
                actions=candidate_actions,
                reason="High-value trusted customer encountered temporary decline. Proposing delayed retry."
            )
        else:
            esc_action = next((a for a in candidate_actions if a.action == "ESCALATE_HUMAN"), candidate_actions[0])
            return AIDecisionSchema(
                diagnosis=f"High-value transaction of INR {amount:,.2f} with limited billing history. Direct automated retries carry churn risk.",
                action="ESCALATE_HUMAN",
                delay_minutes=0,
                confidence=0.88,
                recovery_probability=esc_action.recovery_probability,
                expected_recovery_value=esc_action.expected_recovery_value,
                actions=candidate_actions,
                reason="Transaction value exceeds autonomous threshold. Escalating for manual high-touch outreach."
            )

    # 6. Temporary Bank Declines / Network Errors / Insufficient Funds
    if failure_category in ["TEMPORARY_ISSUER_FAILURE", "NETWORK_FAILURE", "INSUFFICIENT_FUNDS"]:
        delay = max(min_interval, 30 if retry_count == 0 else 120)
        retry_action = next((a for a in candidate_actions if a.action in ["RETRY_LATER", "RETRY_PAYMENT"]), candidate_actions[0])
        conf = 0.92 if past_successes >= 3 else 0.78
        return AIDecisionSchema(
            diagnosis=f"Temporary payment failure categorized as {failure_category}. Customer renewal history shows {past_successes} successful cycles.",
            action="RETRY_LATER",
            delay_minutes=delay,
            confidence=conf,
            recovery_probability=retry_action.recovery_probability,
            expected_recovery_value=retry_action.expected_recovery_value,
            actions=candidate_actions,
            reason=f"Temporary {failure_category.lower().replace('_', ' ')} detected. Delayed retry scheduled to allow banking rails to recover."
        )

    # Default fallback: Escalate to human for unresolved categories
    top_action = candidate_actions[0] if candidate_actions else None
    return AIDecisionSchema(
        diagnosis=f"Unresolved failure code '{raw_failure}'. Failure type cannot be deterministically classified as temporary.",
        action="ESCALATE_HUMAN",
        delay_minutes=0,
        confidence=0.65,
        recovery_probability=top_action.recovery_probability if top_action else 0.30,
        expected_recovery_value=top_action.expected_recovery_value if top_action else 0.0,
        actions=candidate_actions,
        reason="Unresolved failure reason. Escalating for safety to prevent unauthorized retries."
    )


async def get_ai_decision(context: dict, use_cache: bool = True) -> AIDecisionSchema:
    """
    Executes AI reasoning with schema validation and safe fallback.
    Uses Gemini API when configured, otherwise uses the context-aware fallback engine.
    """
    cache_key = f"{context.get('amount')}_{context.get('retry_count')}_{context.get('failure_reason')}_{context.get('subscription_status')}_{context.get('previous_successful_payments')}"
    
    if use_cache:
        cache = load_cache()
        if cache_key in cache:
            try:
                cached_data = cache[cache_key]
                return AIDecisionSchema(**cached_data)
            except Exception:
                pass

    if not settings.GEMINI_API_KEY:
        decision = get_fallback_decision(context)
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
        return decision

    # Live call to Gemini with structured output
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        amount = context.get("amount")
        retry_count = context.get("retry_count")
        failure_cat = context.get("failure_category", "UNKNOWN")
        sub_status = context.get("subscription_status", "active")
        successes = context.get("previous_successful_payments", 0)
        segment = context.get("customer_segment", "NORMAL")
        
        prompt = f"""
        You are the AI Revenue Recovery Agent. Analyze the sanitized payment failure context below and recommend the optimal recovery strategy.
        
        CONTEXT:
        - At-Risk Amount: INR {amount}
        - Current Retry Count: {retry_count}
        - Failure Category: {failure_cat}
        - Subscription Status: {sub_status}
        - Customer Segment: {segment}
        - Successful Past Renewals: {successes}
        
        RULES:
        1. If subscription status is cancelled or halted, you MUST recommend STOP.
        2. If retry count >= 2, you MUST recommend ESCALATE_HUMAN.
        3. If failure category is EXPIRED_PAYMENT_METHOD, you MUST recommend REQUEST_PAYMENT_UPDATE.
        4. If failure category is TEMPORARY_ISSUER_FAILURE, INSUFFICIENT_FUNDS, or NETWORK_FAILURE, recommend RETRY_LATER with delay >= 30m.
        5. If failure category is HARD_DECLINE, recommend STOP.
        6. Provide a concise, professional explanation suitable for a merchant dashboard. Do NOT expose internal chain-of-thought.
        
        Return JSON adhering strictly to the schema:
        {{
            "diagnosis": "Concise failure diagnosis",
            "action": "RETRY_LATER" | "REQUEST_PAYMENT_UPDATE" | "ESCALATE_HUMAN" | "STOP",
            "delay_minutes": integer (>= 30 for RETRY_LATER),
            "confidence": float (0.0 to 1.0, AI confidence in this diagnosis),
            "recovery_probability": float (0.0 to 1.0, estimated likelihood of recovering funds),
            "reason": "Concise explanation for merchant"
        }}
        """
        
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        data = json.loads(response.text)
        
        # Calculate EV and attach ranked candidate actions
        candidate_actions = rank_candidate_actions(
            amount=float(amount),
            failure_reason=context.get("failure_reason", ""),
            subscription_status=sub_status,
            retry_count=int(retry_count),
            previous_successful_payments=int(successes)
        )
        
        # Ensure action mapping is normalized
        act = data.get("action", "ESCALATE_HUMAN")
        if act == "RETRY_PAYMENT":
            act = "RETRY_LATER"
            
        selected_cand = next((a for a in candidate_actions if a.action in [act, "RETRY_LATER" if act == "RETRY_PAYMENT" else act]), candidate_actions[0])
        
        rec_prob = float(data.get("recovery_probability", selected_cand.recovery_probability))
        conf = float(data.get("confidence", 0.85))
        ev = round(rec_prob * float(amount) - selected_cand.estimated_cost - selected_cand.friction_penalty, 2)
        
        decision = AIDecisionSchema(
            diagnosis=data.get("diagnosis", f"Diagnosed as {failure_cat}"),
            action=act,
            delay_minutes=int(data.get("delay_minutes", 30)),
            confidence=max(0.0, min(1.0, conf)),
            recovery_probability=max(0.0, min(1.0, rec_prob)),
            expected_recovery_value=ev,
            actions=candidate_actions,
            reason=data.get("reason", "Action selected based on customer recovery profile.")
        )
        
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
            
        return decision

    except Exception as e:
        logger.warning(f"AI decision call failed ({e}). Falling back to safe deterministic decision engine.")
        decision = get_fallback_decision(context)
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
        return decision
