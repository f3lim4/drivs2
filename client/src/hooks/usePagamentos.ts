import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Pagamento, InsertPagamento } from '@shared/schema';

export function usePagamentos() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const locadoraId = profile?.locadoraId;

  const query = useQuery({
    queryKey: ['/api/pagamentos', locadoraId],
    queryFn: async () => {
      if (!locadoraId) return [];
      
      const response = await fetch(`/api/pagamentos?locadoraId=${locadoraId}`);
      if (!response.ok) throw new Error('Failed to fetch pagamentos');
      
      const data = await response.json();
      
      console.log('Pagamentos - Verificando isolamento:', {
        locadoraId,
        pagamentosTotal: data.length,
        primeiroPagamento: data[0]?.locadoraId
      });
      
      return data as Pagamento[];
    },
    enabled: !!locadoraId,
  });

  const createMutation = useMutation({
    mutationFn: async (pagamento: InsertPagamento) => {
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagamento),
      });
      
      if (!response.ok) throw new Error('Failed to create pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos', locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertPagamento> }) => {
      const response = await fetch(`/api/pagamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos', locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pagamentos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos', locadoraId] });
    },
  });

  return {
    pagamentos: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createPagamento: createMutation.mutate,
    updatePagamento: updateMutation.mutate,
    deletePagamento: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useAluguelValorSemanal(aluguelId: string | null) {
  return useQuery({
    queryKey: ['/api/aluguel', aluguelId, 'valor-semanal'],
    queryFn: async () => {
      if (!aluguelId) return null;
      
      const response = await fetch(`/api/aluguel/${aluguelId}/valor-semanal`);
      if (!response.ok) throw new Error('Failed to fetch valor semanal');
      
      const data = await response.json();
      return data.valorSemanal as number;
    },
    enabled: !!aluguelId,
  });
}