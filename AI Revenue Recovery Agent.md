# AI Revenue Recovery Agent
## Production & Buildathon Enhancement Implementation Plan

**Repository:** `TwilightDawn7/AI-Revenue-Recovery-Agent`

**Objective:** Upgrade the existing AI Revenue Recovery Agent into a polished, demonstrably intelligent, measurable, safe, and merchant-oriented Razorpay Buildathon project.

---

# 0. EXECUTION RULES

These rules apply to the entire implementation.

## 0.1 Preserve the existing system

The existing application is already functional.

Do NOT rewrite the project from scratch.

Before modifying anything:

1. Inspect the existing implementation.
2. Understand the current architecture.
3. Reuse existing services, models, routes, workflows, components, and utilities whenever possible.
4. Only introduce new abstractions when the existing architecture genuinely cannot support the requirement.
5. Do not replace working libraries/frameworks merely because another option is more fashionable.

---

# 0.2 Implement sequentially

Implement the project in the exact phase order below.

Do not attempt to implement all phases in one pass.

For every phase:

1. Inspect relevant existing code.
2. Create a short implementation plan.
3. Implement the phase.
4. Run backend tests.
5. Run frontend checks/build.
6. Run relevant integration tests.
7. Manually verify affected UI.
8. Fix regressions.
9. Update documentation.
10. Only then proceed to the next phase.

---

# 0.3 Maintain backward compatibility

Existing functionality must continue working unless explicitly superseded by this plan.

Do NOT break:

- Razorpay integration
- webhook handling
- Inngest workflows
- existing recovery cases
- existing simulator
- existing evaluation
- dashboard
- activity/audit views
- database compatibility
- local development
- existing API contracts

If an API contract must change, preserve backward compatibility where practical.

---

# 0.4 No unnecessary AI complexity

Do NOT introduce:

- multi-agent architecture
- vector databases
- RAG
- autonomous code execution
- unnecessary ML models
- blockchain
- unrelated AI features
- chatbot functionality unless directly useful to recovery

The core architecture should remain:

```text
AI reasoning
      ↓
Deterministic policy gate
      ↓
Razorpay execution
      ↓
Event observation
      ↓
Revenue attribution
```

The AI proposes.

The policy engine authorizes.

The executor performs.

---

# 0.5 Financial safety principle

No LLM output may directly authorize or execute a financial action.

Every AI recommendation must pass through:

```text
AI
 ↓
Schema validation
 ↓
Deterministic policy validation
 ↓
Execution eligibility
 ↓
Executor
```

An invalid AI response must result in a safe fallback.

---

# 0.6 Do not expose chain-of-thought

Never store or display hidden chain-of-thought.

Store only concise decision explanations suitable for a merchant.

Good:

> Recent successful payments and a temporary issuer failure make a delayed retry the highest-value low-friction intervention.

Bad:

> Full internal reasoning transcript...

The system should expose:

- diagnosis
- confidence
- selected action
- action alternatives
- expected recovery value
- concise explanation
- policy result

---

# 0.7 Never fabricate metrics

All recovery and evaluation metrics must be derived from actual system data.

Do not hardcode:

- recovery rates
- recovered revenue
- scenario counts
- benchmark results
- policy violations

Demo-only data may be seeded, but it must be clearly represented as demo/simulation data.

---

# 0.8 No fake Razorpay execution

The application must clearly distinguish:

```text
REAL RAZORPAY TEST API ACTION
```

from:

```text
SIMULATED ACTION
```

Do not represent simulated recovery as a real payment capture.

---

# Phase 0 — Repository Audit & Baseline

## Goal

Understand and document the existing system before changing it.

## Tasks

Inspect:

### Backend

- FastAPI entry point
- routers
- services
- database layer
- models
- schemas
- AI integration
- policy engine
- Razorpay client
- webhook handling
- Inngest functions
- recovery logic
- evaluation logic
- simulator

### Frontend

- routes/pages
- dashboard
- recovery cases
- case details
- simulator
- evaluation
- activity/audit
- settings
- shared components

### Infrastructure

- environment variables
- database configuration
- local setup
- Docker/configuration if present
- dependency files
- tests

