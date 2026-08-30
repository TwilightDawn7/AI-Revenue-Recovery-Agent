import os
import json
import logging
from app.core.config import settings
from app.schemas.schemas import AIDecisionSchema

logger = logging.getLogger("uvicorn")

# Path to local cache file for storing/retrieving LLM outputs during evaluation
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
    Highly structured, context-aware rule engine representing the AI agent's logic.
    Used when GEMINI_API_KEY is not set or during quick cached evaluation simulation.
    """
    problem_type = context.get("problem_type", "")
    failure_reason = context.get("failure_reason", "")
    subscription_status = context.get("subscription_status", "active")
    retry_count = context.get("retry_count", 0)
    amount = context.get("amount", 0.0)
    customer_history_success = context.get("previous_successful_payments", 0)
    
    # 1. Respect Cancellation
    if subscription_status in ["cancelled", "halted"]:
        return AIDecisionSchema(
            diagnosis="The customer has cancelled their subscription. Retrying would violate user intent and merchant compliance guidelines.",
            action="STOP",
            delay_minutes=0,
            confidence=1.0,
            reason="Subscription status is cancelled. Stopping recovery efforts."
        )

    # 2. Maximum Retries Limit Checked at AI level too
    if retry_count >= 2:
        return AIDecisionSchema(
            diagnosis=f"The system has already attempted automated retries {retry_count} times without success.",
            action="ESCALATE_HUMAN",
            delay_minutes=0,
            confidence=0.95,
            reason="Exceeded maximum automated retry limit. Escalating to human customer operations."
        )

    # 3. Invalid Credentials or Expired Card
    if failure_reason in ["EXPIRED_CARD", "INVALID_CARD_DETAILS", "INVALID_CVV", "CARD_EXPIRED"]:
        return AIDecisionSchema(
            diagnosis="The payment failed due to expired card credentials or invalid card details. Direct retries will continue to fail.",
            action="REQUEST_PAYMENT_UPDATE",
            delay_minutes=0,
            confidence=0.9,
            reason="Permanent credential error. Initiated a payment update request to email a secure Razorpay card update link to the customer."
        )

    # 4. High At-Risk Amount -> Escalate to human to avoid indiscriminate billing or checkout abandonment
    if amount > 25000:
        return AIDecisionSchema(
            diagnosis=f"High value transaction of ₹{amount}. Automated retries carry financial decline risks.",
            action="ESCALATE_HUMAN",
            delay_minutes=0,
            confidence=0.85,
            reason="Transaction value exceeds autonomous threshold of ₹25,000. Escalating for white-glove manual outreach."
        )

    # 5. Temporary bank declines (network issue, insufficient funds, etc.)
    if failure_reason in ["BANK_DECLINE", "INSUFFICIENT_FUNDS", "NETWORK_ERROR", "TEMPORARY_DECLINE"]:
        # If they have a strong payment history, we are more confident.
        if customer_history_success >= 3:
            delay = 30 if retry_count == 0 else 120
            return AIDecisionSchema(
                diagnosis=f"Temporary payment failure due to {failure_reason}. Customer has a strong payment history ({customer_history_success} successful renewals), indicating high likelihood of recovery.",
                action="RETRY_PAYMENT",
                delay_minutes=delay,
                confidence=0.92,
                reason="Temporary bank decline with high-trust customer profile. Proposing delayed retry."
            )
        else:
            delay = 60
            return AIDecisionSchema(
                diagnosis=f"Temporary payment failure due to {failure_reason}. Customer has low payment history. Likelihood of recovery is moderate.",
                action="RETRY_PAYMENT",
                delay_minutes=delay,
                confidence=0.75,
                reason="Temporary bank decline. Proposing delayed retry."
            )

    # Default to escalate for safety
    return AIDecisionSchema(
        diagnosis=f"Unknown failure code '{failure_reason}'. System cannot determine permanent vs temporary decline status.",
        action="ESCALATE_HUMAN",
        delay_minutes=0,
        confidence=0.6,
        reason="Unresolved failure reason. Escalating for safety."
    )


async def get_ai_decision(context: dict, use_cache: bool = True) -> AIDecisionSchema:
    """
    Resolves the recovery action decision using Gemini if the API key is present.
    Otherwise falls back to the deterministic context-aware fallback engine.
    """
    # Create a unique key for caching based on the context values
    cache_key = f"{context.get('amount')}_{context.get('retry_count')}_{context.get('failure_reason')}_{context.get('subscription_status')}_{context.get('previous_successful_payments')}"
    
    if use_cache:
        cache = load_cache()
        if cache_key in cache:
            logger.info(f"AI Decision Cache HIT for case: {cache_key}")
            return AIDecisionSchema(**cache[cache_key])

    # If API key is not set, use fallback engine directly
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not found in environment. Using fallback logic engine.")
        decision = get_fallback_decision(context)
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
        return decision

    # Live call to Gemini using google-generativeai
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        prompt = f"""
        You are the AI Revenue Recovery Agent. Analyze the following payment failure context and select the best recovery action.
        
        CONTEXT:
        - At-Risk Amount: INR {context.get('amount')}
        - Current Retry Count: {context.get('retry_count')}
        - Problem Type: {context.get('problem_type')}
        - Payment Failure Reason: {context.get('failure_reason')}
        - Subscription Status: {context.get('subscription_status')}
        - Successful Past Renewals: {context.get('previous_successful_payments')}
        
        RULES:
        1. If the subscription is cancelled or halted, you MUST recommend STOP.
        2. If the current retry count is >= 2, you MUST recommend ESCALATE_HUMAN.
        3. If the amount is > 25,000 INR, you MUST recommend ESCALATE_HUMAN.
        4. If the failure is due to card expiration or incorrect credentials (e.g. EXPIRED_CARD, INVALID_CARD_DETAILS, INVALID_CVV), you MUST recommend REQUEST_PAYMENT_UPDATE.
        5. If the failure is temporary (e.g. BANK_DECLINE, INSUFFICIENT_FUNDS, NETWORK_ERROR), you should recommend RETRY_PAYMENT with a delay of at least 30 minutes.
        
        Return your analysis as a JSON object matching this schema:
        {{
            "diagnosis": "Detailed string explaining why the payment failed and customer's overall billing health",
            "action": "RETRY_PAYMENT" | "REQUEST_PAYMENT_UPDATE" | "ESCALATE_HUMAN" | "STOP",
            "delay_minutes": integer (minimum 30 if action is RETRY_PAYMENT),
            "confidence": float (between 0.0 and 1.0),
            "reason": "String explaining the reason behind this decision"
        }}
        """
        
        # Configure model call for structured JSON output
        model = genai.GenerativeModel("gemini-3-flash-preview")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AIDecisionSchema
            )
        )
        
        data = json.loads(response.text)
        decision = AIDecisionSchema(**data)
        logger.info(f"Gemini API Decision Successful: {decision.action} ({decision.confidence})")
        
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
            
        return decision

    except Exception as e:
        logger.error(f"Gemini API call failed: {e}. Falling back to rule-based engine.")
        decision = get_fallback_decision(context)
        if use_cache:
            cache = load_cache()
            cache[cache_key] = decision.model_dump()
            save_cache(cache)
        return decision
