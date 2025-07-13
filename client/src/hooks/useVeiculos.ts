import { useState, useEffect } from 'react';
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
      
      let url = '/api/veiculos';
      
      // Se for locadora, só carregar seus veículos
      if (isLocadora && profile?.locadoraId) {
        url += `?locadoraId=${profile.locadoraId}`;
        console.log('🔍 Locadora loading vehicles for locadoraId:', profile.locadoraId);
      } else {
        console.log('🔍 Admin loading all vehicles');
      }

      console.log('🔍 Fetching vehicles from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json();
      console.log('🔍 Received vehicles data:', data);

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
  }, [isLocadora, profile?.locadoraId]);

  return {
    veiculos,
    loading,
    carregarVeiculos,
    adicionarVeiculo,
    atualizarVeiculo,
    removerVeiculo,
  };
}