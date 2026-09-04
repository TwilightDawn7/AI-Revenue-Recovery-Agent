import { MerchantPolicy, TestPolicyRequest, TestPolicyResponse } from "@/types";
import { apiClient } from "./client";

export async function fetchMerchantPolicy(): Promise<MerchantPolicy> {
  return apiClient<MerchantPolicy>("/api/policies");
}

export async function updateMerchantPolicy(
  policy: Partial<MerchantPolicy>
): Promise<MerchantPolicy> {
  return apiClient<MerchantPolicy>("/api/policies", {
    method: "PUT",
    body: JSON.stringify(policy),
  });
}

export async function testMerchantPolicy(
  req: TestPolicyRequest
): Promise<TestPolicyResponse> {
  return apiClient<TestPolicyResponse>("/api/policies/test", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
