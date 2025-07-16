import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Despesa, InsertDespesa } from '@shared/schema';

export function useDespesas() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const locadoraId = profile?.locadoraId;

  const query = useQuery({
    queryKey: ['/api/despesas', locadoraId],
    queryFn: async () => {
      if (!locadoraId) return [];
      
      const response = await fetch(`/api/despesas?locadoraId=${locadoraId}`);
      if (!response.ok) throw new Error('Failed to fetch despesas');
      
      const data = await response.json();
      
      console.log('Despesas - Verificando isolamento:', {
        locadoraId,
        despesasTotal: data.length,
        primeiraDespesa: data[0]?.locadoraId
      });
      
      return data as Despesa[];
    },
    enabled: !!locadoraId,
  });

  const createMutation = useMutation({
    mutationFn: async (despesa: InsertDespesa) => {
      const response = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa),
      });
      
      if (!response.ok) throw new Error('Failed to create despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDespesa> }) => {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  return {
    despesas: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createDespesa: createMutation.mutateAsync,
    updateDespesa: updateMutation.mutateAsync,
    deleteDespesa: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook específico para buscar despesas por veículo
export function useDespesasByVeiculo(veiculoId: string) {
  return useQuery({
    queryKey: ['despesas', 'veiculo', veiculoId],
    queryFn: async () => {
      const response = await fetch(`/api/despesas?veiculoId=${veiculoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch despesas by veiculo');
      }
      return response.json() as Promise<Despesa[]>;
    },
    enabled: !!veiculoId,
  });
}