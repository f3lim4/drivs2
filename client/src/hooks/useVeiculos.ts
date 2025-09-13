import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Veiculo } from '@/types';

export function useVeiculos() {
  const { isLocadora, profile, isAdmin } = useAuth();
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
      
      // ADMIN: Não enviar locadoraId para ver todos os veículos
      // LOCADORA: Enviar locadoraId para ver apenas seus veículos
      if (locadoraId && !isAdmin) {
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
      
      // FILTRO DE SEGURANÇA: Aplicar apenas para locadoras, não para admins
      if (isLocadora && locadoraId && !isAdmin) {
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

      // ADMIN: Retornar todos os veículos sem filtro
      if (isAdmin) {
        console.log('🚗 ADMIN - Carregando todos os veículos:', data.length);
      }

      return data.map(formatVeiculo);
    },
    enabled: !!profile && (isAdmin || !!locadoraId),
    staleTime: 0, // Sem cache
    gcTime: 0, // Sem cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Recarregar a cada 5 segundos para garantir dados atualizados
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
    financiado: v.financiado,
    valorFinanciamento: v.valorFinanciamento ? parseFloat(v.valorFinanciamento) : undefined,
    quantidadeParcelas: v.quantidadeParcelas,
    status: v.status as 'disponivel' | 'alugado' | 'manutencao' | 'indisponivel',
    // Documentos e visualização
    documentos: v.documentos,
    visualizar: v.visualizar,
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

  // Adicionar veículo - apenas invalida cache para recarregar dados
  const adicionarVeiculo = (_novoVeiculo?: Veiculo) => {
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
    queryClient.refetchQueries({ queryKey: ['veiculos', locadoraId] });
  };

  const atualizarVeiculo = (_veiculoAtualizado?: Veiculo) => {
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
    queryClient.refetchQueries({ queryKey: ['veiculos', locadoraId] });
  };

  const forcarAtualizacao = () => {
    queryClient.removeQueries({ queryKey: ['veiculos'] });
    queryClient.invalidateQueries({ queryKey: ['veiculos', locadoraId] });
    queryClient.refetchQueries({ queryKey: ['veiculos', locadoraId] });
  };

  const removerVeiculo = (_veiculoId?: string) => {
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
    forcarAtualizacao,
  };
}