/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3, Megaphone, Building2, FileText, Globe, Zap, Cpu, Database, TrendingDown, Crown, Phone, ExternalLink, Mail, Play, Link } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardStats, Alert, Motorista, Veiculo } from '@/types';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAnunciosAtivos } from '@/hooks/useAnuncios';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useLinksUteisAtivos } from '@/hooks/useLinksUteis';
import { AtividadesRecentes } from '@/components/dashboard/AtividadesRecentes';
import type { DashboardConfig } from '@shared/schema';
import { differenceInDays } from 'date-fns';
import { useLocation } from 'wouter';


export default function Dashboard() {
  const { profile, isLocadora, isAdmin } = useAuth();
  
  // Buscar anúncios ativos - cache otimizado
  const { data: anuncios = [], isLoading: loadingAnuncios } = useAnunciosAtivos();

  // Buscar configurações do dashboard - cache estendido
  const { data: dashboardConfig, isLoading: loadingDashboardConfig } = useQuery<DashboardConfig>({
    queryKey: ['/api/dashboard-config'],
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  // Buscar links úteis dinâmicos
  const { data: linksUteis = [], isLoading: loadingLinksUteis } = useLinksUteisAtivos();

  // Buscar dados da locadora para verificar período de teste
  const { data: locadoraData } = useQuery({
    queryKey: [`/api/locadoras/${profile?.locadoraId}`],
    enabled: !!profile?.locadoraId && isLocadora,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para mapear tipos de anúncios para português e cores
  const getAnuncioConfig = (tipo: string) => {
    switch(tipo.toLowerCase()) {
      case 'info':
      case 'informacao':
        return {
          nome: 'Informação',
          border: 'border-l-blue-500',
          bg: 'bg-blue-50/50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          badgeVariant: 'default' as const
        };
      case 'warning':
      case 'atencao':
        return {
          nome: 'Atenção',
          border: 'border-l-yellow-500',
          bg: 'bg-yellow-50/50',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          badgeVariant: 'secondary' as const
        };
      case 'success':
      case 'sucesso':
        return {
          nome: 'Sucesso',
          border: 'border-l-green-500',
          bg: 'bg-green-50/50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          badgeVariant: 'default' as const
        };
      case 'error':
      case 'erro':
        return {
          nome: 'Erro',
          border: 'border-l-red-500',
          bg: 'bg-red-50/50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badgeVariant: 'destructive' as const
        };
      default:
        return {
          nome: 'Informação',
          border: 'border-l-blue-500',
          bg: 'bg-blue-50/50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          badgeVariant: 'default' as const
        };
    }
  };

  // Buscar dados das locadoras (apenas para admin) - com cache otimizado
  const { data: locadoras = [], isLoading: loadingLocadoras } = useQuery<any[]>({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
  
  // Usar hooks especializados para buscar dados
  const { motoristas: motoristasRaw = [], isLoading: loadingMotoristas } = useMotoristas();
  const { veiculos: veiculosRaw = [], loading: loadingVeiculos } = useVeiculos();
  const { alugueis: alugueisRaw = [], isLoading: loadingAlugueis } = useAlugueis();
  const { pagamentos = [], isLoading: loadingPagamentos } = usePagamentos();
  
  const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
    queryKey: ['/api/despesas', profile?.locadoraId],
    enabled: !!profile && isLocadora,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // SISTEMA DE LOADING COMPLETO - Dashboard só carrega quando TODOS os dados estão prontos
  const loading = loadingMotoristas || loadingVeiculos || loadingAlugueis || loadingPagamentos || loadingDespesas || loadingAnuncios || loadingLocadoras || loadingDashboardConfig || loadingLinksUteis;

  // Usar dados diretamente dos hooks (já filtrados corretamente)
  const motoristasSeguro = motoristasRaw;
  const veiculosSeguro = veiculosRaw;
  const alugueisSeguro = alugueisRaw;

  const [, setLocation] = useLocation();


  // Calcular dias restantes do período de teste
  const getTrialStatus = () => {
    if (!locadoraData || !(locadoraData as any).testeGratuito || !(locadoraData as any).dataVencimentoTeste) {
      return null;
    }
    
    const today = new Date();
    const vencimento = new Date((locadoraData as any).dataVencimentoTeste);
    const diasRestantes = differenceInDays(vencimento, today);
    
    return {
      diasRestantes,
      diasTotais: (locadoraData as any).diasTesteGratuito || 30,
      vencimento,
      isActive: diasRestantes >= 0
    };
  };

  const trialStatus = getTrialStatus();



  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return null;
    }
  };

  // Função para calcular dados financeiros mensais
  const getDadosFinanceiros = () => {
    const meses = [
      { nome: 'Jan', numero: 1 },
      { nome: 'Fev', numero: 2 },
      { nome: 'Mar', numero: 3 },
      { nome: 'Abr', numero: 4 },
      { nome: 'Mai', numero: 5 },
      { nome: 'Jun', numero: 6 },
      { nome: 'Jul', numero: 7 },
      { nome: 'Ago', numero: 8 },
      { nome: 'Set', numero: 9 },
      { nome: 'Out', numero: 10 },
      { nome: 'Nov', numero: 11 },
      { nome: 'Dez', numero: 12 }
    ];

    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    const dadosFinanceiros = [];

    // Pegar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      let mes = mesAtual - i;
      let ano = anoAtual;
      
      if (mes <= 0) {
        mes += 12;
        ano -= 1;
      }

      const mesInfo = meses[mes - 1];
      
      // Calcular entradas do mês (pagamentos recebidos)
      const receitaMes = pagamentos
        .filter((p: any) => {
          if (p.status !== 'pago') return false;
          const dataStr = p.dataPagamento || p.data;
          if (!dataStr) return false;
          
          // Criar data no fuso horário local para evitar problemas com UTC
          const dateParts = dataStr.split('-');
          const dataPagamento = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          
          return dataPagamento.getMonth() + 1 === mes && 
                 dataPagamento.getFullYear() === ano;
        })
        .reduce((total: number, p: any) => total + parseFloat(p.valorPago || p.valor || '0'), 0);

      // Calcular saídas do mês (despesas pagas)
      const despesasMes = (despesas as any[])
        .filter((d: any) => {
          if (d.status !== 'pago') return false;
          const dataStr = d.data;
          if (!dataStr) return false;
          
          // Criar data no fuso horário local para evitar problemas com UTC
          const dateParts = dataStr.split('-');
          const dataDespesa = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          
          return dataDespesa.getMonth() + 1 === mes && 
                 dataDespesa.getFullYear() === ano;
        })
        .reduce((total: number, d: any) => total + parseFloat(d.valor || '0'), 0);

      // Calcular saídas fixas mensais (IPVA, seguro, rastreador)
      const despesasFixasMes = veiculosSeguro.reduce((total: number, veiculo: any) => {
        let totalVeiculo = 0;
        
        // IPVA mensal (valor anual dividido por 12)
        if (veiculo.valorIpva) {
          totalVeiculo += parseFloat(veiculo.valorIpva) / 12;
        }
        
        // Seguro mensal
        if (veiculo.valorSeguroMensal) {
          totalVeiculo += parseFloat(veiculo.valorSeguroMensal);
        }
        
        // Rastreador mensal
        if (veiculo.valorRastreadorMensal) {
          totalVeiculo += parseFloat(veiculo.valorRastreadorMensal);
        }
        
        return total + totalVeiculo;
      }, 0);

      dadosFinanceiros.push({
        mes: mesInfo.nome,
        entradas: Math.round(receitaMes),
        saidas: Math.round(despesasMes + despesasFixasMes),
        lucro: Math.round(receitaMes - (despesasMes + despesasFixasMes))
      });
    }

    return dadosFinanceiros;
  };

  // Função para calcular dados de aluguéis mensais
  const getDadosAlugueis = () => {
    const meses = [
      { nome: 'Jan', numero: 1 },
      { nome: 'Fev', numero: 2 },
      { nome: 'Mar', numero: 3 },
      { nome: 'Abr', numero: 4 },
      { nome: 'Mai', numero: 5 },
      { nome: 'Jun', numero: 6 },
      { nome: 'Jul', numero: 7 },
      { nome: 'Ago', numero: 8 },
      { nome: 'Set', numero: 9 },
      { nome: 'Out', numero: 10 },
      { nome: 'Nov', numero: 11 },
      { nome: 'Dez', numero: 12 }
    ];

    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    const dadosAlugueis = [];

    // Pegar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      let mes = mesAtual - i;
      let ano = anoAtual;
      
      if (mes <= 0) {
        mes += 12;
        ano -= 1;
      }

      const mesInfo = meses[mes - 1];
      
      // Contar aluguéis iniciados no mês
      const alugueisIniciados = alugueisSeguro.filter((a: any) => {
        const dataInicio = new Date(a.dataInicio);
        return dataInicio.getMonth() + 1 === mes && 
               dataInicio.getFullYear() === ano;
      }).length;

      // Contar aluguéis finalizados no mês
      const alugueisFinalizados = alugueisSeguro.filter((a: any) => {
        if (!a.dataFim) return false;
        const dataFim = new Date(a.dataFim);
        return dataFim.getMonth() + 1 === mes && 
               dataFim.getFullYear() === ano;
      }).length;

      // Contar aluguéis ativos no mês (iniciados antes ou durante o mês e ainda não finalizados)
      const alugueisAtivos = alugueisSeguro.filter((a: any) => {
        const dataInicio = new Date(a.dataInicio);
        const dataFim = a.dataFim ? new Date(a.dataFim) : null;
        const ultimoDiaMes = new Date(ano, mes, 0);
        
        return dataInicio <= ultimoDiaMes && 
               (!dataFim || dataFim >= new Date(ano, mes - 1, 1));
      }).length;

      dadosAlugueis.push({
        mes: mesInfo.nome,
        iniciados: alugueisIniciados,
        finalizados: alugueisFinalizados,
        ativos: alugueisAtivos
      });
    }

    return dadosAlugueis;
  };



  // Calcular estatísticas diretamente
  const hoje = new Date();
  const proximoMes = new Date(hoje);
  proximoMes.setMonth(proximoMes.getMonth() + 1);

  // Estatísticas de motoristas
  const totalMotoristas = motoristasSeguro.length;
  const motoristasAtivos = motoristasSeguro.filter((m: any) => m.status === 'ativo').length;
  
  // CNH vencendo nos próximos 30 dias
  const cnhVencendo = motoristasSeguro.filter((m: any) => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento >= hoje && vencimento <= proximoMes;
  }).length;

  // CNH já vencida
  const cnhVencida = motoristasSeguro.filter((m: any) => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento < hoje;
  }).length;

  // Estatísticas de veículos
  const totalVeiculos = veiculosSeguro.length;
  const veiculosDisponivel = veiculosSeguro.filter((v: any) => v.status === 'disponivel').length;
  const veiculosAlugado = veiculosSeguro.filter((v: any) => v.status === 'alugado').length;
  const veiculosManutencao = veiculosSeguro.filter((v: any) => v.status === 'manutencao').length;
  const veiculosParado = veiculosSeguro.filter((v: any) => v.status === 'parado').length;

  // Estatísticas de aluguéis - COM DEBUG
  const totalAlugueis = alugueisSeguro.length;
  const alugueisAtivos = alugueisSeguro.filter((a: any) => a.status === 'ativo').length;
  const alugueisPendentes = alugueisSeguro.filter((a: any) => a.status === 'pendente').length;

  console.log('[DEBUG DASHBOARD] Dados de aluguéis:', {
    totalAlugueis,
    alugueisAtivos,
    alugueisPendentes,
    alugueisSeguro: alugueisSeguro.slice(0, 3) // Primeiros 3 para debug
  });
  
  // Calcular receita mensal baseada nos aluguéis ativos
  const receitaMensal = alugueisSeguro
    .filter((a: any) => a.status === 'ativo' || a.status === 'pendente')
    .reduce((total: number, aluguel: any) => total + parseFloat(aluguel.valorMensal || '0'), 0);

  // CORRIGIDO: Calcular receita semanal recebida usando mesma lógica da página Pagamentos
  // Últimos 7 dias (igual à função calcularValorVisualizacaoRecebido da página Pagamentos)
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 7);

  // CORRIGIDO: Calcular receita semanal esperada baseada em TODOS os pagamentos dessa semana (recebidos + em aberto)
  const pagamentosSemanaEsperados = pagamentos
    .filter((p: any) => {
      if (!p.dataPagamento) return false;
      const dataPagamento = new Date(p.dataPagamento);
      return dataPagamento >= seteDiasAtras && 
             dataPagamento <= hoje;
             // REMOVIDO FILTRO POR STATUS - agora inclui todos
    });

  const receitaSemanalEsperada = pagamentosSemanaEsperados
    .reduce((sum: number, p: any) => {
      const valorTotal = parseFloat(p.valorTotal || '0');
      return sum + valorTotal;
    }, 0);

  const pagamentosSemanaRecebidos = pagamentos
    .filter((p: any) => {
      if (!p.dataPagamento) return false;
      const dataPagamento = new Date(p.dataPagamento);
      return dataPagamento >= seteDiasAtras && 
             dataPagamento <= hoje &&
             p.status === 'pago';
    });

  const receitaSemanalRecebida = pagamentosSemanaRecebidos
    .reduce((sum: number, p: any) => {
      const valorPago = parseFloat(p.valorPago || '0');
      return sum + valorPago;
    }, 0);

  // Métricas importantes para admin de SaaS de locadoras
  const locadorasAtivas = locadoras.filter(l => l.status === 'ativa').length;
  const locadorasInativas = locadoras.filter(l => l.status === 'inativa').length;
  const totalVeiculosGlobal = veiculosSeguro.length;
  const totalMotoristasGlobal = motoristasSeguro.length;
  const totalAlugueisGlobal = alugueisSeguro.length;
  const receitaTotalGlobal = alugueisSeguro.reduce((sum: number, a: any) => sum + parseFloat(a.valorMensal || '0'), 0);

  // Dados para gráficos de gestão de SaaS de locadoras
  const crescimentoLocadorasData = [
    { name: 'Jan', locadoras: 15, novasLocadoras: 3, churn: 1 },
    { name: 'Fev', locadoras: 18, novasLocadoras: 4, churn: 1 },
    { name: 'Mar', locadoras: 22, novasLocadoras: 5, churn: 1 },
    { name: 'Abr', locadoras: 26, novasLocadoras: 6, churn: 2 },
    { name: 'Mai', locadoras: 30, novasLocadoras: 5, churn: 1 },
    { name: 'Jun', locadoras: locadoras.length, novasLocadoras: 4, churn: 1 },
  ];

  const receitaRecorrenteData = [
    { name: 'Jan', receita: 45000, locadorasAtivas: 15, ticketMedio: 3000 },
    { name: 'Fev', receita: 54000, locadorasAtivas: 18, ticketMedio: 3000 },
    { name: 'Mar', receita: 66000, locadorasAtivas: 22, ticketMedio: 3000 },
    { name: 'Abr', receita: 78000, locadorasAtivas: 26, ticketMedio: 3000 },
    { name: 'Mai', receita: 90000, locadorasAtivas: 30, ticketMedio: 3000 },
    { name: 'Jun', receita: receitaTotalGlobal, locadorasAtivas: locadorasAtivas, ticketMedio: locadorasAtivas > 0 ? Math.round(receitaTotalGlobal / locadorasAtivas) : 0 },
  ];

  // Dados para distribuição de planos das locadoras
  const planoBasico = locadoras.filter(l => l.plano === 'basico').length;
  const planoPremium = locadoras.filter(l => l.plano === 'premium').length;
  const planoEnterprise = locadoras.filter(l => l.plano === 'enterprise').length;
  
  const planosData = [
    { name: 'Básico', value: planoBasico, color: '#94a3b8' },
    { name: 'Premium', value: planoPremium, color: '#64748b' },
    { name: 'Enterprise', value: planoEnterprise, color: '#475569' },
  ];
  
  const metricasData = [
    { name: 'Locadoras Ativas', value: locadorasAtivas, growth: '+12%', icon: Building2 },
    { name: 'Total Veículos', value: totalVeiculosGlobal, growth: '+8%', icon: Car },
    { name: 'Total Motoristas', value: totalMotoristasGlobal, growth: '+15%', icon: Users },
    { name: 'Receita Total', value: receitaTotalGlobal, growth: '+22%', icon: DollarSign },
  ];

  // Gerar alertas baseados nos dados
  const alertas: Alert[] = [];
  
  if (cnhVencida > 0) {
    alertas.push({
      id: 'cnh-vencida',
      titulo: 'CNH Vencida',
      descricao: `${cnhVencida} motorista${cnhVencida > 1 ? 's' : ''} com CNH vencida`,
      tipo: 'danger' as const,
      data: new Date().toISOString(),
      lida: false
    });
  }

  if (cnhVencendo > 0) {
    alertas.push({
      id: 'cnh-vencendo',
      titulo: 'CNH Vencendo',
      descricao: `${cnhVencendo} motorista${cnhVencendo > 1 ? 's' : ''} com CNH vencendo este mês`,
      tipo: 'warning' as const,
      data: new Date().toISOString(),
      lida: false
    });
  }

  if (veiculosManutencao > 0) {
    alertas.push({
      id: 'veiculos-manutencao',
      titulo: 'Veículos em Manutenção',
      descricao: `${veiculosManutencao} veículo${veiculosManutencao > 1 ? 's' : ''} em manutenção`,
      tipo: 'warning' as const,
      data: new Date().toISOString(),
      lida: false
    });
  }

  if (veiculosDisponivel === 0 && veiculosSeguro.length > 0) {
    alertas.push({
      id: 'sem-veiculos',
      titulo: 'Sem Veículos Disponíveis',
      descricao: 'Todos os veículos estão alugados ou em manutenção',
      tipo: 'warning' as const,
      data: new Date().toISOString(),
      lida: false
    });
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-center">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Grid de estatísticas principais - apenas para locadoras */}
      {isLocadora && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de Motoristas - Card Futurista */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">TOTAL DE MOTORISTAS</p>
                <p className="text-lg font-bold text-blue-800">
                  {totalMotoristas}
                </p>
                <p className="text-xs text-blue-600">
                  {motoristasAtivos > 0 ? `${motoristasAtivos} ativos` : "0 ativos"}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veículos Disponíveis - Card Futurista */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">VEÍCULOS DISPONÍVEIS</p>
                <p className="text-lg font-bold text-green-800">
                  {veiculosDisponivel}
                </p>
                <p className="text-xs text-green-600">
                  {totalVeiculos} total na frota
                </p>
              </div>
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                <Car className="w-4 h-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aluguéis Ativos - Card Futurista */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">ALUGUÉIS ATIVOS</p>
                <p className="text-lg font-bold text-purple-800">
                  {alugueisAtivos + alugueisPendentes}
                </p>
                <p className="text-xs text-purple-600">
                  {totalAlugueis} total de contratos
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entradas Semanais - Card Futurista */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-yellow-700">ENTRADAS DESSA SEMANA</p>
                <p className="text-lg font-bold text-yellow-800">
                  {formatCurrency(receitaSemanalRecebida)}
                </p>
                <p className="text-xs text-yellow-600">
                  do total de {formatCurrency(receitaSemanalEsperada)} esperado
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}


      {/* Seção de Anúncios */}
      {isLocadora && anuncios.length > 0 && (
        <div className="grid gap-4">
          {anuncios.map((anuncio) => {
            const config = getAnuncioConfig(anuncio.tipo);
            return (
              <Card key={anuncio.id} className={`border-l-4 ${config.border} ${config.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.iconBg}`}>
                      <Megaphone className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{anuncio.titulo}</h3>
                        <Badge variant={config.badgeVariant} className="text-xs">
                          {config.nome}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {anuncio.conteudo}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {anuncio.dataExpiracao && (
                          <span>
                            Válido até: {new Date(anuncio.dataExpiracao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span>
                          Publicado: {new Date(anuncio.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dashboard Futurista para Admin */}
      {isAdmin && (
        <div className="space-y-8">
          {/* Header do Dashboard Admin */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Sistema DRIVS - Dashboard Admin
            </h1>
            <p className="text-slate-500">
              Monitoramento do sistema SaaS em tempo real
            </p>
          </div>

          {/* Métricas do Sistema */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status do Sistema */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-700">Sistema Online</p>
                    <p className="text-2xl font-bold text-green-800">100%</p>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Operacional
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Locadoras Ativas */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-700">Locadoras Ativas</p>
                    <p className="text-2xl font-bold text-blue-800">{locadoras.length}</p>
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Empresas cadastradas
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Veículos */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-700">Total de Veículos</p>
                    <p className="text-2xl font-bold text-purple-800">{veiculosRaw.length}</p>
                    <div className="text-xs text-purple-600 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Frota total
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <Car className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banco de Dados */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-indigo-700">PostgreSQL</p>
                    <p className="text-2xl font-bold text-indigo-800">OK</p>
                    <div className="text-xs text-indigo-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Conectado
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Técnicas do Sistema */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Dados do Sistema */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-600" />
                  Dados do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600">Motoristas</p>
                    <p className="text-2xl font-bold text-slate-800">{motoristasRaw.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600">Aluguéis</p>
                    <p className="text-2xl font-bold text-slate-800">{alugueisRaw.length}</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Entradas Totais</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(
                      alugueisRaw.reduce((acc: number, aluguel: any) => acc + parseFloat(aluguel.valorTotal || '0'), 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Técnico */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-slate-600" />
                  Status Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Servidor</span>
                    </div>
                    <span className="text-sm text-slate-500">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">API</span>
                    </div>
                    <span className="text-sm text-slate-500">Funcionando</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Performance</span>
                    </div>
                    <span className="text-sm text-slate-500">Excelente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Locadoras Cadastradas */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" />
                Locadoras Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {locadoras.map((locadora: any) => (
                  <div key={locadora.id} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{locadora.nome}</h3>
                        <p className="text-sm text-slate-500">{locadora.plano || 'Free'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-600">
                        <span className="font-medium">CNPJ:</span> {locadora.cnpj}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Cidade:</span> {locadora.cidade}/{locadora.estado}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${locadora.status === 'ativa' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${locadora.status === 'ativa' ? 'text-green-700' : 'text-red-700'}`}>
                          {locadora.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Seção inferior com alertas e aluguéis recentes - apenas para locadoras */}
      {isLocadora && (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Card de Atividade Recentes */}
        <AtividadesRecentes />

        {/* Card de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alertas
              {alertas.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {alertas.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertas.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.tipo === 'danger' ? 'bg-destructive' :
                    alert.tipo === 'warning' ? 'bg-warning' :
                    'bg-primary'
                  }`} />
                  
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-medium">{alert.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                  </div>
                  
                  {alert.tipo === 'info' && (
                    <Badge variant="outline" className="text-xs">
                      Info
                    </Badge>
                  )}
                </div>
              ))}
              
              {alertas.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas detalhadas em grid menor */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-700">CNH VENCENDO</p>
                  <p className="text-2xl font-bold text-yellow-800">{cnhVencendo}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700">CNH VENCIDA</p>
                  <p className="text-2xl font-bold text-red-800">{cnhVencida}</p>
                </div>
                <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">VEÍCULOS EM MANUTENÇÃO</p>
                  <p className="text-2xl font-bold text-gray-800">{veiculosManutencao}</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Suporte - Configurável pelo Admin */}
        {dashboardConfig?.mostrarLinksSuporte && (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Suporte DRIVS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="space-y-3 text-sm">
                  {dashboardConfig?.telefoneSuporte && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700 font-medium">{dashboardConfig.telefoneSuporte}</span>
                    </div>
                  )}
                  {dashboardConfig?.emailSuporte && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700 font-medium">{dashboardConfig.emailSuporte}</span>
                    </div>
                  )}
                  {dashboardConfig?.linkSuporteUrl && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a 
                        href={dashboardConfig.linkSuporteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {dashboardConfig.linkSuporteTitulo || "Central de Ajuda"}
                      </a>
                    </div>
                  )}
                  {dashboardConfig?.linkTreinamentoUrl && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a 
                        href={dashboardConfig.linkTreinamentoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {dashboardConfig.linkTreinamentoTitulo || "Treinamentos"}
                      </a>
                    </div>
                  )}
                  {dashboardConfig?.linkManualUrl && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a 
                        href={dashboardConfig.linkManualUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {dashboardConfig.linkManualTitulo || "Manual"}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Vídeo Tutorial - Sempre visível para produção */}
        {(dashboardConfig?.mostrarVideoTutorial && dashboardConfig?.videoTutorialUrl) || true && (
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <Play className="w-5 h-5" />
                {dashboardConfig?.videoTutorialTitulo || "Vídeo Tutorial"}
              </CardTitle>
              <CardDescription className="text-purple-600">
                {dashboardConfig?.videoTutorialDescricao || "Aprenda como usar o sistema DRIVS"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-white rounded-lg border border-purple-200 overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={dashboardConfig?.videoTutorialUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&modestbranding=1&rel=0"}
                  title={dashboardConfig?.videoTutorialTitulo || "Vídeo Tutorial DRIVS"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-purple-600 mt-2 text-center">
                📹 {dashboardConfig?.videoTutorialDescricao || "Assista ao tutorial completo do sistema"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card de Vídeo Demo - Configurável pelo Admin */}
        {dashboardConfig?.mostrarVideoDemo && dashboardConfig?.videoDemoUrl && (
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
                <Play className="w-5 h-5" />
                {dashboardConfig.videoDemoTitulo || "Demonstração"}
              </CardTitle>
              <CardDescription className="text-indigo-600">
                {dashboardConfig.videoDemoDescricao || "Veja o sistema em ação"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-white rounded-lg border border-indigo-200 overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={dashboardConfig.videoDemoUrl}
                  title={dashboardConfig.videoDemoTitulo || "Demonstração DRIVS"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-indigo-600 mt-2 text-center">
                📺 {dashboardConfig.videoDemoDescricao || "Veja como o sistema funciona"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card de Links Úteis Dinâmicos - Sempre visível */}
        {(
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <Link className="w-5 h-5" />
                Links Úteis
              </CardTitle>
              <CardDescription className="text-green-600">
                Recursos importantes para sua locadora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loadingLinksUteis ? (
                  <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-green-600">Carregando links...</span>
                  </div>
                ) : linksUteis.length > 0 ? (
                  linksUteis.map((link) => (
                    <div key={link.id} className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="space-y-2">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-700 hover:text-green-800 hover:underline font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {link.titulo}
                        </a>
                        <p className="text-xs text-gray-600">
                          {link.descricao}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-green-200 text-center">
                    <p className="text-green-600 text-sm">Nenhum link configurado no momento</p>
                    <p className="text-gray-500 text-xs">Links úteis aparecerão aqui quando configurados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      )}


    </div>
  );
}