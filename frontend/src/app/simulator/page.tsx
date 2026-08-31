"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { triggerSimulatedWebhook } from "@/lib/api/simulator";
import { simulatePaymentResolution } from "@/lib/api/cases";
import { useQueryClient } from "@tanstack/react-query";
import {
  Terminal,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Ban,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Code2,
  DollarSign,
} from "lucide-react";

export default function SimulatorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);

  // Helper to generate fresh dynamic payload
  const createPayload = (scen: any) => {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 7);
    return {
      event: scen.event || "payment.failed",
      id: `evt_${scen.id}_${timestamp}_${nonce}`,
      payload: {
        payment: {
          entity: {
            id: `pay_${scen.id}_${timestamp}_${nonce}`,
            amount: scen.rawAmount,
            currency: "INR",
            status: scen.event === "payment.captured" ? "captured" : "failed",
            error_code: scen.problem,
            subscription_id: scen.subscriptionId || `sub_${scen.id}_${timestamp}`,
            customer_details: {
              name: scen.customerName,
              email: scen.customerEmail,
            },
          },
        },
      },
    };
  };

  // Custom JSON editor state
  const [customJson, setCustomJson] = useState(
    JSON.stringify(
      {
        event: "payment.failed",
        id: `evt_sim_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: `pay_sim_${Math.random().toString(36).substring(2, 10)}`,
              amount: 199900,
              currency: "INR",
              status: "failed",
              error_code: "BANK_DECLINE",
              customer_id: "cust_rahul_kumar",
              customer_details: {
                name: "Rahul Kumar",
                email: "rahul.kumar@example.com",
              },
            },
          },
        },
      },
      null,
      2
    )
  );

  const triggerScenario = async (scenarioKey: string, payload: any) => {
    setIsTriggering(scenarioKey);
    try {
      const res = await triggerSimulatedWebhook(payload);
      setLastResponse(res);
      await queryClient.invalidateQueries();
      return res;
    } catch (err: any) {
      setLastResponse({ error: err.message || "Simulation request failed" });
      return null;
    } finally {
      setIsTriggering(null);
    }
  };

  const handleResolveCaseFromSim = async (caseId: number) => {
    try {
      const res = await simulatePaymentResolution(caseId);
      setLastResponse({
        status: "resolved",
        case_id: caseId,
        message: `Case #${caseId} resolved and revenue successfully recovered!`,
        data: res,
      });
      await queryClient.invalidateQueries();
    } catch (err: any) {
      setLastResponse({ error: err.message || "Failed to resolve case" });
    }
  };

  const handleRunFullDemo = async () => {
    setIsRunningDemo(true);
    setDemoLogs([]);
    setDemoStep(1);

    const demoScenarios = [
      {
        name: "Scenario A: Temporary Bank Decline (Rahul Kumar - ₹1,999)",
        payload: createPayload({
          id: "demo_a",
          event: "payment.failed",
          rawAmount: 199900,
          problem: "BANK_DECLINE",
          customerName: "Priya Sharma",
          customerEmail: "priya.sharma@example.com",
        }),
      },
      {
        name: "Scenario B: Expired Card (Neha Sen - ₹3,499)",
        payload: createPayload({
          id: "demo_b",
          event: "payment.failed",
          rawAmount: 349900,
          problem: "EXPIRED_CARD",
          customerName: "Amit Patel",
          customerEmail: "amit.patel@example.com",
        }),
      },
      {
        name: "Scenario C: Cancelled Subscription (Karan Johar - ₹4,999)",
        payload: createPayload({
          id: "demo_c",
          event: "payment.failed",
          rawAmount: 499900,
          problem: "SUBSCRIPTION_CANCELLED",
          customerName: "Rohan Gupta",
          customerEmail: "rohan.gupta@example.com",
        }),
      },
      {
        name: "Scenario D: High-Value Transaction > ₹25,000 (Apex Enterprise - ₹45,000)",
        payload: createPayload({
          id: "demo_d",
          event: "payment.failed",
          rawAmount: 4500000,
          problem: "BANK_DECLINE",
          customerName: "Vikram Malhotra Enterprises",
          customerEmail: "finance@vikrammalhotra.com",
        }),
      },
    ];

    for (let i = 0; i < demoScenarios.length; i++) {
      const s = demoScenarios[i];
      setDemoStep(i + 1);
      setDemoLogs((prev) => [...prev, `[Running] ${s.name}...`]);

      const res = await triggerScenario(`demo_${i}`, s.payload);
      if (res && res.case_id) {
        setDemoLogs((prev) => [
          ...prev,
          `✓ Case #${res.case_id} registered → AI & Policy evaluation started`,
        ]);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }

    setDemoLogs((prev) => [
      ...prev,
      "✓ All 4 demo scenarios successfully executed! Database & KPIs updated.",
    ]);
    setIsRunningDemo(false);
  };

  const presetScenarios = [
    {
      id: "bank_decline",
      title: "Scenario A: Temporary Bank Decline",
      amount: "₹1,999",
      rawAmount: 199900,
      problem: "BANK_DECLINE",
      customer: "Rahul Kumar (Active Sub)",
      customerName: "Rahul Kumar",
      customerEmail: "rahul.kumar@example.com",
      color: "border-[#8B7CFF]/40 bg-[#8B7CFF]/5 hover:border-[#8B7CFF]",
      icon: RotateCcw,
      iconColor: "text-[#8B7CFF]",
      expectedAI: "RETRY_PAYMENT (30m delay)",
      expectedPolicy: "APPROVED",
      expectedOutcome: "Auto-Recovered via Inngest step",
    },
    {
      id: "expired_card",
      title: "Scenario B: Expired Card Credentials",
      amount: "₹3,499",
      rawAmount: 349900,
      problem: "EXPIRED_CARD",
      customer: "Neha Sen (Pro Member)",
      customerName: "Neha Sen",
      customerEmail: "neha.sen@example.com",
      color: "border-sky-500/40 bg-sky-500/5 hover:border-sky-500",
      icon: CreditCard,
      iconColor: "text-sky-400",
      expectedAI: "REQUEST_PAYMENT_UPDATE",
      expectedPolicy: "APPROVED",
      expectedOutcome: "Razorpay Update Link Generated",
    },
    {
      id: "cancelled_sub",
      title: "Scenario C: Cancelled Subscription",
      amount: "₹4,999",
      rawAmount: 499900,
      problem: "SUBSCRIPTION_CANCELLED",
      customer: "Karan Johar (Cancelled)",
      customerName: "Karan Johar",
      customerEmail: "karan.johar@example.com",
      color: "border-zinc-700 bg-zinc-800/10 hover:border-zinc-500",
      icon: Ban,
      iconColor: "text-zinc-400",
      expectedAI: "STOP",
      expectedPolicy: "BLOCKED (Strict Guardrail)",
      expectedOutcome: "Safely Stopped — 0 Spam Retries",
    },
    {
      id: "high_value",
      title: "Scenario D: High-Value Enterprise Payment",
      amount: "₹45,000",
      rawAmount: 4500000,
      problem: "BANK_DECLINE",
      customer: "Apex Global Enterprise",
      customerName: "Apex Global Enterprise",
      customerEmail: "billing@apexglobal.com",
      color: "border-orange-500/40 bg-orange-500/5 hover:border-orange-500",
      icon: UserCheck,
      iconColor: "text-orange-400",
      expectedAI: "RETRY_PAYMENT",
      expectedPolicy: "OVERRIDDEN → ESCALATE_HUMAN",
      expectedOutcome: "Human Operations Alerted (> ₹25k limit)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Live Recovery Simulator
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
              Interactive Test Console
            </span>
          </div>
          <p className="text-xs text-[#8B929E]">
            Trigger simulated Razorpay webhook events to watch the Gemini AI decision layer, Policy Guardrails, and Inngest state machine in real-time.
          </p>
        </div>

        {/* 1-Click Full Demo Button */}
        <button
          onClick={handleRunFullDemo}
          disabled={isRunningDemo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#8B7CFF] to-[#6366F1] hover:from-[#7966FF] hover:to-[#5558E6] shadow-md shadow-[#8B7CFF]/25 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 fill-current ${isRunningDemo ? "animate-spin" : ""}`} />
          <span>{isRunningDemo ? "Executing Demo Run..." : "▶ Run 4-Scenario Full Demo"}</span>
        </button>
      </div>

      {/* Demo Progress Box */}
      {isRunningDemo && (
        <div className="p-4 rounded-xl bg-[#0D1017] border border-[#8B7CFF]/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#8B7CFF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse" />
              Automated Demo Execution in Progress (Step {demoStep}/4)
            </span>
            <span className="font-mono text-[#8B929E]">{demoStep * 25}% complete</span>
          </div>
          <div className="h-1.5 w-full bg-[#161C2A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B7CFF] transition-all duration-300"
              style={{ width: `${demoStep * 25}%` }}
            />
          </div>
          <div className="font-mono text-[11px] text-[#8B929E] space-y-1 bg-[#090C12] p-2.5 rounded-lg border border-[#191D26] max-h-28 overflow-y-auto">
            {demoLogs.map((log, i) => (
              <div key={i} className="text-[#38BDF8]">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#23262D] pb-2">
        <button
          onClick={() => setActiveTab("presets")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "presets"
              ? "bg-[#161C2A] text-[#F5F7FA] border border-[#23262D]"
              : "text-[#8B929E] hover:text-[#F5F7FA]"
          }`}
        >
          Curated Demo Scenarios
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "custom"
              ? "bg-[#161C2A] text-[#F5F7FA] border border-[#23262D]"
              : "text-[#8B929E] hover:text-[#F5F7FA]"
          }`}
        >
          Custom Webhook JSON Console
        </button>
      </div>

      {activeTab === "presets" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presetScenarios.map((scen) => {
            const Icon = scen.icon;
            const isCurrentTriggering = isTriggering === scen.id;

            return (
              <div
                key={scen.id}
                className={`p-5 rounded-xl border ${scen.color} transition-all space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg bg-[#121722] ${scen.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-[#F5F7FA]">
                        {scen.title}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#F5F7FA]">
                      {scen.amount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#090C12] border border-[#191D26] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#8B929E]">
                      <span>Customer:</span>
                      <span className="text-[#F5F7FA] font-medium">{scen.customer}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#8B929E]">
                      <span>Expected AI Plan:</span>
                      <span className="font-mono font-medium text-[#8B7CFF]">
                        {scen.expectedAI}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#8B929E]">
                      <span>Policy Check:</span>
                      <span className="font-mono font-medium text-emerald-400">
                        {scen.expectedPolicy}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#8B929E] truncate">
                    {scen.expectedOutcome}
                  </span>
                  <button
                    onClick={() => triggerScenario(scen.id, createPayload(scen))}
                    disabled={isCurrentTriggering || isRunningDemo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#161C2A] hover:bg-[#8B7CFF] border border-[#23262D] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Play className={`w-3 h-3 ${isCurrentTriggering ? "animate-spin" : ""}`} />
                    <span>{isCurrentTriggering ? "Firing..." : "Dispatch Event"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Custom JSON Console */
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#38BDF8]" />
              Razorpay Webhook Payload Dispatcher
            </h3>
            <span className="text-xs font-mono text-[#8B929E]">
              Target: POST /api/test/trigger-webhook
            </span>
          </div>

          <textarea
            rows={12}
            value={customJson}
            onChange={(e) => setCustomJson(e.target.value)}
            className="w-full p-3.5 bg-black border border-[#23262D] rounded-lg font-mono text-xs text-[#38BDF8] focus:border-[#8B7CFF] focus:outline-hidden"
          />

          <div className="flex justify-end">
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(customJson);
                  // Ensure unique ID if not customized
                  if (parsed.id?.startsWith("evt_sim")) {
                    parsed.id = `evt_sim_${Date.now()}`;
                  }
                  triggerScenario("custom", parsed);
                } catch (e: any) {
                  setLastResponse({ error: "Invalid JSON format: " + e.message });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#8B7CFF] hover:bg-[#7966FF] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Send Webhook Event</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Response Display & Action Banner */}
      {lastResponse && (
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase font-semibold text-[#8B929E] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              FastAPI Event Processor Response
            </h3>
            {lastResponse.case_id && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleResolveCaseFromSim(lastResponse.case_id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono font-medium text-emerald-300 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Simulate Payment Recovery</span>
                </button>
                <Link
                  href={`/cases/${lastResponse.case_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#8B7CFF]/15 hover:bg-[#8B7CFF]/25 border border-[#8B7CFF]/30 text-xs font-mono font-medium text-[#8B7CFF] transition-colors"
                >
                  <span>Open Case #{lastResponse.case_id}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
          <pre className="p-3 bg-black rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
