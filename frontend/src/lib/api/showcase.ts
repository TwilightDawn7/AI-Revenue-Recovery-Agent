import { apiClient } from "./client";

export interface ShowcasePayload {
  amount?: number;
  customer_name?: string;
  failure_reason?: string;
  subscription_status?: string;
  previous_successful_payments?: number;
}

export interface ShowcaseResponse {
  scenario: {
    title: string;
    customer_name: string;
    amount: number;
    currency: string;
    failure_reason: string;
    failure_category: string;
    customer_segment: string;
    subscription_status: string;
    previous_successful_payments: number;
  };
  context_built: Record<string, any>;
  ai_proposal: {
    diagnosis: string;
    recommended_action: string;
    confidence: number;
    recovery_probability: number;
    expected_recovery_value: number;
    proposed_delay_minutes: number;
    reason: string;
    model_name: string;
    candidate_actions: Array<{
      action: string;
      recovery_probability: number;
      expected_recovery_value: number;
      customer_friction: string;
      estimated_cost: number;
      rank: number;
    }>;
  };
  policy_interceptor: {
    allowed: boolean;
    decision: string;
    rule_triggered: string | null;
    reason: string;
    overridden_action?: string | null;
    autonomous_limit_threshold: number;
  };
  pipeline_verdict: {
    final_action: string;
    execution_mode: string;
    risk_mitigation: string;
  };
}

export async function runShowcasePipeline(
  payload?: ShowcasePayload
): Promise<ShowcaseResponse> {
  return apiClient<ShowcaseResponse>("/api/demo/run-showcase", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function seedDemoDatabase(): Promise<{
  status: string;
  message: string;
  seeded_cases: number;
}> {
  return apiClient<{
    status: string;
    message: string;
    seeded_cases: number;
  }>("/api/demo/seed", {
    method: "POST",
  });
}
