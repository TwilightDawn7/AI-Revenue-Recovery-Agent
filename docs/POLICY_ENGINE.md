# Deterministic Policy Engine Specification

The **Policy Engine** is an independent, non-LLM safety gate that governs all autonomous actions. It operates under the architectural principle:

> **"AI proposes. Policy decides."**

No financial transaction can be executed unless explicitly authorized by the Deterministic Policy Engine.

---

## 7 Deterministic Guardrail Rules (Evaluated Sequentially)

1. **Rule 1: `PAYMENT_ALREADY_CAPTURED`**
   - If payment status is already `captured`, the policy denies any further retries or links and approves case resolution.
2. **Rule 2: `CONCURRENT_RECOVERY_ACTIVE`**
   - At most one executable recovery action may be active for a payment at any time.
3. **Rule 3: `SUBSCRIPTION_CANCELLED_STOP`**
   - If the subscription is cancelled or halted, all recovery attempts are strictly blocked (`STOP`). Retrying cancelled accounts damages merchant reputation and violates payment network rules.
4. **Rule 4: `MAX_RETRIES_EXCEEDED`**
   - If `retry_count >= max_retries` (default: 2), automated direct retries are blocked and overridden to `ESCALATE_HUMAN` to prevent card network spam.
5. **Rule 5: `AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT`**
   - If transaction amount exceeds `max_autonomous_amount` (default: ₹25,000), action is overridden to `ESCALATE_HUMAN` (white-glove outreach).
6. **Rule 6: `MINIMUM_COOLDOWN_ENFORCED`**
   - If AI proposes a retry with a cooldown $< \text{min\_retry\_interval}$ (default: 30 minutes), the delay is overridden to 30 minutes (`DELAYED`).
7. **Rule 7: `POLICY_APPROVED_STANDARD`**
   - If all boundary checks pass, the proposed AI action is approved.

---

## Merchant Policy Studio & Versioning

Merchants can customize guardrails via `/settings`:
- Maximum Retries per Cycle (1 to 5)
- Minimum Cooldown Interval (15 to 240 minutes)
- Maximum Autonomous Amount Threshold (₹1,000 to ₹100,000)
- High-Value Action Routing (`ESCALATE_HUMAN` vs `REQUEST_PAYMENT_UPDATE`)

Every modification increments `policy_version` and is attached to all generated `RecoveryDecision` records for audit traceability.
