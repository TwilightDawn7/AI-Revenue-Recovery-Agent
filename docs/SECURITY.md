# Security, Data Minimization & Prompt Injection Hardening

The **Autonomous AI Revenue Recovery Agent** incorporates financial-grade security standards to prevent data leakage, unauthorized transactions, prompt injection exploits, and race conditions.

---

## 1. Strict Context Minimization (PII Stripping)

The Context Engine (`app/services/context/builder.py`) ensures that the LLM is never exposed to sensitive customer identifiers:
- Customer phone numbers, email addresses, and full names are stripped.
- Raw card numbers, CVVs, and payment secrets are never ingested.
- The model receives only structural attributes: failure reason category, amount, currency, past billing renewal track record, and subscription status.

---

## 2. Prompt Injection Hardening

All incoming metadata and error descriptions are sanitized before insertion into prompts:
- Strips instruction hijackers (`ignore previous instructions`, `system prompt`, `you are now`, `override policy`, `developer mode`).
- Strips dangerous tokens (`[INST]`, `<|im_start|>`, `<script>`, `drop table`).
- Caps input lengths to prevent prompt buffer overflow attacks.

---

## 3. Webhook Signature Verification

All incoming webhooks verify Razorpay SHA256 HMAC signatures:
```python
expected_sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
if not hmac.compare_digest(expected_sig, incoming_sig):
    raise HTTPException(status_code=400, detail="Invalid webhook signature")
```

---

## 4. Concurrency & Replay Guards

- At most one executable recovery action is allowed in-flight per payment.
- Idempotency keys prevent duplicate case creation and multiple charges.
