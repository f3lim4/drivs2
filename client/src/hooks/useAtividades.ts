import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Atividade, InsertAtividade } from '@shared/schema';

export function useAtividades() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['atividades', profile?.locadoraId],
    queryFn: async () => {
      if (!profile?.locadoraId) {
        throw new Error('Locadora ID is required');
      }
      
      console.log('useAtividades - Fazendo requisição para:', `/api/atividades?locadoraId=${profile.locadoraId}`);
      
      const response = await fetch(`/api/atividades?locadoraId=${profile.locadoraId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch atividades');
      }
      
      const data = await response.json() as Atividade[];
      console.log('useAtividades - Dados recebidos:', data);
      
      return data;
    },
    enabled: !!profile?.locadoraId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (data: InsertAtividade) => {
      const response = await fetch('/api/atividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create atividade');
      }
      
      return response.json() as Promise<Atividade>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades', profile?.locadoraId] });
    },
  });
}

// Hook para registrar atividades automaticamente
export function useRegistrarAtividade() {
  const { profile } = useAuth();
  const createAtividade = useCreateAtividade();
  
  return (
    acao: string,
    entidade: string,
    entidadeId?: string,
    detalhes?: string
  ) => {
    if (!profile?.locadoraId) {
      console.warn('Tentativa de registrar atividade sem locadoraId');
      return;
    }
    
    createAtividade.mutate({
      locadoraId: profile.locadoraId,
      usuario: profile.email || 'Usuário',
      acao,
      entidade,
      entidadeId,
      detalhes,
    });
  };
}