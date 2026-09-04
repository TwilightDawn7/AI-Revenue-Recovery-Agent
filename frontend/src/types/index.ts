// TypeScript types aligned with FastAPI schemas and SQLAlchemy models

export type CaseStatus =
  | "AT_RISK"
  | "ANALYZING"
  | "DECIDING"
  | "VALIDATING"
  | "SCHEDULED"
  | "ACTION_PENDING"
  | "WAITING"
  | "RECOVERED"
  | "FAILED"
  | "ESCALATED"
  | "STOPPED";

export type RecoveryActionType =
  | "RETRY_PAYMENT"
  | "RETRY_NOW"
  | "RETRY_LATER"
  | "REQUEST_PAYMENT_UPDATE"
  | "PAYMENT_UPDATE"
  | "CUSTOMER_NOTIFICATION"
  | "ESCALATE_HUMAN"
  | "STOP";

export type PolicyDecision =
  | "APPROVED"
  | "BLOCKED"
  | "ESCALATED"
  | "DELAYED";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  segment?: string;
  lifetime_value?: number;
  successful_renewals?: number;
}

export interface EvaluatedAction {
  action?: RecoveryActionType | string;
  action_type?: RecoveryActionType | string;
  recovery_probability: number;
  expected_recovery_value: number;
  customer_friction?: "LOW" | "MEDIUM" | "HIGH" | string;
  estimated_cost?: number;
  reason?: string;
  rank?: number;
}

export interface AIDecision {
  id: number;
  diagnosis: string;
  recommended_action: RecoveryActionType;
  delay_minutes: number;
  confidence: number;
  recovery_probability?: number;
  expected_recovery_value?: number;
  actions_evaluated?: EvaluatedAction[];
  reason: string;
  model_name: string;
  policy_version?: number;
  created_at: string;
}

export interface RecoveryDecision {
  id: number;
  recovery_case_id: number;
  diagnosis: string;
  ai_action: string;
  ai_confidence: number;
  recovery_probability: number;
  expected_recovery_value: number;
  actions_evaluated?: EvaluatedAction[];
  policy_decision: string;
  policy_rule?: string | null;
  policy_reason?: string | null;
  final_action: string;
  delay_minutes: number;
  policy_version: number;
  created_at: string;
}

export interface RecoveryAction {
  id: number;
  action_type: RecoveryActionType | string;
  attempt_number: number;
  status: string;
  external_reference?: string | null;
  result_summary?: string | null;
  amount_attempted?: number;
  amount_recovered?: number;
  customer_friction?: string;
  estimated_cost?: number;
  executed_at: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  actor: string;
  payload?: Record<string, any> | null;
  created_at: string;
}

export interface RecoveryCase {
  id: number;
  merchant_id: number;
  customer_id: string;
  payment_id?: string | null;
  subscription_id?: string | null;
  problem_type: string;
  amount_at_risk: number;
  currency?: string;
  status: CaseStatus;
  retry_count: number;
  recovery_window_started_at: string;
  recovery_window_ended_at?: string | null;
  recovered_amount: number;
  created_at: string;
  updated_at: string;
  customer: Customer;
  ai_decisions: AIDecision[];
  recovery_decisions?: RecoveryDecision[];
  recovery_actions: RecoveryAction[];
  audit_logs: AuditLog[];
}

export interface DashboardMetrics {
  revenue_at_risk: number;
  recovered_revenue: number;
  recovery_rate: number;
  revenue_protected?: number;
  average_recovery_time_minutes?: number;
  cases_processed: number;
  successful_recoveries: number;
  active_recoveries?: number;
  recovery_attempts?: number;
  wasted_retries_prevented?: number;
  escalations: number;
  stopped_cases: number;
  by_strategy?: Array<{
    strategy: string;
    cases_count: number;
    amount_recovered: number;
    success_rate: number;
  }>;
  by_failure_type?: Array<{
    category: string;
    cases_count: number;
    amount_recovered: number;
    amount_at_risk: number;
  }>;
}

export interface HealthStatus {
  status: string;
  time: string;
}

export interface WebhookSimulationResponse {
  status: string;
  case_id?: number;
  action?: string;
  reason?: string;
  [key: string]: any;
}

export interface MerchantPolicy {
  id?: number;
  merchant_id?: number;
  max_retries: number;
  min_retry_interval_minutes: number;
  max_autonomous_amount: number;
  high_value_action: string;
  policy_version: number;
  created_at?: string;
  updated_at?: string;
}

export interface TestPolicyRequest {
  policy: {
    max_retries: number;
    min_retry_interval_minutes: number;
    max_autonomous_amount: number;
    high_value_action: string;
  };
  scenario: Record<string, any>;
}

export interface TestPolicyResponse {
  allowed: boolean;
  decision: string;
  rule_triggered?: string | null;
  reason: string;
  final_action: string;
  delay_minutes: number;
}

export type TestPolicyResult = TestPolicyResponse;

export interface BenchmarkRow {
  strategy: string;
  total_cases: number;
  revenue_at_risk: number;
  recovered_revenue: number;
  recovery_rate: number;
  recovered_cases: number;
  escalated_cases: number;
  stopped_cases: number;
  attempts_sent: number;
  policy_violations: number;
  wasted_retries: number;
}

export interface AblationRow {
  configuration: string;
  strategy?: string;
  total_cases?: number;
  revenue_at_risk?: number;
  recovered_revenue: number;
  recovery_rate: number;
  recovered_cases?: number;
  escalated_cases: number;
  stopped_cases?: number;
  attempts_sent: number;
  policy_violations?: number;
  wasted_retries?: number;
}

export interface EvaluationPayload {
  benchmark_1000_cases: BenchmarkRow[];
  ablation_study: AblationRow[];
  benchmark_100_cases_dev: BenchmarkRow[];
}

export interface EvaluationSummary {
  total_cases: number;
  revenue_at_risk: number;
  baseline: {
    recovered_revenue: number;
    recovery_rate: number;
    retries_sent: number;
    cases_stopped: number;
    cases_escalated: number;
    compliance_rate: number;
  };
  ai_agent: {
    recovered_revenue: number;
    recovery_rate: number;
    retries_sent: number;
    cases_stopped: number;
    cases_escalated: number;
    compliance_rate: number;
  };
  uplift: {
    recovered_revenue_diff: number;
    recovery_rate_diff: number;
    retries_saved: number;
  };
  category_breakdown?: Array<{
    reason?: string;
    description?: string;
    total_cases?: number;
    amount?: number;
    baseline_recovery_rate?: number;
    ai_recovery_rate?: number;
    strategy?: string;
    status?: string;
    category?: string;
    cases?: number;
    baseline_recovered?: number;
    ai_recovered?: number;
    recovery_lift?: number;
  }>;
}


