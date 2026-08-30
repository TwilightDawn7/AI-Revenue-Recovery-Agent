# Razorpay AI Buildathon 2026 — Implementation Plan

## Deadline

**Final submission: September 5, 2026**

Current planned start: **August 26, 2026**

This is a 10-day sprint. The development strategy is deliberately **vertical-slice**:

> Backend capability → frontend page → connect them → backend capability → frontend update → integration → polish.

Do not build the entire backend first and postpone the frontend.

## Non-negotiable milestone

### August 29 = MVP checkpoint

By the end of August 29, the following must work:

```text
Revenue-risk event
      ↓
Recovery case
      ↓
Case detail page
      ↓
Deterministic recovery decision
      ↓
Recovery result
      ↓
Stored history
```

The AI can still be mocked or replaced by deterministic rules at this checkpoint. The critical thing is that the complete product loop exists.

---

# Phase 0 — Lock scope

## Date

**August 26**

## Goal

Freeze the product idea before implementation becomes fragmented.

## Decide

Hero workflow:

**Failed payment / subscription renewal recovery**

Secondary workflows should remain optional until the hero workflow is solid.

## Complete by end of day

- Project name selected.
- One-sentence problem statement.
- One-sentence solution statement.
- Hero user journey documented.
- Recovery actions defined.
- Safety policies defined.
- Success metrics defined.
- Final demo scenario written down.

## Minimum action set

Start with:

```text
RETRY_PAYMENT
REQUEST_PAYMENT_UPDATE
ESCALATE_HUMAN
STOP
```

Add reminders only if the core flow is already strong.

## Acceptance criteria

A teammate should be able to answer:

> What happens from the moment a payment fails until either money is recovered or the case stops?

in less than one minute.

---

# Phase 1 — Backend foundation

## Dates

**August 26–27**

## Goal

Create the backend foundation and the first useful APIs.

## Build

### Backend

- FastAPI app
- Environment configuration
- PostgreSQL connection
- SQLAlchemy models
- Pydantic schemas
- Basic error handling
- Basic logging

### Models

Start with:

```text
Merchant
Customer
Payment
RecoveryCase
```

Add AI/audit/action tables once the first flow works.

### APIs

```text
GET /health
GET /metrics
GET /recovery-cases
GET /recovery-cases/{id}
```

## Test

Insert sample data and confirm:

- API can read metrics.
- API can list cases.
- API can return one case.
- Database constraints behave correctly.

## Done means

You can open an API endpoint and see a real recovery-case object loaded from PostgreSQL.

---

# Phase 2 — First frontend slice

## Date

**August 27**

## Goal

Make the project visible immediately.

## Build

Next.js + TypeScript + Tailwind + shadcn/ui.

Create:

```text
/dashboard
```

### Dashboard v1

Display:

```text
Revenue at Risk
Recovered Revenue
Recovery Rate
Cases Processed
Recent Cases
```

Initially hard-coded/mocked data is acceptable.

Then connect it to:

```text
GET /metrics
GET /recovery-cases
```

## Done means

A user can open the dashboard and see recovery data coming from the backend rather than mock JSON.

---

# Phase 3 — Recovery case lifecycle

## Dates

**August 27–28**

## Goal

Turn payment failure into a proper recovery case.

## Build

Implement:

```text
Payment FAILED
      ↓
Create RecoveryCase
      ↓
status = AT_RISK
```

Create a clear case-state model:

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

Add:

```text
POST /recovery-cases/{id}/analyze
POST /recovery-cases/{id}/execute
```

The first implementation can use simple deterministic logic.

## Frontend

Create:

```text
/recovery-cases/[id]
```

Show:

- Customer
- Amount
- Failure reason
- Payment history
- Current state
- Recommended action
- Action history

## Done means

A judge can click from the dashboard into a case and understand why revenue is at risk.

---

# Phase 4 — MVP recovery engine

## Date

**August 29**

## Goal

Reach the hard MVP checkpoint.

## Build deterministic strategy first

Example:

```text
if cancelled:
    STOP
elif retry_count >= 2:
    ESCALATE
elif temporary_failure:
    RETRY_PAYMENT
elif invalid_payment_method:
    REQUEST_PAYMENT_UPDATE
else:
    ESCALATE
```

The action must be executable by the backend.

## Add action result storage

Track:

```text
action_type
attempt_number
status
external_reference
result
executed_at
```

## MVP acceptance test

Given:

