# Recovery Lifecycle & State Machine Specification

The recovery lifecycle models the progression of an at-risk transaction through autonomous diagnosis, policy validation, durable execution, and outcome attribution.

---

## State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> DETECTED: Webhook Received
    DETECTED --> ANALYZING: Context Built
    ANALYZING --> DECIDING: AI Reasoning
    DECIDING --> VALIDATING: Action Ranked
    VALIDATING --> SCHEDULED: Policy Approved (Cooldown)
    VALIDATING --> WAITING: Payment Link Sent
    VALIDATING --> ESCALATED: Exceeded Limit / Retries
    VALIDATING --> STOPPED: Cancelled Sub / Invalid
    SCHEDULED --> EXECUTING: Cooldown Finished & Pre-Check Passed
    EXECUTING --> RECOVERED: Payment Captured Webhook
    EXECUTING --> FAILED: Gateway Terminal Failure
    WAITING --> RECOVERED: Customer Paid Link
    WAITING --> FAILED: Link Expired (3 Days)
    ESCALATED --> RECOVERED: Ops Resolved
    RECOVERED --> [*]
    FAILED --> [*]
    STOPPED --> [*]
```

---

## Pre-Execution Safety Re-Check

To eliminate race conditions (e.g. customer paying manually through another channel during the Inngest cooldown sleep), the execution layer executes an immediate database and gateway check:

```python
if payment.status == "captured":
    case.status = "RECOVERED"
    case.recovered_amount = case.amount_at_risk
    return {"aborted": True, "reason": "Payment captured during cooldown window."}
```
