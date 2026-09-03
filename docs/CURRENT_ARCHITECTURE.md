# Current Architecture & Baseline Documentation (Phase 0)

## 1. System Overview

The **AI Revenue Recovery Agent** is a full-stack, event-driven system built to recover failed payments and subscription renewals on the Razorpay gateway while maintaining strict financial guardrails, auditable decision-making, and high-performance workflow execution.

---

## 2. Component Architecture

```mermaid
flowchart TD
    subgraph External ["External Services / Client Rails"]
        RZP[Razorpay Payment Gateway]
        SIM[Webhook Simulator / Test Trigger]
        GEMINI[Google Gemini API]
    end

    subgraph Backend ["FastAPI Backend Application"]
        HANDLER[Webhook & API Handler (`app/main.py`)]
        DB_LAYER[(PostgreSQL / SQLite Fallback)]
        AI_SVC[AI Agent Service (`app/services/ai/agent.py`)]
        POL_SVC[Policy Engine (`app/services/policy/engine.py`)]
        RZP_CLIENT[Razorpay Client (`app/services/razorpay/client.py`)]
        INNGEST_WORKFLOW[Inngest Durable Workflow (`app/workflows/recovery.py`)]
    end

    subgraph Frontend ["Next.js 16 Merchant Console"]
        DASHBOARD[Executive Dashboard (`/`)]
        CASES[Case List & Detail (`/cases`, `/cases/[id]`)]
        SIM_UI[Interactive Simulator (`/simulator`)]
        EVAL_UI[Evaluation Benchmark UI (`/evaluation`)]
        SETTINGS_UI[Merchant Settings / Policy Studio (`/settings`)]
        ACTIVITY_UI[Live Audit Stream (`/activity`)]
    end

    SIM -->|Simulated Webhook| HANDLER
    RZP -->|Inbound Webhook| HANDLER
    HANDLER --> DB_LAYER
    HANDLER --> INNGEST_WORKFLOW
    INNGEST_WORKFLOW --> AI_SVC
    AI_SVC --> GEMINI
    INNGEST_WORKFLOW --> POL_SVC
    INNGEST_WORKFLOW --> RZP_CLIENT
    RZP_CLIENT --> RZP
    Frontend -->|REST APIs| HANDLER
```

---

## 3. Current Database Model

The database layer utilizes SQLAlchemy ORM with dual-engine support (PostgreSQL primary with automatic SQLite fallback for zero-configuration local runs).

### Entities:
1. **`Merchant`**: Top-level tenant (`id`, `name`, `created_at`).
2. **`Customer`**: Merchant customer entity (`id`, `merchant_id`, `name`, `email`, `created_at`).
3. **`Payment`**: Payment transaction (`id`, `merchant_id`, `customer_id`, `amount`, `currency`, `status`, `failure_reason`, `created_at`, `updated_at`).
4. **`Subscription`**: Recurring billing subscription (`id`, `merchant_id`, `customer_id`, `amount`, `status`, `next_billing_date`, `created_at`).
5. **`RecoveryCase`**: State machine tracking recovery lifecycle (`id`, `merchant_id`, `customer_id`, `payment_id`, `subscription_id`, `problem_type`, `amount_at_risk`, `status`, `retry_count`, `recovered_amount`, `recovery_window_started_at`, `created_at`, `updated_at`).
6. **`AIDecision`**: Log of LLM proposals (`id`, `recovery_case_id`, `diagnosis`, `recommended_action`, `delay_minutes`, `confidence`, `reason`, `model_name`, `created_at`).
7. **`RecoveryAction`**: Concrete action executions (`id`, `recovery_case_id`, `action_type`, `attempt_number`, `status`, `external_reference`, `result_summary`, `executed_at`).
8. **`AuditLog`**: Immutable event stream (`id`, `recovery_case_id`, `event_type`, `actor`, `payload`, `created_at`).

---

## 4. Current Event & Recovery Flow

1. **Inbound Webhook (`payment.failed`):**
   - Webhook received via `/api/webhooks/razorpay` or `/api/test/trigger-webhook`.
   - Idempotency guard verifies `event_id` hasn't already been processed.
   - Upserts `Customer`, `Payment`, and `Subscription` records.
   - Creates a `RecoveryCase` in `AT_RISK` status.
   - Dispatches `recovery/payment.failed` event to Inngest.
