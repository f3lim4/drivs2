/**
 * Hook para gerenciar contratos com persistência no banco de dados
 * Substitui o armazenamento em memória por operações reais no banco
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contrato } from '@/types';
import { useAuth } from './useAuth';

export function useContratos() {
  const { profile } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar contratos (incluindo aluguéis ativos como contratos)
  const { 
    data: contratos = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['contratos', locadoraId],
    queryFn: async () => {
      // Buscar contratos formais
      const contratosResponse = await fetch(`/api/contratos?locadoraId=${locadoraId}`);
      if (!contratosResponse.ok) throw new Error('Failed to fetch contratos');
      const contratosFormais = await contratosResponse.json();

      // Buscar aluguéis ativos para incluir como contratos
      const alugueisResponse = await fetch(`/api/alugueis?locadoraId=${locadoraId}`);
      if (!alugueisResponse.ok) throw new Error('Failed to fetch alugueis');
      const todosAlugueis = await alugueisResponse.json();
      const alugueisAtivos = todosAlugueis.filter((aluguel: any) => aluguel.status === 'ativo');

      // Converter aluguéis ativos em formato de contratos
      const contratosDeAlugueis = alugueisAtivos.map((aluguel: any) => ({
        id: `aluguel_${aluguel.id}`,
        locadoraId: aluguel.locadoraId,
        motoristaId: aluguel.motoristaId,
        motoristaNome: aluguel.motoristaNome,
        motoristaCpf: aluguel.motoristaCpf,
        veiculoId: aluguel.veiculoId,
        veiculoPlaca: aluguel.veiculoPlaca,
        veiculoMarca: aluguel.veiculoMarca,
        veiculoModelo: aluguel.veiculoModelo,
        dataInicio: aluguel.dataInicio,
        dataFim: aluguel.dataFim,
        valorMensal: aluguel.valorMensal,
        valorSemanal: aluguel.valorSemanal,
        caucao: aluguel.caucao,
        observacoes: aluguel.observacoes,
        status: 'ativo',
        tipo: 'aluguel_ativo', // Identificador para diferenciar
        createdAt: aluguel.createdAt,
        updatedAt: aluguel.updatedAt,
      }));

      // Combinar contratos formais + aluguéis ativos
      return [...contratosFormais, ...contratosDeAlugueis];
    },
    enabled: !!locadoraId,
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0, // Não manter cache
  });

  // Criar contrato
  const createContrato = useMutation({
    mutationFn: async (contrato: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>) => {
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
        throw new Error(`Failed to create contrato: ${response.status} - ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
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
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contrato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
    },
  });

  return {
    contratos,
    isLoading,
    error,
    createContrato,
    updateContrato,
    deleteContrato,
  };
}