## Required deliverable

Create:

```text
docs/CURRENT_ARCHITECTURE.md
```

Document:

```text
Current architecture
Current database model
Current event flow
Current AI flow
Current policy flow
Current Razorpay flow
Current workflow flow
Current frontend structure
Current evaluation methodology
Current benchmark numbers
Known limitations
```

## Baseline verification

Run:

```text
backend tests
frontend lint
frontend build
existing evaluation
existing simulator
```

Record the baseline.

## Acceptance criteria

- Existing application runs.
- Existing tests pass.
- Existing evaluation can be reproduced.
- Architecture is documented.
- No functional code changes are made unless required to fix an existing issue.

---

# Phase 1 — Reliability, Data Model & Audit Foundation

## Goal

Create a stable foundation for future recovery intelligence.

## Tasks

Review and normalize the relationships among:

```text
Customer
Subscription
Payment
Recovery Case
Recovery Attempt
AI Decision
Policy Decision
Audit Event
```

Every recovery case must have a stable identifier.

## Recovery Case

Ensure it can represent:

```text
case_id
payment_id
customer_id
subscription_id
amount
currency
failure_code
failure_reason
status
created_at
updated_at
```

Use the project's existing naming conventions where applicable.

## AI Decision

Ensure the system can persist:

```text
decision_id
case_id
diagnosis
confidence
recommended_action
reasoning_summary
expected_recovery_probability
expected_recovery_value
created_at
```

## Recovery Attempt

Ensure:

```text
attempt_id
case_id
action
status
result
amount_recovered
executed_at
```

## Audit Event

Every important transition must be auditable.

Example:

```text
PAYMENT_FAILED
CASE_CREATED
CONTEXT_BUILT
AI_ANALYSIS_COMPLETED
AI_ACTION_SELECTED
POLICY_APPROVED
POLICY_BLOCKED
ACTION_SCHEDULED
ACTION_EXECUTED
PAYMENT_RECOVERED
RECOVERY_STOPPED
HUMAN_ESCALATED
```

## Acceptance criteria

A recovery case can be traced from:

```text
payment
→ AI decision
→ policy decision
→ action
→ result
→ recovered amount
```

without relying on unstructured logs.

---

# Phase 2 — Recovery Action Framework

## Goal

Create a standardized action space for the AI.

Define the recovery actions supported by the actual application.

Recommended conceptual actions:

```text
RETRY_NOW
RETRY_LATER
PAYMENT_UPDATE
CUSTOMER_NOTIFICATION
HUMAN_ESCALATION
STOP
```

Do not add an action unless it can actually be represented/executed by the system.

## Create action abstraction

Implement a reusable action definition containing:

```text
action
description
customer_friction
estimated_cost
requires_human
requires_policy_approval
```

## Action evaluation

Create a service capable of evaluating an action against recovery context.

Conceptually:

```python
evaluate_action(
    action,
    payment_context,
    customer_context,
    subscription_context,
    merchant_policy
)
```

Return:

```text
recovery_probability
expected_revenue
estimated_cost
friction_penalty
expected_recovery_value
```

At this phase, values may use deterministic estimates.

Do not yet depend entirely on the LLM for these calculations.

## Acceptance criteria

The system can evaluate multiple possible recovery actions using one consistent interface.

---

# Phase 3 — Context Engine

## Goal

Give the AI enough contextual information to make meaningful decisions.

Create/reuse a centralized context builder.

Conceptually:

```text
RecoveryContext
```

It should combine:

```text
Payment
Customer
Subscription
Payment history
Recovery history
Failure history
Merchant policy
Available recovery actions
```

Example:

```json
{
  "payment": {
    "amount": 7999,
    "failure_code": "BANK_DECLINE",
    "retry_count": 0
  },
  "customer": {
    "tenure_days": 420,
    "successful_payments": 13,
    "failed_payments": 1,
    "lifetime_value": 28000
  },
  "subscription": {
    "status": "active",
    "plan": "pro"
  }
}
```

## Customer segmentation

Add lightweight contextual segmentation where useful:

```text
LOYAL
NORMAL
AT_RISK
HIGH_VALUE
```

Do not build a complex ML segmentation system.

