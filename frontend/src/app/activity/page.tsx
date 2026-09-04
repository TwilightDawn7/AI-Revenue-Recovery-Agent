"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/use-mounted";
import { useCases } from "@/hooks/use-cases";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import {
  Activity,
  ExternalLink,
} from "lucide-react";

export default function ActivityPage() {
  const mounted = useMounted();
  const { data: cases, isLoading } = useCases();
  const showLoading = !mounted || isLoading;
  const [filterType, setFilterType] = useState<string>("ALL");

  const events = React.useMemo(() => {
    if (!cases || cases.length === 0) return [];

    const allEvents: Array<{
      id: string;
      caseId: number;
      customerName: string;
      amount: number;
      time: string;
      type: "WEBHOOK" | "AI_DECISION" | "POLICY" | "ACTION" | "CAPTURED";
      title: string;
      detail: string;
      actor: string;
      payload?: any;
    }> = [];

    cases.forEach((c) => {
      // 1. Audit Logs
      c.audit_logs?.forEach((l) => {
        allEvents.push({
          id: `audit-${l.id}`,
          caseId: c.id,
          customerName: c.customer?.name || "Customer",
          amount: c.amount_at_risk,
          time: l.created_at,
          type:
            l.event_type.includes("WEBHOOK") || l.event_type.includes("PAYMENT_FAILED")
              ? "WEBHOOK"
              : l.event_type.includes("AI")
              ? "AI_DECISION"
              : l.event_type.includes("POLICY") || l.event_type.includes("GUARDRAIL")
              ? "POLICY"
              : l.event_type.includes("RECOVERED") || l.event_type.includes("CAPTURED")
              ? "CAPTURED"
              : "ACTION",
          title: l.event_type,
          detail: `Actor: ${l.actor}`,
          actor: l.actor,
          payload: l.payload,
        });
      });

      // 2. AI Decisions
      c.ai_decisions?.forEach((d) => {
        allEvents.push({
          id: `ai-dec-${d.id}`,
          caseId: c.id,
          customerName: c.customer?.name || "Customer",
          amount: c.amount_at_risk,
          time: d.created_at,
          type: "AI_DECISION",
          title: `AI Reasoning: ${d.recommended_action}`,
          detail: `${Math.round((d.confidence || 0.85) * 100)}% confidence • ${d.diagnosis}`,
          actor: d.model_name || "Gemini",
        });
      });

      // 3. Recovery Actions
      c.recovery_actions?.forEach((a) => {
        const isCaptured =
          a.status === "captured" ||
          a.status === "success" ||
          a.action_type === "PAYMENT_CAPTURED";

        allEvents.push({
          id: `act-log-${a.id}`,
          caseId: c.id,
          customerName: c.customer?.name || "Customer",
          amount: c.amount_at_risk,
          time: a.executed_at,
          type: isCaptured ? "CAPTURED" : "ACTION",
          title: `Action Executed: ${a.action_type}`,
          detail: a.result_summary || `Attempt #${a.attempt_number} · Status: ${a.status}`,
          actor: "Action Executor / Razorpay",
        });
      });
    });

    return allEvents
      .filter((e) => {
        if (filterType === "ALL") return true;
        return e.type === filterType;
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [cases, filterType]);

  const filterTabs = [
    { label: "All Events", value: "ALL" },
    { label: "AI Reasoning", value: "AI_DECISION" },
    { label: "Webhooks", value: "WEBHOOK" },
    { label: "Actions Dispatched", value: "ACTION" },
    { label: "Recovered / Captured", value: "CAPTURED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Live Recovery Event Stream
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-[#8B929E]">
            Immutable chronological audit stream of all Razorpay webhooks, AI inferences, policy validations, and dispatched recovery actions.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#8B929E] bg-[#0D1017] px-3 py-1.5 rounded-lg border border-[#23262D]">
          <span>Total Stream Events:</span>
          <span className="font-bold text-[#F5F7FA]">{events.length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isSelected = filterType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#8B7CFF] text-white shadow-xs font-semibold"
                  : "bg-[#0D1017] text-[#8B929E] hover:text-[#F5F7FA] border border-[#23262D] hover:bg-[#161C2A]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Event Stream List */}
      <div className="rounded-xl bg-[#0D1017] border border-[#23262D] p-5">
        {showLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-[#161C2A] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B929E] space-y-2">
            <Activity className="w-8 h-8 mx-auto text-[#8B929E]/50" />
            <div className="text-sm font-medium text-[#F5F7FA]">
              No events recorded yet
            </div>
            <p className="text-[11px] max-w-sm mx-auto">
              Run a recovery simulator scenario to trigger webhook events and view the live audit trail populate in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#121722] border border-[#23262D] hover:border-[#353B47] transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 mt-0.5 rounded text-[10px] font-mono font-semibold shrink-0 border ${
                      evt.type === "AI_DECISION"
                        ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30"
                        : evt.type === "CAPTURED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : evt.type === "WEBHOOK"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : evt.type === "POLICY"
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                    }`}
                  >
                    {evt.type}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-semibold text-[#F5F7FA] truncate">
                      {evt.title}
                    </div>
                    <div className="text-xs text-[#8B929E]">
                      {evt.customerName} • {evt.detail}
                    </div>
                    <div className="text-[10px] font-mono text-[#8B929E]">
                      Actor: {evt.actor}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-[#F5F7FA] block">
                      {formatCurrency(evt.amount)}
                    </span>
                    <span
                      className="text-[10px] font-mono text-[#8B929E] block"
                      suppressHydrationWarning
                    >
                      {formatRelativeTime(evt.time)}
                    </span>
                  </div>
                  <Link
                    href={`/cases/${evt.caseId}`}
                    className="p-1.5 rounded bg-[#161C2A] hover:bg-[#8B7CFF] text-[#8B929E] hover:text-white transition-colors"
                    title={`Inspect Case #${evt.caseId}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
