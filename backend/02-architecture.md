# Razorpay AI Buildathon 2026 — Technical Architecture

## Architectural goal

Build a small, reliable, event-driven revenue recovery platform in which an LLM makes contextual decisions but never has unrestricted authority to perform financial actions.

## Recommended stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts (or another lightweight charting library)

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

### Database

- PostgreSQL

### AI

- OpenAI API / selected LLM
- Structured JSON outputs
- Custom Python orchestration initially

### Workflow / background jobs

- **Inngest**

Inngest is preferred over Redis + Celery for this project because the core workload is event-driven, delayed, retryable, multi-step recovery workflows.

### Razorpay

- Razorpay Test Mode
- Relevant REST APIs
- Razorpay Webhooks
- Webhook signature verification

### Evaluation

- Python
- pandas
- deterministic evaluation scripts

### Deployment

A practical split:

- Next.js: Vercel or another Next.js-friendly host
- FastAPI: Render/Railway/Fly.io or equivalent
- PostgreSQL: Neon/Supabase or equivalent managed Postgres
- Inngest: hosted Inngest

Use whatever hosting the team can deploy confidently. Infrastructure should not become the project.

## High-level architecture

```text
                         ┌───────────────────────┐
                         │   Razorpay Test Mode  │
                         │  APIs + Webhooks      │
                         └───────────┬───────────┘
                                     │
                           events / API responses
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FastAPI         │
                         │      Application      │
                         └───────────┬───────────┘
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
               ▼                     ▼                     ▼
       ┌──────────────┐      ┌───────────────┐      ┌──────────────┐
       │ PostgreSQL   │      │   AI Agent    │      │   Inngest    │
       │ source of    │      │  reasoning    │      │ workflows    │
       │ truth        │      └───────┬───────┘      └──────┬───────┘
       └──────────────┘              │                     │
                                     ▼                     │
                            ┌────────────────┐             │
                            │ Policy Engine  │◄────────────┘
                            │ / Guardrails   │
                            └───────┬────────┘
                                    │
                                    ▼
                            ┌────────────────┐
                            │ Action Executor│
                            └───────┬────────┘
                                    │
                                    ▼
                              Razorpay APIs

             ┌──────────────────────────────────────────────┐
             │                  Next.js UI                  │
             │ Dashboard / Cases / Audit / Metrics / Policy│
             └──────────────────────▲───────────────────────┘
                                    │
                                 REST API
                                    │
                                 FastAPI
```

## Core design principle

### LLM must not directly control Razorpay actions

Correct:

```text
LLM
 ↓
structured proposed action
 ↓
policy engine
 ↓
allowed?
 ↓ yes
executor
 ↓
Razorpay
```

Incorrect:

```text
LLM
 ↓
raw tool access
 ↓
Razorpay payment API
```

The policy engine is the hard boundary.

## Core domain model

### Merchant

Represents the business using the recovery system.

Fields:

```text
id
name
created_at
```

### Customer

Fields:

```text
id
merchant_id
name
email
created_at
```

### Payment

Fields should contain the minimum information needed for recovery reasoning, for example:

```text
id
merchant_id
customer_id
amount
currency
status
failure_reason
razorpay_reference
created_at
updated_at
```

### Subscription

```text
id
merchant_id
customer_id
amount
status
next_billing_date
razorpay_reference
created_at
updated_at
```

### RecoveryCase

This is the central domain object.

```text
id
merchant_id
customer_id
payment_id / subscription_id
problem_type
amount_at_risk
status
retry_count
recovery_window_started_at
recovered_amount
created_at
updated_at
```

Suggested statuses:

```text
AT_RISK
ANALYZING
ACTION_PENDING
WAITING
RECOVERED
FAILED
ESCALATED
STOPPED
```

### AIDecision

```text
id
recovery_case_id
diagnosis
recommended_action
delay_minutes
confidence
reason
model_name
created_at
```

### RecoveryAction

```text
id
recovery_case_id
action_type
attempt_number
status
external_reference
result_summary
executed_at
```

### AuditLog

```text
id
recovery_case_id
event_type
actor
payload
created_at
```

`actor` can distinguish:

```text
SYSTEM
AI
POLICY_ENGINE
MERCHANT
RAZORPAY_WEBHOOK
```

## API surface

Start small. Expand only when needed.

### Health

```text
GET /health
```

### Dashboard

```text
GET /metrics
GET /recovery-cases
```

### Case

```text
GET /recovery-cases/{id}
POST /recovery-cases/{id}/analyze
POST /recovery-cases/{id}/execute
```

### Webhooks

```text
POST /webhooks/razorpay
```

### Optional

```text
GET /audit-logs/{case_id}
GET /policies
GET /evaluation
```

## Event-driven recovery workflow

### Example: failed subscription payment

