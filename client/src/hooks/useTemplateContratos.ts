/**
 * Hook para gerenciar templates de contratos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface TemplateContrato {
  id: string;
  locadoraId: string;
  nome: string;
  conteudo: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useTemplateContratos() {
  const { profile } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar templates
  const { 
    data: templates = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['template-contratos', locadoraId],
    queryFn: async () => {
      const response = await fetch(`/api/template-contratos?locadoraId=${locadoraId}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      console.log('Templates carregados:', data);
      return data;
    },
    enabled: !!locadoraId,
    staleTime: 0,
    cacheTime: 0,
  });

  // Criar template
  const createTemplate = useMutation({
    mutationFn: async (template: Omit<TemplateContrato, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/template-contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-contratos', locadoraId] });
    },
  });

  // Atualizar template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TemplateContrato> & { id: string }) => {
      const response = await fetch(`/api/template-contratos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-contratos', locadoraId] });
    },
  });

  // Excluir template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/template-contratos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-contratos', locadoraId] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}