import { EvaluationPayload, EvaluationSummary } from "@/types";
import { apiClient } from "./client";

/**
 * Fetch quantitative benchmark results from the backend FastAPI engine.
 */
export async function fetchEvaluationResults(): Promise<EvaluationPayload> {
  return apiClient<EvaluationPayload>("/api/evaluation/results");
}

/**
 * Trigger fresh benchmark execution in backend.
 */
export async function runEvaluationBenchmark(): Promise<EvaluationPayload> {
  return apiClient<EvaluationPayload>("/api/evaluation/run", {
    method: "POST",
  });
}

/**
 * Helper to compute an EvaluationSummary from the 1,000 scenario benchmark.
 */
export async function fetchEvaluationData(): Promise<EvaluationSummary> {
  const payload = await fetchEvaluationResults();
  const b1000 = payload.benchmark_1000_cases || [];
  const alwaysRetry = b1000.find((b) => b.strategy.includes("Always Retry")) || b1000[0] || {
    recovered_revenue: 0,
    recovery_rate: 0,
    attempts_sent: 0,
    stopped_cases: 0,
    escalated_cases: 0,
    policy_violations: 0,
    revenue_at_risk: 0,
    total_cases: 1000,
  };
  const aiAgent = b1000.find((b) => b.strategy.includes("AI Recovery Agent")) || b1000[3] || {
    recovered_revenue: 0,
    recovery_rate: 0,
    attempts_sent: 0,
    stopped_cases: 0,
    escalated_cases: 0,
    policy_violations: 0,
    revenue_at_risk: 0,
    total_cases: 1000,
  };

  const totalCases = aiAgent.total_cases || alwaysRetry.total_cases || 1000;
  const revenueAtRisk = aiAgent.revenue_at_risk || alwaysRetry.revenue_at_risk || 0;

  return {
    total_cases: totalCases,
    revenue_at_risk: revenueAtRisk,
    baseline: {
      recovered_revenue: alwaysRetry.recovered_revenue,
      recovery_rate: alwaysRetry.recovery_rate,
      retries_sent: alwaysRetry.attempts_sent,
      cases_stopped: alwaysRetry.stopped_cases,
      cases_escalated: alwaysRetry.escalated_cases,
      compliance_rate: alwaysRetry.policy_violations === 0 ? 100 : Math.max(0, 100 - (alwaysRetry.policy_violations / totalCases) * 100),
    },
    ai_agent: {
      recovered_revenue: aiAgent.recovered_revenue,
      recovery_rate: aiAgent.recovery_rate,
      retries_sent: aiAgent.attempts_sent,
      cases_stopped: aiAgent.stopped_cases,
      cases_escalated: aiAgent.escalated_cases,
      compliance_rate: aiAgent.policy_violations === 0 ? 100 : Math.max(0, 100 - (aiAgent.policy_violations / totalCases) * 100),
    },
    uplift: {
      recovered_revenue_diff: aiAgent.recovered_revenue - alwaysRetry.recovered_revenue,
      recovery_rate_diff: +(aiAgent.recovery_rate - alwaysRetry.recovery_rate).toFixed(2),
      retries_saved: Math.max(0, alwaysRetry.attempts_sent - aiAgent.attempts_sent),
    },
  };
}
