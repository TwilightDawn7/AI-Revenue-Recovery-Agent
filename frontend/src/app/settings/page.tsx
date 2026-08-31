"use client";

import React from "react";
import { useHealth } from "@/hooks/use-health";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  Key,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { data: health, isLoading } = useHealth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#23262D]">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
          System Integrations & Guardrail Settings
        </h1>
        <p className="text-xs text-[#8B929E] mt-0.5">
          Real-time environment architecture and connected recovery microservices.
        </p>
      </div>

      {/* Connected Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. FastAPI Core */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <Cpu className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#F5F7FA]">
                  FastAPI Engine
                </h2>
                <span className="text-[11px] font-mono text-[#8B929E]">
                  REST API & Webhooks
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online (Port 8000)
            </span>
          </div>
          <div className="p-3 bg-[#121722] rounded-lg text-xs font-mono text-[#8B929E] space-y-1">
            <div>URL: http://localhost:8000</div>
            <div>Health check: /health</div>
            <div>Docs: http://localhost:8000/docs</div>
          </div>
        </div>

        {/* 2. Gemini AI Reasoning */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25">
                <Key className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#F5F7FA]">
                  Google Gemini LLM
                </h2>
                <span className="text-[11px] font-mono text-[#8B929E]">
                  Contextual Diagnosis
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-[#8B7CFF] bg-[#8B7CFF]/10 px-2 py-0.5 rounded border border-[#8B7CFF]/20">
              gemini-1.5-flash
            </span>
          </div>
          <div className="p-3 bg-[#121722] rounded-lg text-xs font-mono text-[#8B929E] space-y-1">
            <div>Mode: Structured JSON Pydantic Schema</div>
            <div>Fallback: Deterministic Rule Engine</div>
          </div>
        </div>

        {/* 3. Inngest Durable Workflows */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/25">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#F5F7FA]">
                  Inngest Durable Orchestrator
                </h2>
                <span className="text-[11px] font-mono text-[#8B929E]">
                  Stateful Retries & Sleeps
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              Dev Server Active
            </span>
          </div>
          <div className="p-3 bg-[#121722] rounded-lg text-xs font-mono text-[#8B929E] space-y-1">
            <div>Workflow ID: payment-recovery-workflow</div>
            <div>Dev UI: http://localhost:8288</div>
          </div>
        </div>

        {/* 4. PostgreSQL Database */}
        <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Database className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#F5F7FA]">
                  PostgreSQL Persistence
                </h2>
                <span className="text-[11px] font-mono text-[#8B929E]">
                  SQLAlchemy ORM
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              localhost:5433
            </span>
          </div>
          <div className="p-3 bg-[#121722] rounded-lg text-xs font-mono text-[#8B929E] space-y-1">
            <div>Database: revenue_recovery</div>
            <div>Tables: RecoveryCase, AIDecision, AuditLog, etc.</div>
          </div>
        </div>
      </div>

      {/* Safety Policy Parameters Card */}
      <div className="p-5 rounded-xl bg-[#0D1017] border border-[#23262D] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-[#F5F7FA]">
            Merchant Safety Guardrail Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#121722] rounded-lg border border-[#23262D]">
            <span className="text-[#8B929E] block mb-1">Max Retry Limit</span>
            <span className="font-mono font-bold text-[#F5F7FA] text-base">
              2 Attempts
            </span>
          </div>

          <div className="p-3 bg-[#121722] rounded-lg border border-[#23262D]">
            <span className="text-[#8B929E] block mb-1">Autonomous Threshold</span>
            <span className="font-mono font-bold text-[#F5F7FA] text-base">
              ₹25,000 max
            </span>
          </div>

          <div className="p-3 bg-[#121722] rounded-lg border border-[#23262D]">
            <span className="text-[#8B929E] block mb-1">Min Retry Interval</span>
            <span className="font-mono font-bold text-[#F5F7FA] text-base">
              30 Minutes
            </span>
          </div>

          <div className="p-3 bg-[#121722] rounded-lg border border-[#23262D]">
            <span className="text-[#8B929E] block mb-1">Cancelled Policy</span>
            <span className="font-mono font-bold text-red-400 text-base">
              Strict Block (0 Retries)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
