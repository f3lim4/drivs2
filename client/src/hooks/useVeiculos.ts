import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Veiculo } from '@/types';

export function useVeiculos() {
  const { isLocadora, profile } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar veículos com React Query
  const { 
    data: veiculos = [], 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['veiculos', locadoraId],
    queryFn: async () => {
      let url = '/api/veiculos';
      if (isLocadora && locadoraId) {
        url += `?locadoraId=${locadoraId}`;
      }

      console.log('useVeiculos - Fazendo requisição para:', url);

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json();
      
      // FILTRO DE SEGURANÇA: Verificar se todos os veículos pertencem à locadora
      if (isLocadora && locadoraId) {
        const filteredData = data.filter((v: any) => v.locadoraId === locadoraId);
        
        // Log de segurança se houver dados mistos
        if (filteredData.length !== data.length) {
          console.warn('SECURITY ALERT: Veículos de outras locadoras removidos');
        }
        
        console.log('useVeiculos - Verificando isolamento:', {
          locadoraId,
          veiculosTotal: filteredData.length,
          primeiroVeiculo: filteredData[0]?.locadoraId,
          segundoVeiculo: filteredData[1]?.locadoraId
        });
        
        return filteredData.map(formatVeiculo);
      }

      return data.map(formatVeiculo);
    },
    enabled: !!profile,
    staleTime: 30000, // 30 segundos
    gcTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Função para formatar dados do veículo
  const formatVeiculo = (v: any): Veiculo => ({
    id: v.id,
    placa: v.placa,
    marca: v.marca,
    modelo: v.modelo,
    ano: v.ano,
    cor: v.cor,
    categoria: v.categoria,
    renavam: v.renavam,
    chassi: v.chassi,
    combustivel: v.combustivel,
    quilometragem: v.quilometragem,
    valorSemanal: parseFloat(v.valorSemanal),
    caucao: parseFloat(v.caucao),
    taxaAdministrativa: v.taxaAdministrativa ? parseFloat(v.taxaAdministrativa) : undefined,
    limiteQuilometragem: v.limiteQuilometragem,
    valorLimiteKm: v.valorLimiteKm,
    ultimaRevisao: v.ultimaRevisao,
    proximaRevisao: v.proximaRevisao,
    seguradora: v.seguradora,
    numeroApolice: v.numeroApolice,
    vigenciaSeguro: v.vigenciaSeguro,
    valorSeguroMensal: v.valorSeguroMensal ? parseFloat(v.valorSeguroMensal) : undefined,
    valorVeiculo: v.valorVeiculo ? parseFloat(v.valorVeiculo) : undefined,
    ipva: v.ipva ? parseFloat(v.ipva) : undefined,
    rastreador: v.rastreador,
    valorRastreadorMensal: v.valorRastreadorMensal ? parseFloat(v.valorRastreadorMensal) : undefined,
    dataCompra: v.dataCompra,
    financiado: v.financiado,
    valorFinanciamento: v.valorFinanciamento ? parseFloat(v.valorFinanciamento) : undefined,
    quantidadeParcelas: v.quantidadeParcelas,
    status: v.status as 'disponivel' | 'alugado' | 'manutencao' | 'indisponivel',
    // Campos de compatibilidade
    valorDiario: parseFloat(v.valorSemanal) / 7,
    valorCaucao: parseFloat(v.caucao),
    kmLimite: v.limiteQuilometragem === 'limitada' && v.valorLimiteKm 
      ? `${v.valorLimiteKm} km/semana` 
      : v.limiteQuilometragem,
    seguro: v.seguradora || 'Não informado',
    // Dados da locadora
    locadoraNome: v.locadoraNome,
  });

  // Adicionar veículo
  const adicionarVeiculo = () => {
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
  };

  const atualizarVeiculo = () => {
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
  };

  const removerVeiculo = () => {
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
  };

  return {
    veiculos,
    loading,
    error,
    carregarVeiculos: () => queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] }),
    adicionarVeiculo,
    atualizarVeiculo,
    removerVeiculo,
  };
}