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
  const { profile } = useAuth();
  
  // Buscar dados dos motoristas
  const { data: motoristas = [], isLoading: loadingMotoristas } = useQuery<Motorista[]>({
    queryKey: ['/api/motoristas'],
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Buscar dados dos veículos
  const { data: veiculos = [], isLoading: loadingVeiculos } = useQuery<Veiculo[]>({
    queryKey: ['/api/veiculos'],
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Buscar dados dos aluguéis
  const { data: alugueis = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: ['/api/alugueis'],
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const loading = loadingMotoristas || loadingVeiculos || loadingAlugueis;

  // Debug: log dos dados carregados
  console.log('Dashboard - Dados carregados:', {
    motoristas: motoristas.length,
    veiculos: veiculos.length,
    loading,
    profile: profile?.type,
    motoristasSample: motoristas[0] || 'nenhum',
    veiculosSample: veiculos[0] || 'nenhum'
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
  const totalMotoristas = motoristas.length;
  const motoristasAtivos = motoristas.filter(m => m.status === 'ativo').length;
  
  // CNH vencendo nos próximos 30 dias
  const cnhVencendo = motoristas.filter(m => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento >= hoje && vencimento <= proximoMes;
  }).length;

  // CNH já vencida
  const cnhVencida = motoristas.filter(m => {
    const vencimento = new Date(m.vencimentoCnh);
    return vencimento < hoje;
  }).length;

  // Estatísticas de veículos
  const totalVeiculos = veiculos.length;
  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel').length;
  const veiculosAlugados = veiculos.filter(v => v.status === 'alugado').length;
  const veiculosManutencao = veiculos.filter(v => v.status === 'manutencao').length;

  // Estatísticas de aluguéis
  const totalAlugueis = alugueis.length;
  const alugueisAtivos = alugueis.filter((a: any) => a.status === 'ativo').length;
  const alugueisPendentes = alugueis.filter((a: any) => a.status === 'pendente').length;
  
  // Calcular receita mensal baseada nos aluguéis ativos
  const receitaMensal = alugueis
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
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum aluguel encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os aluguéis recentes aparecerão aqui
              </p>
            </div>
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