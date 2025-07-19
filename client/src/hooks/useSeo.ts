import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeoConfig, InsertSeoConfig } from "@shared/schema";

const API_BASE = "/api";

async function fetchSeoConfig(): Promise<SeoConfig> {
  const response = await fetch(`${API_BASE}/seo`);
  if (!response.ok) {
    throw new Error('Falha ao buscar configurações SEO');
  }
  return response.json();
}

async function updateSeoConfig(data: Partial<InsertSeoConfig>): Promise<SeoConfig> {
  const response = await fetch(`${API_BASE}/seo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Falha ao atualizar configurações SEO');
  }
  
  return response.json();
}

export function useSeoConfig() {
  return useQuery({
    queryKey: ['seo-config'],
    queryFn: fetchSeoConfig,
  });
}

export function useUpdateSeoConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSeoConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-config'] });
    },
  });
}