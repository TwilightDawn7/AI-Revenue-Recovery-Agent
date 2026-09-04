"use client";

import React from "react";
import Link from "next/link";
import { DashboardMetrics } from "@/types";
import {
  ArrowRight,
} from "lucide-react";

interface RecoveryFunnelProps {
  metrics?: DashboardMetrics;
}

export function RecoveryFunnel({ metrics }: RecoveryFunnelProps) {
  const total = metrics?.cases_processed || 0;
  const recovered = metrics?.successful_recoveries || 0;
  const escalated = metrics?.escalations || 0;
  const stopped = metrics?.stopped_cases || 0;
  const inProgress = Math.max(0, total - (recovered + escalated + stopped));

  const steps = [
    {
      title: "Failed Payment",
      count: total,
      subtext: "Webhook Received",
      status: "AT_RISK",
      color: "border-zinc-700 bg-[#121722]",
      badge: "Inbound",
      badgeColor: "text-[#8B929E] bg-[#161C2A]",
    },
    {
      title: "AI Analysis",
      count: total,
      subtext: "Gemini Structured JSON",
      status: "ANALYZING",
      color: "border-[#8B7CFF]/30 bg-[#8B7CFF]/5",
      badge: "LLM Reasoning",
      badgeColor: "text-[#8B7CFF] bg-[#8B7CFF]/15",
    },
    {
      title: "Policy Guardrails",
      count: total,
      subtext: "Deterministic Interceptor",
      status: "ACTION_PENDING",
      color: "border-emerald-500/30 bg-emerald-500/5",
      badge: "100% Compliant",
      badgeColor: "text-emerald-400 bg-emerald-500/15",
    },
    {
      title: "Durable Action",
      count: total,
      subtext: "Inngest Orchestration",
      status: "WAITING",
      color: "border-sky-500/30 bg-sky-500/5",
      badge: "Scheduled",
      badgeColor: "text-sky-400 bg-sky-500/15",
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight flex items-center gap-2">
            Recovery Pipeline Funnel
            <span className="text-[11px] font-mono font-normal text-[#8B929E]">
              (Click stage to filter cases)
            </span>
          </h2>
          <p className="text-xs text-[#8B929E]">
            End-to-end trace from failed webhook event to final revenue capture.
          </p>
        </div>
        <Link
          href="/cases"
          className="text-xs font-medium text-[#8B7CFF] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          View all cases <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Funnel Pipeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => (
          <Link
            key={step.title}
            href={`/cases?status=${step.status}`}
            className={`p-3.5 rounded-lg border ${step.color} hover:border-[#8B7CFF]/50 transition-all cursor-pointer group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#8B929E]">
                0{idx + 1}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${step.badgeColor}`}
              >
                {step.badge}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#8B7CFF] transition-colors">
                {step.title}
              </div>
              <div className="text-[11px] text-[#8B929E]">{step.subtext}</div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#23262D] flex items-center justify-between">
              <span className="text-xs text-[#8B929E]">Processed:</span>
              <span className="text-sm font-mono font-bold text-[#F5F7FA]">
                {step.count}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Outcome Distribution Bar */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-[#8B929E] mb-2 font-mono">
          <span>Resolution Breakdown</span>
          <span>
            {recovered} Recovered • {escalated} Escalated • {stopped} Stopped • {inProgress} In-Flight
          </span>
        </div>
        <div className="h-2.5 w-full bg-[#161C2A] rounded-full overflow-hidden flex gap-0.5">
          {total > 0 && (
            <>
              <div
                style={{ width: `${(recovered / total) * 100}%` }}
                className="bg-emerald-400 h-full transition-all"
                title={`Recovered: ${recovered}`}
              />
              <div
                style={{ width: `${(escalated / total) * 100}%` }}
                className="bg-orange-400 h-full transition-all"
                title={`Escalated: ${escalated}`}
              />
              <div
                style={{ width: `${(stopped / total) * 100}%` }}
                className="bg-zinc-500 h-full transition-all"
                title={`Stopped: ${stopped}`}
              />
              <div
                style={{ width: `${(inProgress / total) * 100}%` }}
                className="bg-[#8B7CFF] h-full transition-all"
                title={`In-Flight: ${inProgress}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
