# System Architecture — Autonomous AI Revenue Recovery Agent
> **Razorpay AI Buildathon 2026 — Track 3 Submission**  
> *Production-Grade, Event-Driven Autonomous Revenue Recovery Platform with Deterministic Safety Gates.*

---

## 📌 Architectural Overview

The **Autonomous AI Revenue Recovery Agent** is designed for high-volume subscription businesses and digital merchants operating on Razorpay. It replaces naive, indiscriminate cron retries with an intelligent, context-aware recovery lifecycle governed by the foundational principle:

$$\Large \mathbf{\text{AI proposes. Policy decides.}}$$

The platform harmonizes four architectural pillars:
1. **Event Ingestion & Idempotency Layer (FastAPI)**: Ingests webhooks with HMAC SHA256 signature verification and atomic database deduplication.
2. **Context Engine & AI Decision Engine (Google Gemini 3.5 Flash)**: Synthesizes sanitized, zero-PII transaction history and ranks candidate recovery strategies by Net Expected Recovery Value ($EV$).
3. **Deterministic Policy Gate**: An independent non-LLM rule engine evaluating 7 strict safety guardrails.
4. **Durable Execution & Orchestration Engine (Inngest)**: Multi-step durable workflows handling scheduled delays, retry pre-checks, API execution, and asynchronous webhook resume listening.

---

## 🏛️ End-to-End System Architecture

```mermaid
flowchart TB
    subgraph Ingestion ["1. INGESTION & IDEMPOTENCY LAYER"]
        RZP["⚡ Razorpay Webhook / Live Simulator"] -->|Inbound HTTP POST| API["🛡️ FastAPI Webhook Endpoint (/api/webhooks/razorpay)"]
        API -->|1. HMAC SHA-256 Check| SIG{"Valid Signature?"}
        SIG -->|No| REJ["❌ 400 Bad Request"]
        SIG -->|Yes| DEDUP{"Event in AuditLog?"}
        DEDUP -->|Duplicate| IGN["⚠️ 200 Duplicate Ignored"]
        DEDUP -->|New Event| DB_SAVE["💾 Upsert Customer, Payment, Case"]
        DB_SAVE -->|Emit recovery/payment.failed| INN_PUB["📡 Inngest Event Dispatcher"]
    end

    subgraph DurableWorkflow ["2. INNGEST DURABLE WORKFLOW (payment-recovery-workflow)"]
        INN_PUB --> S1["Step 1: AI Diagnosis (step.run)"]
        
        subgraph Step1 ["Context Building & AI Reasoning"]
            S1 --> CTX["🧹 Sanitized Context Builder (Strip PII + Customer Segment)"]
            CTX --> GEMINI["🤖 Google Gemini 3.5 Flash (Structured JSON Schema)"]
            GEMINI -->|Candidate Actions Ranked by EV| PROP["📋 Proposed AI Decision"]
        end

        PROP --> S2["Step 2: Policy Gate Validation (step.run)"]

        subgraph Step2 ["Deterministic Policy Engine"]
            S2 --> POL{"🛡️ 7-Rule Deterministic Policy Gate"}
            POL -->|Sub Cancelled| STOP_ACT["🛑 Action: STOP"]
            POL -->|Amount > ₹25k or Retries >= 2| ESC_ACT["👤 Action: ESCALATE_HUMAN"]
            POL -->|Cooldown < 30m| ADJ_ACT["⏳ Action: RETRY_LATER (Enforce 30m)"]
            POL -->|Clean Limits| APP_ACT["✅ Action: APPROVED"]
        end

        APP_ACT & ADJ_ACT --> S3["Step 3: Durable Sleep & Cooldown (step.sleep)"]
        S3 --> S4["Step 4: Pre-Execution Safety Re-Check"]
        
        subgraph Step4 ["Pre-Execution Safety & Action Dispatch"]
            S4 --> RECHECK{"Payment Already Captured?"}
            RECHECK -->|Yes (e.g. paid via link/web)| AUTO_REC["🎉 Mark Case RECOVERED (Aborted charge)"]
            RECHECK -->|No (still at risk)| EXEC_DISPATCH["⚡ Razorpay API Dispatcher"]
            EXEC_DISPATCH -->|Direct Retry| RZP_CHARGE["💳 Razorpay Charge API"]
            EXEC_DISPATCH -->|Payment Link| RZP_LINK["🔗 Razorpay Payment Link API"]
        end

        RZP_CHARGE & RZP_LINK --> S5["Step 5: Webhook Observation (step.wait_for_event)"]
        S5 -->|razorpay/payment.captured event| CASE_SUCCESS["🏁 Case State: RECOVERED"]
        S5 -->|Timeout (1h - 3d)| CASE_FAIL["⚠️ Case State: FAILED"]
        STOP_ACT --> CASE_STOPPED["🛑 Case State: STOPPED"]
        ESC_ACT --> CASE_ESCALATED["👤 Case State: ESCALATED"]
    end

    subgraph Storage ["3. PERSISTENCE & AUDIT CUSTODY"]
        CASE_SUCCESS & CASE_FAIL & CASE_STOPPED & CASE_ESCALATED --> PG[(PostgreSQL / SQLite Database)]
        PG --- T1["RecoveryCase"]
        PG --- T2["AIDecision"]
        PG --- T3["RecoveryDecision"]
        PG --- T4["RecoveryAction"]
        PG --- T5["AuditLog (Immutable)"]
    end

    subgraph UI ["4. REAL-TIME OPERATIONS CONSOLE"]
        PG --> DASH["📊 Next.js 16 Console (http://localhost:3000)"]
        DASH --- U1["Executive KPI Dashboard (/)"]
        DASH --- U2["Live Recovery Cases (/cases)"]
        DASH --- U3["Case Forensic View (/cases/[id])"]
        DASH --- U4["Live Activity Feed (/activity)"]
        DASH --- U5["Scenario Simulator (/simulator)"]
        DASH --- U6["Policy Studio (/settings)"]
        DASH --- U7["Evaluation & ROI Benchmark (/evaluation)"]
    end

    style Ingestion fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style DurableWorkflow fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc
    style Storage fill:#111827,stroke:#64748b,stroke-width:2px,color:#f8fafc
    style UI fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc
```

