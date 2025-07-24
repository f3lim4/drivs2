import { useQuery } from '@tanstack/react-query';

interface Receita {
  id: string;
  locadoraId: string;
  veiculoId?: string;
  veiculoModelo?: string;
  veiculoPlaca?: string;
  categoria: string;
  descricao: string;
  valor: string;
  data: string;
  tipo: 'receita';
  fonte: string;
  createdAt: string;
  updatedAt: string;
}

export const useReceitas = (locadoraId: string | undefined) => {
  return useQuery({
    queryKey: ['receitas', locadoraId],
    queryFn: async (): Promise<Receita[]> => {
      if (!locadoraId) return [];
      
      // Buscar pagamentos de aluguéis como receita
      const pagamentosResponse = await fetch(`/api/pagamentos?locadoraId=${locadoraId}`);
      if (!pagamentosResponse.ok) throw new Error('Failed to fetch pagamentos');
      const pagamentos = await pagamentosResponse.json();
      
      // Converter pagamentos pagos em receitas
      const receitasPagamentos = pagamentos
        .filter((pagamento: any) => pagamento.status === 'pago')
        .map((pagamento: any) => ({
          id: `pagamento_${pagamento.id}`,
          locadoraId: pagamento.locadoraId,
          veiculoId: pagamento.veiculoId,
          veiculoModelo: pagamento.veiculoModelo || 'N/A',
          veiculoPlaca: pagamento.veiculoPlaca || 'N/A',
          categoria: 'aluguel',
          descricao: `Pagamento de Aluguel - ${pagamento.motoristaNome}`,
          valor: pagamento.valorPago || pagamento.valorTotal,
          data: pagamento.dataPagamento || pagamento.data,
          tipo: 'receita' as const,
          fonte: 'pagamento',
          pagamentoId: pagamento.id,
          createdAt: pagamento.createdAt,
          updatedAt: pagamento.updatedAt,
        }));
      
      // Buscar infrações pagas para incluir como receitas
      const infracoesResponse = await fetch(`/api/infracoes?locadoraId=${locadoraId}`);
      if (!infracoesResponse.ok) throw new Error('Failed to fetch infracoes');
      const infracoes = await infracoesResponse.json();
      
      // Converter infrações pagas em receitas (ENTRADAS)
      const receitasInfracoes = infracoes
        .filter((infracao: any) => infracao.status === 'pago' && infracao.valorFinal)
        .map((infracao: any) => ({
          id: `infracao_${infracao.id}`,
          locadoraId: infracao.locadoraId,
          veiculoId: infracao.veiculoId,
          veiculoModelo: infracao.veiculoModelo || 'N/A',
          veiculoPlaca: infracao.veiculoPlaca || 'N/A',
          categoria: 'infracao',
          descricao: `Pagamento de Infração - ${infracao.tipoInfracao} - ${infracao.numeroAuto}`,
          valor: infracao.valorFinal,
          data: infracao.dataPagamento || infracao.dataInfracao,
          tipo: 'receita' as const,
          fonte: 'infracao',
          infracaoId: infracao.id,
          createdAt: infracao.createdAt,
          updatedAt: infracao.updatedAt,
        }));

      return [...receitasPagamentos, ...receitasInfracoes];
    },
    enabled: !!locadoraId,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
};

export type { Receita };