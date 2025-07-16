import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useDespesas } from '@/hooks/useDespesas';
import { NovaDespesaModal } from '@/components/despesas/NovaDespesaModal';
import { formatCurrency } from '@/lib/utils';

export default function RelatoriosFinanceiros() {
  const { profile } = useAuth();
  const { alugueis } = useAlugueis();
  const { pagamentos } = usePagamentos();
  const { infracoes } = useInfracoes();
  const { despesas } = useDespesas();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Cálculos para o período selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredData = useMemo(() => {
    const isInPeriod = (date: Date) => isWithinInterval(date, { start: monthStart, end: monthEnd });

    const alugueisAtivos = alugueis.filter(aluguel => 
      aluguel.status === 'ativo' && isInPeriod(new Date(aluguel.dataInicio))
    );

    const pagamentosRealizados = pagamentos.filter(pagamento => 
      pagamento.status === 'realizado' && isInPeriod(new Date(pagamento.dataPagamento))
    );

    const infracoesPeriodo = infracoes.filter(infracao => 
      isInPeriod(new Date(infracao.dataInfracao))
    );

    const despesasPeriodo = despesas.filter(despesa => 
      isInPeriod(new Date(despesa.data))
    );

    return { alugueisAtivos, pagamentosRealizados, infracoesPeriodo, despesasPeriodo };
  }, [alugueis, pagamentos, infracoes, despesas, monthStart, monthEnd]);

  // Cálculos financeiros
  const receitaAlugueis = useMemo(() => {
    return filteredData.alugueisAtivos.reduce((total, aluguel) => {
      const valorMensal = parseFloat(aluguel.valorMensal || aluguel.valorDiario);
      return total + valorMensal;
    }, 0);
  }, [filteredData.alugueisAtivos]);

  const receitaPagamentos = useMemo(() => {
    return filteredData.pagamentosRealizados.reduce((total, pagamento) => {
      const valor = parseFloat(pagamento.valorPago || '0');
      return total + valor;
    }, 0);
  }, [filteredData.pagamentosRealizados]);

  const totalDespesas = useMemo(() => {
    return filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa')
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
  }, [filteredData.despesasPeriodo]);

  const totalReceitas = useMemo(() => {
    return filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'receita')
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
  }, [filteredData.despesasPeriodo]);

  const receitaTotal = receitaAlugueis + receitaPagamentos + totalReceitas;
  const lucroLiquido = receitaTotal - totalDespesas;

  // Análise por categoria de despesas
  const despesasPorCategoria = useMemo(() => {
    const categorias = filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa')
      .reduce((acc, despesa) => {
        const categoria = despesa.categoria || 'outros';
        acc[categoria] = (acc[categoria] || 0) + parseFloat(despesa.valor || '0');
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categorias)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData.despesasPeriodo]);

  const categoriasLabels = {
    combustivel: 'Combustível',
    manutencao: 'Manutenção',
    seguro: 'Seguro',
    licenciamento: 'Licenciamento',
    ipva: 'IPVA',
    multa: 'Multa',
    lavagem: 'Lavagem',
    pneus: 'Pneus',
    revisao: 'Revisão',
    reparo: 'Reparo',
    outros: 'Outros'
  };

  const statusBadgeVariants = {
    pago: 'default',
    pendente: 'secondary',
    cancelado: 'destructive'
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise completa da situação financeira
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select 
            value={format(selectedMonth, 'yyyy-MM')} 
            onValueChange={(value) => setSelectedMonth(new Date(value + '-01'))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i);
                return (
                  <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                    {format(date, 'MMMM yyyy', { locale: pt })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <NovaDespesaModal />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receitaTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className={`h-4 w-4 ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(lucroLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aluguéis Ativos</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredData.alugueisAtivos.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contratos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="despesas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="infracoes">Infrações</TabsTrigger>
          <TabsTrigger value="alugueis">Aluguéis</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>
                  Análise das despesas por tipo no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {despesasPorCategoria.map(({ categoria, valor }) => (
                    <div key={categoria} className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {categoriasLabels[categoria as keyof typeof categoriasLabels] || categoria}
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(valor)}
                      </span>
                    </div>
                  ))}
                  {despesasPorCategoria.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma despesa registrada neste período
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Despesas</CardTitle>
                <CardDescription>
                  Despesas mais recentes do período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.despesasPeriodo
                    .filter(despesa => despesa.tipo === 'despesa')
                    .slice(0, 5)
                    .map((despesa) => (
                      <div key={despesa.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{despesa.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(despesa.data), 'dd/MM/yyyy', { locale: pt })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {formatCurrency(parseFloat(despesa.valor || '0'))}
                          </p>
                          <Badge variant={statusBadgeVariants[despesa.status as keyof typeof statusBadgeVariants]}>
                            {despesa.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {filteredData.despesasPeriodo.filter(d => d.tipo === 'despesa').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma despesa registrada neste período
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Fonte</CardTitle>
                <CardDescription>
                  Análise das receitas por origem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Aluguéis</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(receitaAlugueis)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pagamentos de Infrações</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(receitaPagamentos)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outras Receitas</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(totalReceitas)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatCurrency(receitaTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Receitas</CardTitle>
                <CardDescription>
                  Receitas mais recentes do período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.despesasPeriodo
                    .filter(despesa => despesa.tipo === 'receita')
                    .slice(0, 5)
                    .map((receita) => (
                      <div key={receita.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{receita.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(receita.data), 'dd/MM/yyyy', { locale: pt })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(parseFloat(receita.valor || '0'))}
                          </p>
                          <Badge variant={statusBadgeVariants[receita.status as keyof typeof statusBadgeVariants]}>
                            {receita.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {filteredData.despesasPeriodo.filter(d => d.tipo === 'receita').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma receita registrada neste período
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="infracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrações do Período</CardTitle>
              <CardDescription>
                Infrações registradas em {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.infracoesPeriodo.map((infracao) => (
                  <div key={infracao.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{infracao.descricaoInfracao}</p>
                      <p className="text-xs text-muted-foreground">
                        {infracao.motoristaNome} - {infracao.veiculoPlaca}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(infracao.dataInfracao), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatCurrency(parseFloat(infracao.valorFinal || '0'))}
                      </p>
                      <Badge variant={infracao.status === 'pago' ? 'default' : 'secondary'}>
                        {infracao.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredData.infracoesPeriodo.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma infração registrada neste período
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alugueis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aluguéis Ativos</CardTitle>
              <CardDescription>
                Contratos de aluguel ativos no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.alugueisAtivos.map((aluguel) => (
                  <div key={aluguel.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{aluguel.motoristaNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {aluguel.veiculoModelo} - {aluguel.veiculoPlaca}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Início: {format(new Date(aluguel.dataInicio), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(parseFloat(aluguel.valorMensal || aluguel.valorDiario))}
                      </p>
                      <Badge variant="default">
                        {aluguel.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredData.alugueisAtivos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum aluguel ativo neste período
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}