"use client";

import React from "react";
import { useMounted } from "@/hooks/use-mounted";
import { useMetrics } from "@/hooks/use-metrics";
import { useCases } from "@/hooks/use-cases";
import { ExecutiveHeader } from "@/components/dashboard/ExecutiveHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { AIVsPolicyShowcase } from "@/components/dashboard/AIVsPolicyShowcase";
import { RecoveryFunnel } from "@/components/dashboard/RecoveryFunnel";
import { RecoveryBreakdown } from "@/components/dashboard/RecoveryBreakdown";
import { LiveRecoveryFeed } from "@/components/dashboard/LiveRecoveryFeed";
import { CasesOverview } from "@/components/dashboard/CasesOverview";

export default function DashboardPage() {
  const mounted = useMounted();
  const { data: metrics, isLoading: isMetricsLoading } = useMetrics();
  const { data: cases, isLoading: isCasesLoading } = useCases();

  return (
    <div className="space-y-6">
      <ExecutiveHeader />

      <KPIGrid metrics={metrics} isLoading={!mounted || isMetricsLoading} />

      <AIVsPolicyShowcase />

      <RecoveryFunnel metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryBreakdown metrics={metrics} cases={cases} />
        <LiveRecoveryFeed cases={cases} />
      </div>

      <CasesOverview cases={cases} isLoading={!mounted || isCasesLoading} />
    </div>
  );
}

