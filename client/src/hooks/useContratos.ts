/**
 * Hook para gerenciar contratos com persistência no banco de dados
 * Substitui o armazenamento em memória por operações reais no banco
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contrato } from '@/types';
import { useAuth } from './useAuth';

export function useContratos() {
  const { locadoraId } = useAuth();
  const queryClient = useQueryClient();

  // Buscar contratos
  const { 
    data: contratos = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['contratos', locadoraId],
    queryFn: async () => {
      const response = await fetch(`/api/contratos?locadoraId=${locadoraId}`);
      if (!response.ok) throw new Error('Failed to fetch contratos');
      return response.json();
    },
    enabled: !!locadoraId,
    staleTime: 30000, // 30 segundos
    cacheTime: 60000, // 1 minuto
  });

  // Criar contrato
  const createContrato = useMutation({
    mutationFn: async (contrato: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>) => {
      const contratoData = {
        ...contrato,
        locadoraId,
      };
      
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create contrato');
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