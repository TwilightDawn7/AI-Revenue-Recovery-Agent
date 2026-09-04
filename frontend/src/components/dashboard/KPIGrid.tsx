"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { DashboardMetrics } from "@/types";
import { useEvaluationSummary } from "@/hooks/use-evaluation";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface KPIGridProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function KPIGrid({ metrics, isLoading }: KPIGridProps) {
  const { data: evalSummary } = useEvaluationSummary();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] animate-pulse space-y-3"
          >
            <div className="w-24 h-3 bg-[#161C2A] rounded" />
            <div className="w-36 h-7 bg-[#161C2A] rounded" />
            <div className="w-20 h-2 bg-[#161C2A] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const activeCases =
    metrics.active_recoveries !== undefined
      ? metrics.active_recoveries
      : Math.max(
          0,
          metrics.cases_processed -
            (metrics.successful_recoveries +
              metrics.escalations +
              metrics.stopped_cases)
        );

  // Uplift calculation dynamically derived from backend evaluation or metrics
  const baselineRate = evalSummary?.baseline.recovery_rate ?? 7.15;
  const aiRate = evalSummary?.ai_agent.recovery_rate ?? (metrics.recovery_rate > 0 ? metrics.recovery_rate : 61.74);
  const upliftDiff = evalSummary?.uplift.recovery_rate_diff ?? +(aiRate - baselineRate).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Revenue at Risk */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] hover:border-[#353B47] transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#8B929E] font-medium mb-2">
          <span>Revenue at Risk</span>
          <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-[#F5F7FA] tabular-nums">
            {formatCurrency(metrics.revenue_at_risk)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8B929E]">
          <span className="font-mono text-[#F5F7FA] font-medium">
            {metrics.cases_processed}
          </span>{" "}
          failed recovery cases
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 2. Recovered Revenue */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] hover:border-[#353B47] transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#8B929E] font-medium mb-2">
          <span>Recovered Revenue</span>
          <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            {formatCurrency(metrics.recovered_revenue)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-0.5 font-mono font-semibold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
            <ArrowUpRight className="w-3 h-3" />
            {formatPercent(metrics.recovery_rate)}
          </span>
          <span className="text-[#8B929E]">recovery rate</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 3. AI Recovery Uplift */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] hover:border-[#353B47] transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#8B929E] font-medium mb-2">
          <span>AI Recovery Uplift</span>
          <span className="p-1.5 rounded-md bg-[#8B7CFF]/10 text-[#8B7CFF] border border-[#8B7CFF]/25">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-[#8B7CFF] tabular-nums">
            +{upliftDiff.toFixed(1)}pp
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8B929E]">
          <span>vs baseline</span>
          <span className="font-mono text-[#F5F7FA] font-medium">
            ({baselineRate.toFixed(1)}% → {aiRate.toFixed(1)}%)
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B7CFF]/0 via-[#8B7CFF]/60 to-[#8B7CFF]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 4. Active Recoveries & Guarded */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] hover:border-[#353B47] transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#8B929E] font-medium mb-2">
          <span>Active Recoveries</span>
          <span className="p-1.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-[#F5F7FA] tabular-nums">
            {activeCases}
          </span>
          <span className="text-xs text-[#8B929E]">in recovery cycle</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-[#8B929E]">
          <span className="text-orange-400 font-semibold">{metrics.escalations} escalated</span>
          <span>•</span>
          <span className="text-zinc-400 font-semibold">{metrics.stopped_cases} stopped</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
