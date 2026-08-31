"use client";

import React from "react";
import Link from "next/link";
import { RecoveryCase } from "@/types";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import {
  Activity,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";

interface LiveRecoveryFeedProps {
  cases?: RecoveryCase[];
}

export function LiveRecoveryFeed({ cases }: LiveRecoveryFeedProps) {
  // Aggregate recent audit logs and actions across all cases
  const events = React.useMemo(() => {
    if (!cases || cases.length === 0) return [];

    const allEvents: Array<{
      id: string;
      caseId: number;
      customerName: string;
      amount: number;
      time: string;
      type: "PAYMENT_FAILED" | "AI_DECISION" | "POLICY_CHECK" | "ACTION_EXECUTED" | "RECOVERED";
      title: string;
      detail: string;
      color: string;
    }> = [];

    cases.forEach((c) => {
      // 1. Creation event
      allEvents.push({
        id: `case-${c.id}-created`,
        caseId: c.id,
        customerName: c.customer?.name || "Customer",
        amount: c.amount_at_risk,
        time: c.created_at,
        type: "PAYMENT_FAILED",
        title: "Payment Failed",
        detail: `${formatCurrency(c.amount_at_risk)} · ${c.problem_type}`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      });

      // 2. AI Decisions
      c.ai_decisions?.forEach((d) => {
        allEvents.push({
          id: `ai-${d.id}`,
          caseId: c.id,
          customerName: c.customer?.name || "Customer",
          amount: c.amount_at_risk,
          time: d.created_at,
          type: "AI_DECISION",
          title: `AI: ${d.recommended_action.replace(/_/g, " ")}`,
          detail: `${Math.round(d.confidence * 100)}% confidence · ${d.diagnosis.slice(0, 60)}...`,
          color: "text-[#8B7CFF] bg-[#8B7CFF]/10 border-[#8B7CFF]/20",
        });
      });

      // 3. Actions & Recovery
      c.recovery_actions?.forEach((a) => {
        allEvents.push({
          id: `act-${a.id}`,
          caseId: c.id,
          customerName: c.customer?.name || "Customer",
          amount: c.amount_at_risk,
          time: a.executed_at,
          type: a.status === "captured" || a.status === "success" ? "RECOVERED" : "ACTION_EXECUTED",
          title: `Action: ${a.action_type.replace(/_/g, " ")}`,
          detail: a.result_summary || `Attempt #${a.attempt_number} · Status: ${a.status}`,
          color:
            a.status === "captured" || a.status === "success"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-sky-400 bg-sky-500/10 border-sky-500/20",
        });
      });
    });

    // Sort descending by time
    return allEvents
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [cases]);

  return (
    <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
            Live Recovery Feed
          </h2>
        </div>
        <Link
          href="/activity"
          className="text-xs font-medium text-[#8B929E] hover:text-[#F5F7FA] flex items-center gap-1 transition-colors"
        >
          Full stream <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
          <Activity className="w-6 h-6 mx-auto mb-2 text-[#8B929E]/50" />
          No recent recovery events. Run the simulator to trigger live events.
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((evt) => (
            <Link
              key={evt.id}
              href={`/cases/${evt.caseId}`}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#121722]/60 hover:bg-[#161C2A] border border-[#23262D] hover:border-[#353B47] transition-all group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-mono font-medium shrink-0 border ${evt.color}`}
                >
                  {evt.type === "AI_DECISION" ? "AI" : evt.type === "PAYMENT_FAILED" ? "FAIL" : "ACT"}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#F5F7FA] group-hover:text-[#8B7CFF] transition-colors truncate">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-[#8B929E] truncate">
                    {evt.customerName} • {evt.detail}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#8B929E] shrink-0">
                {formatRelativeTime(evt.time)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
