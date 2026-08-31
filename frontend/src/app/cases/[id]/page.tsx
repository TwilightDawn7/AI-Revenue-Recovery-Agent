"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCaseDetail,
  useTriggerAnalysis,
  useManualRetry,
  useGeneratePaymentLink,
  useEscalateCase,
  useStopCase,
  useSimulatePaymentResolution,
} from "@/hooks/use-cases";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getStatusStyle,
  getActionStyle,
} from "@/lib/formatters";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  User,
  CreditCard,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Link2,
  Copy,
  Check,
  Ban,
  UserCheck,
  DollarSign,
  Radio,
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: caseItem, isLoading, isError, refetch } = useCaseDetail(id);
  const triggerAnalysis = useTriggerAnalysis();
  const manualRetry = useManualRetry();
  const generateLink = useGeneratePaymentLink();
  const escalateCase = useEscalateCase();
  const stopCase = useStopCase();
  const simulatePayment = useSimulatePaymentResolution();

  const [isRawJsonOpen, setIsRawJsonOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showFeedback = (text: string, type: "success" | "error" | "info" = "success") => {
    setActionFeedback({ text, type });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleManualAnalyze = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Triggering Inngest workflow...", "info");
      await triggerAnalysis.mutateAsync(caseItem.id);
      showFeedback("Workflow triggered successfully! Real-time state updated.", "success");
      refetch();
    } catch (err: any) {
      showFeedback("Failed to trigger workflow: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleManualRetry = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Initiating payment retry via Razorpay...", "info");
      const res = await manualRetry.mutateAsync(caseItem.id);
      showFeedback(res.message || "Payment retry dispatched!", "success");
      refetch();
    } catch (err: any) {
      showFeedback("Failed to execute retry: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleGenerateLink = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Generating Razorpay payment update link...", "info");
      const res = await generateLink.mutateAsync(caseItem.id);
      showFeedback(
        `Payment link created: ${res.link?.short_url || "Link created successfully"}`,
        "success"
      );
      refetch();
    } catch (err: any) {
      showFeedback("Failed to generate link: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleEscalate = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Routing to Human Operations...", "info");
      const res = await escalateCase.mutateAsync(caseItem.id);
      showFeedback("Case escalated to Tier-2 operations desk.", "success");
      refetch();
    } catch (err: any) {
      showFeedback("Failed to escalate: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleStop = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Halting automated recovery workflow...", "info");
      const res = await stopCase.mutateAsync(caseItem.id);
      showFeedback("Recovery workflow safely terminated.", "success");
      refetch();
    } catch (err: any) {
      showFeedback("Failed to stop case: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleSimulatePayment = async () => {
    if (!caseItem) return;
    try {
      showFeedback("Simulating Razorpay payment.captured webhook...", "info");
      const res = await simulatePayment.mutateAsync(caseItem.id);
      showFeedback(res.message || `Full recovery confirmed for ₹${caseItem.amount_at_risk}!`, "success");
      refetch();
    } catch (err: any) {
      showFeedback("Failed to simulate resolution: " + (err.message || "Unknown error"), "error");
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#161C2A] rounded" />
        <div className="h-40 w-full bg-[#0D1017] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[#0D1017] rounded-xl" />
          <div className="h-64 bg-[#0D1017] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !caseItem) {
    return (
      <div className="py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-semibold text-[#F5F7FA]">
          Recovery Case Not Found
        </h2>
        <p className="text-xs text-[#8B929E] max-w-sm mx-auto">
          Case #{id} could not be retrieved from PostgreSQL or may not exist.
        </p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#161C2A] text-xs text-[#F5F7FA] hover:bg-[#23262D] border border-[#23262D]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases
        </Link>
      </div>
    );
  }

  const statusStyle = getStatusStyle(caseItem.status);
  const latestDecision =
    caseItem.ai_decisions?.[caseItem.ai_decisions.length - 1];
  const latestAction =
    caseItem.recovery_actions?.[caseItem.recovery_actions.length - 1];

  // Find if any payment link was generated in actions
  const paymentLinkAction = caseItem.recovery_actions?.find(
    (a) => a.action_type === "REQUEST_PAYMENT_UPDATE" && a.external_reference
  );
  const paymentLinkUrl = paymentLinkAction?.external_reference?.startsWith("http")
    ? paymentLinkAction.external_reference
    : paymentLinkAction?.external_reference
    ? `https://rzp.io/i/${paymentLinkAction.external_reference}`
    : null;

  // Derive Policy Compliance status
  const isCancelled = caseItem.problem_type.includes("CANCELLED");
  const isHighValue = caseItem.amount_at_risk > 25000;
  const isMaxRetries = caseItem.retry_count >= 2;

  let policyDecisionLabel = "APPROVED";
  let policyOverrideReason = "Within standard recovery constraints";

  if (isCancelled) {
    policyDecisionLabel = "BLOCKED";
    policyOverrideReason = "Subscription was cancelled by user — retries prohibited to protect merchant reputation.";
  } else if (isHighValue) {
    policyDecisionLabel = "ESCALATED";
    policyOverrideReason = `Amount (${formatCurrency(caseItem.amount_at_risk)}) exceeds autonomous limit (₹25,000). Routed to human ops.`;
  } else if (isMaxRetries) {
    policyDecisionLabel = "ESCALATED";
    policyOverrideReason = "Maximum retry attempts (2) reached. Escalated to prevent card network spam.";
  }

  const isAnyActionPending =
    triggerAnalysis.isPending ||
    manualRetry.isPending ||
    generateLink.isPending ||
    escalateCase.isPending ||
    stopCase.isPending ||
    simulatePayment.isPending;

  return (
    <div className="space-y-6">
      {/* Navigation & Live Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-xs text-[#8B929E] hover:text-[#F5F7FA] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recovery Cases</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Polling (3s)
          </span>
          <button
            onClick={handleManualAnalyze}
            disabled={isAnyActionPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#121722] hover:bg-[#161C2A] text-[#F5F7FA] border border-[#23262D] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-[#8B7CFF] ${
                triggerAnalysis.isPending ? "animate-spin" : ""
              }`}
            />
            <span>Re-run Inngest Pipeline</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
            actionFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : actionFeedback.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-[#8B7CFF]/10 border-[#8B7CFF]/30 text-[#8B7CFF]"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : actionFeedback.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-[#8B7CFF] shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
        </div>
      )}

      {/* Case Header Hero Banner */}
      <div className="p-6 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-[#F5F7FA]">
                Case #{caseItem.id}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor}`}
                />
                {statusStyle.label}
              </span>
            </div>
            <p className="text-xs text-[#8B929E] font-mono">
              Payment ID: {caseItem.payment_id || "N/A"} • Merchant: Default Merchant • Created {formatDate(caseItem.created_at)}
            </p>
          </div>

          <div className="flex items-baseline gap-4">
            <div className="text-right">
              <span className="text-[11px] text-[#8B929E] uppercase font-mono block">
                Amount at Risk
              </span>
              <span className="text-2xl font-mono font-bold text-[#F5F7FA] tabular-nums">
                {formatCurrency(caseItem.amount_at_risk)}
              </span>
            </div>
            {caseItem.recovered_amount > 0 && (
              <div className="text-right pl-4 border-l border-[#23262D]">
                <span className="text-[11px] text-emerald-400 uppercase font-mono block">
                  Recovered
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(caseItem.recovered_amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Transaction Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#191D26] text-xs">
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Customer</span>
            <span className="font-semibold text-[#F5F7FA] block truncate mt-0.5">
              {caseItem.customer?.name || "Customer"}
            </span>
            <span className="text-[#8B929E] text-[11px] font-mono block truncate">
              {caseItem.customer?.email || "customer@example.com"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Problem Classification</span>
            <span className="font-mono font-semibold text-[#8B7CFF] block truncate mt-0.5">
              {caseItem.problem_type}
            </span>
            <span className="text-[#8B929E] text-[11px] block truncate">
              Payment Gateway Failure
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Retry Policy Tracker</span>
            <span className="font-mono font-semibold text-[#F5F7FA] block mt-0.5">
              {caseItem.retry_count} / 2 Attempts
            </span>
            <span className="text-[#8B929E] text-[11px] block">
              Max 2 retries per cycle
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Durable Window</span>
            <span className="font-mono text-[#F5F7FA] block truncate mt-0.5">
              {formatRelativeTime(caseItem.recovery_window_started_at)}
            </span>
            <span className="text-emerald-400 text-[11px] block font-mono">
              Inngest Step Active
            </span>
          </div>
        </div>
      </div>

      {/* OPERATOR CONTROL CONSOLE (Interactive Overrides) */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#F5F7FA]">
                Operator Action Control Console
              </h2>
              <p className="text-[11px] text-[#8B929E]">
                Execute manual interventions or override automated AI recovery policies in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Action 1: Force Immediate Retry */}
          <button
            onClick={handleManualRetry}
            disabled={isAnyActionPending || caseItem.status === "RECOVERED"}
            className="flex flex-col items-start p-3 rounded-lg bg-[#121722] hover:bg-[#161C2A] border border-[#23262D] hover:border-[#8B7CFF]/50 transition-all text-left group disabled:opacity-40 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded bg-[#8B7CFF]/20 text-[#8B7CFF]">
                <RotateCcw className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono text-[#8B929E]">Action</span>
            </div>
            <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#8B7CFF] transition-colors">
              Charge Retry Now
            </span>
            <span className="text-[10px] text-[#8B929E] mt-0.5">
              Dispatch card retry immediately
            </span>
          </button>

          {/* Action 2: Generate Payment Link */}
          <button
            onClick={handleGenerateLink}
            disabled={isAnyActionPending || caseItem.status === "RECOVERED"}
            className="flex flex-col items-start p-3 rounded-lg bg-[#121722] hover:bg-[#161C2A] border border-[#23262D] hover:border-sky-500/50 transition-all text-left group disabled:opacity-40 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                <Link2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono text-[#8B929E]">Razorpay</span>
            </div>
            <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-sky-400 transition-colors">
              Send Payment Link
            </span>
            <span className="text-[10px] text-[#8B929E] mt-0.5">
              Generate update checkout URL
            </span>
          </button>

          {/* Action 3: Escalate to Ops */}
          <button
            onClick={handleEscalate}
            disabled={isAnyActionPending || caseItem.status === "ESCALATED"}
            className="flex flex-col items-start p-3 rounded-lg bg-[#121722] hover:bg-[#161C2A] border border-[#23262D] hover:border-orange-500/50 transition-all text-left group disabled:opacity-40 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded bg-orange-500/20 text-orange-400">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono text-[#8B929E]">Ops</span>
            </div>
            <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-orange-400 transition-colors">
              Escalate to Ops
            </span>
            <span className="text-[10px] text-[#8B929E] mt-0.5">
              Route to Tier-2 human desk
            </span>
          </button>

          {/* Action 4: Halt & Stop Case */}
          <button
            onClick={handleStop}
            disabled={isAnyActionPending || caseItem.status === "STOPPED"}
            className="flex flex-col items-start p-3 rounded-lg bg-[#121722] hover:bg-[#161C2A] border border-[#23262D] hover:border-zinc-500/50 transition-all text-left group disabled:opacity-40 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded bg-zinc-700/30 text-zinc-300">
                <Ban className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono text-[#8B929E]">Guardrail</span>
            </div>
            <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-zinc-300 transition-colors">
              Halt Recovery
            </span>
            <span className="text-[10px] text-[#8B929E] mt-0.5">
              Stop all workflows permanently
            </span>
          </button>

          {/* Action 5: Simulate Full Payment Capture */}
          <button
            onClick={handleSimulatePayment}
            disabled={isAnyActionPending || caseItem.status === "RECOVERED"}
            className="flex flex-col items-start p-3 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 transition-all text-left group disabled:opacity-40 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Simulate</span>
            </div>
            <span className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
              Mark as Recovered
            </span>
            <span className="text-[10px] text-emerald-400/70 mt-0.5">
              Emit payment.captured webhook
            </span>
          </button>
        </div>

        {/* Live Payment Link Display if Active */}
        {paymentLinkUrl && (
          <div className="p-3 rounded-lg bg-[#121722] border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[#8B929E] block text-[10px] font-mono">
                  Active Razorpay Payment Link
                </span>
                <span className="font-mono text-sky-300 truncate block">
                  {paymentLinkUrl}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyLink(paymentLinkUrl)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161C2A] text-xs font-mono text-[#F5F7FA] hover:bg-[#23262D] border border-[#23262D] cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#8B929E]" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              <a
                href={paymentLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-mono"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Flagship Row: AI Decision vs Policy Engine Guardrail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. AI Decision Card */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  AI Recovery Proposal
                </h3>
                <p className="text-[11px] text-[#8B929E] font-mono">
                  Model: {latestDecision?.model_name || "gemini-1.5-flash"}
                </p>
              </div>
            </div>
            {latestDecision?.confidence && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-[#8B929E] block">
                  Confidence
                </span>
                <span className="text-sm font-bold font-mono text-[#8B7CFF]">
                  {Math.round(latestDecision.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {latestDecision ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#121722] border border-[#23262D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B929E]">Recommended Action</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30">
                    {latestDecision.recommended_action}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8B929E]">Proposed Delay</span>
                  <span className="text-[#F5F7FA] font-medium">
                    {latestDecision.delay_minutes} minutes
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#F5F7FA] block mb-1">
                  Diagnosis & Reasoning
                </span>
                <p className="text-xs text-[#C1C7D0] leading-relaxed p-3 rounded-lg bg-[#090C12] border border-[#191D26]">
                  {latestDecision.diagnosis}
                </p>
              </div>

              {latestDecision.reason && (
                <div className="text-xs text-[#8B929E] space-y-1">
                  <span className="font-semibold text-[#F5F7FA]">Why this strategy:</span>
                  <p className="text-xs text-[#8B929E]">{latestDecision.reason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
              AI Decision pending execution...
            </div>
          )}
        </div>

        {/* 2. Policy Engine Guardrail Card */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  Policy Engine Guardrail Interceptor
                </h3>
                <p className="text-[11px] text-[#8B929E] font-mono">
                  Deterministic Safety Boundary
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                policyDecisionLabel === "APPROVED"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : policyDecisionLabel === "BLOCKED"
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-orange-500/15 text-orange-400 border-orange-500/30"
              }`}
            >
              {policyDecisionLabel}
            </span>
          </div>

          <div className="space-y-3">
            {/* Guardrail Rules Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121722] border border-[#23262D]">
                <span className="text-[#C1C7D0]">Max Retry Limit (≤ 2 attempts)</span>
                <span
                  className={`font-mono font-semibold ${
                    caseItem.retry_count <= 2 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {caseItem.retry_count <= 2 ? "✓ Passed" : "✗ Exceeded"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121722] border border-[#23262D]">
                <span className="text-[#C1C7D0]">Max Automated Amount (≤ ₹25,000)</span>
                <span
                  className={`font-mono font-semibold ${
                    caseItem.amount_at_risk <= 25000
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }`}
                >
                  {caseItem.amount_at_risk <= 25000
                    ? "✓ Passed"
                    : "⚠ Exceeded (> ₹25k)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121722] border border-[#23262D]">
                <span className="text-[#C1C7D0]">Subscription Active Check</span>
                <span
                  className={`font-mono font-semibold ${
                    !isCancelled ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {!isCancelled ? "✓ Active" : "✗ Cancelled by User"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121722] border border-[#23262D]">
                <span className="text-[#C1C7D0]">Minimum Retry Interval (≥ 30 min)</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  ✓ Enforced
                </span>
              </div>
            </div>

            {/* Verdict Explanation Box */}
            <div className="p-3 rounded-lg bg-[#090C12] border border-[#191D26] text-xs">
              <span className="font-semibold text-[#8B929E] block mb-1 font-mono">
                Policy Interceptor Verdict:
              </span>
              <p className="text-[#F5F7FA]">{policyOverrideReason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Durable Workflow & Chronological Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executed Recovery Actions */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              Executed Actions Log
            </h3>
            <span className="text-xs font-mono text-[#8B929E]">
              {caseItem.recovery_actions?.length || 0} actions recorded
            </span>
          </div>

          {caseItem.recovery_actions?.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
              No actions executed yet. Use the Operator Console above to trigger actions.
            </div>
          ) : (
            <div className="space-y-2.5">
              {caseItem.recovery_actions?.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#F5F7FA]">
                      Attempt #{act.attempt_number} · {act.action_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        act.status === "captured" || act.status === "success"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-[#161C2A] text-sky-400"
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  {act.result_summary && (
                    <p className="text-xs text-[#C1C7D0]">{act.result_summary}</p>
                  )}
                  {act.external_reference && (
                    <div className="text-[11px] font-mono text-[#8B929E]">
                      Ref: {act.external_reference}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-[#8B929E] text-right">
                    {formatDate(act.executed_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8B7CFF]" />
              Durable Audit Timeline
            </h3>
            <span className="text-xs font-mono text-[#8B929E]">
              {caseItem.audit_logs?.length || 0} events
            </span>
          </div>

          {caseItem.audit_logs?.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
              No audit logs captured.
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#23262D]">
              {caseItem.audit_logs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 relative pl-8">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B7CFF] absolute left-2.5 top-1.5 -translate-x-1/2 ring-4 ring-[#0D1017]" />
                  <div className="flex-1 p-2.5 rounded-lg bg-[#121722] border border-[#23262D]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-[#F5F7FA]">
                        {log.event_type}
                      </span>
                      <span className="text-[10px] font-mono text-[#8B929E]">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8B929E] font-mono">
                      Actor: {log.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Raw JSON Data Inspector */}
      <div className="rounded-xl bg-[#0D1017] border border-[#23262D] overflow-hidden">
        <button
          onClick={() => setIsRawJsonOpen(!isRawJsonOpen)}
          className="w-full flex items-center justify-between p-4 text-xs font-mono text-[#8B929E] hover:text-[#F5F7FA] hover:bg-[#121722] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#38BDF8]" />
            Inspect Raw Database & Event Payload
          </span>
          {isRawJsonOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {isRawJsonOpen && (
          <div className="p-4 border-t border-[#23262D] bg-[#090C12]">
            <pre className="p-3 rounded-lg bg-black text-[11px] font-mono text-[#38BDF8] overflow-x-auto max-h-96">
              {JSON.stringify(caseItem, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
