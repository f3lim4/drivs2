import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { DetalhesVeiculoModal } from '@/components/relatorios/DetalhesVeiculoModal';
import { formatCurrency } from '@/lib/utils';

export default function RelatoriosFinanceiros() {
  const { profile } = useAuth();
  const { alugueis } = useAlugueis();
  const { pagamentos } = usePagamentos();
  const { infracoes } = useInfracoes();
  const { despesas } = useDespesas();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('todos');
  const [filtroMotorista, setFiltroMotorista] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Cálculos para o período selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredData = useMemo(() => {
    const isInPeriod = (date: Date) => isWithinInterval(date, { start: monthStart, end: monthEnd });

    let alugueisAtivos = alugueis.filter(aluguel => 
      aluguel.status === 'ativo'
    );

    let pagamentosRealizados = pagamentos.filter(pagamento => 
      pagamento.status === 'realizado' && isInPeriod(new Date(pagamento.dataPagamento))
    );

    let infracoesPeriodo = infracoes.filter(infracao => 
      isInPeriod(new Date(infracao.dataInfracao))
    );

    let despesasPeriodo = despesas.filter(despesa => 
      isInPeriod(new Date(despesa.data))
    );

    // Aplicar filtros
    if (filtroVeiculo !== 'todos') {
      alugueisAtivos = alugueisAtivos.filter(aluguel => aluguel.veiculoId === filtroVeiculo);
      despesasPeriodo = despesasPeriodo.filter(despesa => despesa.veiculoId === filtroVeiculo);
      infracoesPeriodo = infracoesPeriodo.filter(infracao => infracao.veiculoId === filtroVeiculo);
    }

    if (filtroMotorista !== 'todos') {
      alugueisAtivos = alugueisAtivos.filter(aluguel => aluguel.motoristaId === filtroMotorista);
      infracoesPeriodo = infracoesPeriodo.filter(infracao => infracao.motoristaId === filtroMotorista);
    }

    if (filtroCategoria !== 'todos') {
      despesasPeriodo = despesasPeriodo.filter(despesa => despesa.categoria === filtroCategoria);
    }

    return { alugueisAtivos, pagamentosRealizados, infracoesPeriodo, despesasPeriodo };
  }, [alugueis, pagamentos, infracoes, despesas, monthStart, monthEnd, filtroVeiculo, filtroMotorista, filtroCategoria]);

  // Cálculos de despesas fixas dos veículos
  const despesasFixasVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      const despesasFixas = [];
      
      // IPVA (divide anual por 12 meses)
      if (veiculo.ipva) {
        despesasFixas.push({
          tipo: 'IPVA',
          valor: veiculo.ipva / 12,
          descricao: `IPVA mensal - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal) {
        despesasFixas.push({
          tipo: 'Seguro',
          valor: veiculo.valorSeguroMensal,
          descricao: `Seguro ${veiculo.seguradora || 'não informado'} - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal) {
        despesasFixas.push({
          tipo: 'Rastreador',
          valor: veiculo.valorRastreadorMensal,
          descricao: `Rastreador ${veiculo.rastreador || 'não informado'} - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      return {
        veiculo: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        despesas: despesasFixas,
        totalMensal: despesasFixas.reduce((sum, desp) => sum + desp.valor, 0)
      };
    });
  }, [veiculos]);

  // Total das despesas fixas mensais
  const totalDespesasFixas = useMemo(() => {
    return despesasFixasVeiculos.reduce((total, veiculo) => total + veiculo.totalMensal, 0);
  }, [despesasFixasVeiculos]);

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
    const despesasManuais = filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa')
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
    
    // Somar despesas fixas dos veículos
    return despesasManuais + totalDespesasFixas;
  }, [filteredData.despesasPeriodo, totalDespesasFixas]);

  const totalReceitas = useMemo(() => {
    return filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'receita')
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
  }, [filteredData.despesasPeriodo]);

  const receitaTotal = receitaAlugueis + receitaPagamentos + totalReceitas;
  const lucroLiquido = receitaTotal - totalDespesas;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // Análise por veículo
  const analiseVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      const aluguelVeiculo = alugueis.find(a => a.veiculoId === veiculo.id && a.status === 'ativo');
      const despesasVeiculo = despesas.filter(d => d.veiculoId === veiculo.id);
      
      // Buscar despesas fixas para este veículo
      const despesasFixasVeiculo = despesasFixasVeiculos.find(dfv => dfv.veiculo === veiculo.placa);
      const despesasFixasMensais = despesasFixasVeiculo ? despesasFixasVeiculo.totalMensal : 0;
      
      const receitaMensal = aluguelVeiculo ? parseFloat(aluguelVeiculo.valorMensal || aluguelVeiculo.valorDiario) : 0;
      const receitaAnual = receitaMensal * 12;
      
      const despesasManuaisMensais = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      const despesasManuaisAnuais = despesasVeiculo
        .filter(d => d.tipo === 'despesa')
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      // Somar despesas manuais + fixas
      const despesasMensais = despesasManuaisMensais + despesasFixasMensais;
      const despesasAnuais = despesasManuaisAnuais + (despesasFixasMensais * 12);
      
      const lucro = receitaMensal - despesasMensais;
      const margem = receitaMensal > 0 ? (lucro / receitaMensal) * 100 : 0;
      const status = aluguelVeiculo ? 'Lucrativo' : 'Parado';
      
      return {
        veiculo: veiculo.placa,
        modelo: veiculo.modelo,
        receitaMensal,
        despesasMensais,
        despesasFixasMensais,
        despesasManuaisMensais,
        receitaAnual,
        despesasAnuais,
        lucro,
        margem,
        status
      };
    });
  }, [veiculos, alugueis, despesas, despesasFixasVeiculos, monthStart, monthEnd]);

  // Cálculo de mês anterior para comparação
  const mesAnterior = subMonths(selectedMonth, 1);
  const mesAnteriorStart = startOfMonth(mesAnterior);
  const mesAnteriorEnd = endOfMonth(mesAnterior);

  const receitaMesAnterior = useMemo(() => {
    const alugueisAnterior = alugueis.filter(aluguel => 
      aluguel.status === 'ativo' && isWithinInterval(new Date(aluguel.dataInicio), { start: mesAnteriorStart, end: mesAnteriorEnd })
    );
    return alugueisAnterior.reduce((total, aluguel) => total + parseFloat(aluguel.valorMensal || aluguel.valorDiario), 0);
  }, [alugueis, mesAnteriorStart, mesAnteriorEnd]);

  const despesasMesAnterior = useMemo(() => {
    const despesasAnterior = despesas.filter(despesa => 
      despesa.tipo === 'despesa' && isWithinInterval(new Date(despesa.data), { start: mesAnteriorStart, end: mesAnteriorEnd })
    );
    return despesasAnterior.reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
  }, [despesas, mesAnteriorStart, mesAnteriorEnd]);

  const variacaoReceita = receitaMesAnterior > 0 ? ((receitaTotal - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;
  const variacaoDespesas = despesasMesAnterior > 0 ? ((totalDespesas - despesasMesAnterior) / despesasMesAnterior) * 100 : 0;
  const variacaoLucro = (receitaMesAnterior - despesasMesAnterior) > 0 ? ((lucroLiquido - (receitaMesAnterior - despesasMesAnterior)) / (receitaMesAnterior - despesasMesAnterior)) * 100 : 0;

  // Função para gerar dados detalhados do veículo
  const gerarDadosDetalhados = (veiculo: any) => {
    const aluguelVeiculo = alugueis.find(a => a.veiculoId === veiculo.id && a.status === 'ativo');
    const motorista = aluguelVeiculo ? motoristas.find(m => m.id === aluguelVeiculo.motoristaId) : null;
    const despesasVeiculo = despesas.filter(d => d.veiculoId === veiculo.id);
    

    
    const receitaMensal = aluguelVeiculo ? parseFloat(aluguelVeiculo.valorMensal || aluguelVeiculo.valorDiario) : 0;
    const despesasMensais = despesasVeiculo
      .filter(d => d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
    
    const lucro = receitaMensal - despesasMensais;
    const margem = receitaMensal > 0 ? (lucro / receitaMensal) * 100 : 0;
    
    // Status baseado em dados reais
    let status = 'Parado';
    if (aluguelVeiculo && receitaMensal > 0) {
      if (lucro > 0) {
        status = 'Lucrativo';
      } else if (lucro === 0) {
        status = 'Equilibrado';
      } else {
        status = 'Prejuízo';
      }
    }

    // Detalhamento por categoria
    const categorias = [
      { key: 'manutencao', nome: 'Manutenção' },
      { key: 'seguro', nome: 'Seguro' },
      { key: 'ipva', nome: 'IPVA' },
      { key: 'licenciamento', nome: 'Licenciamento' },
      { key: 'multa', nome: 'Multas' },
      { key: 'lavagem', nome: 'Lavagem' },
      { key: 'outros', nome: 'Outros' }
    ];
    
    const despesasDetalhadas = categorias.map(categoria => {
      const valor = despesasVeiculo
        .filter(d => d.categoria === categoria.key && d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      const percentual = despesasMensais > 0 ? (valor / despesasMensais) * 100 : 0;
      return { categoria: categoria.nome, valor, percentual };
    }).filter(item => item.valor > 0);

    // Evolução dos últimos 6 meses - apenas meses com dados reais
    const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
      const mes = subMonths(new Date(), i);
      const mesStart = startOfMonth(mes);
      const mesEnd = endOfMonth(mes);
      
      // Verificar se existe aluguel ativo neste período
      const aluguelPeriodo = alugueis.find(a => 
        a.veiculoId === veiculo.id && 
        a.status === 'ativo' &&
        new Date(a.dataInicio) <= mesEnd &&
        new Date(a.dataFim) >= mesStart
      );
      
      // Só mostrar receita se há aluguel ativo no período
      const receitaMes = aluguelPeriodo ? parseFloat(aluguelPeriodo.valorMensal || 0) : 0;
      const despesasMes = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: mesStart, end: mesEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      return {
        mes: format(mes, 'MMM/yy', { locale: pt }),
        receita: receitaMes,
        despesas: despesasMes,
        lucro: receitaMes - despesasMes
      };
    }).reverse().filter(item => item.receita > 0 || item.despesas > 0); // Mostrar apenas meses com dados reais

    return {
      veiculo,
      analiseFinanceira: {
        receitaMensal,
        despesasMensais,
        lucro,
        margem,
        status
      },
      motorista,
      despesasDetalhadas,
      evolucaoMensal
    };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={filtroVeiculo} onValueChange={setFiltroVeiculo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por veículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os veículos</SelectItem>
              {veiculos.map(veiculo => (
                <SelectItem key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroMotorista} onValueChange={setFiltroMotorista}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por motorista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os motoristas</SelectItem>
              {motoristas.map(motorista => (
                <SelectItem key={motorista.id} value={motorista.id}>
                  {motorista.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="seguro">Seguro</SelectItem>
              <SelectItem value="ipva">IPVA</SelectItem>
              <SelectItem value="multa">Multa</SelectItem>
              <SelectItem value="licenciamento">Licenciamento</SelectItem>
              <SelectItem value="lavagem">Lavagem</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          {(() => {
            const filtrosAtivos = [
              filtroVeiculo !== 'todos' ? 1 : 0,
              filtroMotorista !== 'todos' ? 1 : 0,
              filtroCategoria !== 'todos' ? 1 : 0
            ].reduce((a, b) => a + b, 0);
            
            return filtrosAtivos > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''} aplicado{filtrosAtivos > 1 ? 's' : ''}
              </Badge>
            ) : null;
          })()}
          
          <Button 
            variant="outline" 
            onClick={() => {
              setFiltroVeiculo('todos');
              setFiltroMotorista('todos');
              setFiltroCategoria('todos');
            }}
          >
            Limpar Filtros
          </Button>

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
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">RECEITA TOTAL</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(receitaTotal)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {variacaoReceita > 0 ? '+' : ''}{variacaoReceita.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">DESPESAS TOTAIS</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDespesas)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {variacaoDespesas > 0 ? '+' : ''}{variacaoDespesas.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">LUCRO LÍQUIDO</p>
                <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(lucroLiquido)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {variacaoLucro > 0 ? '+' : ''}{variacaoLucro.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <DollarSign className={`h-6 w-6 ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MARGEM DE LUCRO</p>
                <p className={`text-2xl font-bold ${margemLucro >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {margemLucro.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Meta: 30%
                </p>
              </div>
              <TrendingUp className={`h-6 w-6 ${margemLucro >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="veiculos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="veiculos">Análise por Veículo</TabsTrigger>
          <TabsTrigger value="motoristas">Análise por Motorista</TabsTrigger>
          <TabsTrigger value="categorias">Despesas por Categoria</TabsTrigger>
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
        </TabsList>

        <TabsContent value="veiculos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                ANÁLISE FINANCEIRA POR VEÍCULO
              </CardTitle>
              <CardDescription>
                Performance financeira detalhada de cada veículo da frota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Receita Mensal</TableHead>
                      <TableHead>Despesas Mensais</TableHead>
                      <TableHead>Receita Anual</TableHead>
                      <TableHead>Despesas Anuais</TableHead>
                      <TableHead>Lucro</TableHead>
                      <TableHead>Margem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analiseVeiculos.map((item) => (
                      <TableRow key={item.veiculo}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{item.veiculo}</p>
                            <p className="text-sm text-gray-500">{item.modelo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-bold">
                          {formatCurrency(item.receitaMensal)}
                        </TableCell>
                        <TableCell className="text-red-600 font-bold">
                          {formatCurrency(item.despesasMensais)}
                        </TableCell>
                        <TableCell className="text-green-600 font-bold">
                          {formatCurrency(item.receitaAnual)}
                        </TableCell>
                        <TableCell className="text-red-600 font-bold">
                          {formatCurrency(item.despesasAnuais)}
                        </TableCell>
                        <TableCell className={`font-bold ${item.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.lucro)}
                        </TableCell>
                        <TableCell className={`font-bold ${item.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.margem.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Lucrativo' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const veiculoEncontrado = veiculos.find(v => v.placa === item.veiculo);
                            if (!veiculoEncontrado) {
                              return (
                                <Button variant="ghost" size="sm" disabled>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              );
                            }
                            return (
                              <DetalhesVeiculoModal
                                {...gerarDadosDetalhados(veiculoEncontrado)}
                              />
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motoristas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Motorista</CardTitle>
              <CardDescription>
                Performance financeira de cada motorista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.alugueisAtivos.map((aluguel) => (
                  <div key={aluguel.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{aluguel.motoristaNome}</p>
                      <p className="text-sm text-gray-500">{aluguel.veiculoModelo} - {aluguel.veiculoPlaca}</p>
                      <p className="text-xs text-gray-400">
                        Início: {format(new Date(aluguel.dataInicio), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(aluguel.valorMensal || aluguel.valorDiario))}
                      </p>
                      <Badge variant="default">
                        {aluguel.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>
                Análise detalhada das despesas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const categoriasComDados = ['manutencao', 'seguro', 'ipva', 'multa', 'licenciamento', 'lavagem', 'outros']
                    .map((categoria) => {
                      const despesasCategoria = filteredData.despesasPeriodo
                        .filter(d => d.categoria === categoria && d.tipo === 'despesa');
                      
                      const valor = despesasCategoria
                        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
                      
                      const percentage = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0;
                      
                      return { categoria, valor, percentage };
                    })
                    .filter(item => item.valor > 0); // Só mostrar categorias com dados reais
                  
                  if (categoriasComDados.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma despesa encontrada para o período selecionado</p>
                        <p className="text-sm mt-2">Adicione despesas para visualizar as categorias</p>
                      </div>
                    );
                  }
                  
                  return categoriasComDados.map((item) => (
                    <div key={item.categoria} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{item.categoria}</span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(item.valor)} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas-fixas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas Fixas dos Veículos</CardTitle>
              <CardDescription>
                Despesas automáticas baseadas no cadastro dos veículos (IPVA, Seguro, Rastreador)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resumo das despesas fixas */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Total das Despesas Fixas Mensais</h4>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDespesasFixas)}</p>
                  <p className="text-sm text-gray-600">Projeção anual: {formatCurrency(totalDespesasFixas * 12)}</p>
                </div>

                {/* Tabela de despesas por veículo */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>IPVA (Mensal)</TableHead>
                        <TableHead>Seguro</TableHead>
                        <TableHead>Rastreador</TableHead>
                        <TableHead>Total Mensal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesasFixasVeiculos.map((veiculo, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{veiculo.veiculo}</p>
                              <p className="text-sm text-gray-500">{veiculo.marca} {veiculo.modelo}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {veiculo.despesas.find(d => d.tipo === 'IPVA') ? 
                              formatCurrency(veiculo.despesas.find(d => d.tipo === 'IPVA')?.valor || 0) : 
                              <span className="text-gray-400">-</span>
                            }
                          </TableCell>
                          <TableCell>
                            {veiculo.despesas.find(d => d.tipo === 'Seguro') ? 
                              formatCurrency(veiculo.despesas.find(d => d.tipo === 'Seguro')?.valor || 0) : 
                              <span className="text-gray-400">-</span>
                            }
                          </TableCell>
                          <TableCell>
                            {veiculo.despesas.find(d => d.tipo === 'Rastreador') ? 
                              formatCurrency(veiculo.despesas.find(d => d.tipo === 'Rastreador')?.valor || 0) : 
                              <span className="text-gray-400">-</span>
                            }
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(veiculo.totalMensal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Detalhamento por tipo de despesa */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">IPVA Total</h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(despesasFixasVeiculos.reduce((total, v) => 
                        total + (v.despesas.find(d => d.tipo === 'IPVA')?.valor || 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Seguros Total</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(despesasFixasVeiculos.reduce((total, v) => 
                        total + (v.despesas.find(d => d.tipo === 'Seguro')?.valor || 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Rastreadores Total</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(despesasFixasVeiculos.reduce((total, v) => 
                        total + (v.despesas.find(d => d.tipo === 'Rastreador')?.valor || 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}