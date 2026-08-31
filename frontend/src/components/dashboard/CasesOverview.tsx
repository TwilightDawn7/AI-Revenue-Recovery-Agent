"use client";

import React from "react";
import Link from "next/link";
import { RecoveryCase } from "@/types";
import {
  formatCurrency,
  formatDate,
  getStatusStyle,
  getActionStyle,
} from "@/lib/formatters";
import { ArrowRight, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";

interface CasesOverviewProps {
  cases?: RecoveryCase[];
  isLoading: boolean;
}

export function CasesOverview({ cases, isLoading }: CasesOverviewProps) {
  const recentCases = cases?.slice(0, 8) || [];

  return (
    <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
            Recent Recovery Operations
          </h2>
          <p className="text-xs text-[#8B929E]">
            Live case stream with automated AI diagnosis and policy guardrail interventions.
          </p>
        </div>
        <Link
          href="/cases"
          className="text-xs font-medium text-[#8B7CFF] hover:underline flex items-center gap-1"
        >
          View all {cases?.length || 0} cases <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 w-full bg-[#161C2A] rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : recentCases.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
          No recovery cases recorded yet. Trigger the simulator to generate live cases.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#23262D] text-[11px] font-mono text-[#8B929E] uppercase">
                <th className="py-2.5 px-3">Case</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">AI Recommendation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#191D26] text-xs">
              {recentCases.map((c) => {
                const statusStyle = getStatusStyle(c.status);
                const latestDecision = c.ai_decisions?.[c.ai_decisions.length - 1];
                const actionStyle = latestDecision
                  ? getActionStyle(latestDecision.recommended_action)
                  : null;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-[#121722] transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-[#F5F7FA]">
                      <Link href={`/cases/${c.id}`}>#{c.id}</Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#F5F7FA]">
                        {c.customer?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-[#8B929E] font-mono truncate max-w-[160px]">
                        {c.customer?.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#F5F7FA] tabular-nums">
                      {formatCurrency(c.amount_at_risk)}
                    </td>
                    <td className="py-3 px-3">
                      {actionStyle ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${actionStyle.badgeBg} ${actionStyle.badgeText} ${actionStyle.border}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {actionStyle.label}
                        </span>
                      ) : (
                        <span className="text-[#8B929E] text-[11px] font-mono">
                          Evaluating...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor}`} />
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161C2A] hover:bg-[#23262D] text-[#F5F7FA] text-[11px] font-medium border border-[#23262D] transition-colors"
                      >
                        Forensics
                        <ArrowRight className="w-3 h-3 text-[#8B929E] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
