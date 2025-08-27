import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Local, type InsertLocal } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

export function useLocais() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['/api/locais', profile?.locadoraId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profile?.locadoraId) {
        params.append('locadoraId', profile.locadoraId);
      }
      
      const response = await fetch(`/api/locais?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch locais');
      }
      return response.json() as Promise<Local[]>;
    },
    enabled: !!profile?.locadoraId,
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLocal) => {
      const response = await fetch('/api/locais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create local');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locais'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertLocal>) => {
      const response = await fetch(`/api/locais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update local');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locais'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/locais/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete local');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locais'] });
    },
  });

  return {
    locais: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createLocal: createMutation.mutateAsync,
    updateLocal: updateMutation.mutateAsync,
    deleteLocal: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}