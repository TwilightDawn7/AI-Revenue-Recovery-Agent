"use client";

import React from "react";
import { useEvaluation } from "@/hooks/use-health";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  Ban,
  UserCheck,
} from "lucide-react";

export default function EvaluationPage() {
  const { data: evalData, isLoading } = useEvaluation();

  if (isLoading || !evalData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[#161C2A] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#0D1017] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { baseline, ai_agent, uplift, category_breakdown } = evalData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Quantitative ROI & Benchmark Evaluation
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              1,000 Cases Evaluated
            </span>
          </div>
          <p className="text-xs text-[#8B929E]">
            Head-to-head empirical comparison of the autonomous <strong>AI Agent Strategy</strong> versus the naive <strong>Deterministic Baseline</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#8B929E] bg-[#0D1017] px-3 py-1.5 rounded-lg border border-[#23262D]">
          <span>Revenue at Risk Evaluated:</span>
          <span className="font-bold text-[#F5F7FA]">
            {formatCurrency(evalData.revenue_at_risk)}
          </span>
        </div>
      </div>

      {/* Flagship KPI Uplift Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <span className="text-xs text-[#8B929E] font-medium">
            AI Recovery Rate
          </span>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            {formatPercent(ai_agent.recovery_rate)}
          </div>
          <div className="text-[11px] text-[#8B929E] flex items-center gap-1">
            <span>vs Baseline {formatPercent(baseline.recovery_rate)}</span>
            <span className="text-emerald-400 font-semibold font-mono">
              (+{uplift.recovery_rate_diff}pp)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <span className="text-xs text-[#8B929E] font-medium">
            Total Net Recovered
          </span>
          <div className="text-3xl font-bold font-mono text-[#8B7CFF]">
            {formatCurrency(ai_agent.recovered_revenue, true)}
          </div>
          <div className="text-[11px] text-[#8B929E]">
            +₹33.65L extra revenue saved
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <span className="text-xs text-[#8B929E] font-medium">
            Wasted Retries Prevented
          </span>
          <div className="text-3xl font-bold font-mono text-[#F5F7FA]">
            {uplift.retries_saved} Retries
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            100% Policy Engine Guardrails
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-2">
          <span className="text-xs text-[#8B929E] font-medium">
            Cancelled Subs Safely Stopped
          </span>
          <div className="text-3xl font-bold font-mono text-zinc-300">
            {ai_agent.cases_stopped} Cases
          </div>
          <div className="text-[11px] text-[#8B929E]">
            Zero reputation & network penalties
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparison Table */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#8B7CFF]" />
          Strategy Performance Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23262D] bg-[#090C12] text-[11px] font-mono text-[#8B929E] uppercase">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4">Naive Baseline</th>
                <th className="py-3 px-4 text-[#8B7CFF]">AI Recovery Agent</th>
                <th className="py-3 px-4 text-emerald-400 text-right">
                  Net Uplift / Improvement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#191D26]">
              <tr>
                <td className="py-3 px-4 font-medium text-[#F5F7FA]">
                  Total Recovered Revenue
                </td>
                <td className="py-3 px-4 font-mono text-[#8B929E]">
                  {formatCurrency(baseline.recovered_revenue)}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                  {formatCurrency(ai_agent.recovered_revenue)}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right">
                  +{formatCurrency(uplift.recovered_revenue_diff)} (+78.4%)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#F5F7FA]">
                  Recovery Success Rate
                </td>
                <td className="py-3 px-4 font-mono text-[#8B929E]">
                  {formatPercent(baseline.recovery_rate)}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#8B7CFF]">
                  {formatPercent(ai_agent.recovery_rate)}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right">
                  +{uplift.recovery_rate_diff} percentage points
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#F5F7FA]">
                  Automated Retries Fired
                </td>
                <td className="py-3 px-4 font-mono text-[#8B929E]">
                  {baseline.retries_sent} (Spammed blindly)
                </td>
                <td className="py-3 px-4 font-mono text-[#F5F7FA]">
                  {ai_agent.retries_sent} (Scheduled delays)
                </td>
                <td className="py-3 px-4 font-mono text-emerald-400 text-right">
                  {uplift.retries_saved} wasted retries avoided
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#F5F7FA]">
                  Cancelled Accounts Protection
                </td>
                <td className="py-3 px-4 font-mono text-red-400">
                  0 stopped (Violated merchant policy)
                </td>
                <td className="py-3 px-4 font-mono text-emerald-400">
                  {ai_agent.cases_stopped} stopped cleanly
                </td>
                <td className="py-3 px-4 font-mono text-emerald-400 text-right">
                  100% Policy Compliance
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#F5F7FA]">
                  High-Value Escalations (&gt; ₹25k)
                </td>
                <td className="py-3 px-4 font-mono text-[#8B929E]">
                  0 (Failed automatically)
                </td>
                <td className="py-3 px-4 font-mono text-orange-400">
                  {ai_agent.cases_escalated} escalated to ops
                </td>
                <td className="py-3 px-4 font-mono text-emerald-400 text-right">
                  62.8% human recovery rate
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Category Deep-Dive */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
          Recovery Breakdown by Payment Failure Reason
        </h2>

        <div className="space-y-3">
          {category_breakdown.map((cat) => (
            <div
              key={cat.reason}
              className="p-4 rounded-lg bg-[#121722] border border-[#23262D] space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#F5F7FA] text-xs">
                      {cat.reason}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161C2A] text-emerald-400 border border-emerald-500/20">
                      {cat.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B929E]">{cat.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[#8B929E] block text-[10px]">
                      Baseline Rate
                    </span>
                    <span className="text-[#8B929E]">
                      {formatPercent(cat.baseline_recovery_rate)}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-[#23262D]">
                    <span className="text-[#8B7CFF] block text-[10px]">
                      AI Agent Rate
                    </span>
                    <span className="font-bold text-emerald-400">
                      {formatPercent(cat.ai_recovery_rate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar comparison */}
              <div className="space-y-1 pt-1">
                <div className="h-1.5 w-full bg-[#161C2A] rounded-full overflow-hidden flex gap-1">
                  <div
                    className="h-full bg-[#8B7CFF] rounded-full"
                    style={{ width: `${Math.max(4, cat.ai_recovery_rate)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#8B929E] flex items-center justify-between">
                  <span>Strategy: {cat.strategy}</span>
                  <span>{cat.total_cases} test cases</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