Use explainable deterministic signals.

## Acceptance criteria

The AI receives a consistent, structured context object.

No duplicated customer/payment history queries should be scattered throughout the decision flow.

---

# Phase 4 — AI Decision Engine 2.0

## Goal

Upgrade the AI from simple diagnosis/recommendation into a contextual recovery decision engine.

This is one of the highest-priority phases.

## AI responsibilities

The AI should:

### 1. Diagnose

Examples:

```text
TEMPORARY_ISSUER_FAILURE
INSUFFICIENT_FUNDS
EXPIRED_PAYMENT_METHOD
NETWORK_FAILURE
HARD_DECLINE
UNKNOWN
```

Use failure categories supported by the project.

### 2. Evaluate actions

Consider available actions.

### 3. Rank actions

Example:

```text
1. RETRY_LATER
2. PAYMENT_UPDATE
3. HUMAN_ESCALATION
```

### 4. Estimate recovery probability

Example:

```text
RETRY_LATER
probability = 0.72
```

### 5. Calculate expected recovery value

Conceptually:

```text
Expected Recovery Value
=
recovery_probability × payment_amount
-
intervention_cost
-
friction_penalty
```

The implementation may use a deterministic calculation after the AI supplies the probability.

Do not allow the LLM to arbitrarily perform financial arithmetic without validation.

### 6. Select an action

### 7. Produce concise explanation

## Structured AI output

Use strict schema validation.

Conceptually:

```json
{
  "diagnosis": "TEMPORARY_ISSUER_FAILURE",
  "confidence": 0.91,
  "actions": [
    {
      "action": "RETRY_LATER",
      "recovery_probability": 0.72,
      "expected_recovery_value": 5757,
      "rank": 1
    }
  ],
  "selected_action": "RETRY_LATER",
  "explanation": "Recent successful payments and an active subscription make a delayed retry the highest-value low-friction option."
}
```

## Validation requirements

Reject:

```text
unknown actions
confidence < 0
confidence > 1
negative probabilities
negative amounts
malformed JSON
missing required fields
invalid enum values
```

## Fallback

If AI fails:

```text
AI failure
 ↓
safe deterministic fallback
 ↓
no unauthorized financial action
```

## Acceptance criteria

For the same contextual scenario, the agent can distinguish between different recovery strategies based on:

- customer history
- payment history
- failure type
- amount
- subscription state
- retry history
- merchant policy

---

# Phase 5 — Deterministic Policy Gate 2.0

## Goal

Make the system's safety model explicit:

# AI proposes. Policy decides.

The AI must never bypass this layer.

## Flow

```text
AI Proposal
    ↓
Schema Validation
    ↓
Policy Engine
    ↓
APPROVE / MODIFY / BLOCK
    ↓
Executor
```

## Policies

Implement/reuse deterministic policies for:

### Retry limit

```text
retry_count >= max_retries
→ BLOCK
```

### Amount limit

```text
amount > autonomous_amount_limit
→ HUMAN_ESCALATION
```

### Subscription state

```text
CANCELLED
→ STOP
```

### Payment state

```text
ALREADY_CAPTURED
→ STOP
```

### Duplicate recovery

```text
active recovery exists
→ BLOCK duplicate execution
```

### Cooldown

```text
last_attempt < minimum_retry_interval
→ DELAY
```

### Hard failure

Do not automatically retry failure types that should require customer action.

## Policy result

The policy engine should produce:

```text
decision
reason
rule_triggered
original_ai_action
final_action
```

Example:

```text
AI:
RETRY_LATER

Policy:
BLOCK

Reason:
Maximum retry count reached.

Final action:
HUMAN_ESCALATION
```

## Acceptance criteria

It must be possible to demonstrate:

```text
AI recommends unsafe action
→ policy blocks it
→ safe fallback executes
```

---

# Phase 6 — Merchant Recovery Policy Studio

## Goal

Allow merchants to configure recovery boundaries.

Create or extend a merchant settings page.

Recommended controls:

