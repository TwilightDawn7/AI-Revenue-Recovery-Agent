import { CaseStatus, RecoveryActionType, PolicyDecision } from "@/types";

/**
 * Format currency with Indian Rupee symbol and standard fintech separators.
 */
export function formatCurrency(amount: number, compact = false): string {
  if (isNaN(amount)) return "₹0";

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage with customizable decimal places.
 */
export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date into clean relative or timestamp format.
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g. "2m ago", "Just now")
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

/**
 * Status style mapping according to Master Specification Semantic Rules:
 * AT_RISK: Neutral / Warning
 * ANALYZING: AI Violet / Indigo
 * WAITING: Amber
 * ACTION_PENDING: Cyan
 * RECOVERED: Emerald
 * ESCALATED: Orange
 * STOPPED: Red / Neutral
 * FAILED: Red
 */
export interface StatusStyle {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export function getStatusStyle(status: CaseStatus): StatusStyle {
  switch (status) {
    case "RECOVERED":
      return {
        label: "Recovered",
        badgeBg: "bg-emerald-500/10",
        badgeText: "text-emerald-400",
        badgeBorder: "border-emerald-500/20",
        dotColor: "bg-emerald-400",
      };
    case "AT_RISK":
      return {
        label: "At Risk",
        badgeBg: "bg-amber-500/10",
        badgeText: "text-amber-400",
        badgeBorder: "border-amber-500/20",
        dotColor: "bg-amber-400",
      };
    case "ANALYZING":
      return {
        label: "AI Analyzing",
        badgeBg: "bg-[#8B7CFF]/10",
        badgeText: "text-[#8B7CFF]",
        badgeBorder: "border-[#8B7CFF]/25",
        dotColor: "bg-[#8B7CFF]",
      };
    case "WAITING":
      return {
        label: "Waiting Retry",
        badgeBg: "bg-amber-500/10",
        badgeText: "text-amber-400",
        badgeBorder: "border-amber-500/20",
        dotColor: "bg-amber-400",
      };
    case "ACTION_PENDING":
      return {
        label: "Action Pending",
        badgeBg: "bg-sky-500/10",
        badgeText: "text-sky-400",
        badgeBorder: "border-sky-500/20",
        dotColor: "bg-sky-400",
      };
    case "ESCALATED":
      return {
        label: "Escalated to Human",
        badgeBg: "bg-orange-500/10",
        badgeText: "text-orange-400",
        badgeBorder: "border-orange-500/25",
        dotColor: "bg-orange-400",
      };
    case "STOPPED":
      return {
        label: "Safely Stopped",
        badgeBg: "bg-zinc-800/60",
        badgeText: "text-zinc-400",
        badgeBorder: "border-zinc-700/40",
        dotColor: "bg-zinc-500",
      };
    case "FAILED":
      return {
        label: "Recovery Failed",
        badgeBg: "bg-red-500/10",
        badgeText: "text-red-400",
        badgeBorder: "border-red-500/20",
        dotColor: "bg-red-400",
      };
    default:
      return {
        label: status,
        badgeBg: "bg-zinc-800",
        badgeText: "text-zinc-300",
        badgeBorder: "border-zinc-700",
        dotColor: "bg-zinc-400",
      };
  }
}

export function getActionStyle(action: RecoveryActionType) {
  switch (action) {
    case "RETRY_PAYMENT":
      return {
        label: "Retry Payment",
        badgeBg: "bg-[#8B7CFF]/15",
        badgeText: "text-[#8B7CFF]",
        border: "border-[#8B7CFF]/30",
      };
    case "REQUEST_PAYMENT_UPDATE":
      return {
        label: "Payment Link Update",
        badgeBg: "bg-sky-500/15",
        badgeText: "text-sky-400",
        border: "border-sky-500/30",
      };
    case "ESCALATE_HUMAN":
      return {
        label: "Escalate to Human",
        badgeBg: "bg-orange-500/15",
        badgeText: "text-orange-400",
        border: "border-orange-500/30",
      };
    case "STOP":
      return {
        label: "Stop Recovery",
        badgeBg: "bg-zinc-800",
        badgeText: "text-zinc-400",
        border: "border-zinc-700",
      };
  }
}

export function getPolicyDecisionStyle(decision: PolicyDecision) {
  switch (decision) {
    case "APPROVED":
      return {
        label: "Policy Approved",
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
      };
    case "BLOCKED":
      return {
        label: "Policy Blocked",
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/30",
      };
    case "ESCALATED":
      return {
        label: "Policy Overridden (Escalated)",
        bg: "bg-orange-500/15",
        text: "text-orange-400",
        border: "border-orange-500/30",
      };
    case "DELAYED":
      return {
        label: "Policy Adjusted (Delay Increased)",
        bg: "bg-amber-500/15",
        text: "text-amber-400",
        border: "border-amber-500/30",
      };
  }
}
