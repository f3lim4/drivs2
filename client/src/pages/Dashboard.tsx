/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Alert, Motorista, Veiculo } from '@/types';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { profile, isLocadora } = useAuth();
  
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

  const loading = loadingMotoristas || loadingVeiculos || loadingAlugueis;

  // Debug: log dos dados carregados
  console.log('Dashboard - Dados carregados:', {
    motoristas: motoristasSeguro.length,
    veiculos: veiculosSeguro.length,
    alugueis: alugueisSeguro.length,
    loading,
    profile: profile?.type,
    locadoraId: profile?.locadoraId,
    isLocadora,
    motoristasSample: motoristasSeguro[0] || 'nenhum',
    veiculosSample: veiculosSeguro[0] || 'nenhum',
    aluguelSample: alugueisSeguro[0] || 'nenhum'
  });

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
  const veiculosDisponiveis = veiculosSeguro.filter(v => v.status === 'disponivel').length;
  const veiculosAlugados = veiculosSeguro.filter(v => v.status === 'alugado').length;
  const veiculosManutencao = veiculosSeguro.filter(v => v.status === 'manutencao').length;

  // Estatísticas de aluguéis
  const totalAlugueis = alugueisSeguro.length;
  const alugueisAtivos = alugueisSeguro.filter((a: any) => a.status === 'ativo').length;
  const alugueisPendentes = alugueisSeguro.filter((a: any) => a.status === 'pendente').length;
  
  // Calcular receita mensal baseada nos aluguéis ativos
  const receitaMensal = alugueisSeguro
    .filter((a: any) => a.status === 'ativo' || a.status === 'pendente')
    .reduce((total: number, aluguel: any) => total + parseFloat(aluguel.valorMensal || '0'), 0);

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

  if (veiculosDisponiveis === 0 && veiculos.length > 0) {
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
        <DrivsHeader 
          title="Dashboard"
          subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header da página */}
      <DrivsHeader 
        title="Dashboard"
        subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
      />

      {/* Grid de estatísticas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Motoristas */}
        <StatCard
          title="Total de Motoristas"
          value={totalMotoristas}
          icon={<Activity />}
          variant="blue"
          trend={{
            value: "12%",
            isPositive: true,
            label: "vs mês anterior"
          }}
        />

        {/* Veículos Disponíveis */}
        <StatCard
          title="Veículos Disponíveis"
          value={veiculosDisponiveis}
          icon={<Car />}
          variant="green"
        />

        {/* Aluguéis Ativos */}
        <StatCard
          title="Aluguéis Ativos"
          value={alugueisAtivos + alugueisPendentes}
          icon={<BarChart3 />}
          variant="yellow"
        />

        {/* Receita Mensal */}
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(receitaMensal)}
          icon={<DollarSign />}
          variant="green"
          trend={{
            value: "8%",
            isPositive: true,
            label: "vs mês anterior"
          }}
        />
      </div>

      {/* Seção inferior com alertas e aluguéis recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Aluguéis Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Aluguéis Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalAlugueis > 0 ? (
              <div className="space-y-4">
                {alugueis.slice(0, 3).map((aluguel: any) => (
                  <div key={aluguel.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{aluguel.motoristaNome}</p>
                        <p className="text-xs text-muted-foreground">{aluguel.veiculoModelo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(parseFloat(aluguel.valorMensal))}</p>
                      <Badge variant={aluguel.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                        {aluguel.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {totalAlugueis > 3 && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    +{totalAlugueis - 3} mais aluguéis
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nenhum aluguel encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os aluguéis recentes aparecerão aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>

      {/* Estatísticas detalhadas em grid menor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CNH Vencendo</p>
                <p className="text-2xl font-bold text-yellow-600">{cnhVencendo}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CNH Vencida</p>
                <p className="text-2xl font-bold text-red-600">{cnhVencida}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Veículos em Manutenção</p>
                <p className="text-2xl font-bold text-gray-600">{veiculosManutencao}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Car className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}