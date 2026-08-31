import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "@/lib/api/metrics";

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 4000,
  });
}
