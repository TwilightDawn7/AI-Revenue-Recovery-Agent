"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  Layers,
  FileCheck2
} from "lucide-react";

interface ShowcaseData {
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
      action_type: string;
      recovery_probability: number;
      expected_recovery_value: number;
      customer_friction: string;
      estimated_cost: number;
      reason: string;
    }>;
  };
  policy_interceptor: {
    allowed: boolean;
    decision: string;
    rule_triggered: string;
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

export function AIVsPolicyShowcase() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(false);

  const runPipeline = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/demo/run-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 48000.0,
          customer_name: "Arjun Enterprises",
          failure_reason: "BANK_DECLINE",
          subscription_status: "active",
          previous_successful_payments: 4
        })
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Showcase run failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPipeline();
  }, []);

  return (
    <div className="p-6 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-[#F5F7FA]">
              Interactive Architecture Showcase: AI Reasoning vs Deterministic Policy Gate
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
              Live Pipeline
            </span>
          </div>
          <p className="text-xs text-[#8B929E]">
            Real-time execution of the ₹48,000 High-Value Enterprise Renewal through the Context Engine, AI Decision Model, and Policy Interceptor.
          </p>
        </div>

        <button
          onClick={runPipeline}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121722] hover:bg-[#161C2A] text-[#F5F7FA] border border-[#23262D] hover:border-[#8B7CFF]/50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-[#8B7CFF] ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Executing Pipeline..." : "Re-Execute ₹48,000 Scenario"}</span>
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Step 1: Scenario Context */}
          <div className="p-4 rounded-xl bg-[#121722] border border-[#23262D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                <Layers className="w-3.5 h-3.5" />
                1. Context Engine (Sanitized)
              </span>
              <span className="text-[10px] font-mono text-[#8B929E] bg-[#161C2A] px-2 py-0.5 rounded border border-[#23262D]">
                Zero PII
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Scenario:</span>
                <span className="font-semibold text-[#F5F7FA]">{data.scenario.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Amount at Risk:</span>
                <span className="font-mono font-bold text-amber-400">₹{data.scenario.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Customer Segment:</span>
                <span className="font-mono font-semibold text-[#8B7CFF]">{data.scenario.customer_segment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Renewal History:</span>
                <span className="font-mono text-[#F5F7FA]">{data.scenario.previous_successful_payments} successful cycles</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8B929E]">Failure Reason:</span>
                <span className="font-mono text-rose-400">{data.scenario.failure_reason}</span>
              </div>
            </div>
          </div>

          {/* Step 2: AI Proposal */}
          <div className="p-4 rounded-xl bg-[#121722] border border-[#23262D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#8B7CFF]">
                <Sparkles className="w-3.5 h-3.5" />
                2. AI Reasoning Proposal
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Confidence: {Math.round(data.ai_proposal.confidence * 100)}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">AI Proposes:</span>
                <span className="font-mono font-semibold text-[#8B7CFF]">{data.ai_proposal.recommended_action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Recovery Probability:</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(data.ai_proposal.recovery_probability * 100)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Expected Net Value (EV):</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(data.ai_proposal.expected_recovery_value)}</span>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-[#8B929E] block mb-1 font-semibold">AI Recommendation Rationale:</span>
                <p className="text-[11px] text-[#C1C7D0] leading-relaxed line-clamp-2">
                  {data.ai_proposal.diagnosis}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Policy Interceptor Gate */}
          <div className="p-4 rounded-xl bg-[#121722] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                3. Deterministic Policy Gate
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {data.policy_interceptor.decision}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Rule Triggered:</span>
                <span className="font-mono font-semibold text-amber-300 truncate max-w-[170px]">{data.policy_interceptor.rule_triggered}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Policy Ceiling:</span>
                <span className="font-mono text-[#F5F7FA]">₹{data.policy_interceptor.autonomous_limit_threshold.toLocaleString()} max auto</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191D26]">
                <span className="text-[#8B929E]">Final Action:</span>
                <span className="font-mono font-bold text-amber-400">{data.pipeline_verdict.final_action}</span>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-amber-400/90 block mb-1 font-semibold">Policy Guardrail Reason:</span>
                <p className="text-[11px] text-[#C1C7D0] leading-relaxed">
                  {data.policy_interceptor.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Verdict Banner */}
      {data && (
        <div className="p-3.5 rounded-lg bg-[#090C12] border border-[#23262D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[#F5F7FA]">
              <strong>Pipeline Safety Outcome:</strong> {data.pipeline_verdict.risk_mitigation}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8B929E] bg-[#121722] px-2.5 py-1 rounded border border-[#23262D] shrink-0">
            Execution Mode: {data.pipeline_verdict.execution_mode}
          </span>
        </div>
      )}
    </div>
  );
}
