import { apiClient } from "./client";
import { WebhookSimulationResponse, HealthStatus } from "@/types";

export async function triggerSimulatedWebhook(payload: Record<string, any>): Promise<WebhookSimulationResponse> {
  return apiClient<WebhookSimulationResponse>("/api/test/trigger-webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchHealth(): Promise<HealthStatus> {
  return apiClient<HealthStatus>("/health");
}
