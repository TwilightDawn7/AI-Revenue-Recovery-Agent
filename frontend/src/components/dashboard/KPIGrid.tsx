"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { DashboardMetrics } from "@/types";
import {
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Zap,
} from "lucide-react";

interface KPIGridProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function KPIGrid({ metrics, isLoading }: KPIGridProps) {
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

  const activeCases = Math.max(
    0,
    metrics.cases_processed -
      (metrics.successful_recoveries +
        metrics.escalations +
        metrics.stopped_cases)
  );

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
          total failed payments tracked
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
            +54.65pp
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8B929E]">
          <span>vs naive baseline</span>
          <span className="font-mono text-[#F5F7FA] font-medium">(5.4% → 60.1%)</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B7CFF]/0 via-[#8B7CFF]/60 to-[#8B7CFF]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 4. Active & Guarded Cases */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] hover:border-[#353B47] transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-[#8B929E] font-medium mb-2">
          <span>Active & Escalations</span>
          <span className="p-1.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-[#F5F7FA] tabular-nums">
            {activeCases}
          </span>
          <span className="text-xs text-[#8B929E]">active workflows</span>
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
