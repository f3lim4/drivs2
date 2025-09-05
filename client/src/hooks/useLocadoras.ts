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
      console.log('🗑️ [DELETE] Iniciando exclusão da locadora:', id);
      console.log('🗑️ [DELETE] URL da requisição:', `/api/locadoras/${id}`);
      
      const response = await fetch(`/api/locadoras/${id}`, {
        method: 'DELETE',
      });

      console.log('🗑️ [DELETE] Response status:', response.status);
      console.log('🗑️ [DELETE] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('🗑️ [DELETE] Erro na resposta:', errorData);
        
        // Tratar diferentes tipos de erro
        if (response.status === 404) {
          toast({
            title: "Locadora já foi excluída",
            description: "Esta locadora não existe mais no sistema",
            variant: "destructive",
          });
          // Atualizar lista mesmo assim
          await queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
          return;
        }
        
        throw new Error(errorData.message || 'Erro ao excluir locadora');
      }

      console.log('🗑️ [DELETE] Exclusão concluída, invalidando cache...');
      // Invalidar cache para atualizar a lista
      await queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
      
      console.log('🗑️ [DELETE] Cache invalidado, mostrando toast...');
      toast({
        title: "Locadora EXCLUÍDA PERMANENTEMENTE",
        description: "A locadora e todos os dados relacionados (veículos, motoristas, contratos, pagamentos) foram removidos completamente do sistema",
      });
      console.log('🗑️ [DELETE] Processo de exclusão finalizado com sucesso!');
    } catch (error) {
      console.error('🗑️ [DELETE] Erro ao excluir locadora:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a locadora permanentemente",
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