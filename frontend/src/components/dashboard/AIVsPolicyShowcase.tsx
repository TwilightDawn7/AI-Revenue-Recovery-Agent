"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/formatters";
import { runShowcasePipeline, ShowcaseResponse } from "@/lib/api/showcase";
import {
  Sparkles,
  ShieldAlert,
  RotateCcw,
  FileCheck2,
  Calculator,
  Layers,
} from "lucide-react";

export function AIVsPolicyShowcase() {
  const [data, setData] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runShowcasePipeline({
        amount: 48000.0,
        customer_name: "Arjun Enterprises",
        failure_reason: "BANK_DECLINE",
        subscription_status: "active",
        previous_successful_payments: 4,
      });
      setData(res);
    } catch (err) {
      console.error("Showcase run failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    runShowcasePipeline({
      amount: 48000.0,
      customer_name: "Arjun Enterprises",
      failure_reason: "BANK_DECLINE",
      subscription_status: "active",
      previous_successful_payments: 4,
    })
      .then((res) => {
        if (!ignore) setData(res);
      })
      .catch((err) => {
        if (!ignore) console.error("Showcase run failed:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="p-6 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-6">
      {/* Header with Architectural Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-[#F5F7FA]">
              Payment Recovery Decision Pipeline
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
              Live Pipeline
            </span>
          </div>
          {/* Architectural Tagline */}
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#8B7CFF]">
            <span>AI proposes</span>
            <span className="text-[#8B929E]">→</span>
            <span>Policy authorizes</span>
            <span className="text-[#8B929E]">→</span>
            <span>Executor acts</span>
          </div>
          <p className="text-xs text-[#8B929E] pt-0.5">
            Real-time execution of the ₹48,000 enterprise renewal scenario through context assembly, LLM reasoning, deterministic EV ranking, and the policy gate.
          </p>
        </div>

        <button
          onClick={runPipeline}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#121722] hover:bg-[#161C2A] text-[#F5F7FA] border border-[#23262D] hover:border-[#8B7CFF]/50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-[#8B7CFF] ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Evaluating Decision..." : "Re-Run Showcase"}</span>
        </button>
      </div>

      {data && (
        <div className="space-y-4">
          {/* 4-Stage Architectural Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Inbound Context */}
            <div className="p-4 rounded-xl bg-[#121722] border border-[#23262D] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#191D26]">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                    <Layers className="w-3.5 h-3.5" />
                    1. Context Engine
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Sanitized
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Amount at Risk:</span>
                    <span className="font-mono font-bold text-amber-400">
                      ₹{data.scenario.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Failure:</span>
                    <span className="font-mono text-rose-400">{data.scenario.failure_reason}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Customer Segment:</span>
                    <span className="font-mono font-semibold text-[#8B7CFF]">
                      {data.scenario.customer_segment}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Renewal History:</span>
                    <span className="font-mono text-[#F5F7FA]">
                      {data.scenario.previous_successful_payments} cycles
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#191D26] text-[10px] text-[#8B929E]">
                Assembles behavioral history with zero raw card credentials passed.
              </div>
            </div>

            {/* Step 2: AI Proposal */}
            <div className="p-4 rounded-xl bg-[#121722] border border-[#8B7CFF]/30 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#191D26]">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#8B7CFF]">
                    <Sparkles className="w-3.5 h-3.5" />
                    2. AI Proposal
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Conf: {Math.round(data.ai_proposal.confidence * 100)}%
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Recommendation:</span>
                    <span className="font-mono font-semibold text-[#8B7CFF]">
                      {data.ai_proposal.recommended_action}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Recovery Prob:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round(data.ai_proposal.recovery_probability * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Proposed Delay:</span>
                    <span className="font-mono text-[#F5F7FA]">
                      {data.ai_proposal.proposed_delay_minutes} min
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#8B929E] block mb-0.5 font-semibold">Diagnosis:</span>
                    <p className="text-[11px] text-[#C1C7D0] line-clamp-2 leading-relaxed">
                      {data.ai_proposal.diagnosis}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#191D26] text-[10px] text-[#8B929E]">
                Model estimates recovery likelihood based on pattern matching.
              </div>
            </div>

            {/* Step 3: Deterministic Valuation */}
            <div className="p-4 rounded-xl bg-[#121722] border border-[#23262D] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#191D26]">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Calculator className="w-3.5 h-3.5" />
                    3. Deterministic EV
                  </span>
                  <span className="text-[10px] font-mono text-[#8B929E]">
                    Ranked
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Expected Net EV:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(data.ai_proposal.expected_recovery_value)}
                    </span>
                  </div>
                  <div className="pt-1 space-y-1">
                    <span className="text-[10px] text-[#8B929E] block font-semibold">Candidate Ranking:</span>
                    {data.ai_proposal.candidate_actions?.slice(0, 2).map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] font-mono p-1 rounded bg-[#090C12] border border-[#191D26]"
                      >
                        <span className="text-[#C1C7D0] truncate max-w-[100px]">{act.action}</span>
                        <span className="text-emerald-400">
                          {Math.round(act.recovery_probability * 100)}% · {formatCurrency(act.expected_recovery_value, true)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#191D26] text-[10px] text-[#8B929E]">
                EV = P(success) × Amount − Cost − Friction
              </div>
            </div>

            {/* Step 4: Policy Gate & Final Action */}
            <div className="p-4 rounded-xl bg-[#121722] border border-amber-500/30 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#191D26]">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    4. Policy Gate
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {data.policy_interceptor.decision}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Triggered Rule:</span>
                    <span className="font-mono font-semibold text-amber-300 truncate max-w-[110px]">
                      {data.policy_interceptor.rule_triggered || "AMOUNT_LIMIT"}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Autonomous Limit:</span>
                    <span className="font-mono text-[#F5F7FA]">
                      ₹{data.policy_interceptor.autonomous_limit_threshold.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8B929E]">Authorized Action:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {data.pipeline_verdict.final_action}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#191D26] text-[10px] text-amber-400/90 font-medium">
                Deterministic override protects high-value revenue from unassisted retry.
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="p-3.5 rounded-lg bg-[#090C12] border border-[#23262D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[#F5F7FA]">
                <strong>Policy Engine Protection:</strong> {data.pipeline_verdict.risk_mitigation}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8B929E] bg-[#121722] px-2.5 py-1 rounded border border-[#23262D] shrink-0">
              Execution Mode: {data.pipeline_verdict.execution_mode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
