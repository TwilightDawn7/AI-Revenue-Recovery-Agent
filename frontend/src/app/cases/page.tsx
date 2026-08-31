"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCases } from "@/hooks/use-cases";
import { CaseStatus, RecoveryCase } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getStatusStyle,
  getActionStyle,
} from "@/lib/formatters";
import {
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
  ArrowUpDown,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

export default function CasesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "retries">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: cases, isLoading } = useCases();

  const filteredCases = useMemo(() => {
    if (!cases) return [];

    return cases
      .filter((c) => {
        // Status filter
        if (statusFilter !== "ALL" && c.status !== statusFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (c.customer?.name || "").toLowerCase();
          const email = (c.customer?.email || "").toLowerCase();
          const paymentId = (c.payment_id || "").toLowerCase();
          const caseId = String(c.id);

          return (
            name.includes(q) ||
            email.includes(q) ||
            paymentId.includes(q) ||
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
    { label: "At Risk", value: "AT_RISK" },
    { label: "Analyzing", value: "ANALYZING" },
    { label: "Waiting Retry", value: "WAITING" },
    { label: "Action Pending", value: "ACTION_PENDING" },
    { label: "Recovered", value: "RECOVERED" },
    { label: "Escalated", value: "ESCALATED" },
    { label: "Stopped", value: "STOPPED" },
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
            Real-time management table of failed payments, autonomous AI plans, and policy overrides.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#8B929E] bg-[#0D1017] px-3 py-1.5 rounded-lg border border-[#23262D]">
          <span>Total Records:</span>
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
            placeholder="Search by customer name, email, payment ID, or #case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0D1017] border border-[#23262D] focus:border-[#8B7CFF] rounded-lg text-xs text-[#F5F7FA] placeholder-[#8B929E] focus:outline-hidden transition-colors"
          />
        </div>

        {/* Status Tabs */}
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
        {isLoading ? (
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
              No transactions match your current search or status filter. Try resetting filters or triggering a new case in the simulator.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#23262D] bg-[#090C12] text-[11px] font-mono text-[#8B929E] uppercase tracking-wider">
                  <th className="py-3 px-4">Case</th>
                  <th className="py-3 px-4">Customer</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount at Risk</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Problem Type</th>
                  <th className="py-3 px-4">AI Recommendation</th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("retries")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Retries</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer select-none hover:text-[#F5F7FA]"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Details</th>
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

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#121722] transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#F5F7FA]">
                        <Link
                          href={`/cases/${c.id}`}
                          className="hover:text-[#8B7CFF] transition-colors"
                        >
                          #{c.id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F5F7FA]">
                          {c.customer?.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-[#8B929E] font-mono truncate max-w-[170px]">
                          {c.customer?.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F5F7FA] tabular-nums">
                        {formatCurrency(c.amount_at_risk)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#161C2A] text-[#8B929E] border border-[#23262D]">
                          {c.problem_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {actionStyle ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${actionStyle.badgeBg} ${actionStyle.badgeText} ${actionStyle.border}`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {actionStyle.label}
                            </span>
                            {latestDecision?.confidence && (
                              <div className="text-[10px] font-mono text-[#8B929E]">
                                {Math.round(latestDecision.confidence * 100)}% conf
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[#8B929E]">
                            Pending analysis
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#161C2A] text-[#F5F7FA]">
                          {c.retry_count} / 2
                        </span>
                      </td>
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
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-[#8B929E]">
                        {formatRelativeTime(c.created_at)}
                      </td>
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
