import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Veiculo } from '@/types';

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLocadora, profile } = useAuth();
  const { toast } = useToast();

  const carregarVeiculos = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('veiculos').select(`
        *,
        locadoras:locadora_id (
          nome
        )
      `);

      // Se for locadora, só carregar seus veículos
      if (isLocadora && profile?.locadora_id) {
        query = query.eq('locadora_id', profile.locadora_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Converter dados do banco para formato esperado
      const veiculosFormatados: Veiculo[] = data.map((v: any) => ({
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
        valorSemanal: v.valor_semanal,
        caucao: v.caucao,
        taxaAdministrativa: v.taxa_administrativa,
        limiteQuilometragem: v.limite_quilometragem,
        valorLimiteKm: v.valor_limite_km,
        ultimaRevisao: v.ultima_revisao,
        proximaRevisao: v.proxima_revisao,
        seguradora: v.seguradora,
        numeroApolice: v.numero_apolice,
        vigenciaSeguro: v.vigencia_seguro,
        valorSeguroMensal: v.valor_seguro_mensal,
        status: v.status as 'disponivel' | 'alugado' | 'manutencao' | 'indisponivel',
        // Campos de compatibilidade
        valorDiario: v.valor_semanal / 7,
        valorCaucao: v.caucao,
        kmLimite: v.limite_quilometragem === 'limitada' && v.valor_limite_km 
          ? `${v.valor_limite_km} km/semana` 
          : v.limite_quilometragem,
        seguro: v.seguradora || 'Não informado',
        // Dados da locadora
        locadoraNome: v.locadoras?.nome,
      }));

      setVeiculos(veiculosFormatados);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      toast({
        title: "Erro ao carregar veículos",
        description: "Não foi possível carregar a lista de veículos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarVeiculo = (novoVeiculo: Veiculo) => {
    setVeiculos(prev => [...prev, novoVeiculo]);
  };

  const atualizarVeiculo = (veiculoAtualizado: Veiculo) => {
    setVeiculos(prev => 
      prev.map(v => v.id === veiculoAtualizado.id ? veiculoAtualizado : v)
    );
  };

  const removerVeiculo = (veiculoId: string) => {
    setVeiculos(prev => prev.filter(v => v.id !== veiculoId));
  };

  useEffect(() => {
    carregarVeiculos();
  }, [isLocadora, profile?.locadora_id]);

  return {
    veiculos,
    loading,
    carregarVeiculos,
    adicionarVeiculo,
    atualizarVeiculo,
    removerVeiculo,
  };
}