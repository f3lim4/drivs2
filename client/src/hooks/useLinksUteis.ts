import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LinkUtil, InsertLinkUtil } from '@shared/schema';

// Função helper para fazer requisições à API
const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }
  return response.json();
};

// Hook para buscar todos os links úteis ativos
export function useLinksUteis() {
  return useQuery<LinkUtil[]>({
    queryKey: ['/api/links-uteis'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar apenas links úteis ativos (para exibição no dashboard)
export function useLinksUteisAtivos() {
  return useQuery<LinkUtil[]>({
    queryKey: ['/api/links-uteis/ativos'],
    queryFn: async () => {
      const response = await fetch('/api/links-uteis');
      if (!response.ok) {
        throw new Error('Erro ao buscar links úteis');
      }
      const links = await response.json();
      // Filtrar apenas links ativos e ordenar
      return links.filter((link: LinkUtil) => link.ativo).sort((a: LinkUtil, b: LinkUtil) => a.ordem - b.ordem);
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutos - cache estendido para links
    gcTime: 20 * 60 * 1000, // 20 minutos
  });
}

// Hook para criar um novo link útil
export function useCreateLinkUtil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertLinkUtil) => {
      return apiRequest('/api/links-uteis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links-uteis'] });
    },
  });
}

// Hook para atualizar um link útil
export function useUpdateLinkUtil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertLinkUtil> }) => {
      return apiRequest(`/api/links-uteis/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links-uteis'] });
    },
  });
}

// Hook para deletar um link útil
export function useDeleteLinkUtil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/links-uteis/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links-uteis'] });
    },
  });
}