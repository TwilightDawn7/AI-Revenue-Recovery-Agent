# Razorpay AI Buildathon 2026 — Track 3 Project Overview

## Project name

**AI Revenue Recovery Agent**

## One-line description

An AI-powered revenue recovery agent that detects revenue at risk from failed payments and related payment problems, diagnoses the likely cause, selects the best permitted recovery action, executes that action through Razorpay/test APIs, observes the outcome, and measures the revenue actually recovered.

## Problem we are solving

Merchants lose revenue even when customers intended to pay. Examples include:

- Failed payment attempts
- Failed subscription renewals
- Checkout abandonment
- Overdue receivables/invoices
- Repeated payment failures where indiscriminate retries are wasteful

A normal dashboard only tells a merchant that revenue is being lost. Our product should close the loop:

**Detect → Diagnose → Decide → Validate → Act → Observe → Recover / Escalate / Stop → Measure**

## Core product idea

Think of the product as a **Revenue Recovery Manager for a merchant**.

For every revenue-risk event, the system should:

1. Create or update a recovery case.
2. Gather context: amount, customer history, failure reason, prior attempts, subscription state, etc.
3. Ask the AI for a structured recommended action.
4. Run the recommendation through a deterministic policy/guardrail engine.
5. Execute only an allowed action.
6. Receive the result through the API/webhook path.
7. Continue the recovery workflow when appropriate.
8. Record an auditable explanation of what happened.
9. Attribute recovered money to the recovery case.

## Primary scope for the hackathon

Focus on **failed payment / subscription recovery** as the hero workflow. Do not attempt to build every possible revenue-recovery feature before the core workflow is strong.

### Hero scenario

Example:

- Customer: Rahul
- Subscription renewal: ₹1,999
- Previous successful payments: 8
- Current renewal: failed
- Failure reason: temporary-looking bank decline
- Customer has not cancelled
- Retry count: 0

The agent should reason that the case is likely recoverable, propose a retry, pass that proposal through the policy engine, execute the permitted action, observe the result, and record whether ₹1,999 was recovered.

### Important negative scenario

The system must also demonstrate that the AI **can stop**.

Example:

- Customer has cancelled the subscription.
- There have already been 2 automated attempts.
- Another retry is proposed.
- Policy engine blocks it.
- Case is stopped or escalated to a human.

This proves that the LLM is not an unrestricted payment controller.

## What makes this an agent instead of a chatbot

The project should not be just:

> "AI recommends retrying this payment."

It should perform an actual closed-loop workflow:

```text
Event
  ↓
Observe state
  ↓
Reason with AI
  ↓
Propose structured action
  ↓
Policy engine authorizes/blocks
  ↓
Execute permitted action
  ↓
Observe external result
  ↓
Re-evaluate
  ↓
Recover / escalate / stop
  ↓
Record outcome
```

The LLM is the **reasoning component**, not the complete control system.

## Core product principles

### 1. Measurable business outcome

The primary value metric is money recovered.

Example:

- Revenue at risk: ₹10,00,000
- Revenue recovered: ₹3,20,000
- Recovery rate: 32%

### 2. Bounded autonomy

The agent must operate within explicit merchant policies.

Example policy:

- Maximum automated retries: 2
- Minimum retry interval: 30 minutes
- Maximum automated recovery amount: ₹25,000
- Cancelled subscription: never retry
- Repeated failures: escalate
- Uncertain cases: human review

### 3. Explainability

Every important decision must have a reason and an audit trail.

Example:

```text
Case: RR-10293
Amount at risk: ₹1,999

Diagnosis:
Temporary-looking payment failure; customer has strong prior payment history.

AI decision:
RETRY_PAYMENT after 30 minutes

Policy:
Approved

Action:
Retry #1

Result:
SUCCESS

Recovered:
₹1,999
```

### 4. Event-driven workflow

Use payment events and webhooks to drive state changes rather than relying on constant polling.

### 5. Demo-first engineering

Every major backend capability should quickly appear in the frontend so the team always has a visible, demonstrable product.

## Target users

### Primary user

An online merchant or operations/revenue team that wants to recover failed or at-risk payments without manually investigating every case.

### Secondary user

A finance/operations manager who needs to understand:

- How much revenue is at risk
- What the agent is doing
- Why an action was taken
- How much money was recovered
- What was escalated or stopped

## Main screens

### Dashboard

Show:

- Revenue at risk
- Recovered revenue
- Recovery rate
- Cases processed
- Successful recoveries
- Escalations
- Recent recovery cases
- Recovery by intervention type

### Recovery case detail

Show:

- Customer
- Amount
- Problem type
- Payment/subscription context
- AI diagnosis
- AI recommended action
- Confidence (optional)
- Policy decision
- Action history
- Webhook/result history
- Final recovered amount

### Optional policy/settings view

Show the merchant's recovery boundaries:

- Retry count
- Retry delay
- Automated amount limit
- Escalation rules
- Stop conditions

### Optional evaluation/analytics view

Show:

- Batch size
- Revenue at risk
- Recovered amount
- Recovery rate
- Baseline comparison
- Intervention outcomes

## Success criteria

The project is successful when a reviewer can see this end-to-end:

1. A payment/revenue-risk event enters the system.
2. A recovery case is created.
3. AI reasons over relevant context.
4. A structured action is proposed.
5. Policy engine approves or blocks the action.
6. The allowed action is executed.
7. The result is observed.
8. The recovery case is updated.
9. Recovered revenue is measured.
10. The audit trail explains everything.

## What NOT to build first

Avoid spending hackathon time on:

- A generic customer-support chatbot
- A pure payment-failure classifier
- A dashboard with no automated recovery action
- Multiple loosely related AI agents
- Fine-tuning a model without a clear need
- Complex RAG infrastructure that does not affect recovery decisions
- Enterprise authentication/permissions that are irrelevant to the demo

## Demo narrative

The final pitch should communicate:

> Merchants already know that payments fail. The real problem is deciding what to do next and actually recovering the money. Our AI Revenue Recovery Agent turns a failed payment into a bounded, explainable recovery workflow and measures the money it wins back.

## Final mental model

**The AI proposes. The policy engine authorizes. The workflow engine orchestrates. Razorpay executes/communicates payment state. PostgreSQL records the truth. The dashboard shows the business impact.**
