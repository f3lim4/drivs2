import { useState, useEffect, useCallback } from 'react';
import { differenceInDays, format } from 'date-fns';

interface UseRecommendationsProps {
  locadoraId?: string;
  motoristas?: any[];
  veiculos?: any[];
  alugueis?: any[];
  pagamentos?: any[];
  manutencoes?: any[];
}

interface RecommendationData {
  totalVeiculos: number;
  veiculosDisponivel: number;
  veiculosAlugado: number;
  totalMotoristas: number;
  motoristasAtivos: number;
  alugueisAtivos: number;
  receitaMensal: number;
  cnhVencendo: number;
  cnhVencida: number;
  pagamentosVencidos: number;
  manutencoesPendentes: number;
}

const RECOMMENDATION_STORAGE_KEY = 'drivs_recommendations_settings';
const LAST_SHOWN_KEY = 'drivs_recommendations_last_shown';

interface RecommendationSettings {
  enabled: boolean;
  frequency: 'always' | 'daily' | 'weekly' | 'monthly';
  lastShown?: string;
}

export const useRecommendations = ({
  locadoraId,
  motoristas = [],
  veiculos = [],
  alugueis = [],
  pagamentos = [],
  manutencoes = []
}: UseRecommendationsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [settings, setSettings] = useState<RecommendationSettings>({
    enabled: true,
    frequency: 'daily'
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(RECOMMENDATION_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erro ao carregar configurações das recomendações:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const updateSettings = useCallback((newSettings: Partial<RecommendationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(updatedSettings));
  }, [settings]);

  // Verificar se deve mostrar recomendações baseado na frequência
  const shouldShowRecommendations = useCallback(() => {
    if (!settings.enabled || !locadoraId) return false;

    const lastShownStr = localStorage.getItem(`${LAST_SHOWN_KEY}_${locadoraId}`);
    if (!lastShownStr) return true;

    try {
      const lastShown = new Date(lastShownStr);
      const now = new Date();
      const daysDiff = differenceInDays(now, lastShown);

      switch (settings.frequency) {
        case 'always':
          return true;
        case 'daily':
          return daysDiff >= 1;
        case 'weekly':
          return daysDiff >= 7;
        case 'monthly':
          return daysDiff >= 30;
        default:
          return true;
      }
    } catch (error) {
      console.error('Erro ao verificar última exibição:', error);
      return true;
    }
  }, [settings, locadoraId]);

  // Calcular dados das recomendações
  useEffect(() => {
    if (!locadoraId || motoristas.length === 0) return;

    const hoje = new Date();
    const proximoMes = new Date();
    proximoMes.setDate(hoje.getDate() + 30);

    // Calcular CNHs vencidas e vencendo
    const cnhVencida = motoristas.filter((m: any) => {
      if (!m.vencimentoCnh) return false;
      const vencimento = new Date(m.vencimentoCnh);
      return vencimento < hoje;
    }).length;

    const cnhVencendo = motoristas.filter((m: any) => {
      if (!m.vencimentoCnh) return false;
      const vencimento = new Date(m.vencimentoCnh);
      return vencimento >= hoje && vencimento <= proximoMes;
    }).length;

    // Estatísticas de veículos
    const totalVeiculos = veiculos.length;
    const veiculosDisponivel = veiculos.filter((v: any) => v.status === 'disponivel').length;
    const veiculosAlugado = veiculos.filter((v: any) => v.status === 'alugado').length;

    // Estatísticas de motoristas
    const totalMotoristas = motoristas.length;
    const motoristasAtivos = motoristas.filter((m: any) => m.status === 'ativo').length;

    // Estatísticas de aluguéis
    const alugueisAtivos = alugueis.filter((a: any) => a.status === 'ativo').length;

    // Calcular receita mensal
    const receitaMensal = alugueis
      .filter((a: any) => a.status === 'ativo' || a.status === 'pendente')
      .reduce((total: number, aluguel: any) => total + parseFloat(aluguel.valorMensal || '0'), 0);

    // Pagamentos vencidos
    const pagamentosVencidos = pagamentos.filter((p: any) => {
      if (p.status === 'pago') return false;
      if (!p.dataVencimento) return false;
      const vencimento = new Date(p.dataVencimento);
      return vencimento < hoje;
    }).length;

    // Manutenções pendentes (aproximação baseada em veículos em manutenção)
    const manutencoesPendentes = veiculos.filter((v: any) => v.status === 'manutencao').length;

    const data: RecommendationData = {
      totalVeiculos,
      veiculosDisponivel,
      veiculosAlugado,
      totalMotoristas,
      motoristasAtivos,
      alugueisAtivos,
      receitaMensal,
      cnhVencendo,
      cnhVencida,
      pagamentosVencidos,
      manutencoesPendentes
    };

    setRecommendationData(data);

    // Verificar se deve mostrar automaticamente
    if (shouldShowRecommendations()) {
      // Mostrar apenas se há problemas urgentes ou oportunidades importantes
      const hasUrgentIssues = cnhVencida > 0 || cnhVencendo > 0 || pagamentosVencidos > 0;
      const hasOpportunities = veiculosDisponivel > 2 && (veiculosAlugado / totalVeiculos) < 0.6;
      
      if (hasUrgentIssues || hasOpportunities) {
        setShowRecommendations(true);
      }
    }
  }, [locadoraId, motoristas, veiculos, alugueis, pagamentos, manutencoes, shouldShowRecommendations]);

  // Marcar como visto
  const markAsShown = useCallback(() => {
    if (locadoraId) {
      localStorage.setItem(`${LAST_SHOWN_KEY}_${locadoraId}`, new Date().toISOString());
    }
    setShowRecommendations(false);
  }, [locadoraId]);

  // Forçar exibição das recomendações
  const forceShow = useCallback(() => {
    setShowRecommendations(true);
  }, []);

  // Fechar recomendações
  const closeRecommendations = useCallback(() => {
    markAsShown();
  }, [markAsShown]);

  return {
    showRecommendations,
    recommendationData,
    settings,
    updateSettings,
    forceShow,
    closeRecommendations,
    markAsShown
  };
};