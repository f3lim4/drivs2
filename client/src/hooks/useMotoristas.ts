/**
 * Hook para gerenciar motoristas com isolamento de dados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { Motorista } from '@/types';

export function useMotoristas() {
  const { profile, isLocadora } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar motoristas com isolamento de segurança
  const { 
    data: motoristas = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['motoristas', locadoraId],
    queryFn: async () => {
      let url = '/api/motoristas';
      
      // Se for locadora, só carregar seus motoristas
      if (isLocadora && locadoraId) {
        url += `?locadoraId=${locadoraId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar motoristas');
      }

      const data = await response.json();
      
      // FILTRO DE SEGURANÇA: Verificar se todos os motoristas pertencem à locadora
      if (isLocadora && locadoraId) {
        const filteredData = data.filter(m => m.locadoraId === locadoraId);
        
        // Log de segurança se houver dados mistos
        if (filteredData.length !== data.length) {
          console.warn('SECURITY ALERT: Motoristas de outras locadoras removidos');
        }
        
        console.log('Motoristas - Verificando isolamento:', {
          locadoraId,
          motoristasTotal: filteredData.length,
          primeiroMotorista: filteredData[0]?.locadoraId,
          segundoMotorista: filteredData[1]?.locadoraId
        });
        
        return filteredData;
      }

      return data;
    },
    enabled: !!profile,
    staleTime: 30000, // 30 segundos
    cacheTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Criar motorista
  const createMotorista = useMutation({
    mutationFn: async (motorista: Omit<Motorista, 'id'>) => {
      const response = await fetch('/api/motoristas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motorista),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create motorista');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
    },
  });

  // Atualizar motorista
  const updateMotorista = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Motorista> & { id: string }) => {
      const response = await fetch(`/api/motoristas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update motorista');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
    },
  });

  // Excluir motorista
  const deleteMotorista = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/motoristas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete motorista');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
    },
  });

  return {
    motoristas,
    isLoading,
    error,
    createMotorista,
    updateMotorista,
    deleteMotorista,
  };
}