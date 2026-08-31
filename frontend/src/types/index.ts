// TypeScript types aligned with FastAPI schemas and SQLAlchemy models

export type CaseStatus =
  | "AT_RISK"
  | "ANALYZING"
  | "ACTION_PENDING"
  | "WAITING"
  | "RECOVERED"
  | "FAILED"
  | "ESCALATED"
  | "STOPPED";

export type RecoveryActionType =
  | "RETRY_PAYMENT"
  | "REQUEST_PAYMENT_UPDATE"
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
  email: string;
}

export interface AIDecision {
  id: number;
  diagnosis: string;
  recommended_action: RecoveryActionType;
  delay_minutes: number;
  confidence: number;
  reason: string;
  model_name: string;
  created_at: string;
}

export interface RecoveryAction {
  id: number;
  action_type: RecoveryActionType;
  attempt_number: number;
  status: string;
  external_reference?: string | null;
  result_summary?: string | null;
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
  status: CaseStatus;
  retry_count: number;
  recovery_window_started_at: string;
  recovered_amount: number;
  created_at: string;
  updated_at: string;
  customer: Customer;
  ai_decisions: AIDecision[];
  recovery_actions: RecoveryAction[];
  audit_logs: AuditLog[];
}

export interface DashboardMetrics {
  revenue_at_risk: number;
  recovered_revenue: number;
  recovery_rate: number;
  cases_processed: number;
  successful_recoveries: number;
  escalations: number;
  stopped_cases: number;
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
  category_breakdown: Array<{
    reason: string;
    description: string;
    total_cases: number;
    amount: number;
    baseline_recovery_rate: number;
    ai_recovery_rate: number;
    strategy: string;
    status: string;
  }>;
}