```text
Customer: Rahul
Amount: ₹1,999
Failure: temporary-looking bank decline
Retries: 0
Active subscription: yes
```

System should:

```text
create case
→ decide retry
→ execute/test action
→ record result
→ update case
```

And a negative test:

```text
Customer cancelled
→ STOP
```

### Critical rule

Do not continue adding features if this loop is broken.

---

# Phase 5 — Add AI reasoning

## Dates

**August 29–30**

## Goal

Replace hard-coded action selection with contextual AI reasoning while keeping deterministic execution controls.

## Build

### Context builder

Create a function that extracts the relevant context for an individual case.

### LLM decision

Use structured output.

Example:

```json
{
  "action": "RETRY_PAYMENT",
  "delay_minutes": 30,
  "confidence": 0.91,
  "reason": "First temporary-looking failure with strong prior payment history"
}
```

### Validation

Parse the model output with Pydantic.

Reject:

- Unknown actions
- Missing required fields
- Invalid delay values
- Invalid numeric fields

## Testing

Create at least 10–20 representative cases covering:

- First temporary failure
- Repeated failure
- Cancelled subscription
- Invalid payment method
- High-value payment
- Already recovered case
- Ambiguous/unknown failure

## Done means

The AI chooses different actions for different contexts instead of always retrying.

---

# Phase 6 — Policy engine and safety boundary

## Dates

**August 31 – September 1**

## Goal

Make autonomous recovery bounded, explainable, and safe.

## Build

Create a deterministic policy engine between AI and execution.

```text
AI proposal
   ↓
Policy Engine
   ↓
APPROVED / BLOCKED / ESCALATED / DELAYED
   ↓
Action Executor
```

## Rules

At minimum:

```text
max retries = 2
min retry interval = 30 minutes
max automated amount = configurable
cancelled = STOP
retry limit exceeded = ESCALATE
unknown action = BLOCK
```

## Add audit log

For every case, record:

- AI proposal
- AI reason
- Policy decision
- Policy reason
- Executed action
- External result
- Recovered amount
- Final state

## Frontend update

Add a policy/audit panel to the case page.

## Done means

You can demonstrate:

> The AI suggested an action, but the system refused it because it violated a policy.

---

# Phase 7 — Inngest workflow orchestration

## Dates

**August 31 – September 1**

## Goal

Turn the recovery process into an event-driven, delayed, resumable workflow.

## Use Inngest for

- Delayed retry
- Multi-step recovery
- Retry/backoff where appropriate
- Waiting for external payment events
- Resuming after webhook events
- Escalation after stopping conditions

## Example workflow

```text
payment.failed
      ↓
createRecoveryCase
      ↓
analyzeWithAI
      ↓
policyCheck
      ↓
retry allowed?
   /          \
 yes           no
  ↓             ↓
schedule       stop/escalate
retry
  ↓
wait
  ↓
observe result
  ↓
recover / next strategy / stop
```

## Important implementation rule

Do not keep long work inside the webhook HTTP request.

Webhook handler should validate, persist, and emit/trigger the workflow; Inngest handles the long-running workflow.

## Done means

A case can survive a delayed step or external event and resume correctly.

---

# Phase 8 — Razorpay integration hardening

## Dates

**September 1–2**

## Goal

Make the demo's payment path feel real and event-driven.

## Build

- Razorpay Test Mode credentials
- Relevant API integrations for the selected scenario
- Webhook endpoint
- Webhook signature verification
- Event idempotency
- External reference persistence
- Error handling

## Webhook flow

```text
Razorpay
 ↓
POST /webhooks/razorpay
 ↓
verify signature
 ↓
parse event
 ↓
update DB
 ↓
write audit log
 ↓
emit internal event if needed
```

## Done means

The system can receive a Razorpay/test event, safely update internal state, and continue the recovery workflow without duplicate actions.

---

# Phase 9 — Evaluation and revenue-recovery proof

## Date

**September 2**

## Goal

Produce the strongest quantitative evidence in the project.

## Build a fixed batch

Example:

```text
1000 cases
₹10,00,000 revenue at risk
```

Generate a mixture of recoverable and non-recoverable scenarios.

## Run two strategies

### Baseline

Use simple deterministic logic.

Example:

> Retry every eligible failure once.

### AI agent

Use your complete recovery system.

## Measure

```text
revenue_at_risk
recovered_revenue
recovery_rate
successful_interventions
escalations
stopped_cases
unnecessary_interventions
average_attempts
```

## Example final result format