---

## 🔄 Sequence Diagram: End-to-End Recovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Banking Rail
    participant RZP as Razorpay Gateway
    participant API as FastAPI Backend
    participant DB as Database (SQLAlchemy)
    participant Inngest as Inngest Durable Engine
    participant Gemini as Gemini 3.5 Flash
    participant Policy as Policy Engine
    participant Ops as Human Operations Console

    Customer->>RZP: Recurring Subscription Payment Fails
    RZP->>API: POST /api/webhooks/razorpay (payment.failed)
    Note over API: Verify HMAC SHA256 Signature<br/>Check Idempotency in AuditLog
    API->>DB: Upsert Customer, Payment, RecoveryCase (Status: AT_RISK)
    API->>Inngest: Send Event `recovery/payment.failed` {case_id, payment_id}
    API-->>RZP: 200 OK (Event Ingested)

    Inngest->>API: Execute Step: `ai-diagnosis`
    API->>DB: Query Sanitized History (Strip PII)
    API->>Gemini: POST Structured Prompt (Catalog & Net EV Formula)
    Gemini-->>API: AI Proposal {Diagnosis, Action, Confidence, Recovery Prob, EV}
    API->>DB: Save AIDecision & AuditLog (Status: DECIDING)

    Inngest->>API: Execute Step: `policy-evaluation`
    API->>Policy: Evaluate 7 Deterministic Rules
    Note over Policy: Enforce Max Retries, Sub Status,<br/>Amount Limit & Min Cooldown
    Policy-->>API: Policy Verdict {Allowed, Overridden Action, Reason}
    API->>DB: Save RecoveryDecision & AuditLog (Status: VALIDATING)

    alt Action is RETRY_LATER
        Inngest->>Inngest: step.sleep(cooldown_duration e.g. 30m)
        Inngest->>API: Execute Step: `execute-payment-retry`
        Note over API: Pre-Execution Safety Re-Check:<br/>Verify payment.status != 'captured'
        API->>RZP: POST /v1/payments/{id}/retry
        API->>DB: Record RecoveryAction (Attempt #1, Status: ACTION_PENDING)
        Inngest->>Inngest: step.wait_for_event('razorpay/payment.captured', timeout=1h)
        RZP->>API: POST Webhook (payment.captured)
        API->>Inngest: Dispatch Resume Event `razorpay/payment.captured`
        Inngest->>API: Execute Step: `finalize-retry-case`
        API->>DB: Update Case Status -> RECOVERED (Amount: ₹1,999)
    else Action is REQUEST_PAYMENT_UPDATE
        Inngest->>API: Execute Step: `create-payment-update-link`
        API->>RZP: POST /v1/payment_links
        RZP-->>API: Payment Link URL (https://rzp.io/i/rec_xyz)
        API->>DB: Update Case Status -> WAITING
        Inngest->>Inngest: step.wait_for_event('razorpay/payment.captured', timeout=3d)
    else Action is ESCALATE_HUMAN
        Inngest->>API: Execute Step: `escalate-recovery`
        API->>DB: Update Case Status -> ESCALATED
        API->>Ops: Emit Real-Time Escalation Notification
    else Action is STOP
        Inngest->>API: Execute Step: `stop-recovery`
        API->>DB: Update Case Status -> STOPPED (0 Wasted Retries)
    end
```

---

## 🧩 Component Breakdown

### 1. Ingestion & Idempotency Layer (`backend/app/main.py`)
- **HMAC Signature Guard**: Computes `hmac.new(secret, body, sha256)` against `X-Razorpay-Signature`. Rejecting unauthenticated requests prevents malicious spoofing.
- **Atomic Idempotency Guard**: Checks if incoming `event_id` exists in `AuditLog.payload["event_id"]`. Duplicates return HTTP 200 immediately without redundant processing.
- **Relational Upserting**: Idempotently creates or syncs `Merchant`, `Customer`, `Subscription`, `Payment`, and `RecoveryCase` records.

### 2. Context Engine (`backend/app/services/context/builder.py`)
- **Zero-PII Sanitation**: Explicitly removes customer names, email addresses, phone numbers, and full card details.
- **Prompt Injection Defense**: Sanitizes tokens such as `[INST]`, `<|im_start|>`, `ignore previous instructions`, `system prompt`, and caps payload length to 500 characters.
- **Heuristic Customer Segmentation**: Categorizes customer risk based on longevity, successful renewal track record, and payment failure frequency (`LOYAL`, `NORMAL`, `AT_RISK`, `HIGH_VALUE`).

### 3. AI Decision Engine (`backend/app/services/ai/agent.py`)
- **Gemini 3.5 Flash Reasoning**: Invoked with structured Pydantic schema enforcement via JSON schema mode.
- **Multi-Action Candidate Ranking**: Evaluates the action catalog (`RETRY_NOW`, `RETRY_LATER`, `REQUEST_PAYMENT_UPDATE`, `CUSTOMER_NOTIFICATION`, `ESCALATE_HUMAN`, `STOP`) and computes the Net Expected Recovery Value ($EV$) for each candidate.
- **Metric Separation**: Strict architectural separation between **Confidence** ($0.0 - 1.0$), **Recovery Probability** ($0.0 - 1.0$), and **Expected Value** (INR).

### 4. Deterministic Policy Gate (`backend/app/services/policy/engine.py`)
- Evaluates a 7-rule sequential cascade. AI proposals that violate merchant boundaries are immediately overridden.
- Tracks `policy_version` on every decision for tamper-proof regulatory auditability.

### 5. Durable Orchestration Engine (`backend/app/workflows/recovery.py`)
- Built on **Inngest Python SDK v0.3.0+**.
- Uses durable primitives:
  - `step.run(step_id, handler)` for non-blocking atomic execution units.
  - `step.sleep(step_id, duration)` for robust cooldowns lasting minutes to days without consuming server threads.
  - `step.wait_for_event(step_id, event, timeout, if_exp)` for asynchronous webhook synchronization.
- **Pre-Execution Safety Re-Check**: Before dispatching any payment retry, the database and payment status are re-verified to prevent double-charging if the customer paid during the cooldown sleep.

---

## 📊 Data Model & Entity-Relationship Diagram

```mermaid
erDiagram
    MERCHANT ||--o{ CUSTOMER : has
    MERCHANT ||--o{ MERCHANT_POLICY : defines
    CUSTOMER ||--o{ SUBSCRIPTION : holds
    CUSTOMER ||--o{ PAYMENT : makes
    SUBSCRIPTION ||--o{ PAYMENT : generates
    PAYMENT ||--|| RECOVERY_CASE : targets
    RECOVERY_CASE ||--o{ AI_DECISION : records
    RECOVERY_CASE ||--o{ RECOVERY_DECISION : records
    RECOVERY_CASE ||--o{ RECOVERY_ACTION : executes
    RECOVERY_CASE ||--o{ AUDIT_LOG : tracks

    MERCHANT {
        int id PK
        string name
        datetime created_at
    }

    MERCHANT_POLICY {
        int id PK
        int merchant_id FK
        int max_retries
        int min_retry_interval_minutes
        float max_autonomous_amount
        string high_value_action
        int policy_version
        datetime updated_at
    }

    RECOVERY_CASE {
        int id PK
        int merchant_id FK
        string customer_id FK
        string payment_id FK
        string subscription_id FK
        string status "AT_RISK|ANALYZING|DECIDING|VALIDATING|SCHEDULED|WAITING|ACTION_PENDING|RECOVERED|FAILED|ESCALATED|STOPPED"
        string problem_type
        float amount_at_risk
        float recovered_amount
        int retry_count
        datetime created_at
        datetime updated_at
    }

    AI_DECISION {
        int id PK
        int recovery_case_id FK
        string diagnosis
        string recommended_action
        int delay_minutes
        float confidence
        float recovery_probability
        float expected_recovery_value
        json actions_evaluated
        text reason
        string model_name
        int policy_version
        datetime created_at
    }

    RECOVERY_DECISION {
        int id PK
        int recovery_case_id FK
        string diagnosis
        string ai_action
        float ai_confidence
        float recovery_probability
        float expected_recovery_value
        json actions_evaluated
        string policy_decision "APPROVED|OVERRIDDEN"
        string policy_rule
        text policy_reason
        string final_action
        int delay_minutes
        int policy_version
        datetime created_at
    }

    RECOVERY_ACTION {
        int id PK
        int recovery_case_id FK
        string action_type
        int attempt_number
        string status "INITIATED|EXECUTED|FAILURE|CAPTURED|STOPPED|ESCALATED"
        string external_reference
        text result_summary
        float amount_attempted
        float amount_recovered
        string customer_friction "LOW|MEDIUM|HIGH"
        float estimated_cost
        datetime created_at
    }

    AUDIT_LOG {
        int id PK
        int recovery_case_id FK
        string event_type
        string actor "SYSTEM|AI|POLICY_ENGINE|HUMAN_OPERATOR|RAZORPAY_WEBHOOK|SIMULATOR"
        json payload
        datetime created_at
    }
```
