from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    customers = relationship("Customer", back_populates="merchant", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="merchant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="merchant", cascade="all, delete-orphan")
    recovery_cases = relationship("RecoveryCase", back_populates="merchant", cascade="all, delete-orphan")
    policies = relationship("MerchantPolicy", back_populates="merchant", cascade="all, delete-orphan")


class MerchantPolicy(Base):
    __tablename__ = "merchant_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    max_retries = Column(Integer, default=2, nullable=False)
    min_retry_interval_minutes = Column(Integer, default=30, nullable=False)
    max_autonomous_amount = Column(Float, default=25000.0, nullable=False)
    high_value_action = Column(String, default="ESCALATE_HUMAN", nullable=False)
    policy_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    merchant = relationship("Merchant", back_populates="policies")


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True)  # Can store Razorpay customer ID or local ID
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    merchant = relationship("Merchant", back_populates="customers")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    recovery_cases = relationship("RecoveryCase", back_populates="customer", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, index=True)  # Razorpay payment ID (e.g. pay_...) or local ID
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Stored in Rupees (INR)
    currency = Column(String, default="INR")
    status = Column(String, nullable=False)  # created, authorized, captured, refunded, failed
    failure_reason = Column(String, nullable=True)
    razorpay_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    merchant = relationship("Merchant", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
    recovery_cases = relationship("RecoveryCase", back_populates="payment", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, index=True)  # Razorpay subscription ID (e.g. sub_...)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # active, authenticated, charged, pending, halted, cancelled
    next_billing_date = Column(DateTime, nullable=True)
    razorpay_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    merchant = relationship("Merchant", back_populates="subscriptions")
    customer = relationship("Customer", back_populates="subscriptions")
    recovery_cases = relationship("RecoveryCase", back_populates="subscription", cascade="all, delete-orphan")


class RecoveryCase(Base):
    __tablename__ = "recovery_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    payment_id = Column(String, ForeignKey("payments.id"), nullable=True)
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=True)
    problem_type = Column(String, nullable=False)  # PAYMENT_FAILED, SUBSCRIPTION_PAYMENT_FAILED, etc.
    amount_at_risk = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, nullable=False, default="AT_RISK")  # AT_RISK, ANALYZING, DECIDING, VALIDATING, SCHEDULED, ACTION_PENDING, WAITING, RECOVERED, FAILED, ESCALATED, STOPPED
    retry_count = Column(Integer, default=0)
    recovery_window_started_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    recovered_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    merchant = relationship("Merchant", back_populates="recovery_cases")
    customer = relationship("Customer", back_populates="recovery_cases")
    payment = relationship("Payment", back_populates="recovery_cases")
    subscription = relationship("Subscription", back_populates="recovery_cases")
    
    ai_decisions = relationship("AIDecision", back_populates="recovery_case", cascade="all, delete-orphan")
    recovery_decisions = relationship("RecoveryDecision", back_populates="recovery_case", cascade="all, delete-orphan")
    recovery_actions = relationship("RecoveryAction", back_populates="recovery_case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="recovery_case", cascade="all, delete-orphan")


class AIDecision(Base):
    __tablename__ = "ai_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    recovery_case_id = Column(Integer, ForeignKey("recovery_cases.id"), nullable=False)
    diagnosis = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)  # RETRY_NOW, RETRY_LATER, RETRY_PAYMENT, REQUEST_PAYMENT_UPDATE, ESCALATE_HUMAN, STOP
    delay_minutes = Column(Integer, default=0)
    confidence = Column(Float, nullable=False)  # AI model confidence (0.0 to 1.0)
    recovery_probability = Column(Float, nullable=True)  # Estimated recovery probability (0.0 to 1.0)
    expected_recovery_value = Column(Float, nullable=True)  # Computed expected recovery value in INR
    actions_evaluated = Column(JSON, nullable=True)  # Array of evaluated and ranked candidate actions
    reason = Column(String, nullable=False)
    model_name = Column(String, default="Gemini 3.5 Flash")
    policy_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    recovery_case = relationship("RecoveryCase", back_populates="ai_decisions")


class RecoveryDecision(Base):
    """
    Unified decision record tying together AI reasoning, Policy validation,
    and final authorized execution outcome for auditability and Decision Replay.
    """
    __tablename__ = "recovery_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    recovery_case_id = Column(Integer, ForeignKey("recovery_cases.id"), nullable=False)
    diagnosis = Column(String, nullable=False)
    ai_action = Column(String, nullable=False)
    ai_confidence = Column(Float, nullable=False)
    recovery_probability = Column(Float, nullable=False)
    expected_recovery_value = Column(Float, nullable=False)
    actions_evaluated = Column(JSON, nullable=True)
    policy_decision = Column(String, nullable=False)  # APPROVED, BLOCKED, ESCALATED, DELAYED
    policy_rule = Column(String, nullable=True)
    policy_reason = Column(String, nullable=False)
    final_action = Column(String, nullable=False)
    delay_minutes = Column(Integer, default=0)
    policy_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    recovery_case = relationship("RecoveryCase", back_populates="recovery_decisions")


class RecoveryAction(Base):
    """
    Concrete execution attempt for a recovery case.
    """
    __tablename__ = "recovery_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    recovery_case_id = Column(Integer, ForeignKey("recovery_cases.id"), nullable=False)
    action_type = Column(String, nullable=False)  # RETRY_PAYMENT, REQUEST_PAYMENT_UPDATE, ESCALATE_HUMAN, STOP, etc.
    attempt_number = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # PENDING, EXECUTED, SUCCESS, FAILURE, BLOCKED
    external_reference = Column(String, nullable=True)  # Razorpay payment_link_id or payment_id
    result_summary = Column(String, nullable=True)
    amount_attempted = Column(Float, default=0.0)
    amount_recovered = Column(Float, default=0.0)
    customer_friction = Column(String, default="LOW")  # LOW, MEDIUM, HIGH
    estimated_cost = Column(Float, default=0.0)
    executed_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    recovery_case = relationship("RecoveryCase", back_populates="recovery_actions")

# Alias for terminology compliance
RecoveryAttempt = RecoveryAction


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    recovery_case_id = Column(Integer, ForeignKey("recovery_cases.id"), nullable=False)
    event_type = Column(String, nullable=False)  # PAYMENT_FAILED, CASE_CREATED, CONTEXT_BUILT, AI_ANALYSIS_COMPLETED, POLICY_EVALUATED, ACTION_SCHEDULED, ACTION_EXECUTED, PAYMENT_RECOVERED, RECOVERY_STOPPED, HUMAN_ESCALATED
    actor = Column(String, nullable=False)  # SYSTEM, AI, POLICY_ENGINE, MERCHANT, RAZORPAY_WEBHOOK, HUMAN_OPERATOR, SIMULATOR
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    recovery_case = relationship("RecoveryCase", back_populates="audit_logs")
