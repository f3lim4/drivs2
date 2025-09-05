/**
 * Custom hook for managing Locadoras data and operations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Locadora } from '@/types';

export const useLocadoras = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Usar React Query para buscar locadoras
  const { 
    data: locadoras = [], 
    isLoading, 
    refetch: fetchLocadoras 
  } = useQuery({
    queryKey: ['/api/locadoras'],
    queryFn: async () => {
      const response = await fetch('/api/locadoras');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar locadoras');
      }
      
      const data = await response.json();
      return data || [];
    },
    onError: (error) => {
      console.error('Erro ao carregar locadoras:', error);
      toast({
        title: "Erro ao carregar locadoras",
        description: "Não foi possível carregar a lista de locadoras",
        variant: "destructive",
      });
    }
  });

  const deleteLocadora = async (id: string) => {
    try {
      const response = await fetch(`/api/locadoras/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir locadora');
      }

      // Invalidar cache para atualizar a lista
      await queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
      
      toast({
        title: "Locadora EXCLUÍDA PERMANENTEMENTE",
        description: "A locadora e todos os dados relacionados (veículos, motoristas, contratos, pagamentos) foram removidos completamente do sistema",
      });
    } catch (error) {
      console.error('Erro ao excluir locadora:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a locadora",
        variant: "destructive",
      });
    }
  };

  const updateLocadora = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/locadoras/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar locadora');
      }

      // Invalidar cache para atualizar a lista
      await queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
      
      toast({
        title: "Status alterado",
        description: "O status da locadora foi alterado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar locadora:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status da locadora",
        variant: "destructive",
      });
    }
  };

  return {
    locadoras,
    isLoading,
    fetchLocadoras,
    updateLocadora,
    deleteLocadora,
  };
};