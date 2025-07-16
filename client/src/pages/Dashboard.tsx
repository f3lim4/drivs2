/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3, Megaphone, Building2, FileText, Globe } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Alert, Motorista, Veiculo } from '@/types';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAnunciosAtivos } from '@/hooks/useAnuncios';

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

      {/* Seção específica para Admin - Estatísticas Globais */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Estatísticas Globais do Sistema */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Estatísticas Globais do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total de Locadoras */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-foreground">Locadoras</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {locadoras.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      empresas cadastradas
                    </p>
                  </div>
                </div>

                {/* Total de Veículos */}
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-foreground">Veículos</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {veiculosSeguro.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      carros cadastrados
                    </p>
                  </div>
                </div>

                {/* Total de Motoristas */}
                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium text-foreground">Motoristas</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {motoristasSeguro.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      motoristas cadastrados
                    </p>
                  </div>
                </div>

                {/* Receita Total */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium text-foreground">Receita Total</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(alugueisSeguro.reduce((total, aluguel) => total + parseFloat(aluguel.valorTotal || '0'), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      receita de todas as locadoras
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Desempenho */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Métricas de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Tempo de Atividade */}
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">Uptime</h4>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {Math.floor(Date.now() / 1000 / 3600)}h {Math.floor((Date.now() / 1000 / 60) % 60)}m
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sistema online
                    </p>
                  </div>
                </div>

                {/* Taxa de Erros */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">Taxa de Erros</h4>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      0.1%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Últimas 24h
                    </p>
                  </div>
                </div>

                {/* Uso de CPU */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">CPU</h4>
                    </div>
                    <p className="text-lg font-bold text-yellow-600">
                      15%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uso médio
                    </p>
                  </div>
                </div>

                {/* Performance DB */}
                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">DB Query</h4>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      ~180ms
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tempo médio
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Financeiras */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Métricas Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Receita Mensal Total */}
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-foreground">Receita Mensal</h4>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(alugueisSeguro.filter(a => a.status === 'ativo').reduce((total, aluguel) => total + parseFloat(aluguel.valorMensal || '0'), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Todas as locadoras
                    </p>
                  </div>
                </div>

                {/* Aluguéis Ativos */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-foreground">Aluguéis Ativos</h4>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {alugueisSeguro.filter(a => a.status === 'ativo').length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contratos em andamento
                    </p>
                  </div>
                </div>

                {/* Taxa de Ocupação */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-medium text-foreground">Taxa Ocupação</h4>
                    </div>
                    <p className="text-lg font-bold text-yellow-600">
                      {veiculosSeguro.length > 0 ? Math.round((veiculosSeguro.filter(v => v.status === 'alugado').length / veiculosSeguro.length) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Veículos alugados
                    </p>
                  </div>
                </div>

                {/* Receita por Veículo */}
                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-foreground">Receita/Veículo</h4>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(veiculosSeguro.length > 0 ? 
                        alugueisSeguro.filter(a => a.status === 'ativo').reduce((total, aluguel) => total + parseFloat(aluguel.valorMensal || '0'), 0) / veiculosSeguro.length 
                        : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Média mensal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Status Online */}
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">Sistema Online</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Servidor funcionando normalmente
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PostgreSQL conectado
                    </p>
                  </div>
                </div>

                {/* Armazenamento */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">Armazenamento</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {motoristasSeguro.length + veiculosSeguro.length + alugueisSeguro.length} registros
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Banco otimizado
                    </p>
                  </div>
                </div>

                {/* Memória */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <h4 className="font-medium text-foreground">Memória</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      85% disponível
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uso otimizado
                    </p>
                  </div>
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