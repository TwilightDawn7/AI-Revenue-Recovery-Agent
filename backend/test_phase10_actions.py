import requests
import json
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase10_operator_actions():
    print("\n--- 1. Testing Webhook Simulator Case Creation ---")
    ts = int(time.time() * 1000)
    sim_payload = {
        "event": "payment.failed",
        "id": f"evt_p10_test_{ts}",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_p10_{ts}",
                    "amount": 249900,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BANK_DECLINE",
                    "customer_details": {
                        "name": "Phase 10 Test Customer",
                        "email": "phase10@test.com"
                    }
                }
            }
        }
    }
    res = client.post("/api/test/trigger-webhook", json=sim_payload)
    print("Webhook response:", res.status_code, res.json())
    assert res.status_code == 200
    case_id = res.json()["case_id"]
    print(f"Created Case #{case_id}")

    print("\n--- 2. Testing Manual Retry Action ---")
    res_retry = client.post(f"/api/recovery-cases/{case_id}/actions/retry")
    print("Retry response:", res_retry.status_code, res_retry.json())
    assert res_retry.status_code == 200

    print("\n--- 3. Testing Generate Payment Link Action ---")
    res_link = client.post(f"/api/recovery-cases/{case_id}/actions/payment-link")
    print("Payment link response:", res_link.status_code, res_link.json())
    assert res_link.status_code == 200
    assert "link" in res_link.json()

    print("\n--- 4. Testing Escalate to Ops Action ---")
    res_esc = client.post(f"/api/recovery-cases/{case_id}/actions/escalate")
    print("Escalate response:", res_esc.status_code, res_esc.json())
    assert res_esc.status_code == 200

    print("\n--- 5. Testing Stop Action ---")
    res_stop = client.post(f"/api/recovery-cases/{case_id}/actions/stop")
    print("Stop response:", res_stop.status_code, res_stop.json())
    assert res_stop.status_code == 200

    print("\n--- 6. Testing Simulate Payment Resolution (Full Recovery) ---")
    res_pay = client.post(f"/api/recovery-cases/{case_id}/actions/simulate-payment")
    print("Simulate payment response:", res_pay.status_code, res_pay.json())
    assert res_pay.status_code == 200
    assert res_pay.json()["case"]["status"] == "RECOVERED"
    assert res_pay.json()["case"]["recovered_amount"] == 2499.0

    print("\n--- 7. Verifying Case Detail & Audit Logs ---")
    res_detail = client.get(f"/api/recovery-cases/{case_id}")
    detail = res_detail.json()
    print(f"Case #{case_id} Status: {detail['status']}")
    print(f"Total Recovery Actions: {len(detail['recovery_actions'])}")
    print(f"Total Audit Logs: {len(detail['audit_logs'])}")
    
    assert len(detail["recovery_actions"]) >= 5
    assert len(detail["audit_logs"]) >= 6

    print("\n--- 8. Checking Updated Dashboard Metrics ---")
    res_metrics = client.get("/api/metrics")
    metrics = res_metrics.json()
    print("Dashboard Metrics:", metrics)
    assert metrics["recovered_revenue"] >= 2499.0

    print("\n[SUCCESS] All Phase 10 Interactive Action Endpoints Verified Successfully!")

if __name__ == "__main__":
    test_phase10_operator_actions()
