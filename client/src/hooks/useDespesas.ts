import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Despesa, InsertDespesa, Manutencao } from '@shared/schema';
import { format } from 'date-fns';

export function useDespesas() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const locadoraId = profile?.locadoraId;

  const query = useQuery({
    queryKey: ['/api/despesas', locadoraId],
    queryFn: async () => {
      if (!locadoraId) return [];
      
      // Buscar despesas manuais
      const despesasResponse = await fetch(`/api/despesas?locadoraId=${locadoraId}`);
      if (!despesasResponse.ok) throw new Error('Failed to fetch despesas');
      const despesasManuais = await despesasResponse.json();
      
      // Buscar manutenções para incluir como despesas
      const manutencoesResponse = await fetch(`/api/manutencoes?locadoraId=${locadoraId}`);
      if (!manutencoesResponse.ok) throw new Error('Failed to fetch manutencoes');
      const manutencoes = await manutencoesResponse.json();
      
      // Converter manutenções em despesas
      const despesasManutencao = manutencoes
        .filter((manutencao: Manutencao) => manutencao.valorOrcamento && parseFloat(manutencao.valorOrcamento) > 0)
        .map((manutencao: Manutencao) => ({
          id: `manutencao_${manutencao.id}`,
          locadoraId: manutencao.locadoraId,
          veiculoId: manutencao.veiculoId,
          veiculoModelo: manutencao.veiculoModelo,
          veiculoPlaca: manutencao.veiculoPlaca,
          categoria: 'manutencao',
          descricao: `Manutenção - ${manutencao.tipo} - ${manutencao.oficina}`,
          valor: manutencao.valorOrcamento,
          data: manutencao.dataInicio,
          tipo: 'despesa',
          fonte: 'manutencao',
          manutencaoId: manutencao.id,
          createdAt: manutencao.createdAt,
          updatedAt: manutencao.updatedAt,
        }));
      
      const todasDespesas = [...despesasManuais, ...despesasManutencao];
      
      console.log('Despesas - Verificando isolamento:', {
        locadoraId,
        despesasTotal: todasDespesas.length,
        despesasManuais: despesasManuais.length,
        despesasManutencao: despesasManutencao.length,
        primeiraDespesa: todasDespesas[0]?.locadoraId
      });
      
      return todasDespesas as Despesa[];
    },
    enabled: !!locadoraId,
  });

  const createMutation = useMutation({
    mutationFn: async (despesa: InsertDespesa) => {
      const response = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa),
      });
      
      if (!response.ok) throw new Error('Failed to create despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDespesa> }) => {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    },
  });

  return {
    despesas: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createDespesa: createMutation.mutateAsync,
    updateDespesa: updateMutation.mutateAsync,
    deleteDespesa: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook específico para buscar despesas por veículo
export function useDespesasByVeiculo(veiculoId: string) {
  return useQuery({
    queryKey: ['despesas', 'veiculo', veiculoId],
    queryFn: async () => {
      const response = await fetch(`/api/despesas?veiculoId=${veiculoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch despesas by veiculo');
      }
      return response.json() as Promise<Despesa[]>;
    },
    enabled: !!veiculoId,
  });
}