2. **Context Gathering:**
   - Inngest step `ai-diagnosis` queries payment details, failure reason, subscription state, past success count, and past failure count.
3. **AI Reasoning:**
   - Calls `get_ai_decision(context)`: uses Gemini if `GEMINI_API_KEY` is present; falls back to structured deterministic rule engine if absent or cached.
4. **Deterministic Policy Gate:**
   - Evaluates proposed action against policy limits:
     - Cancelled subscription $\to$ Force `STOP`.
     - Retry count $\ge 2$ $\to$ Force `ESCALATE_HUMAN`.
     - Amount $> ₹25,000$ $\to$ Force `ESCALATE_HUMAN`.
     - Delay $< 30\text{m}$ for retries $\to$ Force $30\text{m}$ cooldown.
5. **Execution & Durability:**
   - `RETRY_PAYMENT`: Durable `step.sleep(delay)` $\to$ Razorpay retry $\to$ `step.waitForEvent("razorpay/payment.captured")`.
   - `REQUEST_PAYMENT_UPDATE`: Creates Razorpay payment link $\to$ `step.waitForEvent("razorpay/payment.captured")`.
   - `ESCALATE_HUMAN`: Updates case to `ESCALATED`.
   - `STOP`: Updates case to `STOPPED`.
6. **Observation & Finalization:**
   - Webhook resumption or timeout updates status to `RECOVERED` or `FAILED`, updates `recovered_amount`, and logs audit events.

---

## 5. Current Evaluation Methodology & Baseline Numbers

- **Evaluation Dataset:** 100 representative synthetic test cases generated in `backend/evaluation/test_cases.json`.
- **Baseline Strategy:** Naive single retry on active subscriptions; no delay; no payment update links.
- **AI Agent Strategy:** Contextual action selection (`RETRY_PAYMENT` with delay, `REQUEST_PAYMENT_UPDATE` for credential errors, `ESCALATE_HUMAN` for high-value/exhausted retries, `STOP` on cancellation).
- **Baseline Measured Results (100 Executed Cases):**
  - Revenue At Risk: ₹615,697.05
  - Baseline Recovered: ₹33,482.00 (18 cases recovered, 5.44% recovery rate, 72 retries)
  - AI Agent Recovered: ₹369,987.35 (46 cases recovered, 60.09% recovery rate, 83 retries, 14 stopped, 7 escalated)
  - AI Revenue Uplift: +₹336,505.35

---

## 6. Known Limitations Identified in Baseline Audit

1. **Extrapolation in Evaluation:** The 1,000-scenario report was previously extrapolated from 100 cases instead of running 1,000 actual test executions.
2. **Merged Confidence & Probability:** AI decision schema currently combines model confidence and recovery probability into a single field.
3. **Data Model Coupling:** Generic action definitions and concrete execution attempts are mixed in `RecoveryAction`.
4. **Context Contains Unfiltered Fields:** Customer names and identifiers are not systematically stripped before prompt building.
5. **Static Merchant Policies:** Policy limits (2 retries, ₹25,000 max, 30m delay) are hardcoded in `evaluate_policy` rather than being dynamic database records with a live "Test Policy" sandbox.
6. **Showcase UI Decoupling:** Need to ensure the high-value ₹48,000 AI vs Policy scenario enters the full backend pipeline rather than using static client mocks.
7. **Pre-Execution Payment State Check:** The executor must re-verify payment status immediately before executing any charge to prevent race conditions.

---

## 7. Baseline Verification Record

- **Backend Integration Tests:** Passed (`./backend/.venv/Scripts/python.exe backend/verification_test.py`)
- **Backend Operator Action Tests:** Passed (`./backend/.venv/Scripts/python.exe backend/test_phase10_actions.py`)
- **Evaluation Runner:** Passed (`./backend/.venv/Scripts/python.exe backend/evaluation/run_evaluation.py`)
- **Frontend Production Build:** Passed (`npm run build` on Next.js 16 with Turbopack, 0 errors)
