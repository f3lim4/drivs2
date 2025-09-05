import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingUp, DollarSign, Users, Car, FileText, Search, Filter, ArrowUpDown, Eye, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface RelatorioFinanceiro {
  timestamp: string;
  totalLocadoras: number;
  resumoGeral: {
    receitaTotal: number;
    despesaTotal: number;
    lucroTotal: number;
  };
  locadoras: {
    locadora: {
      id: string;
      nome: string;
      cnpj: string;
      email: string;
      status: string;
      plano: string;
      cidade?: string;
      estado?: string;
    };
    financeiro: {
      totalReceita: number;
      totalDespesas: number;
      lucroLiquido: number;
      margemLucro: number;
    };
    estatisticas: {
      totalVeiculos: number;
      totalMotoristas: number;
      totalPagamentos: number;
      totalDespesasCount: number;
    };
  }[];
}

export default function RelatorioFinanceiroAdmin() {
  const { profile } = useAuth();
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("");
  const [ordenacao, setOrdenacao] = useState("lucroLiquido");

  const { data: relatorio, isLoading, error } = useQuery<RelatorioFinanceiro>({
    queryKey: ["/api/admin/financeiro"],
    refetchInterval: 60000, // Atualizar a cada 60 segundos (menos frequente)
    staleTime: 30000, // Considerar dados frescos por 30 segundos
    retry: 2, // Menos tentativas em caso de erro
  });

  // Verificar se o usuário é admin
  if (profile?.type !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header com skeleton */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Relatório Financeiro - Locadoras
          </h1>
        </div>
        
        {/* Skeleton cards do resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Loading message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Processando dados financeiros de todas as locadoras...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Isso pode levar alguns segundos
          </p>
        </div>
      </div>
    );
  }

  if (error || !relatorio) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Erro ao carregar relatório</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Não foi possível carregar os dados financeiros das locadoras.
        </p>
      </div>
    );
  }

  // Filtrar e ordenar dados
  const locadorasFiltradas = relatorio.locadoras
    .filter(item => {
      const textoMatch = item.locadora.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                       item.locadora.cnpj.includes(filtroTexto) ||
                       item.locadora.email.toLowerCase().includes(filtroTexto.toLowerCase());
      const planoMatch = !filtroPlano || item.locadora.plano === filtroPlano;
      return textoMatch && planoMatch;
    })
    .sort((a, b) => {
      switch (ordenacao) {
        case "receita":
          return b.financeiro.totalReceita - a.financeiro.totalReceita;
        case "despesas":
          return b.financeiro.totalDespesas - a.financeiro.totalDespesas;
        case "margem":
          return b.financeiro.margemLucro - a.financeiro.margemLucro;
        case "nome":
          return a.locadora.nome.localeCompare(b.locadora.nome);
        default: // lucroLiquido
          return b.financeiro.lucroLiquido - a.financeiro.lucroLiquido;
      }
    });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ativo': { label: 'Ativo', variant: 'default' as const },
      'inativo': { label: 'Inativo', variant: 'secondary' as const },
      'suspenso': { label: 'Suspenso', variant: 'destructive' as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanoBadge = (plano: string) => {
    const planoMap = {
      'start': { label: 'Start', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      'business': { label: 'Business', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      'pro': { label: 'Pro', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
      'enterprise': { label: 'Enterprise', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' }
    };
    const planoInfo = planoMap[plano as keyof typeof planoMap] || { label: plano, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
    return <Badge className={planoInfo.color}>{planoInfo.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Relatório Financeiro - Locadoras
        </h1>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(relatorio.resumoGeral.receitaTotal)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              De todas as locadoras ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(relatorio.resumoGeral.despesaTotal)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Custos operacionais totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${relatorio.resumoGeral.lucroTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatarMoeda(relatorio.resumoGeral.lucroTotal)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Resultado consolidado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Ordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filtroPlano} onValueChange={setFiltroPlano}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os planos</SelectItem>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucroLiquido">Maior Lucro</SelectItem>
                <SelectItem value="receita">Maior Receita</SelectItem>
                <SelectItem value="despesas">Maiores Despesas</SelectItem>
                <SelectItem value="margem">Maior Margem</SelectItem>
                <SelectItem value="nome">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Locadoras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Desempenho por Locadora ({locadorasFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locadorasFiltradas.map((item) => (
              <Card key={item.locadora.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Info da Locadora */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.locadora.nome}</h3>
                        {getStatusBadge(item.locadora.status)}
                        {getPlanoBadge(item.locadora.plano)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        CNPJ: {item.locadora.cnpj}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.locadora.email}
                      </p>
                      {item.locadora.cidade && item.locadora.estado && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.locadora.cidade} - {item.locadora.estado}
                        </p>
                      )}
                    </div>

                    {/* Dados Financeiros */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Receita:</span>
                        <span className="font-medium text-green-600">
                          {formatarMoeda(item.financeiro.totalReceita)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Despesas:</span>
                        <span className="font-medium text-red-600">
                          {formatarMoeda(item.financeiro.totalDespesas)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lucro:</span>
                        <span className={`font-bold ${item.financeiro.lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatarMoeda(item.financeiro.lucroLiquido)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Margem:</span>
                        <span className={`font-medium ${item.financeiro.margemLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {item.financeiro.margemLucro.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.estatisticas.totalVeiculos} veículos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.estatisticas.totalMotoristas} motoristas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.estatisticas.totalPagamentos} pagamentos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.estatisticas.totalDespesasCount} despesas
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {locadorasFiltradas.length === 0 && (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma locadora encontrada com os filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}