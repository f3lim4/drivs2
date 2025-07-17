/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3, Megaphone, Building2, FileText, Globe, Zap, Cpu, Database, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Alert, Motorista, Veiculo } from '@/types';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAnunciosAtivos } from '@/hooks/useAnuncios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const { profile, isLocadora, isAdmin } = useAuth();
  
  // Buscar anúncios ativos
  const { data: anuncios = [], isLoading: loadingAnuncios } = useAnunciosAtivos();

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

  // Calcular receita semanal (mensal dividido por 4 semanas)
  const receitaSemanal = receitaMensal / 4;

  // Dados para os gráficos
  const performanceData = [
    { name: 'Jan', cpu: 12, memoria: 45, queries: 180 },
    { name: 'Fev', cpu: 15, memoria: 52, queries: 165 },
    { name: 'Mar', cpu: 18, memoria: 48, queries: 195 },
    { name: 'Abr', cpu: 14, memoria: 44, queries: 170 },
    { name: 'Mai', cpu: 16, memoria: 49, queries: 185 },
    { name: 'Jun', cpu: 15, memoria: 46, queries: 175 },
  ];

  const receitaData = [
    { name: 'Jan', receita: 45000, alugueis: 12 },
    { name: 'Fev', receita: 52000, alugueis: 15 },
    { name: 'Mar', receita: 48000, alugueis: 14 },
    { name: 'Abr', receita: 58000, alugueis: 18 },
    { name: 'Mai', receita: 62000, alugueis: 20 },
    { name: 'Jun', receita: receitaMensal, alugueis: alugueisSeguro.filter(a => a.status === 'ativo').length },
  ];

  const statusData = [
    { name: 'Alugado', value: veiculosSeguro.filter(v => v.status === 'alugado').length, color: '#64748b' },
    { name: 'Disponível', value: veiculosSeguro.filter(v => v.status === 'disponivel').length, color: '#94a3b8' },
    { name: 'Manutenção', value: veiculosSeguro.filter(v => v.status === 'manutencao').length, color: '#cbd5e1' },
  ];

  const metricasData = [
    { name: 'Locadoras', value: locadoras.length, growth: '+12%' },
    { name: 'Veículos', value: veiculosSeguro.length, growth: '+8%' },
    { name: 'Motoristas', value: motoristasSeguro.length, growth: '+15%' },
    { name: 'Receita', value: receitaMensal, growth: '+22%' },
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
      {/* Seção de Anúncios */}
      {isLocadora && anuncios.length > 0 && (
        <div className="grid gap-4">
          {anuncios.map((anuncio) => (
            <Card key={anuncio.id} className="border-l-4 border-l-blue-500 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground">{anuncio.titulo}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {anuncio.tipo}
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
          ))}
        </div>
      )}

      {/* Dashboard Clean para Admin */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metricasData.map((metric, index) => (
              <Card key={metric.name} className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {metric.name === 'Receita' ? formatCurrency(metric.value) : metric.value}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {metric.growth}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      {metric.name === 'Locadoras' && <Building2 className="w-6 h-6 text-slate-600" />}
                      {metric.name === 'Veículos' && <Car className="w-6 h-6 text-slate-600" />}
                      {metric.name === 'Motoristas' && <Users className="w-6 h-6 text-slate-600" />}
                      {metric.name === 'Receita' && <DollarSign className="w-6 h-6 text-slate-600" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráficos Principais */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Receita e Aluguéis */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  Evolução da Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={receitaData}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1e293b'
                        }}
                        formatter={(value: any) => [formatCurrency(value), 'Receita']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#64748b" 
                        fillOpacity={1}
                        fill="url(#colorReceita)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance do Sistema */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  Performance do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1e293b'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#64748b" 
                        strokeWidth={2}
                        dot={{ fill: '#64748b', strokeWidth: 0, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memoria" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        dot={{ fill: '#94a3b8', strokeWidth: 0, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status dos Veículos */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-slate-600" />
                Status da Frota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Gráfico de Pizza */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1e293b'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda e Status */}
                <div className="flex flex-col justify-center space-y-4">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-semibold text-slate-800">{item.value}</span>
                        <p className="text-xs text-slate-600">veículos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid de estatísticas principais - apenas para locadoras */}
      {isLocadora && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Motoristas - Card Personalizado */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Motoristas
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {totalMotoristas}
                </p>
                <p className="text-sm text-muted-foreground">
                  {motoristasAtivos > 0 ? `${motoristasAtivos} ativos` : "0 ativos"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veículos Disponíveis - Card Personalizado */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <Car className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Veículos Disponíveis
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {veiculosDisponiveis}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalVeiculos} total na frota
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aluguéis Ativos - Card Personalizado */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aluguéis Ativos
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {alugueisAtivos + alugueisPendentes}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalAlugueis} total de contratos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal - Card Personalizado */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Receita Mensal
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(receitaMensal)}
                </p>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Semanal:</span> {formatCurrency(receitaSemanal)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Seção inferior com alertas e aluguéis recentes - apenas para locadoras */}
      {isLocadora && (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Atividade Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Atividade Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalAlugueis > 0 ? (
              <div className="space-y-4">
                {alugueisSeguro.slice(0, 3).map((aluguel: any) => (
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
                      <p className="font-medium text-sm">{formatCurrency(parseFloat(aluguel.valorTotal))}</p>
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
      )}
    </div>
  );
}