"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
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
} from "@/lib/formatters";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Zap,
  ExternalLink,
  Layers,
  Link2,
  Copy,
  Check,
  Ban,
  UserCheck,
  DollarSign,
  History,
  Scale,
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const mounted = useMounted();

  const { data: caseItem, isLoading, isError, refetch } = useCaseDetail(id);
  const triggerAnalysis = useTriggerAnalysis();
  const manualRetry = useManualRetry();
  const generateLink = useGeneratePaymentLink();
  const escalateCase = useEscalateCase();
  const stopCase = useStopCase();
  const simulatePayment = useSimulatePaymentResolution();

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
      await escalateCase.mutateAsync(caseItem.id);
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
      await stopCase.mutateAsync(caseItem.id);
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

  if (!mounted || isLoading) {
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
          Case #{id} could not be retrieved from PostgreSQL database or may not exist.
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
  
  // Authoritative Backend Data Extraction
  const latestAIDecision = caseItem.ai_decisions?.[caseItem.ai_decisions.length - 1];
  const latestRecoveryDecision = caseItem.recovery_decisions?.[caseItem.recovery_decisions.length - 1];

  // Derive candidate actions evaluated from backend
  const candidateActions =
    latestRecoveryDecision?.actions_evaluated ||
    latestAIDecision?.actions_evaluated ||
    [];

  // Authoritative Policy Evaluation from Backend
  const policyDecisionLabel = latestRecoveryDecision?.policy_decision || (
    caseItem.status === "ESCALATED" ? "ESCALATED" :
    caseItem.status === "STOPPED" ? "BLOCKED" : "APPROVED"
  );
  const policyRule = latestRecoveryDecision?.policy_rule || (
    caseItem.status === "ESCALATED" ? "POLICY_ESCALATION_RULE" :
    caseItem.status === "STOPPED" ? "POLICY_SAFETY_GUARD" : "STANDARD_POLICY"
  );
  const policyReason = latestRecoveryDecision?.policy_reason || (
    caseItem.status === "ESCALATED"
      ? `Case routed for human operator review per policy requirements.`
      : caseItem.status === "STOPPED"
      ? `Automated recovery halted by deterministic policy guard.`
      : `Action authorized within autonomous operating limits.`
  );
  const finalAction = latestRecoveryDecision?.final_action || (
    policyDecisionLabel === "BLOCKED" ? "STOP" :
    policyDecisionLabel === "ESCALATED" ? "ESCALATE_HUMAN" :
    latestAIDecision?.recommended_action || "RETRY_PAYMENT"
  );

  // Find if any payment link was generated in actions
  const paymentLinkAction = caseItem.recovery_actions?.find(
    (a) => a.action_type === "REQUEST_PAYMENT_UPDATE" && a.external_reference
  );
  const paymentLinkUrl = paymentLinkAction?.external_reference?.startsWith("http")
    ? paymentLinkAction.external_reference
    : paymentLinkAction?.external_reference
    ? `https://rzp.io/i/${paymentLinkAction.external_reference}`
    : null;

  const isAnyActionPending =
    triggerAnalysis.isPending ||
    manualRetry.isPending ||
    generateLink.isPending ||
    escalateCase.isPending ||
    stopCase.isPending ||
    simulatePayment.isPending;

  return (
    <div className="space-y-6">
      {/* Navigation & Live Polling Header */}
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
            Live Sync
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

      {/* Case Hero Banner */}
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
              Payment ID: {caseItem.payment_id || "N/A"} • Created {formatDate(caseItem.created_at)}
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
            <span className="text-[#8B929E] block text-[11px]">Customer & Segment</span>
            <span className="font-semibold text-[#F5F7FA] block truncate mt-0.5">
              {caseItem.customer?.name || "Customer"}
            </span>
            <span className="text-[#8B7CFF] text-[11px] font-mono block uppercase">
              {caseItem.customer?.segment || (caseItem.amount_at_risk > 25000 ? "HIGH VALUE" : "LOYAL CUSTOMER")}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Failure Classification</span>
            <span className="font-mono font-semibold text-[#8B7CFF] block truncate mt-0.5">
              {caseItem.problem_type}
            </span>
            <span className="text-[#8B929E] text-[11px] block truncate">
              Gateway Diagnostic Code
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Attempts Executed</span>
            <span className="font-mono font-semibold text-[#F5F7FA] block mt-0.5">
              {caseItem.retry_count} {caseItem.retry_count === 1 ? "Attempt" : "Attempts"}
            </span>
            <span className="text-[#8B929E] text-[11px] block">
              Governed by policy limit
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D]">
            <span className="text-[#8B929E] block text-[11px]">Recovery Window</span>
            <span className="font-mono text-[#F5F7FA] block truncate mt-0.5">
              {formatRelativeTime(caseItem.recovery_window_started_at)}
            </span>
            <span className="text-emerald-400 text-[11px] block font-mono">
              Inngest Step Active
            </span>
          </div>
        </div>
      </div>

      {/* OPERATOR CONTROL CONSOLE */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#F5F7FA]">
                Operator Action Console
              </h2>
              <p className="text-[11px] text-[#8B929E]">
                Execute manual recovery interventions or override automated AI recovery policies.
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
              Dispatch immediate card retry
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
              Stop workflows permanently
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
              Emit payment.captured event
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

      {/* DECISION REPLAY TIMELINE */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#23262D]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#8B7CFF]" />
            <h2 className="text-sm font-semibold text-[#F5F7FA]">
              Decision Replay & Chain of Custody
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Immutable Audit Trail
          </span>
        </div>

        {/* Step Progression */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 1</span>
            <span className="font-semibold text-rose-400 block truncate">Payment Failed</span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">{caseItem.problem_type}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 2</span>
            <span className="font-semibold text-sky-400 block truncate">Context Assembled</span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">Zero PII Sanitized</span>
          </div>
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 3</span>
            <span className="font-semibold text-[#8B7CFF] block truncate">AI Diagnosed</span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">
              {latestAIDecision?.recommended_action || "RETRY_PAYMENT"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 4</span>
            <span className="font-semibold text-emerald-400 block truncate">EV Valuation</span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">
              {latestAIDecision?.expected_recovery_value ? formatCurrency(latestAIDecision.expected_recovery_value, true) : "Calculated"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 5</span>
            <span className={`font-semibold block truncate ${policyDecisionLabel === "APPROVED" ? "text-emerald-400" : "text-amber-400"}`}>
              Policy Gate
            </span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">{policyDecisionLabel}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1">
            <span className="text-[10px] font-mono text-[#8B929E] block">Stage 6</span>
            <span className={`font-semibold block truncate ${caseItem.status === "RECOVERED" ? "text-emerald-400" : "text-[#F5F7FA]"}`}>
              Final Action
            </span>
            <span className="text-[10px] font-mono text-[#8B929E] block truncate">{finalAction}</span>
          </div>
        </div>
      </div>

      {/* Row: AI Proposal vs Deterministic Policy Gate */}
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
                  Model: {latestAIDecision?.model_name || "Gemini"}
                </p>
              </div>
            </div>
            {latestAIDecision && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#8B929E] block">
                    Confidence
                  </span>
                  <span className="text-sm font-bold font-mono text-[#8B7CFF]">
                    {Math.round(latestAIDecision.confidence * 100)}%
                  </span>
                </div>
                {latestAIDecision.recovery_probability !== undefined && (
                  <div className="text-right pl-3 border-l border-[#23262D]">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 block">
                      Recovery Prob
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {Math.round(latestAIDecision.recovery_probability * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {latestAIDecision ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#121722] border border-[#23262D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B929E]">Recommended Action</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30">
                    {latestAIDecision.recommended_action}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8B929E]">Proposed Delay</span>
                  <span className="text-[#F5F7FA] font-medium">
                    {latestAIDecision.delay_minutes} minutes
                  </span>
                </div>
                {latestAIDecision.expected_recovery_value !== undefined && (
                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#191D26]">
                    <span className="text-[#8B929E]">Expected Net Value (EV)</span>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(latestAIDecision.expected_recovery_value)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-[#F5F7FA] block mb-1">
                  Diagnosis
                </span>
                <p className="text-xs text-[#C1C7D0] leading-relaxed p-3 rounded-lg bg-[#090C12] border border-[#191D26]">
                  {latestAIDecision.diagnosis}
                </p>
              </div>

              {latestAIDecision.reason && (
                <div className="text-xs text-[#8B929E] space-y-1">
                  <span className="font-semibold text-[#F5F7FA]">Reasoning:</span>
                  <p className="text-xs text-[#8B929E]">{latestAIDecision.reason}</p>
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
                  Policy Engine Gate
                </h3>
                <p className="text-[11px] text-[#8B929E] font-mono">
                  Deterministic Merchant Guardrails
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                policyDecisionLabel === "APPROVED"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : policyDecisionLabel === "BLOCKED"
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {policyDecisionLabel}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-[#121722] border border-[#23262D] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8B929E]">Policy Rule:</span>
                <span className="font-mono font-semibold text-amber-300">
                  {policyRule}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B929E]">Authorized Final Action:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {finalAction}
                </span>
              </div>
            </div>

            {/* Exact Policy Reason from Backend */}
            <div className="p-3.5 rounded-lg bg-[#090C12] border border-[#191D26] text-xs space-y-1">
              <span className="font-semibold text-[#8B929E] block font-mono">
                Policy Enforcement Rationale:
              </span>
              <p className="text-[#F5F7FA] leading-relaxed">
                {policyReason}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Actions & Evaluated EV Table */}
      {candidateActions && candidateActions.length > 0 && (
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#F5F7FA]">
              Evaluated Candidate Actions & Net Recovery Value (EV)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#23262D] text-[#8B929E] font-mono text-[11px]">
                  <th className="pb-2">Action</th>
                  <th className="pb-2 text-right">Recovery Probability</th>
                  <th className="pb-2 text-right">Expected Net Value</th>
                  <th className="pb-2 text-center">Customer Friction</th>
                  <th className="pb-2 text-right">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#191D26] font-mono">
                {candidateActions.map((cAct: any, i: number) => {
                  const actionName = cAct.action || cAct.action_type || "ACTION";
                  const isWinner = i === 0;
                  return (
                    <tr key={i} className={isWinner ? "bg-emerald-500/10 text-[#F5F7FA]" : "text-[#8B929E]"}>
                      <td className="py-2.5 font-semibold text-[#F5F7FA] flex items-center gap-1.5">
                        {isWinner && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                        {actionName}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        {Math.round(cAct.recovery_probability * 100)}%
                      </td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">
                        {formatCurrency(cAct.expected_recovery_value)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#161C2A] text-[#8B929E] border border-[#23262D]">
                          {cAct.customer_friction || "LOW"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(cAct.estimated_cost || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chronological Audit & Executed Actions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executed Recovery Actions */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              Executed Actions Log
            </h3>
            <span className="text-xs font-mono text-[#8B929E]">
              {caseItem.recovery_actions?.length || 0} recorded
            </span>
          </div>

          {caseItem.recovery_actions?.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
              No actions executed yet. Use the Operator Console above to dispatch actions.
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
                    <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {act.status}
                    </span>
                  </div>
                  {act.result_summary && (
                    <p className="text-xs text-[#C1C7D0]">{act.result_summary}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8B929E] pt-1">
                    <span>Ref: {act.external_reference || "N/A"}</span>
                    <span>{formatRelativeTime(act.executed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Stream */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#8B7CFF]" />
              Immutable Audit Events
            </h3>
            <span className="text-xs font-mono text-[#8B929E]">
              {caseItem.audit_logs?.length || 0} events
            </span>
          </div>

          {caseItem.audit_logs?.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8B929E] border border-dashed border-[#23262D] rounded-lg">
              No audit records available.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {caseItem.audit_logs?.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-[#121722] border border-[#23262D] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#8B7CFF]">
                      {log.event_type}
                    </span>
                    <span className="text-[10px] font-mono text-[#8B929E]">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-xs text-[#8B929E] flex items-center gap-2">
                    <span>Actor: {log.actor}</span>
                  </div>
                  {log.payload && (
                    <pre className="mt-1 p-2 rounded bg-black text-[10px] font-mono text-emerald-400 overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