```text
Maximum automatic retries
[ 2 ]

Minimum retry interval
[ 30 minutes ]

Maximum autonomous payment
[ ₹25,000 ]

High-value payments
[ Require human approval ]

Cancelled subscriptions
[ Stop recovery ]

Temporary failures
[ Allow retry ]

Hard failures
[ Require customer action ]
```

## Validation

Prevent unsafe or invalid values.

Examples:

```text
negative retry count → reject
negative amount → reject
invalid interval → reject
```

## Policy versioning

Where practical, store policy version information with recovery cases.

A historical recovery decision should be explainable using the policy that existed at that time.

## Acceptance criteria

A merchant can change:

```text
maximum retries
```

and the recovery engine immediately respects the new boundary.

---

# Phase 7 — Recovery Lifecycle & Durable Execution

## Goal

Create a complete event-driven recovery lifecycle using the project's existing Inngest/workflow infrastructure.

Do not replace Inngest if it is already functioning correctly.

## Lifecycle

```text
DETECTED
↓
ANALYZING
↓
DECIDING
↓
VALIDATING
↓
SCHEDULED
↓
EXECUTING
↓
RECOVERED / FAILED / ESCALATED / STOPPED
```

## Event flow

```text
Razorpay payment.failed
        ↓
Create recovery case
        ↓
Build context
        ↓
AI diagnosis
        ↓
AI action ranking
        ↓
Policy validation
        ↓
Execute action
        ↓
Observe result
        ↓
Update recovery case
        ↓
Continue / escalate / stop
```

## Stopping rules

Stop recovery when:

```text
payment succeeds
subscription cancelled
maximum retries reached
merchant disables recovery
hard failure requires customer action
case expires
human takes ownership
```

## Idempotency

Ensure duplicate events do not create duplicate financial actions.

For example:

```text
payment.failed
payment.failed
payment.failed
```

must not cause three independent recovery workflows.

## Acceptance criteria

The entire lifecycle is represented in the database and audit system.

---

# Phase 8 — Revenue Attribution & Merchant Analytics

## Goal

Make the system clearly demonstrate business value.

## Dashboard metrics

Add/standardize:

```text
Revenue At Risk
Revenue Recovered
Recovery Rate
Revenue Protected
Average Recovery Time
Active Recoveries
Recovery Attempts
Wasted Retries Prevented
Human Escalations
```

## Definitions

Use precise metric definitions.

### Revenue at risk

Amount associated with failed payments eligible for recovery.

### Revenue recovered

Money from payments that actually succeed following a recovery intervention.

### Revenue protected

Only use this metric if the implementation has a defensible definition.

Document exactly how it is calculated.

### Recovery rate

```text
Recovered Revenue / Revenue At Risk
```

Do not mix simulation and live/test-mode money without clearly labeling the source.

## Recovery by strategy

Show:

```text
Retry
Payment Update
Human Escalation
```

and the revenue associated with each.

## Recovery by failure type

Show:

```text
Bank Decline
Network Failure
Expired Payment Method
Insufficient Funds
etc.
```

## Acceptance criteria

Every dashboard number can be traced back to underlying recovery/payment data.

---

# Phase 9 — Evaluation 2.0

## Goal

Prove that the AI actually improves recovery outcomes.

This phase is critical for judging credibility.

## First fix evaluation inconsistencies

Review the current documentation and code for any discrepancy between:

```text
100-case benchmark
```

and:

```text
1,000-case benchmark
```

If both exist, clearly explain their purpose.

Never display contradictory numbers.

---

# Baselines

Compare at least:

## Baseline 1 — Always Retry

Naive strategy.

## Baseline 2 — Failure-Code Rules

Simple mapping:

```text
temporary failure → retry
expired card → update payment method
hard decline → stop
```

## Baseline 3 — Existing Rule-Based Engine

Use the strongest deterministic implementation available.

## Baseline 4 — AI Recovery Agent

The new system.

---

# Metrics

Measure:

```text
Recovery Rate
Revenue Recovered
Revenue At Risk
Average Recovery Time
Recovery Attempts
Wasted Retries
Human Escalations
Policy Violations
False Recovery Decisions
```

## Dataset

Create a balanced synthetic evaluation dataset containing multiple failure types:

