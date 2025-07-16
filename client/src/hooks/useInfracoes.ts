import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Infracao, InsertInfracao } from '@shared/schema';

export function useInfracoes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['infracoes', profile?.locadoraId],
    queryFn: async () => {
      const response = await fetch(`/api/infracoes?locadoraId=${profile?.locadoraId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch infracoes');
      }
      return response.json() as Promise<Infracao[]>;
    },
    enabled: !!profile?.locadoraId,
  });



  const createMutation = useMutation({
    mutationFn: async (data: InsertInfracao) => {
      const response = await fetch('/api/infracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create infracao');
      return response.json();
    },
    onSuccess: () => {
      console.log('Infração criada com sucesso, invalidando cache...');
      queryClient.invalidateQueries({ queryKey: ['infracoes', profile?.locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertInfracao> }) => {
      const response = await fetch(`/api/infracoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update infracao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infracoes', profile?.locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/infracoes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete infracao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infracoes', profile?.locadoraId] });
    },
  });

  return {
    infracoes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createInfracao: createMutation.mutateAsync,
    updateInfracao: updateMutation.mutateAsync,
    deleteInfracao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

  };
}

// Hook específico para buscar infrações por motorista
export function useInfracoesByMotorista(motoristaId: string) {
  return useQuery({
    queryKey: ['infracoes', 'motorista', motoristaId],
    queryFn: async () => {
      const response = await fetch(`/api/infracoes?motoristaId=${motoristaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch infracoes by motorista');
      }
      return response.json() as Promise<Infracao[]>;
    },
    enabled: !!motoristaId,
  });
}