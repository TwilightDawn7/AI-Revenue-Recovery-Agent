import os
import sys
import json
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, Base, SessionLocal
from app.models.models import Merchant, Customer, Payment, Subscription, RecoveryCase, AuditLog, AIDecision
from app.services.policy.engine import evaluate_policy
from app.schemas.schemas import AIDecisionSchema
from app.main import process_razorpay_event_logic, inngest_client

# Mock Inngest event sending to run tests without Inngest Dev Server running
async def mock_send(events, *args, **kwargs):
    # Support both single event and list of events
    evt_list = events if isinstance(events, list) else [events]
    for e in evt_list:
        print(f"   [Mock Inngest] Event sent: '{e.name}' - data={e.data}")
    return ["mock-event-id"]

inngest_client.send = mock_send

def run_tests():
    print("="*60)
    print("      RUNNING INTEGRATION AND UNIT TEST SUITE")
    print("="*60)

    # 1. Initialize DB tables
    print("\n1. Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        # Clear existing test data to start fresh
        db.query(AuditLog).delete()
        db.query(AIDecision).delete()
        db.query(RecoveryCase).delete()
        db.query(Payment).delete()
        db.query(Subscription).delete()
        db.query(Customer).delete()
        db.query(Merchant).delete()
        db.commit()
        
        # Create merchant
        merchant = Merchant(name="Test Recovery Merchant")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        
        print("   Database initialized successfully.")

        # 2. Test Policy Engine Guardrails
        print("\n2. Testing Policy Engine Guardrails...")
        
        # Test Case A: Cancelled Subscription -> Proposes Retry, Policy should override to STOP
        cancelled_decision = AIDecisionSchema(
            diagnosis="Temporary decline but customer status needs review",
            action="RETRY_PAYMENT",
            delay_minutes=30,
            confidence=0.8,
            reason="Simple retry"
        )
        res_a = evaluate_policy(
            amount=1999.00,
            current_retry_count=0,
            subscription_status="cancelled",
            proposed_decision=cancelled_decision
        )
        print(f"   Case A (Cancelled Sub): Allowed={res_a.allowed}, ActionOverride={res_a.overridden_action}, Decision={res_a.decision}")
        assert res_a.overridden_action == "STOP"
        
        # Test Case B: Retry Count Exceeded -> Proposes Retry, Policy should escalate
        limit_decision = AIDecisionSchema(
            diagnosis="Temporary bank decline, retry again",
            action="RETRY_PAYMENT",
            delay_minutes=30,
            confidence=0.8,
            reason="Retrying"
        )
        res_b = evaluate_policy(
            amount=1999.00,
            current_retry_count=2,
            subscription_status="active",
            proposed_decision=limit_decision
        )
        print(f"   Case B (Retry Limit): Allowed={res_b.allowed}, ActionOverride={res_b.overridden_action}, Decision={res_b.decision}")
        assert res_b.overridden_action == "ESCALATE_HUMAN"
        
        # Test Case C: High Amount -> Proposes Retry, Policy should escalate
        high_decision = AIDecisionSchema(
            diagnosis="Temporary decline, strong history",
            action="RETRY_PAYMENT",
            delay_minutes=30,
            confidence=0.9,
            reason="High value retry"
        )
        res_c = evaluate_policy(
            amount=30000.00,
            current_retry_count=0,
            subscription_status="active",
            proposed_decision=high_decision
        )
        print(f"   Case C (High Amount INR 30k): Allowed={res_c.allowed}, ActionOverride={res_c.overridden_action}, Decision={res_c.decision}")
        assert res_c.overridden_action == "ESCALATE_HUMAN"

        print("   Policy Engine Guardrails tests passed.")

        # 3. Test Webhook Event Logic & Idempotency
        print("\n3. Testing Shared Webhook Processing & Idempotency...")
        
        # Create a mock webhook payload for a failed payment
        webhook_payload = {
            "id": "evt_test_failed_101",
            "entity": "event",
            "account_id": "acc_1",
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_failed_101",
                        "amount": 199900,  # ₹1999 in paise
                        "currency": "INR",
                        "status": "failed",
                        "error_code": "BANK_DECLINE",
                        "customer_id": "cust_test_101",
                        "customer_details": {
                            "name": "Test Customer",
                            "email": "test.customer@example.com"
                        }
                    }
                }
            },
            "created_at": 1690000000
        }
        
        # Process the event first time
        import asyncio
        loop = asyncio.get_event_loop()
        res_webhook1 = loop.run_until_complete(
            process_razorpay_event_logic("payment.failed", webhook_payload, db)
        )
        print(f"   Webhook Process (First Run): Result={res_webhook1}")
        
        # Verify Case was created in DB
        case = db.query(RecoveryCase).filter(RecoveryCase.payment_id == "pay_test_failed_101").first()
        print(f"   Created Case ID: {case.id}, Problem Type: {case.problem_type}, Status: {case.status}, Amount: INR {case.amount_at_risk}")
        assert case is not None
        assert case.status == "AT_RISK"
        assert case.amount_at_risk == 1999.00
        
        # Process the SAME event a second time (Idempotency Check)
        res_webhook2 = loop.run_until_complete(
            process_razorpay_event_logic("payment.failed", webhook_payload, db)
        )
        print(f"   Webhook Process (Second Run/Idempotence Check): Result={res_webhook2}")
        assert res_webhook2["status"] == "ignored"
        assert res_webhook2["reason"] == "duplicate_event"
        
        print("   Shared Webhook & Idempotency tests passed.")
        print("\n" + "="*60)
        print("      ALL TESTS PASSED SUCCESSFULLY!")
        print("="*60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