```text
BANK_DECLINE
INSUFFICIENT_FUNDS
EXPIRED_CARD
NETWORK_TIMEOUT
FRAUD_SUSPECTED
CANCELLED_SUBSCRIPTION
DUPLICATE_PAYMENT
UNKNOWN_FAILURE
```

and customer segments:

```text
LOYAL
NORMAL
AT_RISK
HIGH_VALUE
```

## Reproducibility

Use deterministic seeds where randomness is involved.

Store evaluation configuration:

```text
dataset size
random seed
failure distribution
customer distribution
baseline configuration
agent configuration
```

## Evaluation UI

Show:

```text
                 RULES       AI AGENT

Recovery Rate     XX.X%        XX.X%

Recovered         ₹XXX         ₹XXX

Attempts           XXX          XXX

Wasted Retries     XXX          XXX

Policy Violations   X             0
```

## Acceptance criteria

A reviewer should be able to understand:

1. What dataset was used.
2. How the scenarios were generated.
3. What the baselines do.
4. What the AI does.
5. Which metrics were measured.
6. How the final numbers were calculated.

---

# Phase 10 — Agent Decision Replay

## Goal

Create the project's strongest demonstration UI.

Every recovery case should have a human-readable decision timeline.

Example:

```text
RECOVERY CASE #RC-1048

₹7,999
BANK DECLINE
```

Then:

```text
PAYMENT FAILED
      ↓
CONTEXT BUILT
      ↓
AI ANALYSIS
      ↓
ACTION RANKING
      ↓
POLICY CHECK
      ↓
ACTION EXECUTED
      ↓
PAYMENT RESULT
      ↓
REVENUE ATTRIBUTION
```

## Context section

Show useful context:

```text
13 successful payments
1 previous failure
Active subscription
Customer tenure
Lifetime value
Current retry count
```

Do not expose sensitive unnecessary information.

## AI section

Show:

```text
Diagnosis
Confidence
Recommended action
Alternative actions
Expected recovery probability
Expected recovery value
Concise explanation
```

## Policy section

Show:

```text
✓ Retry allowed
✓ Amount below autonomous limit
✓ Retry count below maximum
```

or:

```text
✗ Retry blocked
Reason: maximum retries reached
```

## Result section

Show:

```text
Action
Result
Amount recovered
Time to recovery
```

---

# Phase 11 — AI vs Policy Showcase

## Goal

Create a guaranteed demo proving that AI is bounded.

Create a curated scenario such as:

```text
Payment:
₹48,000

Failure:
BANK_DECLINE
```

AI:

```text
Recommended:
RETRY_LATER

Confidence:
96%
```

Policy:

```text
Maximum autonomous amount:
₹25,000

₹48,000 > ₹25,000

BLOCK
```

Final:

```text
HUMAN_ESCALATION
```

UI should explicitly state:

# AI recommendation blocked by merchant policy.

Then communicate:

# AI ≠ Authority

The AI reasons.

The policy engine controls financial boundaries.

---

# Phase 12 — Live Activity Stream

## Goal

Turn the existing activity/audit page into a readable event stream.

Example:

```text
21:43:09  payment.failed
          ₹7,999

21:43:10  AI diagnosis
          TEMPORARY_ISSUER_FAILURE

21:43:10  AI decision
          RETRY_LATER

21:43:10  policy
          APPROVED

21:44:11  retry
          EXECUTED

21:44:15  payment.captured
          +₹7,999

21:44:15  recovery
          SUCCESS
```

Reuse the existing event infrastructure.

Do not introduce a new real-time system unless required.

---

# Phase 13 — Frontend Product Polish

## Goal

Only after backend functionality is stable, improve presentation.

Do not perform a major visual rewrite until previous phases are complete.

## Dashboard

Prioritize:

```text
Revenue Recovered
Revenue At Risk
Recovery Rate
Active Recoveries
Human Escalations
```

## Recovery cases

Filters:

```text
All
At Risk
Recovering
Recovered
Escalated
Stopped
```

## Case detail

Make the decision replay the primary visual element.

## Evaluation

Make baseline vs AI comparison immediately understandable.

## Policy Studio

Clearly communicate:

> These are the boundaries AI cannot cross.

## Activity

