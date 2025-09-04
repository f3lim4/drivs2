import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Manutencao, InsertManutencao } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

export function useManutencoes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['manutencoes', profile?.locadoraId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profile?.locadoraId) {
        params.append('locadoraId', profile.locadoraId);
      }
      
      const response = await fetch(`/api/manutencoes?${params}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch manutencoes');
      }
      const data = await response.json() as Manutencao[];
      return data;
    },
    enabled: !!profile?.locadoraId,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertManutencao) => {
      console.log('Enviando dados para API:', data);
      
      const response = await fetch('/api/manutencoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', errorText);
        throw new Error(`Erro ao criar manutenção: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Resposta da API:', result);
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          data.locadoraId,
          profile?.email || 'usuario@drivs.me',
          'criar',
          'manutencao',
          result.id,
          `Manutenção criada: ${data.tipo} - ${data.descricao}`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return result;
    },
    onSuccess: () => {
      console.log('Manutenção criada com sucesso, invalidando cache...');
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.refetchQueries({ queryKey: ['manutencoes'] });
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
      const result = await response.json();
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          data.locadoraId || profile?.locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'editar',
          'manutencao',
          id,
          `Manutenção editada: ${data.tipo || 'manutenção'} - ${data.descricao || 'sem descrição'}`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manutencoes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete manutencao');
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          profile?.locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'excluir',
          'manutencao',
          id,
          `Manutenção excluída`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar TODOS os caches relacionados
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['despesas'] }); // Despesas incluem manutenções
      queryClient.invalidateQueries({ queryKey: ['veiculos'] }); // Dados dos veículos podem incluir manutenções
      
      // Force refetch para garantir dados atualizados
      queryClient.refetchQueries({ queryKey: ['manutencoes'] });
      queryClient.refetchQueries({ queryKey: ['despesas'] });
      
      console.log('Manutenção excluída, cache invalidado e dados atualizados');
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
    queryKey: ['manutencoes', 'veiculo', veiculoId],
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