```text
1. Razorpay emits payment-related event.
2. FastAPI verifies webhook signature.
3. Backend upserts payment/customer state.
4. Backend creates or updates RecoveryCase.
5. FastAPI emits an Inngest event.
6. Inngest starts recovery workflow.
7. Workflow loads recovery context from PostgreSQL.
8. AI produces structured decision.
9. Policy engine validates decision.
10. If blocked: write audit record and stop/escalate.
11. If allowed: execute recovery action.
12. Workflow waits if a delayed action is required.
13. Razorpay result arrives by webhook.
14. Backend updates state and emits an event.
15. Inngest resumes the workflow.
16. System calculates recovered amount.
17. Audit log is finalized.
```

## AI decision contract

Do not ask the model for arbitrary prose as the source of truth.

Use a strict structure similar to:

```json
{
  "action": "RETRY_PAYMENT",
  "delay_minutes": 30,
  "confidence": 0.91,
  "reason": "First temporary-looking failure with strong prior payment history"
}
```

Possible actions:

```text
RETRY_PAYMENT
REQUEST_PAYMENT_UPDATE
SEND_REMINDER
ESCALATE_HUMAN
STOP
```

The exact action set should be limited to actions the backend actually implements.

## AI context construction

The AI should not receive the entire database blindly. Build a compact, deterministic recovery context.

Example:

```json
{
  "amount": 1999,
  "currency": "INR",
  "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
  "failure_reason": "BANK_DECLINE",
  "previous_successful_payments": 8,
  "previous_failed_payments": 0,
  "retry_count": 0,
  "subscription_active": true,
  "customer_cancelled": false,
  "merchant_policy": {
    "max_retries": 2,
    "min_retry_interval_minutes": 30,
    "max_automated_amount": 25000
  }
}
```

## Policy engine

The policy engine should be deterministic and testable.

Example checks:

```text
if customer_cancelled:
    BLOCK

if retry_count >= max_retries:
    BLOCK / ESCALATE

if amount > max_automated_amount:
    ESCALATE

if action == RETRY_PAYMENT and retry_interval_not_met:
    DELAY / BLOCK

if action is unknown or unsupported:
    BLOCK
```

The policy engine should return a structured result, e.g.:

```json
{
  "allowed": true,
  "decision": "APPROVED",
  "reason": "Within retry and amount limits"
}
```

## Inngest workflow responsibilities

Use Inngest for things such as:

- Delayed retry workflows
- Retry/backoff around recoverable technical failures
- Waiting for external payment events
- Multi-step recovery sequences
- Escalation after a stopping condition
- Resuming workflow after a webhook event

Do not use Inngest to store business truth. PostgreSQL remains the source of truth.

## Webhook responsibilities

Webhook handler should:

1. Receive the request.
2. Verify the Razorpay signature.
3. Parse the event.
4. Idempotently update the relevant payment/subscription state.
5. Create an audit event.
6. Emit an internal event if a recovery workflow must resume.
7. Return quickly.

Do not perform a long AI workflow directly inside the webhook request.

## Idempotency

This matters because webhook systems can deliver repeated events.

Implement at minimum:

- Store an external event/reference ID.
- Ignore already-processed events.
- Make recovery action execution idempotent where applicable.
- Protect against duplicate recovery cases.

## Security basics

- Razorpay secret keys stay server-side.
- LLM API key stays server-side.
- Database credentials stay server-side.
- Validate webhook signatures.
- Validate all AI outputs against a Pydantic schema.
- Never execute unknown AI actions.
- Never trust an AI-generated amount or customer ID; derive critical identifiers from server-side state.

## Frontend architecture

Suggested page structure:

```text
/app
  /dashboard
  /recovery-cases
  /recovery-cases/[id]
  /policy
  /evaluation
```

The frontend should consume backend APIs and not talk directly to Razorpay with secret credentials.

## Dashboard metrics

At minimum:

```text
revenue_at_risk
recovered_revenue
recovery_rate
cases_processed
successful_recoveries
escalations
stopped_cases
```

Optional:

```text
recovery_by_action
recovery_by_failure_reason
baseline_vs_agent
average_attempts
```

## Evaluation architecture

Use a fixed synthetic/test batch so results are reproducible.

Example:

```text
1000 cases
₹10,00,000 at risk
```

Run at least:

1. Baseline strategy.
2. AI agent strategy.

Compare:

```text
Total recovered
Recovery rate
Successful interventions
Unnecessary interventions
Escalation rate
Average attempts
```

The benchmark must be deterministic enough to repeat after code changes.

## Recommended repo structure

```text
razorpay-revenue-recovery/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── recovery/
│   │   │   ├── policy/
│   │   │   └── razorpay/
│   │   ├── workflows/
│   │   ├── db/
│   │   └── core/
│   └── tests/
│
├── evaluation/
│   ├── generate_data.py
│   ├── run_baseline.py
│   ├── run_agent.py
│   └── metrics.py
│
├── docs/
│   ├── architecture.md
│   └── demo-script.md
│
├── .env.example
├── README.md
└── docker-compose.yml (optional)
```

## Key engineering rule

Prefer simple, explicit modules over framework-heavy abstraction.

The project is judged on the quality of the revenue-recovery system, not on the number of libraries used.