Use readable event cards rather than raw backend logs.

---

# Phase 14 — Security, Reliability & Failure Testing

## Goal

Attempt to break the system intentionally.

---

## AI failure tests

Test:

```text
malformed AI output
missing fields
unknown action
invalid confidence
negative probability
negative recovery value
unexpected enum
timeout
LLM unavailable
```

Expected:

```text
safe fallback
no unauthorized execution
```

---

## Razorpay failure tests

Test:

```text
API timeout
duplicate webhook
already captured payment
invalid payment ID
network failure
```

---

## Workflow failure tests

Test:

```text
worker restart
duplicate event
workflow retry
partial execution
```

---

## Policy tests

Test:

```text
retry limit exceeded
amount limit exceeded
cancelled subscription
duplicate recovery
cooldown active
human escalation required
```

---

## Security review

Check:

```text
API authentication
authorization
webhook verification
environment secrets
input validation
SQL injection
sensitive logging
prompt injection through external data
```

Do not log secrets.

Do not commit API keys.

---

# Phase 15 — Curated Demo Dataset

## Goal

Create deterministic demo scenarios so the final presentation never depends on random behavior.

Create approximately:

```text
20–30 curated scenarios
```

Include at least:

---

## Scenario A — Successful retry

```text
Temporary bank decline
→ retry later
→ payment captured
→ revenue recovered
```

---

## Scenario B — Payment update

```text
Expired payment method
→ payment update
→ successful recovery
```

---

## Scenario C — High-value escalation

```text
₹48,000
→ AI recommends retry
→ policy blocks
→ human escalation
```

---

## Scenario D — Cancellation stop

```text
Subscription cancelled
→ STOP
```

---

## Scenario E — Maximum retries

```text
Retry #2
→ failure
→ STOP
```

---

## Scenario F — Duplicate webhook

```text
payment.failed
payment.failed
→ one recovery case
→ one eligible action
```

---

## Scenario G — AI failure

```text
AI unavailable
→ deterministic safe fallback
→ no unsafe action
```

---

# Phase 16 — Documentation & Submission Readiness

Create:

```text
docs/
├── CURRENT_ARCHITECTURE.md
├── ARCHITECTURE.md
├── AI_DECISION_ENGINE.md
├── POLICY_ENGINE.md
├── RECOVERY_LIFECYCLE.md
├── EVALUATION.md
├── SECURITY.md
└── DEMO_SCENARIOS.md
```

---

# README STRUCTURE

The README should communicate the project within the first screen.

Recommended structure:

```text
# AI Revenue Recovery Agent

Autonomously recover failed Razorpay payments
while keeping financial actions bounded,
explainable and auditable.

Detect
↓
Diagnose
↓
Decide
↓
Validate
↓
Act
↓
Observe
↓
Measure
```

Then immediately show:

```text
Problem

Architecture

Key Features

AI Decision Engine

Policy Safety

Razorpay Integration

Evaluation

Screenshots

Demo

Setup

Technical Architecture
```

Do not force judges to read the entire README before understanding the project.

---

# Final System Architecture

The completed system should conceptually implement:

```text
                         RAZORPAY
                            │
                     payment.failed
                            │
                            ▼
                  ┌──────────────────┐
                  │ EVENT INGESTION  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ CONTEXT ENGINE   │
                  │                  │
                  │ Payment          │
                  │ Customer         │
                  │ Subscription     │
                  │ History          │
                  │ Recovery History │
                  │ Merchant Policy  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │     AI AGENT     │
                  │                  │
                  │ Diagnose         │
                  │ Predict          │
                  │ Rank Actions     │
                  │ Calculate EV     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │   POLICY GATE    │
                  │                  │
                  │ Retry Limits     │
                  │ Amount Limits    │
                  │ State Checks     │
                  │ Merchant Rules   │
                  └────────┬─────────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
             RETRY     UPDATE PMT   HUMAN
                │          │          │
                └──────────┼──────────┘
                           ▼
                       RAZORPAY
                           │
                           ▼
                  payment.captured
                           │
                           ▼
                  ┌──────────────────┐
                  │ OBSERVABILITY    │
                  │                  │
                  │ Audit            │
                  │ Attribution      │
                  │ Recovery         │
                  │ Analytics        │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ MERCHANT CONSOLE │
                  │                  │
                  │ Dashboard        │
                  │ Cases            │
                  │ Replay           │
                  │ Policies        │
                  │ Evaluation       │
                  │ Activity         │
                  └──────────────────┘
```

