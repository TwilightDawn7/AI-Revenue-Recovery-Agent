"use client";

import React from "react";
import { DashboardMetrics, RecoveryCase } from "@/types";
import {
  RotateCcw,
  Link2,
  UserCheck,
  Ban,
  ShieldCheck,
} from "lucide-react";

interface RecoveryBreakdownProps {
  metrics?: DashboardMetrics;
  cases?: RecoveryCase[];
}

export function RecoveryBreakdown({ metrics, cases }: RecoveryBreakdownProps) {
  // Compute action distribution from cases
  const totalCases = cases?.length || 1;

  const retryCases =
    cases?.filter((c) =>
      c.ai_decisions?.some((d) => d.recommended_action === "RETRY_PAYMENT" || d.recommended_action === "RETRY_LATER")
    ).length || 0;

  const linkCases =
    cases?.filter((c) =>
      c.ai_decisions?.some(
        (d) => d.recommended_action === "REQUEST_PAYMENT_UPDATE" || d.recommended_action === "PAYMENT_UPDATE"
      )
    ).length || 0;

  const escalateCases =
    cases?.filter((c) =>
      c.ai_decisions?.some((d) => d.recommended_action === "ESCALATE_HUMAN")
    ).length || (metrics?.escalations || 0);

  const stopCases =
    cases?.filter((c) =>
      c.ai_decisions?.some((d) => d.recommended_action === "STOP")
    ).length || (metrics?.stopped_cases || 0);

  const strategies = [
    {
      name: "Durable Auto Retries",
      description: "Delayed backoff for temporary bank declines",
      count: retryCases,
      icon: RotateCcw,
      color: "text-[#8B7CFF]",
      barColor: "bg-[#8B7CFF]",
      successRate: "68.5%",
    },
    {
      name: "Payment Update Links",
      description: "Secure WhatsApp / SMS Razorpay links for expired cards",
      count: linkCases,
      icon: Link2,
      color: "text-sky-400",
      barColor: "bg-sky-400",
      successRate: "45.2%",
    },
    {
      name: "Human Escalation",
      description: "White-glove outreach for high-value accounts (> ₹25k)",
      count: escalateCases,
      icon: UserCheck,
      color: "text-orange-400",
      barColor: "bg-orange-400",
      successRate: "62.8%",
    },
    {
      name: "Safely Stopped",
      description: "Policy Engine blocked spam on cancelled subs",
      count: stopCases,
      icon: Ban,
      color: "text-zinc-400",
      barColor: "bg-zinc-500",
      successRate: "100% compliant",
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
            Recovery Strategy Distribution
          </h2>
          <p className="text-xs text-[#8B929E]">
            Autonomous routing determined by Gemini contextual analysis.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Guardrails Active
        </span>
      </div>

      <div className="space-y-3.5">
        {strategies.map((strat) => {
          const Icon = strat.icon;
          const pct = Math.round((strat.count / Math.max(1, totalCases)) * 100);

          return (
            <div key={strat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${strat.color}`} />
                  <span className="font-medium text-[#F5F7FA]">{strat.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[#8B929E]">{strat.count} cases</span>
                  <span className="text-[#F5F7FA] font-semibold">{strat.successRate}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-[#161C2A] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${strat.barColor} transition-all duration-500`}
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
