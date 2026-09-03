# System Architecture — Autonomous AI Revenue Recovery Agent

The **Autonomous AI Revenue Recovery Agent** is a production-grade, event-driven payment recovery platform designed for high-volume subscription businesses on Razorpay. It replaces rigid cron-based retries with an intelligent, context-aware recovery lifecycle governed by deterministic safety boundaries.

---

## High-Level Architecture Overview

```
                        ┌────────────────────────────────────────────────────────┐
                        │                  Razorpay Webhook                     │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Ingestion Engine                                │
│   - Webhook HMAC Signature Validation                                                  │
│   - Idempotency & Concurrency Guards                                                   │
│   - Inngest Event Dispatch: 'recovery/payment.failed'                                  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Inngest Durable Workflow                                  │
│                                                                                        │
│   Step 1: Sanitized Context Engine (app/services/context/builder.py)                   │
│           ├── Strip PII (names, phones, raw card numbers)                              │
│           ├── Sanitize Prompt Injection Tokens                                         │
│           └── Compute Customer Segment (LOYAL, NORMAL, AT_RISK, HIGH_VALUE)            │
│                                                                                        │
│   Step 2: AI Decision Engine (app/services/ai/agent.py - Gemini 3.5 Flash)             │
│           ├── Multi-Action Evaluation across Candidate Catalog                         │
│           ├── Expected Recovery Value (EV = P * Amount - Cost - Friction)              │
│           ├── Metric Separation: Confidence vs Recovery Probability vs Net EV          │
│           └── Safe Deterministic Fallback if AI unavailable                            │
│                                                                                        │
│   Step 3: Deterministic Policy Engine (app/services/policy/engine.py)                  │
│           "AI proposes. Policy decides."                                               │
│           ├── 1. Payment Already Captured Check                                        │
│           ├── 2. Concurrent In-Flight Check                                            │
│           ├── 3. Cancelled Subscription Block -> STOP                                  │
│           ├── 4. Max Retries Limit -> ESCALATE_HUMAN                                   │
│           ├── 5. Max Autonomous Limit (> ₹25,000) -> ESCALATE_HUMAN                    │
│           ├── 6. Minimum Cooldown Enforced (>= 30 mins) -> DELAYED                     │
│           └── 7. Standard Policy Approval -> APPROVED                                  │
│                                                                                        │
│   Step 4: Pre-Execution Safety Check & Durable Execution                               │
│           ├── Re-verify payment status immediately before executable charge            │
│           ├── Inngest durable sleep for cooldown interval                              │
│           ├── Dispatch via Razorpay API (Direct Charge / Payment Update Link)          │
│           └── Inngest wait_for_event('razorpay/payment.captured')                      │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL / SQLite Storage & Audit Custody                        │
│   - RecoveryCase (Full Lifecycle State Machine)                                        │
│   - AIDecision (Proposals, Ranked Actions, Confidence, EV)                             │
│   - RecoveryDecision (Unified Audit Trail: AI Proposal + Policy Verdict)               │
│   - RecoveryAction / RecoveryAttempt (Amounts Attempted, Friction, Cost, Result)       │
│   - AuditLog (Immutable Chronological Event Stream)                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Webhook Ingestion & Idempotency Layer
- Accepts incoming `payment.failed` and `payment.captured` webhooks from Razorpay or the built-in local simulator.
- Computes SHA256 HMAC signature verification with strict secret checking.
- Verifies idempotency to prevent duplicate case creation or double-charging.

### 2. Context Engine (`app/services/context/builder.py`)
- Extracts only essential diagnostic signals: failure code, amount, currency, past successful billing cycles, past failed cycles, and subscription status.
- Strips all PII and sanitizes against prompt injection patterns (`ignore previous instructions`, `system prompt`, `override policy`).
- Assigns heuristic customer segmentation (`LOYAL`, `NORMAL`, `AT_RISK`, `HIGH_VALUE`).

### 3. AI Decision Engine (`app/services/ai/agent.py`)
- Powered by Gemini 3.5 Flash via structured JSON schema prompts.
- Evaluates multiple candidate actions simultaneously and ranks them by Net Expected Recovery Value ($EV$).
- Emits explicit separated metrics:
  - **AI Confidence:** Confidence in diagnosis ($0.0 - 1.0$).
  - **Recovery Probability:** Likelihood that proposed action succeeds ($0.0 - 1.0$).
  - **Expected Net Value (EV):** $P(\text{recovery}) \times \text{Amount} - \text{Intervention Cost} - \text{Friction Penalty}$.

### 4. Deterministic Policy Gate (`app/services/policy/engine.py`)
- Independent safety barrier enforcing merchant rules.
- Strict evaluation order prevents AI hallucinations from executing unassisted retries on cancelled subscriptions, high-value invoices ($> \text{₹25,000}$), or exceeded retry limits.

### 5. Durable Recovery Lifecycle (`app/workflows/recovery.py`)
- Coordinates durable execution using Inngest step functions and event listeners.
- Performs an immediate pre-execution check to prevent race conditions before charging cards.