---

# Definition of Done

The project is considered complete only when all of the following are true.

## Intelligence

- [ ] AI uses payment + customer + subscription + recovery context.
- [ ] AI diagnoses failure.
- [ ] AI evaluates multiple recovery actions.
- [ ] AI ranks actions.
- [ ] AI estimates recovery probability.
- [ ] Expected recovery value is calculated.
- [ ] AI provides concise explanations.
- [ ] AI output is schema validated.

## Safety

- [ ] AI cannot directly execute financial actions.
- [ ] Policy engine validates every action.
- [ ] Retry limits enforced.
- [ ] Autonomous amount limits enforced.
- [ ] Cancelled subscriptions stop recovery.
- [ ] Duplicate recovery prevented.
- [ ] Cooldowns enforced.
- [ ] Hard failures handled safely.
- [ ] AI failures have safe fallbacks.

## Merchant control

- [ ] Merchant can configure retry limits.
- [ ] Merchant can configure autonomous amount limits.
- [ ] Merchant can configure escalation behavior.
- [ ] Policies are validated.
- [ ] Recovery decisions can be associated with policy versions.

## Execution

- [ ] Razorpay integration remains functional.
- [ ] Webhooks remain functional.
- [ ] Inngest workflows remain functional.
- [ ] Actions are idempotent.
- [ ] Recovery lifecycle is persisted.

## Analytics

- [ ] Revenue at risk is measurable.
- [ ] Revenue recovered is measurable.
- [ ] Recovery rate is measurable.
- [ ] Recovery by strategy is visible.
- [ ] Recovery by failure type is visible.
- [ ] Human escalations are visible.
- [ ] Wasted retries can be measured.

## Evaluation

- [ ] Multiple baselines exist.
- [ ] Dataset methodology is documented.
- [ ] Evaluation is reproducible.
- [ ] Metrics are derived from actual evaluation results.
- [ ] 100/1,000 scenario discrepancy is resolved.
- [ ] AI performance can be compared against deterministic strategies.

## UX

- [ ] Dashboard clearly communicates merchant value.
- [ ] Recovery cases are easy to understand.
- [ ] Decision replay exists.
- [ ] AI-vs-policy behavior is visible.
- [ ] Activity stream is readable.
- [ ] Policy Studio exists.
- [ ] Evaluation dashboard is understandable.

## Demo

- [ ] Successful recovery scenario works.
- [ ] Payment-update scenario works.
- [ ] High-value escalation works.
- [ ] Policy-block scenario works.
- [ ] Stop-recovery scenario works.
- [ ] Duplicate webhook scenario works.
- [ ] AI failure scenario works.
- [ ] Demo dataset is deterministic.

## Documentation

- [ ] Architecture documented.
- [ ] AI engine documented.
- [ ] Policy engine documented.
- [ ] Lifecycle documented.
- [ ] Evaluation methodology documented.
- [ ] Security documented.
- [ ] Demo scenarios documented.
- [ ] README updated.

---

# Final Engineering Principle

The finished product should not look like:

```text
Payment failed
↓
Ask AI
↓
Retry payment
```

It should demonstrate:

```text
Payment failed
        ↓
Understand customer + payment context
        ↓
Diagnose failure
        ↓
Evaluate multiple interventions
        ↓
Estimate expected recovery value
        ↓
Choose optimal intervention
        ↓
Apply deterministic merchant policy
        ↓
Execute safely
        ↓
Observe payment outcome
        ↓
Continue / escalate / stop
        ↓
Attribute recovered revenue
        ↓
Record complete audit trail
```

The key architectural principle is:

# AI decides what is economically sensible.
# Policy decides what is permitted.
# Razorpay executes what is authorized.
# The system measures whether it actually worked.

Prioritize correctness, explainability, safety, measurable revenue impact, and demo clarity over architectural novelty.