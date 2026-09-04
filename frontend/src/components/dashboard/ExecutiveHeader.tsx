"use client";

import React from "react";
import Link from "next/link";
import { Terminal, Zap, Sparkles } from "lucide-react";

export function ExecutiveHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#23262D]">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Revenue Recovery Overview
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-mono">
            <Sparkles className="w-3 h-3" />
            AI + Policy Governed
          </span>
        </div>
        <p className="text-xs text-[#8B929E] max-w-2xl">
          Real-time autonomous payment recovery engine. Predictive AI reasoning with deterministic merchant guardrails and durable Inngest workflows.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/simulator"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F5F7FA] bg-[#121722] hover:bg-[#161C2A] border border-[#23262D] rounded-lg transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Webhook Simulator</span>
        </Link>
        <Link
          href="/simulator?run=demo"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#8B7CFF] hover:bg-[#7966FF] rounded-lg shadow-sm shadow-[#8B7CFF]/30 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Launch Demo</span>
        </Link>
      </div>
    </div>
  );
}
