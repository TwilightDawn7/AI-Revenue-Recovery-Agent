"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  Key,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Save,
  Clock,
  Sparkles,
  Info
} from "lucide-react";

interface MerchantPolicy {
  id?: number;
  merchant_id?: number;
  max_retries: number;
  min_retry_interval_minutes: number;
  max_autonomous_amount: number;
  high_value_action: string;
  policy_version: number;
  updated_at?: string;
}

interface TestPolicyResult {
  allowed: boolean;
  decision: string;
  rule_triggered?: string;
  reason: string;
  final_action: string;
  delay_minutes: number;
}

export default function PolicyStudioPage() {
  const [policy, setPolicy] = useState<MerchantPolicy>({
    max_retries: 2,
    min_retry_interval_minutes: 30,
    max_autonomous_amount: 25000,
    high_value_action: "ESCALATE_HUMAN",
    policy_version: 1
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Test sandbox state
  const [testAmount, setTestAmount] = useState(2499);
  const [testRetryCount, setTestRetryCount] = useState(0);
  const [testSubStatus, setTestSubStatus] = useState("active");
  const [testAction, setTestAction] = useState("RETRY_LATER");
  const [testDelay, setTestDelay] = useState(30);

  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestPolicyResult | null>(null);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/api/policies");
      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
      }
    } catch (e) {
      console.error("Failed to load policy:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const res = await fetch("http://localhost:8000/api/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_retries: policy.max_retries,
          min_retry_interval_minutes: policy.min_retry_interval_minutes,
          max_autonomous_amount: policy.max_autonomous_amount,
          high_value_action: policy.high_value_action
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setPolicy(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save policy:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const runTestSandbox = async () => {
    try {
      setTestRunning(true);
      const res = await fetch("http://localhost:8000/api/policies/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy: {
            max_retries: policy.max_retries,
            min_retry_interval_minutes: policy.min_retry_interval_minutes,
            max_autonomous_amount: policy.max_autonomous_amount,
            high_value_action: policy.high_value_action
          },
          scenario: {
            amount: testAmount,
            retry_count: testRetryCount,
            subscription_status: testSubStatus,
            proposed_action: testAction,
            delay_minutes: testDelay
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (e) {
      console.error("Policy test failed:", e);
    } finally {
      setTestRunning(false);
    }
  };

  const applyPreset = (type: string) => {
    if (type === "standard") {
      setTestAmount(2499);
      setTestRetryCount(0);
      setTestSubStatus("active");
      setTestAction("RETRY_LATER");
      setTestDelay(30);
    } else if (type === "high_value") {
      setTestAmount(48000);
      setTestRetryCount(0);
      setTestSubStatus("active");
      setTestAction("RETRY_LATER");
      setTestDelay(60);
    } else if (type === "cancelled") {
      setTestAmount(1999);
      setTestRetryCount(0);
      setTestSubStatus("cancelled");
      setTestAction("RETRY_LATER");
      setTestDelay(30);
    } else if (type === "max_retries") {
      setTestAmount(2999);
      setTestRetryCount(2);
      setTestSubStatus("active");
      setTestAction("RETRY_LATER");
      setTestDelay(30);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#23262D] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Merchant Recovery Policy Studio
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 rounded-full font-semibold">
              Policy v{policy.policy_version}
            </span>
          </div>
          <p className="text-xs text-[#8B929E] mt-0.5">
            Configure, version, and test immutable financial boundaries enforced on autonomous recovery actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Policy Updated (v{policy.policy_version})
            </span>
          )}
          <button
            onClick={handleSavePolicy}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving Policy..." : "Save Policy"}
          </button>
        </div>
      </div>

      {/* Principle Banner */}
      <div className="p-4 rounded-xl bg-[#0D1017] border border-[#23262D] flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7FA]">
            Deterministic Guardrail Architecture: AI Proposes. Policy Decides.
          </h2>
          <p className="text-xs text-[#8B929E] mt-0.5 leading-relaxed">
            Every recovery strategy formulated by Gemini is intercepted and validated against these merchant boundaries before execution on Razorpay rails. If an AI recommendation exceeds your retry ceiling or autonomous threshold, the policy engine deterministically overrides it to human escalation or stop.
          </p>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Boundary Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#23262D]">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-[#F5F7FA]">
                Autonomous Recovery Thresholds
              </h3>
            </div>

            {/* 1. Max Automated Retries */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#F5F7FA]">Maximum Automated Retries</span>
                <span className="font-mono text-emerald-400 font-bold bg-[#121722] px-2 py-0.5 rounded border border-[#23262D]">
                  {policy.max_retries} attempts
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={policy.max_retries}
                onChange={(e) => setPolicy({ ...policy, max_retries: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 bg-[#121722] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#8B929E]">
                After {policy.max_retries} failed retries, automated actions cease and the case routes to Human Operations.
              </p>
            </div>

            {/* 2. Minimum Retry Interval */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#F5F7FA]">Minimum Retry Interval (Cooldown)</span>
                <span className="font-mono text-sky-400 font-bold bg-[#121722] px-2 py-0.5 rounded border border-[#23262D]">
                  {policy.min_retry_interval_minutes} minutes
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={15}
                value={policy.min_retry_interval_minutes}
                onChange={(e) => setPolicy({ ...policy, min_retry_interval_minutes: parseInt(e.target.value) })}
                className="w-full accent-sky-500 bg-[#121722] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#8B929E]">
                Enforces durable sleep between retry attempts to allow banking rails and card networks to stabilize.
              </p>
            </div>

            {/* 3. Autonomous Amount Ceiling */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#F5F7FA]">Autonomous Transaction Ceiling</span>
                <span className="font-mono text-[#8B7CFF] font-bold bg-[#121722] px-2 py-0.5 rounded border border-[#23262D]">
                  ₹{policy.max_autonomous_amount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={100000}
                step={5000}
                value={policy.max_autonomous_amount}
                onChange={(e) => setPolicy({ ...policy, max_autonomous_amount: parseFloat(e.target.value) })}
                className="w-full accent-[#8B7CFF] bg-[#121722] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#8B929E]">
                Transactions exceeding ₹{policy.max_autonomous_amount.toLocaleString()} require manual operator approval.
              </p>
            </div>

            {/* 4. High-Value Action */}
            <div className="space-y-2 pt-2 border-t border-[#23262D]">
              <label className="text-xs font-medium text-[#F5F7FA]">High-Value Policy Action</label>
              <select
                value={policy.high_value_action}
                onChange={(e) => setPolicy({ ...policy, high_value_action: e.target.value })}
                className="w-full bg-[#121722] border border-[#23262D] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-emerald-500"
              >
                <option value="ESCALATE_HUMAN">ESCALATE_HUMAN (Tier-2 Operations Review)</option>
                <option value="STOP">STOP (Halt Automated Recovery)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: "Test Policy" Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23262D]">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  Test Policy Sandbox
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8B929E] bg-[#121722] px-2 py-0.5 rounded border border-[#23262D]">
                Live Policy Engine
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-[#8B929E]">Scenario Presets:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("standard")}
                  className="px-2.5 py-1.5 text-[11px] font-mono bg-[#121722] hover:bg-[#1C2230] text-[#F5F7FA] rounded border border-[#23262D] text-left transition-colors"
                >
                  ₹2,499 Decline
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("high_value")}
                  className="px-2.5 py-1.5 text-[11px] font-mono bg-[#121722] hover:bg-[#1C2230] text-amber-400 rounded border border-amber-500/20 text-left transition-colors"
                >
                  ₹48,000 High-Value
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("cancelled")}
                  className="px-2.5 py-1.5 text-[11px] font-mono bg-[#121722] hover:bg-[#1C2230] text-rose-400 rounded border border-rose-500/20 text-left transition-colors"
                >
                  Cancelled Sub
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("max_retries")}
                  className="px-2.5 py-1.5 text-[11px] font-mono bg-[#121722] hover:bg-[#1C2230] text-sky-400 rounded border border-sky-500/20 text-left transition-colors"
                >
                  Max Retries #2
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-[#8B929E]">Amount (₹)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121722] border border-[#23262D] rounded px-2.5 py-1.5 text-xs font-mono text-[#F5F7FA]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#8B929E]">Current Retries</label>
                <input
                  type="number"
                  value={testRetryCount}
                  onChange={(e) => setTestRetryCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121722] border border-[#23262D] rounded px-2.5 py-1.5 text-xs font-mono text-[#F5F7FA]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#8B929E]">Subscription</label>
                <select
                  value={testSubStatus}
                  onChange={(e) => setTestSubStatus(e.target.value)}
                  className="w-full bg-[#121722] border border-[#23262D] rounded px-2 py-1.5 text-xs font-mono text-[#F5F7FA]"
                >
                  <option value="active">active</option>
                  <option value="cancelled">cancelled</option>
                  <option value="halted">halted</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#8B929E]">Proposed Action</label>
                <select
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value)}
                  className="w-full bg-[#121722] border border-[#23262D] rounded px-2 py-1.5 text-xs font-mono text-[#F5F7FA]"
                >
                  <option value="RETRY_LATER">RETRY_LATER</option>
                  <option value="REQUEST_PAYMENT_UPDATE">REQUEST_PAYMENT_UPDATE</option>
                  <option value="ESCALATE_HUMAN">ESCALATE_HUMAN</option>
                  <option value="STOP">STOP</option>
                </select>
              </div>
            </div>

            <button
              onClick={runTestSandbox}
              disabled={testRunning}
              className="w-full flex items-center justify-center gap-2 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {testRunning ? "Evaluating..." : "Run Policy Evaluation"}
            </button>

            {/* Test Result Display */}
            {testResult && (
              <div className="p-3.5 rounded-lg bg-[#121722] border border-[#23262D] space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8B929E]">Policy Evaluation Result:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      testResult.decision === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : testResult.decision === "ESCALATED"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {testResult.decision}
                  </span>
                </div>

                {testResult.rule_triggered && (
                  <div className="text-[11px] font-mono text-amber-400">
                    Rule Triggered: {testResult.rule_triggered}
                  </div>
                )}

                <div className="text-xs text-[#F5F7FA] bg-[#0D1017] p-2.5 rounded border border-[#23262D] leading-relaxed">
                  {testResult.reason}
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 text-[#8B929E]">
                  <span>Authorized Action:</span>
                  <span className="font-mono text-emerald-400 font-bold">{testResult.final_action}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#F5F7FA]">
              <Cpu className="w-4 h-4 text-emerald-400" />
              FastAPI Gateway
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-[11px] font-mono text-[#8B929E]">
            Status: Healthy (Port 8000)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#F5F7FA]">
              <Key className="w-4 h-4 text-[#8B7CFF]" />
              Gemini AI Engine
            </span>
            <span className="text-[10px] font-mono text-[#8B7CFF] bg-[#8B7CFF]/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#8B929E]">
            Structured Output & Safe Fallback
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#F5F7FA]">
              <Layers className="w-4 h-4 text-sky-400" />
              Inngest Orchestration
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
              Durable
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#8B929E]">
            step.sleep & step.waitForEvent
          </div>
        </div>
      </div>
    </div>
  );
}
