/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3, Megaphone, Building2, FileText, Globe, Zap, Cpu, Database, TrendingDown, Crown, Phone, ExternalLink, Mail } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardStats, Alert, Motorista, Veiculo } from '@/types';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAnunciosAtivos } from '@/hooks/useAnuncios';
import { AtividadesRecentes } from '@/components/dashboard/AtividadesRecentes';


export default function Dashboard() {
  const { profile, isLocadora, isAdmin } = useAuth();
  
  // Buscar anúncios ativos
  const { data: anuncios = [], isLoading: loadingAnuncios } = useAnunciosAtivos();

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

  // Buscar dados das locadoras (apenas para admin)
  const { data: locadoras = [], isLoading: loadingLocadoras } = useQuery<any[]>({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Construir URLs com filtro de locadora se necessário
  const motoristasUrl = isLocadora && profile?.locadoraId 
    ? `/api/motoristas?locadoraId=${profile.locadoraId}`
    : '/api/motoristas';
  
  const veiculosUrl = isLocadora && profile?.locadoraId 
    ? `/api/veiculos?locadoraId=${profile.locadoraId}`
    : '/api/veiculos';
  
  const alugueisUrl = isLocadora && profile?.locadoraId 
    ? `/api/alugueis?locadoraId=${profile.locadoraId}`
    : '/api/alugueis';
  
  // Buscar dados dos motoristas
  const { data: motoristasRaw = [], isLoading: loadingMotoristas } = useQuery<Motorista[]>({
    queryKey: [motoristasUrl, profile?.locadoraId, isLocadora],
    enabled: !!profile,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  // FILTRO DE SEGURANÇA: Garantir que locadora veja apenas seus motoristas  
  const motoristas = isLocadora && profile?.locadoraId 
    ? motoristasRaw.filter(m => m.locadoraId === profile.locadoraId)
    : motoristasRaw;
  
  // PROTEÇÃO EXTRA: Se for locadora e tiver dados de outras locadoras, mostrar array vazio
  const motoristasSeguro = isLocadora && profile?.locadoraId 
    ? motoristas.every(m => m.locadoraId === profile.locadoraId) ? motoristas : []
    : motoristas;

  // Buscar dados dos veículos
  const { data: veiculosRaw = [], isLoading: loadingVeiculos } = useQuery<Veiculo[]>({
    queryKey: [veiculosUrl, profile?.locadoraId, isLocadora],
    enabled: !!profile,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  // FILTRO DE SEGURANÇA: Garantir que locadora veja apenas seus veículos
  const veiculos = isLocadora && profile?.locadoraId 
    ? veiculosRaw.filter(v => v.locadoraId === profile.locadoraId)
    : veiculosRaw;
  
  // PROTEÇÃO EXTRA: Se for locadora e tiver dados de outras locadoras, mostrar array vazio
  const veiculosSeguro = isLocadora && profile?.locadoraId 
    ? veiculos.every(v => v.locadoraId === profile.locadoraId) ? veiculos : []
    : veiculos;

  // Buscar dados dos aluguéis
  const { data: alugueisRaw = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: [alugueisUrl, profile?.locadoraId, isLocadora],
    enabled: !!profile,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  // FILTRO DE SEGURANÇA: Garantir que locadora veja apenas seus aluguéis
  const alugueis = isLocadora && profile?.locadoraId 
    ? alugueisRaw.filter((a: any) => a.locadoraId === profile.locadoraId)
    : alugueisRaw;
  
  // PROTEÇÃO EXTRA: Se for locadora e tiver dados de outras locadoras, mostrar array vazio
  const alugueisSeguro = isLocadora && profile?.locadoraId 
    ? alugueis.every((a: any) => a.locadoraId === profile.locadoraId) ? alugueis : []
    : alugueis;

  // Buscar dados financeiros para o gráfico
  const pagamentosUrl = isLocadora && profile?.locadoraId 
    ? `/api/pagamentos?locadoraId=${profile.locadoraId}`
    : '/api/pagamentos';
  
  const despesasUrl = isLocadora && profile?.locadoraId 
    ? `/api/despesas?locadoraId=${profile.locadoraId}`
    : '/api/despesas';

  const { data: pagamentos = [] } = useQuery({
    queryKey: [pagamentosUrl, profile?.locadoraId],
    enabled: !!profile && isLocadora,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: [despesasUrl, profile?.locadoraId],
    enabled: !!profile && isLocadora,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const loading = loadingMotoristas || loadingVeiculos || loadingAlugueis;

  // Log apenas se houver problemas para debug
  if (isLocadora && veiculosSeguro.length > 1) {
    console.log('Dashboard - Verificando isolamento:', {
      locadoraId: profile?.locadoraId,
      veiculosTotal: veiculosSeguro.length,
      primeiroVeiculo: veiculosSeguro[0]?.locadoraId,
      segundoVeiculo: veiculosSeguro[1]?.locadoraId
    });
  }

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
      
      // Calcular receita do mês (pagamentos recebidos)
      const receitaMes = pagamentos
        .filter((p: any) => {
          const dataPagamento = new Date(p.data);
          return dataPagamento.getMonth() + 1 === mes && 
                 dataPagamento.getFullYear() === ano &&
                 p.status === 'pago';
        })
        .reduce((total: number, p: any) => total + parseFloat(p.valor || '0'), 0);

      // Calcular despesas do mês (despesas pagas)
      const despesasMes = despesas
        .filter((d: any) => {
          const dataDespesa = new Date(d.data);
          return dataDespesa.getMonth() + 1 === mes && 
                 dataDespesa.getFullYear() === ano &&
                 d.status === 'pago';
        })
        .reduce((total: number, d: any) => total + parseFloat(d.valor || '0'), 0);

      // Calcular despesas fixas mensais (IPVA, seguro, rastreador)
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
        receita: Math.round(receitaMes),
        despesas: Math.round(despesasMes + despesasFixasMes),
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
  const motoristasAtivos = motoristasSeguro.filter(m => m.status === 'ativo').length;
  
  // CNH vencendo nos próximos 30 dias
  const cnhVencendo = motoristasSeguro.filter(m => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento >= hoje && vencimento <= proximoMes;
  }).length;

  // CNH já vencida
  const cnhVencida = motoristasSeguro.filter(m => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento < hoje;
  }).length;

  // Estatísticas de veículos
  const totalVeiculos = veiculosSeguro.length;
  const veiculosDisponivel = veiculosSeguro.filter(v => v.status === 'disponivel').length;
  const veiculosAlugado = veiculosSeguro.filter(v => v.status === 'alugado').length;
  const veiculosManutencao = veiculosSeguro.filter(v => v.status === 'manutencao').length;
  const veiculosParado = veiculosSeguro.filter(v => v.status === 'parado').length;

  // Estatísticas de aluguéis
  const totalAlugueis = alugueisSeguro.length;
  const alugueisAtivos = alugueisSeguro.filter((a: any) => a.status === 'ativo').length;
  const alugueisPendentes = alugueisSeguro.filter((a: any) => a.status === 'pendente').length;
  
  // Calcular receita mensal baseada nos aluguéis ativos
  const receitaMensal = alugueisSeguro
    .filter((a: any) => a.status === 'ativo' || a.status === 'pendente')
    .reduce((total: number, aluguel: any) => total + parseFloat(aluguel.valorMensal || '0'), 0);

  // Calcular receita semanal esperada (baseada nos aluguéis ativos)
  const receitaSemanalEsperada = alugueisSeguro
    .filter((a: any) => a.status === 'ativo' || a.status === 'pendente')
    .reduce((total: number, aluguel: any) => {
      const valorMensal = parseFloat(aluguel.valorMensal || '0');
      const valorSemanal = valorMensal / 4; // Divide por 4 semanas
      return total + valorSemanal;
    }, 0);

  // Calcular receita semanal já recebida (pagamentos desta semana)
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo da semana atual
  inicioSemana.setHours(0, 0, 0, 0);
  
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado da semana atual
  fimSemana.setHours(23, 59, 59, 999);

  const receitaSemanalRecebida = pagamentos
    .filter((p: any) => {
      const dataPagamento = new Date(p.data);
      return dataPagamento >= inicioSemana && 
             dataPagamento <= fimSemana &&
             p.status === 'pago';
    })
    .reduce((sum: number, p: any) => {
      const valorBase = parseFloat(p.valor || '0');
      const valorJuros = parseFloat(p.valorJuros || '0');
      const valorMulta = parseFloat(p.valorMulta || '0');
      return sum + valorBase + valorJuros + valorMulta;
    }, 0);

  // Métricas importantes para admin de SaaS de locadoras
  const locadorasAtivas = locadoras.filter(l => l.status === 'ativa').length;
  const locadorasInativas = locadoras.filter(l => l.status === 'inativa').length;
  const totalVeiculosGlobal = veiculosSeguro.length;
  const totalMotoristasGlobal = motoristasSeguro.length;
  const totalAlugueisGlobal = alugueisSeguro.length;
  const receitaTotalGlobal = alugueisSeguro.reduce((sum, a) => sum + (a.valores?.mensal || 0), 0);

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
      tipo: 'danger'
    });
  }

  if (cnhVencendo > 0) {
    alertas.push({
      id: 'cnh-vencendo',
      titulo: 'CNH Vencendo',
      descricao: `${cnhVencendo} motorista${cnhVencendo > 1 ? 's' : ''} com CNH vencendo este mês`,
      tipo: 'warning'
    });
  }

  if (veiculosManutencao > 0) {
    alertas.push({
      id: 'veiculos-manutencao',
      titulo: 'Veículos em Manutenção',
      descricao: `${veiculosManutencao} veículo${veiculosManutencao > 1 ? 's' : ''} em manutenção`,
      tipo: 'warning'
    });
  }

  if (veiculosDisponivel === 0 && veiculos.length > 0) {
    alertas.push({
      id: 'sem-veiculos',
      titulo: 'Sem Veículos Disponíveis',
      descricao: 'Todos os veículos estão alugados ou em manutenção',
      tipo: 'warning'
    });
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Grid de estatísticas principais - apenas para locadoras */}
      {isLocadora && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Receita Semanal - Card Futurista */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-yellow-700">TOTAL RECEBIDO ESSA SEMANA</p>
                <p className="text-lg font-bold text-yellow-800">
                  {formatCurrency(receitaSemanalRecebida)}
                </p>
                <p className="text-xs text-yellow-600">
                  de {formatCurrency(receitaSemanalEsperada)} esperado
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
                        {formatDate(anuncio.dataFim) && (
                          <span>
                            Válido até: {formatDate(anuncio.dataFim)}
                          </span>
                        )}
                        {formatDate(anuncio.dataInicio) && (
                          <span>
                            Publicado: {formatDate(anuncio.dataInicio)}
                          </span>
                        )}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Status do Sistema */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-700">Sistema Online</p>
                    <p className="text-2xl font-bold text-green-800">100%</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Operacional
                    </p>
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
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Empresas cadastradas
                    </p>
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
                    <p className="text-xs text-purple-600 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Frota total
                    </p>
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
                    <p className="text-xs text-indigo-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Conectado
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Técnicas do Sistema */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dados do Sistema */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-600" />
                  Dados do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm font-medium text-slate-600">Receita Total</p>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="grid gap-6 md:grid-cols-2">
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
        <div className="grid gap-4 md:grid-cols-3">
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

        {/* Card de Suporte */}
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
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700 font-medium">(11) 99999-9999</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700 font-medium">suporte@drivs.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <a 
                    href="https://drivs.com.br/suporte" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Central de Ajuda
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}