import { apiClient } from "./client";
import { DashboardMetrics } from "@/types";

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return apiClient<DashboardMetrics>("/api/metrics");
}
