from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Any, Dict
from typing_extensions import Literal

# ==========================================
# AI Decision Schema (Enforced on LLM)
# ==========================================
class AIDecisionSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    diagnosis: str = Field(
        ..., 
        description="Detailed analysis of why the payment failed and customer's overall billing health."
    )
    action: Literal["RETRY_PAYMENT", "REQUEST_PAYMENT_UPDATE", "ESCALATE_HUMAN", "STOP"] = Field(
        ..., 
        description="The recommended recovery action. RETRY_PAYMENT (for bank declines/network issues), REQUEST_PAYMENT_UPDATE (for card expired/invalid details), ESCALATE_HUMAN (for repeated failures or manual intervention needed), STOP (for cancelled subscriptions or permanent failure reasons)."
    )
    delay_minutes: int = Field(
        default=30, 
        description="The delayed retry duration in minutes. Use 0 if immediate retry or action is requested. Must be at least 30 if action is RETRY_PAYMENT per merchant safety rules."
    )
    confidence: float = Field(
        ..., 
        description="Confidence score for this action, between 0.0 and 1.0."
    )
    reason: str = Field(
        ..., 
        description="The explanation for why this action was chosen."
    )


# ==========================================
# Policy Engine Output Schema
# ==========================================
class PolicyEvaluationResult(BaseModel):
    allowed: bool
    decision: Literal["APPROVED", "BLOCKED", "ESCALATED", "DELAYED"]
    reason: str
    overridden_action: Optional[str] = None
    overridden_delay_minutes: Optional[int] = None


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
    reason: str
    model_name: str
    created_at: datetime


class RecoveryActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action_type: str
    attempt_number: int
    status: str
    external_reference: Optional[str] = None
    result_summary: Optional[str] = None
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
    status: str
    retry_count: int
    recovery_window_started_at: datetime
    recovered_amount: float
    created_at: datetime
    updated_at: datetime
    
    customer: CustomerResponse
    ai_decisions: List[AIDecisionResponse] = []
    recovery_actions: List[RecoveryActionResponse] = []
    audit_logs: List[AuditLogResponse] = []


# ==========================================
# Dashboard Metrics Response
# ==========================================
class DashboardMetrics(BaseModel):
    revenue_at_risk: float
    recovered_revenue: float
    recovery_rate: float
    cases_processed: int
    successful_recoveries: int
    escalations: int
    stopped_cases: int
