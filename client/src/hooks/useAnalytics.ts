import { useQuery } from '@tanstack/react-query';

interface SystemAnalytics {
  visitantesEsseMes: number;
  paginasVisualizadas: number;
  tempoMedio: number;
  taxaRetorno: number;
}

export function useAnalytics() {
  return useQuery<SystemAnalytics>({
    queryKey: ['/api/analytics'],
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache  
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
}