/**
 * Hook para gerenciar contratos com persistência no banco de dados
 * Substitui o armazenamento em memória por operações reais no banco
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contrato, InsertContrato } from '@shared/schema';
import { useAuth } from './useAuth';

export function useContratos() {
  const { profile } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar APENAS contratos formais (não misturar com aluguéis)
  const { 
    data: contratos = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['contratos', locadoraId],
    queryFn: async () => {
      // Buscar APENAS contratos formais da tabela contratos
      const contratosResponse = await fetch(`/api/contratos?locadoraId=${locadoraId}`);
      if (!contratosResponse.ok) throw new Error('Failed to fetch contratos');
      const contratosFormais = await contratosResponse.json();

      console.log('[CONTRATOS DEBUG]', {
        contratosFormais: contratosFormais.length,
        contratos: contratosFormais
      });
      
      return contratosFormais;
    },
    enabled: !!locadoraId,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
    refetchOnMount: true, // Sempre recarregar ao montar
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
  });

  // Criar contrato
  const createContrato = useMutation({
    mutationFn: async (contrato: InsertContrato) => {
      const contratoData = {
        ...contrato,
        locadoraId,
      };
      
      console.log('Enviando dados do contrato:', contratoData);
      
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        
        // Tentar fazer parse do JSON de erro para mensagem mais amigável
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message && errorJson.message.includes('contrato/aluguel ativo')) {
            throw new Error(`Este motorista já possui um contrato/aluguel ativo. Finalize o contrato atual antes de criar um novo.`);
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, usa mensagem original
        }
        
        throw new Error(`Failed to create contrato: ${response.status} - ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Limpar cache para evitar duplicações (exceto motoristas para preservar imagens)
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
      // Removido: queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
      queryClient.removeQueries({ queryKey: ['contratos', locadoraId] });
    },
  });

  // Atualizar contrato
  const updateContrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contrato> & { id: string }) => {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contrato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
    },
  });

  // Excluir contrato
  const deleteContrato = useMutation({
    mutationFn: async ({ id, excluirPagamentos = false }: { id: string; excluirPagamentos?: boolean }) => {
      console.log(`Excluindo contrato: ${id} - Excluir pagamentos: ${excluirPagamentos}`);
      const response = await fetch(`/api/contratos/${id}?excluirPagamentos=${excluirPagamentos}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contrato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de contratos e dados relacionados (exceto motoristas para preservar imagens)
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
      // FORÇA atualização imediata dos veículos após exclusão de contrato
      queryClient.refetchQueries({ queryKey: ['veiculos', locadoraId] });
      // Removido: queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
      queryClient.removeQueries({ queryKey: ['/api/pagamentos', locadoraId] });
    },
  });

  // Função para limpar cache completamente
  const clearCache = () => {
    console.log('[CACHE CLEAR] Limpando cache de contratos...');
    queryClient.removeQueries({ queryKey: ['contratos'] });
    queryClient.removeQueries({ queryKey: ['alugueis'] });
    // Removido: queryClient.removeQueries({ queryKey: ['motoristas'] });
    queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
  };

  return {
    contratos,
    isLoading,
    error,
    createContrato,
    updateContrato,
    deleteContrato,
    clearCache, // Nova função para limpar cache
  };
}