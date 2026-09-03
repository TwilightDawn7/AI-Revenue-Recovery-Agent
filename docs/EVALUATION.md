# Empirical Evaluation 2.0 & Benchmark Methodology

To evaluate the financial and operational efficacy of the Autonomous AI Revenue Recovery Agent, we execute a multi-baseline empirical benchmark across **1,000 distinct synthetic scenarios** generated with deterministic seed `42`.

**Integrity Mandate:** Zero metric extrapolation. Every reported number reflects concrete simulated executions.

---

## 1. Multi-Baseline Comparison (1,000 Executed Scenarios)

| Strategy | Revenue At Risk | Recovered Revenue | Recovery Rate (%) | Recovered Cases | Attempts Sent | Wasted Retries | Policy Violations |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline 1: Always Retry** | ₹12,953,578.15 | ₹926,319.37 | 7.15% | 160 | 1000 | 235 | 140 |
| **Baseline 2: Failure-Code Rules** | ₹12,953,578.15 | ₹4,264,868.40 | 32.92% | 286 | 668 | 0 | 0 |
| **Baseline 3: Rule-Based Engine** | ₹12,953,578.15 | ₹6,760,851.10 | 52.19% | 422 | 622 | 0 | 0 |
| **Baseline 4: AI Recovery Agent** | ₹12,953,578.15 | **₹7,998,002.11** | **61.74%** | **487** | 588 | **0** | **0** |

---

## 2. AI Ablation Study

| Configuration | Recovered Revenue | Recovery Rate (%) | Wasted Retries Avoided | Human Escalations |
| :--- | :---: | :---: | :---: | :---: |
| **Rule-Based Engine** | ₹6,760,851.10 | 52.19% | 378 | 128 |
| **AI without Customer Context** | ₹6,901,733.34 | 53.28% | 398 | 116 |
| **AI with Full Customer Context** | **₹7,998,002.11** | **61.74%** | **412** | **94** |

---

## 3. Running the Benchmark Locally

```bash
# Execute 1,000-scenario benchmark and generate markdown report
backend/.venv/Scripts/python.exe backend/evaluation/run_evaluation.py
```
