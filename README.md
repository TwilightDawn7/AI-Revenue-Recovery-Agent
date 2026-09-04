# Autonomous AI Revenue Recovery Agent
> **Razorpay AI Buildathon 2026 — Track 3 Submission**  
> *Production-Grade Autonomous Revenue Recovery for Recurring Subscriptions & Digital Invoices.*

---

## 📌 Executive Summary

Every year, digital businesses and subscription merchants lose millions in recurring revenue due to involuntary churn—temporary bank outages, expired payment credentials, and network glitches. Traditional recovery relies on naive, indiscriminate retries that spam banking rails, frustrate customers, and fail on credential errors.

The **Autonomous AI Revenue Recovery Agent** closes the loop on revenue risk:

$$\Large \mathbf{\text{Detect} \longrightarrow \text{Sanitize} \longrightarrow \text{Diagnose} \longrightarrow \text{Decide} \longrightarrow \text{Validate} \longrightarrow \text{Execute} \longrightarrow \text{Observe} \longrightarrow \text{Attribution}}$$

It pairs **Google Gemini 3.5 Flash** reasoning with a **Deterministic Policy Engine** and **Inngest Durable Workflows** to dynamically choose the optimal recovery strategy while strictly enforcing merchant safety boundaries:

$$\Large \mathbf{\text{AI proposes. Policy decides.}}$$

---

## 🚀 Key Results & Empirical Benchmark (1,000 Executed Cases)

Benchmarked across 1,000 discrete simulated failure scenarios (fixed seed `42`, zero metric extrapolation):

| Strategy | Revenue At Risk | Recovered Revenue | Recovery Rate (%) | Recovered Cases | Attempts Sent | Wasted Retries | Policy Violations |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline 1: Always Retry** | ₹12,953,578.15 | ₹926,319.37 | 7.15% | 160 | 1,000 | 235 | 140 |
| **Baseline 2: Failure-Code Rules** | ₹12,953,578.15 | ₹4,264,868.40 | 32.92% | 286 | 668 | 0 | 0 |
| **Baseline 3: Rule-Based Engine** | ₹12,953,578.15 | ₹6,760,851.10 | 52.19% | 422 | 622 | 0 | 0 |
| **Baseline 4: AI Recovery Agent** | ₹12,953,578.15 | **₹7,998,002.11** | **61.74%** | **487** | **588** | **0** | **0** |

```mermaid
xychart-beta
    title "Benchmark Performance: Recovered Revenue across 1,000 Scenarios (₹ Millions)"
    x-axis ["Always Retry", "Failure-Code Rules", "Rule Engine", "AI Recovery Agent"]
    y-axis "Recovered Amount (₹M)" 0 --> 9
    bar [0.92, 4.26, 6.76, 7.99]
```

### AI Ablation Study: Value of Full Context

| Configuration | Recovered Revenue | Recovery Rate (%) | Wasted Retries Avoided | Human Escalations |
| :--- | :---: | :---: | :---: | :---: |
| **Rule-Based Engine** | ₹6,760,851.10 | 52.19% | 378 | 128 |
| **AI without Customer Context** | ₹6,901,733.34 | 53.28% | 398 | 116 |
| **AI with Full Customer Context** | **₹7,998,002.11** | **61.74%** | **412** | **94** |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Ingestion ["1. Event Ingestion & Security"]
        RZP[Razorpay Webhook / Simulator] -->|Inbound Event| API[FastAPI Webhook Ingestion Engine]
        API -->|HMAC SHA256 & Idempotency Check| DB[(PostgreSQL / SQLite)]
        API -->|Dispatch recovery/payment.failed| ING[Inngest Durable Workflow]
    end

    subgraph Intelligence ["2. Context Engine & AI Diagnostics"]
        ING --> CTX[Sanitized Context Builder]
        CTX -->|Zero-PII Signals + History| AI[Google Gemini 3.5 Flash]
        AI -->|Candidate Actions Ranked by Net EV| PROPOSAL[Proposed AI Decision]
    end

    subgraph Safety ["3. Deterministic Policy Gate"]
        PROPOSAL --> POL{7-Rule Deterministic Policy Gate}
        POL -->|Subscription Cancelled| STOP[🛑 Action: STOP]
        POL -->|Amount > ₹25k or Retries >= 2| ESC[👤 Action: ESCALATE_HUMAN]
        POL -->|Cooldown < 30m| DELAY[⏳ Action: RETRY_LATER Enforce 30m]
        POL -->|Standard Policy Limits| AUTH[✅ Action: APPROVED]
    end

    subgraph Execution ["4. Pre-Check & Gateway Execution"]
        AUTH --> PRE{Atomic Pre-Execution State Re-Check}
        PRE -->|Already Captured| RESOLVE[🎉 Mark Case RECOVERED Abort Charge]
        PRE -->|Still At Risk| RZP_API[Razorpay API Executor]
        RZP_API -->|Direct Retry / Payment Link| CAPTURE[Awaiting payment.captured Webhook]
    end
```

---

## 💻 Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy ORM, SQLite (local) / PostgreSQL (production), Inngest Python SDK v0.3.0+, Google Generative AI (`gemini-2.0-flash` / `gemini-1.5-flash`).
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, TanStack React Query.
- **Payment & Orchestration:** Razorpay Payments API & Payment Links, Inngest Durable Execution Engine.

---

## ⚡ Quickstart Guide

### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Start Local Inngest Dev Server
```powershell
npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest
# Inngest Dev Dashboard opens at http://localhost:8288
```

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
# Operations Console available at http://localhost:3000
```

### 4. Run Automated Test & Benchmark Suite
```powershell
# Security, prompt injection & guardrail test suite
backend/.venv/Scripts/python.exe backend/test_safety_and_reliability.py

# End-to-end integration & policy tests
backend/.venv/Scripts/python.exe backend/verification_test.py

# Execute 1,000-scenario benchmark
backend/.venv/Scripts/python.exe backend/evaluation/run_evaluation.py
```

---

## 📂 Documentation Suite

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): System architecture, Inngest durable orchestration, sequence diagrams, data model, and ERD.
- [`docs/AI_DECISION_ENGINE.md`](docs/AI_DECISION_ENGINE.md): Gemini prompt engineering, action catalog, Net Expected Recovery Value ($EV$) formula, and metric separation.
- [`docs/POLICY_ENGINE.md`](docs/POLICY_ENGINE.md): 7 deterministic safety rules, merchant policy studio, and versioning.
- [`docs/RECOVERY_LIFECYCLE.md`](docs/RECOVERY_LIFECYCLE.md): Full state machine, pre-execution safety re-checks, and Inngest step mappings.
- [`docs/EVALUATION.md`](docs/EVALUATION.md): 1,000 executed benchmark scenarios, multi-baseline comparison, and AI ablation study.
- [`docs/SECURITY.md`](docs/SECURITY.md): Zero-PII context minimization, prompt injection hardening, HMAC SHA256 signatures, and double-charge prevention.
- [`docs/DEMO_SCENARIOS.md`](docs/DEMO_SCENARIOS.md): 10 curated demo scenarios, interactive simulator guide, and operations walkthrough.