```text
Revenue at risk:       ₹10,00,000
Baseline recovered:   ₹2,10,000
AI recovered:         ₹3,20,000
Improvement:          +₹1,10,000
AI recovery rate:      32%
```

Use real measurements from your system; never invent final numbers.

## Done means

You can confidently answer:

> How much money did the agent recover, and how did it compare with a baseline?

---

# Phase 10 — Dashboard polish

## Date

**September 3**

## Goal

Make the product understandable in 30 seconds.

## Final dashboard should show

```text
Revenue at Risk
Recovered Revenue
Recovery Rate
Cases Processed
Successful Recoveries
Escalations
Stopped Cases
```

Add charts only where they support a business conclusion.

Recommended sections:

1. KPI cards
2. Recovery funnel
3. Recent cases
4. Recovery by strategy
5. Recovery trend or batch comparison

## Case detail should show

```text
Problem
Context
AI diagnosis
AI proposal
Policy decision
Action
External result
Recovered amount
Audit timeline
```

## Visual priority

The dashboard should visually emphasize:

**₹ recovered**

not:

**number of AI calls**.

---

# Phase 11 — Submission package

## Date

**September 4**

## Goal

Freeze the product and finish all competition materials.

## Do not add major features

From this point, only fix bugs, improve clarity, and prepare submission materials.

## Repository checklist

- Public GitHub repository
- Working README
- Setup instructions
- Architecture diagram
- Environment variable example
- Test/demo instructions
- AI workflow explanation
- Policy/guardrail explanation
- Evaluation results
- Screenshots or GIF if useful

## 5-minute video

Suggested structure:

### 0:00–0:30 — Problem

Explain revenue leakage.

### 0:30–1:00 — Solution

Explain the AI recovery agent and architecture.

### 1:00–3:30 — Live demo

Show a successful recovery and a blocked/escalated case.

### 3:30–4:30 — Results

Show revenue at risk, recovered revenue, recovery rate, and baseline comparison.

### 4:30–5:00 — Why it matters

Close with the business value.

---

# September 5 — Submission day

## Goal

Submit, do not redesign.

## Final checklist

- Build from a clean environment.
- Confirm environment variables.
- Confirm frontend loads.
- Confirm backend loads.
- Confirm database is reachable.
- Confirm Razorpay/test integration.
- Confirm webhook endpoint.
- Run one successful recovery case.
- Run one blocked/escalated case.
- Run final evaluation script.
- Verify metrics shown in video match code output.
- Verify README links.
- Verify repository visibility.
- Verify pitch video.
- Submit.

---

# Development rhythm for the team

## Recommended working pattern

Do not assign one person the entire backend for five days.

Instead, divide by vertical slice.

### Example

Developer A:

- FastAPI
- DB
- recovery APIs
- Razorpay integration

Developer B:

- Next.js
- dashboard
- case detail
- charts

Developer C (if available):

- AI decision layer
- evaluation
- prompts
- policy tests

Still keep one shared architecture and one shared domain model.

## Daily rule

Every day should end with something that can be demonstrated.

Examples:

**Aug 27:** Dashboard shows real recovery cases.

**Aug 28:** Clicking a case shows its lifecycle.

**Aug 29:** A complete non-AI recovery loop works.

**Aug 30:** AI chooses the next action.

**Sep 1:** Policy blocks unsafe actions and Inngest handles delayed steps.

**Sep 2:** Batch evaluation produces measurable recovered revenue.

**Sep 3:** Product looks polished.

**Sep 4:** Submission package is complete.

---

# Prioritization rule

Use this order whenever deciding what to build next:

```text
1. Does it make the recovery loop work?
2. Does it improve recovered revenue?
3. Does it improve safety/explainability?
4. Does it improve the demo?
5. Everything else.
```

If a feature does not help one of the first four, it is probably out of scope for the hackathon.

# Definition of done for the whole project

The project is done when this complete story works:

```text
Razorpay/test payment event
        ↓
Revenue-risk detection
        ↓
Recovery case
        ↓
Context gathering
        ↓
AI diagnosis + structured action
        ↓
Deterministic policy validation
        ↓
Inngest workflow
        ↓
Razorpay/test action
        ↓
Webhook/result
        ↓
Agent re-evaluation
        ↓
Recovered / escalated / stopped
        ↓
Audit trail
        ↓
Recovered revenue metric
        ↓
Merchant dashboard
```

That is the product. Everything else is supporting infrastructure or polish.
