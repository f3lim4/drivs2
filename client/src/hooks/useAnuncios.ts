import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Anuncio, InsertAnuncio } from '@shared/schema';

// Função para realizar requests para a API
const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export function useAnuncios() {
  return useQuery<Anuncio[]>({
    queryKey: ['/api/anuncios'],
    queryFn: () => apiRequest('/api/anuncios'),
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
}

export function useAnunciosAtivos() {
  return useQuery<Anuncio[]>({
    queryKey: ['/api/anuncios/ativos'],
    queryFn: () => apiRequest('/api/anuncios/ativos'),
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
}

export function useAnuncio(id: string) {
  return useQuery<Anuncio>({
    queryKey: ['/api/anuncios', id],
    queryFn: () => apiRequest(`/api/anuncios/${id}`),
    enabled: !!id,
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
}

export function useCreateAnuncio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertAnuncio) => apiRequest('/api/anuncios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios/ativos'] });
    },
  });
}

export function useUpdateAnuncio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAnuncio> }) => 
      apiRequest(`/api/anuncios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios/ativos'] });
    },
  });
}

export function useDeleteAnuncio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/anuncios/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/anuncios/ativos'] });
    },
  });
}