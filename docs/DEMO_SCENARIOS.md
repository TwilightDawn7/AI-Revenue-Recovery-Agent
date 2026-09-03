# Curated Demo Scenarios & Interactive Walkthrough

The platform includes 10 pre-configured deterministic demo scenarios accessible via the **Live Recovery Simulator** (`/simulator`) and seeded via `POST /api/demo/seed`.

---

## Scenario Catalog

### Scenario A: Temporary Bank Decline (Loyal Customer)
- **Amount:** ₹1,999.00
- **Context:** Active subscriber with 8 successful consecutive renewals.
- **AI Recommendation:** `RETRY_LATER` (60-minute cooldown).
- **Policy Verdict:** `APPROVED`.
- **Outcome:** Case transitions to `SCHEDULED` $\to$ `RECOVERED`.

### Scenario B: Expired Card Credentials
- **Amount:** ₹2,999.00
- **Context:** Card expiry date passed.
- **AI Recommendation:** `REQUEST_PAYMENT_UPDATE`.
- **Policy Verdict:** `APPROVED`.
- **Outcome:** Generates Razorpay checkout update link; case transitions to `WAITING`.

### Scenario C: Cancelled Subscription (Guardrail Stop)
- **Amount:** ₹1,499.00
- **Context:** Customer cancelled subscription prior to billing date.
- **AI Recommendation:** `STOP`.
- **Policy Verdict:** `APPROVED` (`SUBSCRIPTION_CANCELLED_STOP`).
- **Outcome:** Case immediately halted (`STOPPED`). Zero spam retries sent.

### Scenario D: High-Value Enterprise Account
- **Amount:** ₹48,000.00
- **Context:** Enterprise annual renewal.
- **AI Recommendation:** `RETRY_LATER` (high confidence).
- **Policy Verdict:** `ESCALATED` (`AMOUNT_EXCEEDS_AUTONOMOUS_LIMIT` > ₹25,000 threshold).
- **Outcome:** Routed to Tier-2 human operations desk (`ESCALATED`).

### Scenario E: Exceeded Retry Limit
- **Amount:** ₹3,499.00
- **Context:** Already retried 2 times unsuccessfully.
- **AI Recommendation:** `RETRY_LATER`.
- **Policy Verdict:** `ESCALATED` (`MAX_RETRIES_EXCEEDED`).
- **Outcome:** Overridden to `ESCALATE_HUMAN`.

---

## How to Run Live Demonstrations

1. Navigate to `/simulator` in your browser.
2. Click **"Seed Curated Dataset (10 Cases)"** or click any Scenario card.
3. Observe real-time Inngest step execution, AI diagnosis, and Policy Engine verdicts.
4. On the main Dashboard (`/`), test the **"Re-Execute ₹48,000 Scenario"** live showcase.
