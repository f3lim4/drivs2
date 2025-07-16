import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Manutencao, InsertManutencao } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

export function useManutencoes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['/api/manutencoes', profile?.locadoraId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profile?.locadoraId) {
        params.append('locadoraId', profile.locadoraId);
      }
      
      const response = await fetch(`/api/manutencoes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch manutencoes');
      }
      return response.json() as Promise<Manutencao[]>;
    },
    enabled: !!profile?.locadoraId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertManutencao) => {
      const response = await fetch('/api/manutencoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create manutencao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manutencoes', profile?.locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertManutencao>) => {
      const response = await fetch(`/api/manutencoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update manutencao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manutencoes', profile?.locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manutencoes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete manutencao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manutencoes', profile?.locadoraId] });
    },
  });

  return {
    manutencoes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createManutencao: createMutation.mutate,
    updateManutencao: updateMutation.mutate,
    deleteManutencao: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useManutencoesByVeiculo(veiculoId: string) {
  const query = useQuery({
    queryKey: ['/api/manutencoes', 'veiculo', veiculoId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('veiculoId', veiculoId);
      
      const response = await fetch(`/api/manutencoes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch manutencoes');
      }
      return response.json() as Promise<Manutencao[]>;
    },
    enabled: !!veiculoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    manutencoes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}