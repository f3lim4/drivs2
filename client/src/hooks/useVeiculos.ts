import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Veiculo } from '@/types';

export function useVeiculos() {
  const { isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar veículos
  const fetchVeiculos = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let url = '/api/veiculos';
      if (isLocadora && profile?.locadoraId) {
        url += `?locadoraId=${profile.locadoraId}`;
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
    
    // FILTRO TRIPLO DE SEGURANÇA: Sempre filtrar no frontend também
    let veiculosFiltrados = data;
    if (isLocadora && profile?.locadoraId) {
      veiculosFiltrados = data.filter((v: any) => v.locadoraId === profile.locadoraId);
      
      // PROTEÇÃO EXTRA: Se ainda houver veículos de outras locadoras, limpar tudo
      const temVeiculosDeOutrasLocadoras = veiculosFiltrados.some(v => v.locadoraId !== profile.locadoraId);
      if (temVeiculosDeOutrasLocadoras) {
        console.error('SECURITY ALERT: Dados de outras locadoras detectados, limpando array');
        throw new Error('Dados inconsistentes detectados');
      }
    }

    // VALIDAÇÃO ADICIONAL: Garantir que todos os veículos pertencem à locadora correta
    if (isLocadora && profile?.locadoraId) {
      const todosVeiculosCorretos = veiculosFiltrados.every(v => v.locadoraId === profile.locadoraId);
      if (!todosVeiculosCorretos) {
        console.error('SECURITY ALERT: Veículos de outras locadoras detectados, retornando array vazio');
        throw new Error('Violação de segurança detectada');
      }
    }

    // Converter dados do banco para formato esperado
    const veiculosFormatados: Veiculo[] = veiculosFiltrados.map((v: any) => {
      console.log('Mapeando veículo:', v.placa, {
        valor_veiculo: v.valor_veiculo,
        ipva: v.ipva,
        valor_rastreador_mensal: v.valor_rastreador_mensal,
        rastreador: v.rastreador
      });
      
      return {
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
        taxaAdministrativa: v.taxaAdministrativa ? parseFloat(v.taxaAdministrativa) : null,
        limiteQuilometragem: v.limiteQuilometragem,
        valorLimiteKm: v.valorLimiteKm,
        ultimaRevisao: v.ultimaRevisao,
        proximaRevisao: v.proximaRevisao,
        seguradora: v.seguradora,
        numeroApolice: v.numeroApolice,
        vigenciaSeguro: v.vigenciaSeguro,
        valorSeguroMensal: v.valorSeguroMensal ? parseFloat(v.valorSeguroMensal) : null,
        valorVeiculo: v.valor_veiculo ? parseFloat(v.valor_veiculo) : null,
        ipva: v.ipva ? parseFloat(v.ipva) : null,
        rastreador: v.rastreador,
        valorRastreadorMensal: v.valor_rastreador_mensal ? parseFloat(v.valor_rastreador_mensal) : null,
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
      };
    });

    // Log apenas se houver problemas para debug
    if (isLocadora && veiculosFiltrados.length > 1) {
      console.log('useVeiculos - Verificando isolamento:', {
        locadoraId: profile?.locadoraId,
        veiculosTotal: veiculosFiltrados.length,
        primeiroVeiculo: veiculosFiltrados[0]?.locadoraId,
        segundoVeiculo: veiculosFiltrados[1]?.locadoraId
      });
    }
    
    setVeiculos(veiculosFormatados);
    setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setLoading(false);
    }
  };

  // Carregar veículos quando o perfil estiver disponível
  useEffect(() => {
    if (profile) {
      fetchVeiculos();
    }
  }, [profile, isLocadora]);

  const adicionarVeiculo = (novoVeiculo: Veiculo) => {
    fetchVeiculos();
  };

  const atualizarVeiculo = (veiculoAtualizado: Veiculo) => {
    fetchVeiculos();
  };

  const removerVeiculo = (veiculoId: string) => {
    fetchVeiculos();
  };

  return {
    veiculos,
    loading,
    carregarVeiculos: fetchVeiculos,
    adicionarVeiculo,
    atualizarVeiculo,
    removerVeiculo,
  };
}