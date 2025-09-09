import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Pagamento, InsertPagamento } from '@shared/schema';

export function usePagamentos() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const locadoraId = profile?.locadoraId || profile?.id;
  
  // Hook funcionando normalmente"

  const query = useQuery({
    queryKey: ['/api/pagamentos', locadoraId],
    queryFn: async () => {
      if (!locadoraId) return [];
      
      const response = await fetch(`/api/pagamentos?locadoraId=${locadoraId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch pagamentos');
      
      const data = await response.json();
      
      
      return data as Pagamento[];
    },
    enabled: !!locadoraId,
    // Cache otimizado para performance
    staleTime: 30 * 1000, // 30 segundos de cache
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: async (pagamento: InsertPagamento) => {
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagamento),
      });
      
      if (!response.ok) throw new Error('Failed to create pagamento');
      const novoPagamento = await response.json();
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          pagamento.locadoraId,
          profile?.email || 'usuario@drivs.me',
          'criar',
          'pagamento',
          novoPagamento.id,
          `Pagamento criado: ${pagamento.tipo} - ${pagamento.motoristaId} (R$ ${pagamento.valorTotal})`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return novoPagamento;
    },
    onSuccess: (novoPagamento) => {
      // ATUALIZAÇÃO OTIMISTA: Adiciona o novo pagamento na lista imediatamente
      queryClient.setQueryData(['/api/pagamentos', locadoraId], (oldData: Pagamento[] | undefined) => {
        return oldData ? [novoPagamento, ...oldData] : [novoPagamento];
      });
      
      // INVALIDAÇÃO AGRESSIVA: Força refetch de todos os dados relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/relatorios'] });
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
      const pagamentoAtualizado = await response.json();
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'editar',
          'pagamento',
          id,
          `Pagamento editado: ${updates.tipo || 'pagamento'} - ${updates.motoristaId || 'motorista'}`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return pagamentoAtualizado;
    },
    onSuccess: (pagamentoAtualizado) => {
      // ATUALIZAÇÃO OTIMISTA: Atualiza o pagamento na lista imediatamente
      queryClient.setQueryData(['/api/pagamentos', locadoraId], (oldData: Pagamento[] | undefined) => {
        return oldData?.map(p => p.id === pagamentoAtualizado.id ? pagamentoAtualizado : p) || [];
      });
      
      // INVALIDAÇÃO AGRESSIVA: Força refetch de todos os dados relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/relatorios'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`[FRONTEND] Tentando excluir pagamento: ${id}`);
      
      // Buscar dados do pagamento antes de excluir para o log
      const pagamentoPrevio = query.data?.find(p => p.id === id);
      console.log(`[FRONTEND] Pagamento encontrado para exclusão:`, pagamentoPrevio);
      
      const response = await fetch(`/api/pagamentos/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log(`[FRONTEND] Response status: ${response.status}`);
      console.log(`[FRONTEND] Response ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[FRONTEND] Erro na exclusão:`, errorData);
        throw new Error(`Failed to delete pagamento: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log(`[FRONTEND] Resultado da exclusão:`, result);
      
      // Log da atividade
      try {
        const { registrarAtividade } = await import('@/utils/activityLogger');
        await registrarAtividade(
          locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'excluir',
          'pagamento',
          id,
          `Pagamento excluído: ${pagamentoPrevio?.tipo || 'pagamento'} - ${pagamentoPrevio?.motoristaId || 'motorista'} (R$ ${pagamentoPrevio?.valorTotal || '0'})`
        );
      } catch (error) {
        console.error('Erro ao registrar atividade:', error);
      }
      
      return { id, deleted: true };
    },
    onSuccess: (_, deletedId) => {
      console.log(`[FRONTEND] Exclusão bem-sucedida, invalidando cache para ID: ${deletedId}`);
      
      // ATUALIZAÇÃO OTIMISTA: Remove o pagamento da lista imediatamente
      queryClient.setQueryData(['/api/pagamentos', locadoraId], (oldData: Pagamento[] | undefined) => {
        const filtered = oldData?.filter(p => p.id !== deletedId) || [];
        console.log(`[FRONTEND] Cache atualizado otimisticamente, ${oldData?.length || 0} -> ${filtered.length} pagamentos`);
        return filtered;
      });
      
      // INVALIDAÇÃO AGRESSIVA: Força refetch de todos os dados relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/relatorios'] });
      
      // FORÇAR REFETCH IMEDIATO para garantir sincronização
      queryClient.refetchQueries({ 
        queryKey: ['/api/pagamentos', locadoraId],
        type: 'active' 
      });
      
      // ADICIONAR DELAY PARA GARANTIR PROPAGAÇÃO NO DEPLOY
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/pagamentos'] });
        queryClient.refetchQueries({ queryKey: ['/api/pagamentos', locadoraId] });
        console.log(`[FRONTEND] Refetch adicional após delay para sincronização de deploy`);
      }, 500);
      
      console.log(`[FRONTEND] Todas as queries invalidadas e refetch forçado`);
    },
    onError: (error, deletedId) => {
      console.error(`[FRONTEND] Erro na exclusão do pagamento ${deletedId}:`, error);
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