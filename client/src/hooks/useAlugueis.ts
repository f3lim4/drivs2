import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Aluguel, InsertAluguel } from '@shared/schema';

export function useAlugueis() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const locadoraId = profile?.locadoraId;

  const query = useQuery({
    queryKey: ['/api/alugueis', locadoraId],
    queryFn: async () => {
      if (!locadoraId) return [];
      
      const response = await fetch(`/api/alugueis?locadoraId=${locadoraId}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch alugueis');
      
      const data = await response.json();
      console.log('[DEBUG ALUGUEIS] Dados recebidos da API:', data);
      
      return data as Aluguel[];
    },
    enabled: !!locadoraId,
    staleTime: 0, // SEM cache
    gcTime: 0, // SEM cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Recarregar a cada 5 segundos
  });

  const createMutation = useMutation({
    mutationFn: async (aluguel: InsertAluguel) => {
      const response = await fetch('/api/alugueis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aluguel),
      });
      
      if (!response.ok) throw new Error('Failed to create aluguel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['/api/veiculos', locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertAluguel> }) => {
      const response = await fetch(`/api/alugueis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update aluguel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['/api/veiculos', locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Tentando excluir aluguel:', { id, locadoraId });
      
      const response = await fetch(`/api/alugueis/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao excluir aluguel:', errorData);
        throw new Error('Failed to delete aluguel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['/api/veiculos', locadoraId] });
    },
  });

  return {
    alugueis: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAluguel: createMutation.mutate,
    updateAluguel: updateMutation.mutate,
    deleteAluguel: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}