import { apiClient } from "./client";
import { RecoveryCase } from "@/types";

export async function fetchRecoveryCases(status?: string): Promise<RecoveryCase[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient<RecoveryCase[]>(`/api/recovery-cases${query}`);
}

export async function fetchRecoveryCaseDetail(id: number | string): Promise<RecoveryCase> {
  return apiClient<RecoveryCase>(`/api/recovery-cases/${id}`);
}

export async function triggerCaseAnalysis(id: number | string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/api/recovery-cases/${id}/analyze`, {
    method: "POST",
  });
}

export async function triggerManualRetry(id: number | string): Promise<{ status: string; message: string; case: RecoveryCase }> {
  return apiClient<{ status: string; message: string; case: RecoveryCase }>(`/api/recovery-cases/${id}/actions/retry`, {
    method: "POST",
  });
}

export async function generatePaymentLink(id: number | string): Promise<{ status: string; link: any; case: RecoveryCase }> {
  return apiClient<{ status: string; link: any; case: RecoveryCase }>(`/api/recovery-cases/${id}/actions/payment-link`, {
    method: "POST",
  });
}

export async function escalateCase(id: number | string): Promise<{ status: string; message: string; case: RecoveryCase }> {
  return apiClient<{ status: string; message: string; case: RecoveryCase }>(`/api/recovery-cases/${id}/actions/escalate`, {
    method: "POST",
  });
}

export async function stopCase(id: number | string): Promise<{ status: string; message: string; case: RecoveryCase }> {
  return apiClient<{ status: string; message: string; case: RecoveryCase }>(`/api/recovery-cases/${id}/actions/stop`, {
    method: "POST",
  });
}

export async function simulatePaymentResolution(id: number | string): Promise<{ status: string; message: string; case: RecoveryCase }> {
  return apiClient<{ status: string; message: string; case: RecoveryCase }>(`/api/recovery-cases/${id}/actions/simulate-payment`, {
    method: "POST",
  });
}

