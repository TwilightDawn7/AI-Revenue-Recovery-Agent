# Deterministic Policy Engine Specification
> **Independent, Non-LLM Financial Safety Gate Enforcing Merchant Boundaries**

---

## 📌 Architectural Mandate

The **Deterministic Policy Engine** is the ultimate authority in the recovery lifecycle. While AI reasoning is probabilistic and creative, financial safety must be **deterministic and immutable**.

$$\Large \mathbf{\text{AI proposes. Policy decides.}}$$

No financial operation (payment retry, direct debit, customer payment link, or cancellation) can be executed without passing through the sequential 7-rule Policy Engine cascade (`backend/app/services/policy/engine.py`).

---

## 🛡️ 7-Rule Sequential Safety Cascade

The engine evaluates rules in strict order. The first rule that matches produces the final verdict and halts subsequent checks:

```mermaid
flowchart TD
    PROPOSAL(["📋 Proposed AI Decision Received"]) --> R1{"Rule 1: Payment Already Captured?"}
    
    R1 -->|Yes| V1["Verdict: APPROVED (Status: ALREADY_CAPTURED)"]
    R1 -->|No| R2{"Rule 2: Concurrent In-Flight Action Active?"}
    
    R2 -->|Yes| V2["Verdict: OVERRIDDEN -> WAIT<br/>(Rule: CONCURRENT_RECOVERY_ACTIVE)"]
    R2 -->|No| R3{"Rule 3: Subscription Cancelled or Halted?"}
    
    R3 -->|Yes| V3["Verdict: OVERRIDDEN -> STOP<br/>(Rule: SUBSCRIPTION_CANCELLED_STOP)"]
    R3 -->|No| R4{"Rule 4: Current Retries >= Max Allowed?"}
    
    R4 -->|Yes| V4["Verdict: OVERRIDDEN -> ESCALATE_HUMAN<br/>(Rule: MAX_RETRIES_EXCEEDED)"]
    R4 -->|No| R5{"Rule 5: Amount > Merchant Limit (₹25k)?"}
    
    R5 -->|Yes| V5["Verdict: OVERRIDDEN -> ESCALATE_HUMAN<br/>(Rule: AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT)"]
    R5 -->|No| R6{"Rule 6: Proposed Cooldown < Min Limit (30m)?"}
    
    R6 -->|Yes| V6["Verdict: APPROVED with Adjusted Delay<br/>(Rule: MINIMUM_COOLDOWN_ENFORCED -> 30m)"]
    R6 -->|No| R7["Rule 7: Standard Policy Boundary Check"]
    
    R7 --> V7["Verdict: APPROVED (Proposed Action Authorized)"]

    V1 & V2 & V3 & V4 & V5 & V6 & V7 --> LOG["💾 Persist Unified RecoveryDecision & AuditLog"]
    LOG --> EXEC(["⚡ Handover to Inngest Durable Execution Layer"])

    style R1 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R2 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R3 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R4 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R5 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R6 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style R7 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style V3 fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#f8fafc
    style V4 fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#f8fafc
    style V5 fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#f8fafc
    style V6 fill:#713f12,stroke:#facc15,stroke-width:2px,color:#f8fafc
    style V7 fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#f8fafc
```

---

## 📖 Detailed Rule Specifications

### Rule 1: `PAYMENT_ALREADY_CAPTURED`
- **Condition**: `payment_status == "captured"`
- **Action**: Aborts further retries or links immediately and marks the case as `RECOVERED`.
- **Rationale**: Eliminates race conditions where a customer pays through another channel while the recovery workflow is sleeping.

### Rule 2: `CONCURRENT_RECOVERY_ACTIVE`
- **Condition**: Another executable action is currently marked `IN_PROGRESS` or `ACTION_PENDING` for the same invoice.
- **Action**: Pauses and prevents concurrent double-charging.

### Rule 3: `SUBSCRIPTION_CANCELLED_STOP`
- **Condition**: `subscription_status in ["cancelled", "halted", "paused", "terminated"]`
- **Action**: Overrides any proposed retry to `STOP` ($0$ retries dispatched).
- **Rationale**: Charging a cancelled subscriber directly violates Visa/Mastercard scheme rules and incurs severe chargeback penalties.

### Rule 4: `MAX_RETRIES_EXCEEDED`
- **Condition**: `current_retry_count >= merchant_policy.max_retries` (Default: `2`)
- **Action**: Overrides proposed retry to `ESCALATE_HUMAN`.
- **Rationale**: Prevents payment network spamming and avoids triggering card issuer fraud blocks.

### Rule 5: `AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT`
- **Condition**: `amount > merchant_policy.max_autonomous_amount` (Default: `₹25,000.00`)
- **Action**: Overrides autonomous retry to `ESCALATE_HUMAN` (or `REQUEST_PAYMENT_UPDATE` based on merchant configuration).
- **Rationale**: Protects high-value merchant contracts by ensuring VIP and Enterprise accounts receive high-touch human success intervention.

### Rule 6: `MINIMUM_COOLDOWN_ENFORCED`
- **Condition**: Proposed action is `RETRY_LATER` but `proposed_delay < merchant_policy.min_retry_interval_minutes` (Default: `30` mins).
- **Action**: Approves retry but clamps `delay_minutes = 30`.
- **Rationale**: Enforces a mandatory cooling-off window for bank clearing houses to settle temporary liquidity or downtime issues.

### Rule 7: `POLICY_APPROVED_STANDARD`
- **Condition**: All preceding boundary checks pass.
- **Action**: Fully authorizes the AI proposal (`APPROVED`).

---

## 🎛️ Merchant Policy Studio & Dynamic Versioning

Merchants can configure their safety parameters via the **Policy Studio** (`/settings`):

```mermaid
classDiagram
    class MerchantPolicy {
        +int merchant_id
        +int max_retries "Default: 2 (Range: 1 - 5)"
        +int min_retry_interval_minutes "Default: 30 mins (Range: 15 - 240 mins)"
        +float max_autonomous_amount "Default: ₹25,000 (Range: ₹1,000 - ₹100,000)"
        +string high_value_action "ESCALATE_HUMAN | REQUEST_PAYMENT_UPDATE"
        +int policy_version "Auto-incremented on every edit"
        +datetime updated_at
    }
```

### Versioned Regulatory Audit Trail
Every decision made by the Policy Engine writes a record to the `RecoveryDecision` table stamped with `policy_version`:

```json
{
  "recovery_case_id": 42,
  "diagnosis": "Temporary bank node decline with active tenure",
  "ai_action": "RETRY_LATER",
  "ai_confidence": 0.88,
  "recovery_probability": 0.75,
  "expected_recovery_value": 1494.25,
  "policy_decision": "APPROVED",
  "policy_rule": "POLICY_APPROVED_STANDARD",
  "final_action": "RETRY_LATER",
  "delay_minutes": 60,
  "policy_version": 3,
  "created_at": "2026-09-04T22:00:00Z"
}
```
