from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Any, Dict
from typing_extensions import Literal

# ==========================================
# Action Evaluation Schema
# ==========================================
class EvaluatedActionSchema(BaseModel):
    action: str = Field(..., description="Action name, e.g. RETRY_LATER, PAYMENT_UPDATE, ESCALATE_HUMAN, STOP")
    recovery_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated probability of successful recovery")
    expected_recovery_value: float = Field(..., description="Expected net recovery value in INR")
    customer_friction: str = Field(default="LOW", description="Friction level: LOW, MEDIUM, HIGH")
    estimated_cost: float = Field(default=0.0, description="Cost of intervention in INR")
    rank: int = Field(default=1, description="Ranking among candidate actions")


# ==========================================
# AI Decision Schema (Enforced on LLM)
# ==========================================
class AIDecisionSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    diagnosis: str = Field(
        ..., 
        description="Detailed analysis of failure reason, e.g. TEMPORARY_ISSUER_FAILURE, INSUFFICIENT_FUNDS, EXPIRED_PAYMENT_METHOD, NETWORK_FAILURE, HARD_DECLINE, UNKNOWN"
    )
    action: str = Field(
        ..., 
        description="Recommended action: RETRY_NOW, RETRY_LATER, RETRY_PAYMENT, REQUEST_PAYMENT_UPDATE, ESCALATE_HUMAN, STOP"
    )
    delay_minutes: int = Field(
        default=30, 
        ge=0,
        description="Delayed retry duration in minutes. Must be at least 30 if action is RETRY_LATER/RETRY_PAYMENT."
    )
    confidence: float = Field(
        ..., 
        ge=0.0,
        le=1.0,
        description="AI model's diagnosis confidence score (0.0 to 1.0)"
    )
    recovery_probability: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Estimated probability of actual fund recovery (0.0 to 1.0)"
    )
    expected_recovery_value: Optional[float] = Field(
        default=None,
        description="Expected net recovery value in INR (P * amount - cost - friction)"
    )
    actions: List[EvaluatedActionSchema] = Field(
        default_factory=list,
        description="Ranked candidate recovery actions evaluated by the engine"
    )
    reason: str = Field(
        ..., 
        description="Concise merchant-facing explanation for the selected action"
    )


# ==========================================
# Policy Engine Output Schema
# ==========================================
class PolicyEvaluationResult(BaseModel):
    allowed: bool
    decision: Literal["APPROVED", "BLOCKED", "ESCALATED", "DELAYED"]
    rule_triggered: Optional[str] = None
    reason: str
    original_ai_action: Optional[str] = None
    overridden_action: Optional[str] = None
    overridden_delay_minutes: Optional[int] = None
    policy_version: int = Field(default=1)


# ==========================================
# Merchant Policy Schemas
# ==========================================
class MerchantPolicyBase(BaseModel):
    max_retries: int = Field(default=2, ge=0, le=10, description="Maximum automated retry attempts")
    min_retry_interval_minutes: int = Field(default=30, ge=0, le=1440, description="Minimum delay between retries in minutes")
    max_autonomous_amount: float = Field(default=25000.0, ge=0.0, description="Maximum amount eligible for autonomous retry")
    high_value_action: str = Field(default="ESCALATE_HUMAN", description="Action for payments exceeding autonomous amount")

class MerchantPolicyResponse(MerchantPolicyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    merchant_id: int
    policy_version: int
    created_at: datetime
    updated_at: datetime

class TestPolicyRequest(BaseModel):
    policy: MerchantPolicyBase
    scenario: Dict[str, Any]

class TestPolicyResponse(BaseModel):
    allowed: bool
    decision: str
    rule_triggered: Optional[str] = None
    reason: str
    final_action: str
    delay_minutes: int


# ==========================================
# API Database Response Schemas
# ==========================================
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_type: str
    actor: str
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime


class AIDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: int
    diagnosis: str
    recommended_action: str
    delay_minutes: int
    confidence: float
    recovery_probability: Optional[float] = None
    expected_recovery_value: Optional[float] = None
    actions_evaluated: Optional[List[Dict[str, Any]]] = None
    reason: str
    model_name: str
    policy_version: int
    created_at: datetime


class RecoveryDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    recovery_case_id: int
    diagnosis: str
    ai_action: str
    ai_confidence: float
    recovery_probability: float
    expected_recovery_value: float
    actions_evaluated: Optional[List[Dict[str, Any]]] = None
    policy_decision: str
    policy_rule: Optional[str] = None
    policy_reason: str
    final_action: str
    delay_minutes: int
    policy_version: int
    created_at: datetime


class RecoveryActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action_type: str
    attempt_number: int
    status: str
    external_reference: Optional[str] = None
    result_summary: Optional[str] = None
    amount_attempted: float = 0.0
    amount_recovered: float = 0.0
    customer_friction: str = "LOW"
    estimated_cost: float = 0.0
    executed_at: datetime


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str


class RecoveryCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    merchant_id: int
    customer_id: str
    payment_id: Optional[str] = None
    subscription_id: Optional[str] = None
    problem_type: str
    amount_at_risk: float
    currency: str = "INR"
    status: str
    retry_count: int
    recovery_window_started_at: datetime
    recovered_amount: float
    created_at: datetime
    updated_at: datetime
    
    customer: CustomerResponse
    ai_decisions: List[AIDecisionResponse] = []
    recovery_decisions: List[RecoveryDecisionResponse] = []
    recovery_actions: List[RecoveryActionResponse] = []
    audit_logs: List[AuditLogResponse] = []


# ==========================================
# Dashboard Metrics Response
# ==========================================
class StrategyMetric(BaseModel):
    strategy: str
    cases_count: int
    amount_recovered: float
    success_rate: float

class FailureCategoryMetric(BaseModel):
    category: str
    cases_count: int
    amount_recovered: float
    amount_at_risk: float

class DashboardMetrics(BaseModel):
    revenue_at_risk: float
    recovered_revenue: float
    recovery_rate: float
    revenue_protected: float = 0.0
    average_recovery_time_minutes: float = 0.0
    cases_processed: int
    successful_recoveries: int
    active_recoveries: int = 0
    recovery_attempts: int = 0
    wasted_retries_prevented: int = 0
    escalations: int
    stopped_cases: int
    by_strategy: List[StrategyMetric] = []
    by_failure_type: List[FailureCategoryMetric] = []
