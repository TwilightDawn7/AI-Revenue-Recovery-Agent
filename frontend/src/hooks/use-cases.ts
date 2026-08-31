import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecoveryCases,
  fetchRecoveryCaseDetail,
  triggerCaseAnalysis,
  triggerManualRetry,
  generatePaymentLink,
  escalateCase,
  stopCase,
  simulatePaymentResolution,
} from "@/lib/api/cases";

export function useCases(status?: string) {
  return useQuery({
    queryKey: ["cases", status || "ALL"],
    queryFn: () => fetchRecoveryCases(status),
    refetchInterval: 4000,
  });
}

export function useCaseDetail(id: number | string) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchRecoveryCaseDetail(id),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => triggerCaseAnalysis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useManualRetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => triggerManualRetry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useGeneratePaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => generatePaymentLink(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useEscalateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => escalateCase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useStopCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => stopCase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useSimulatePaymentResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => simulatePaymentResolution(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

