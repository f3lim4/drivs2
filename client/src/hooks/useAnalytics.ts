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
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}