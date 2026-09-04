"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/use-mounted";
import { useCases } from "@/hooks/use-cases";
import {
  formatCurrency,
  formatRelativeTime,
  getStatusStyle,
  getActionStyle,
} from "@/lib/formatters";
import {
  Search,
  ShieldAlert,
  Sparkles,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";

export default function CasesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "retries">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const mounted = useMounted();
  const { data: cases, isLoading } = useCases();
  const showLoading = !mounted || isLoading;

  const filteredCases = useMemo(() => {
    if (!cases) return [];

    return cases
      .filter((c) => {
        // Quick Filters
        if (statusFilter === "NEEDS_HUMAN") {
          if (c.status !== "ESCALATED") return false;
        } else if (statusFilter === "HIGH_VALUE") {
          if (c.amount_at_risk < 25000) return false;
        } else if (statusFilter === "IN_PROGRESS") {
          if (
            c.status !== "AT_RISK" &&
            c.status !== "ANALYZING" &&
            c.status !== "DECIDING" &&
            c.status !== "ACTION_PENDING"
          ) {
            return false;
          }
        } else if (statusFilter !== "ALL" && c.status !== statusFilter) {
          return false;
        }

        // Search query (sanitized without relying on exposed raw PII)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (c.customer?.name || "").toLowerCase();
          const segment = (c.customer?.segment || "").toLowerCase();
          const paymentId = (c.payment_id || "").toLowerCase();
          const problemType = (c.problem_type || "").toLowerCase();
          const caseId = String(c.id);

          return (
            name.includes(q) ||
            segment.includes(q) ||
            paymentId.includes(q) ||
            problemType.includes(q) ||
            caseId.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "amount") {
          return sortOrder === "desc"
            ? b.amount_at_risk - a.amount_at_risk
            : a.amount_at_risk - b.amount_at_risk;
        }
        if (sortBy === "retries") {
          return sortOrder === "desc"
            ? b.retry_count - a.retry_count
            : a.retry_count - b.retry_count;
        }
        // Date
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [cases, statusFilter, searchQuery, sortBy, sortOrder]);

  const toggleSort = (column: "date" | "amount" | "retries") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const statusTabs = [
    { label: "All Cases", value: "ALL" },
    { label: "Needs Human", value: "NEEDS_HUMAN" },
    { label: "Waiting Retry", value: "WAITING" },
    { label: "In-Flight", value: "IN_PROGRESS" },
    { label: "Recovered", value: "RECOVERED" },
    { label: "Blocked / Stopped", value: "STOPPED" },
    { label: "High Value (>₹25k)", value: "HIGH_VALUE" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Recovery Operations Console
          </h1>
          <p className="text-xs text-[#8B929E] mt-0.5">
            Merchant operations table for monitoring autonomous recovery actions, LLM reasoning, and policy guardrails.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#8B929E] bg-[#0D1017] px-3 py-1.5 rounded-lg border border-[#23262D]">
          <span>Total Cases:</span>
          <span className="font-bold text-[#F5F7FA]">{cases?.length || 0}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8B929E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, segment, problem type, payment ID, or #case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0D1017] border border-[#23262D] focus:border-[#8B7CFF] rounded-lg text-xs text-[#F5F7FA] placeholder-[#8B929E] focus:outline-hidden transition-colors"
          />
        </div>

        {/* Status Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {statusTabs.map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
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
      </div>

      {/* Operations Table */}
      <div className="rounded-xl bg-[#0D1017] border border-[#23262D] overflow-hidden">
        {showLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-12 w-full bg-[#161C2A] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B929E] space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-[#8B929E]/50" />
            <div className="text-sm font-medium text-[#F5F7FA]">
              No recovery cases found
            </div>
            <p className="max-w-sm mx-auto text-[11px]">
              No transactions match your current search or status filter. Reset filters or run a scenario in the simulator.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#23262D] text-[11px] font-mono text-[#8B929E] uppercase">
                  <th className="py-3 px-4">Case</th>
                  <th className="py-3 px-4">Customer</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Failure</th>
                  <th className="py-3 px-4">AI Recommendation</th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("retries")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Attempts</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Updated</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Forensics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#191D26] text-xs">
                {filteredCases.map((c) => {
                  const statusStyle = getStatusStyle(c.status);
                  const latestDecision =
                    c.ai_decisions?.[c.ai_decisions.length - 1];
                  const actionStyle = latestDecision
                    ? getActionStyle(latestDecision.recommended_action)
                    : null;

                  const customerSegment =
                    c.customer?.segment ||
                    (c.amount_at_risk > 25000 ? "HIGH VALUE" : "ACTIVE SUBSCRIBER");

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#121722] transition-colors group"
                    >
                      {/* Case ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#F5F7FA]">
                        <Link
                          href={`/cases/${c.id}`}
                          className="hover:text-[#8B7CFF] transition-colors"
                        >
                          #{c.id}
                        </Link>
                      </td>

                      {/* Customer & Segment (No raw email in main table) */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F5F7FA]">
                          {c.customer?.name || "Customer"}
                        </div>
                        <div className="text-[10px] font-mono text-[#8B7CFF] uppercase">
                          {customerSegment}
                        </div>
                      </td>

                      {/* Amount at Risk */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F5F7FA] tabular-nums">
                        {formatCurrency(c.amount_at_risk)}
                      </td>

                      {/* Failure / Problem Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#161C2A] text-[#8B929E] border border-[#23262D]">
                          {c.problem_type}
                        </span>
                      </td>

                      {/* AI Recommendation & Recovery Prob vs Confidence */}
                      <td className="py-3.5 px-4">
                        {actionStyle ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${actionStyle.badgeBg} ${actionStyle.badgeText} ${actionStyle.border}`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {actionStyle.label}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B929E]">
                              {latestDecision?.recovery_probability !== undefined ? (
                                <span className="text-emerald-400 font-semibold">
                                  {Math.round(latestDecision.recovery_probability * 100)}% prob
                                </span>
                              ) : (
                                <span>{Math.round((latestDecision?.confidence || 0.8) * 100)}% conf</span>
                              )}
                              {latestDecision?.confidence !== undefined && latestDecision?.recovery_probability !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{Math.round(latestDecision.confidence * 100)}% conf</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[#8B929E]">
                            Pending analysis
                          </span>
                        )}
                      </td>

                      {/* Attempts */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#161C2A] text-[#F5F7FA]">
                          {c.retry_count} {c.retry_count === 1 ? "retry" : "retries"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor}`}
                          />
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td
                        className="py-3.5 px-4 text-right font-mono text-[11px] text-[#8B929E]"
                        suppressHydrationWarning
                      >
                        {formatRelativeTime(c.updated_at || c.created_at)}
                      </td>

                      {/* Forensics Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/cases/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161C2A] hover:bg-[#8B7CFF] hover:text-white text-[#F5F7FA] text-xs font-medium border border-[#23262D] transition-all cursor-pointer"
                        >
                          Forensics
                          <ChevronRight className="w-3 h-3 text-[#8B929E] group-hover:text-white" />
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
    </div>
  );
}
