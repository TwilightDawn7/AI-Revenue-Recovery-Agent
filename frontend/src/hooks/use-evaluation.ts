import { useQuery } from "@tanstack/react-query";
import { fetchEvaluationResults, fetchEvaluationData } from "@/lib/api/evaluation";
import { EvaluationPayload, EvaluationSummary } from "@/types";

export function useEvaluationResults() {
  return useQuery<EvaluationPayload>({
    queryKey: ["evaluation", "results"],
    queryFn: fetchEvaluationResults,
    staleTime: 60 * 1000,
  });
}

export function useEvaluationSummary() {
  return useQuery<EvaluationSummary>({
    queryKey: ["evaluation", "summary"],
    queryFn: fetchEvaluationData,
    staleTime: 60 * 1000,
  });
}
