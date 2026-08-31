import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/lib/api/simulator";
import { fetchEvaluationData } from "@/lib/api/evaluation";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useEvaluation() {
  return useQuery({
    queryKey: ["evaluation"],
    queryFn: fetchEvaluationData,
    staleTime: 60000,
  });
}
