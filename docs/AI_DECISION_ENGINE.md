# AI Decision Engine Specification

The **AI Decision Engine** utilizes Google Gemini 3.5 Flash to diagnose failed transactions, evaluate candidate recovery strategies, and rank actions based on net mathematical value.

---

## Action Evaluation Catalog

The engine evaluates actions from a standardized catalog (`app/services/actions/framework.py`):

| Action Type | Description | Customer Friction | Cost (INR) | Friction Penalty (INR) |
| :--- | :--- | :---: | :---: | :---: |
| `RETRY_NOW` | Immediate charge retry | Low | ₹5.00 | ₹10.00 |
| `RETRY_LATER` | Delayed charge retry after bank clearing | Low | ₹5.00 | ₹5.00 |
| `REQUEST_PAYMENT_UPDATE` | Generate Razorpay update link (WhatsApp/Email) | Medium | ₹15.00 | ₹25.00 |
| `CUSTOMER_NOTIFICATION` | Friendly nudge before card retry | Medium | ₹8.00 | ₹15.00 |
| `ESCALATE_HUMAN` | Route to Tier-2 human operations desk | High | ₹150.00 | ₹50.00 |
| `STOP` | Halt recovery immediately (0 retries) | None | ₹0.00 | ₹0.00 |

---

## Expected Recovery Value ($EV$) Formula

Net Expected Recovery Value is defined as:

$$\text{EV} = (\text{Recovery Probability} \times \text{Amount}) - \text{Intervention Cost} - \text{Friction Penalty}$$

Where:
- **Recovery Probability ($P \in [0, 1]$):** Estimated probability of payment success given the failure reason and customer profile.
- **Intervention Cost:** Direct gateway/communication fee.
- **Friction Penalty:** Quantified customer churn risk for repetitive outreach or card pings.

---

## Metric Separation Policy

The system strictly stores and displays separate values for:
1. **AI Confidence:** The model's diagnostic certainty that its assessment is correct.
2. **Recovery Probability:** The realistic statistical chance of funds being captured.
3. **Expected Recovery Value (EV):** The risk-adjusted net return in INR.

*Note:* AI confidence is never conflated with recovery probability.

---

## Safe Deterministic Fallback

If the Gemini API key is not configured, encounters a network timeout, or returns a malformed response, the engine seamlessly invokes `get_fallback_decision()`:
- **Temporary Bank Declines / Network Glitches:** Proposes `RETRY_LATER` with a 60-minute cooldown.
- **Expired Card / Invalid Credentials:** Proposes `REQUEST_PAYMENT_UPDATE`.
- **Cancelled Subscriptions:** Proposes `STOP`.
- **Exceeded Retries:** Proposes `ESCALATE_HUMAN`.
