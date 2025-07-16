import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye, Trash2, Plus } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DetalhesVeiculoModal } from '@/components/relatorios/DetalhesVeiculoModal';
import { formatCurrency } from '@/lib/utils';

// Schema para formulário de nova despesa
const novaDespesaSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  status: z.enum(['pendente', 'pago']).default('pendente'),
  formaPagamento: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto']).optional()
});

type NovaDespesaData = z.infer<typeof novaDespesaSchema>;

export default function RelatoriosFinanceiros() {
  const { profile } = useAuth();
  const { alugueis } = useAlugueis();
  const { pagamentos } = usePagamentos();
  const { infracoes } = useInfracoes();
  const { despesas } = useDespesas();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [despesaExcluindo, setDespesaExcluindo] = useState<string | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);
  const [modalNovaDespesa, setModalNovaDespesa] = useState(false);

  // Formulário para nova despesa
  const formNovaDespesa = useForm<NovaDespesaData>({
    resolver: zodResolver(novaDespesaSchema),
    defaultValues: {
      veiculoId: '',
      categoria: '',
      descricao: '',
      valor: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
      formaPagamento: 'dinheiro'
    }
  });

  // Função para criar nova despesa
  const criarNovaDespesa = async (data: NovaDespesaData) => {
    try {
      const response = await fetch('/api/despesas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          locadoraId: profile?.id,
          tipo: 'despesa'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar despesa');
      }

      // Invalidar cache e fechar modal
      queryClient.invalidateQueries({ queryKey: ['/api/despesas'] });
      setModalNovaDespesa(false);
      formNovaDespesa.reset();
      
      toast({
        title: "Despesa criada",
        description: "A despesa foi criada com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar despesa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para mostrar confirmação de exclusão
  const handleClickExcluir = (despesaId: string) => {
    setDespesaParaExcluir(despesaId);
  };

  // Função para confirmar exclusão
  const confirmarExclusao = async () => {
    if (!despesaParaExcluir) return;
    
    try {
      setDespesaExcluindo(despesaParaExcluir);
      
      const response = await fetch(`/api/despesas/${despesaParaExcluir}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir despesa');
      }

      // Invalidar cache do React Query para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/despesas'] });
      
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDespesaExcluindo(null);
      setDespesaParaExcluir(null);
    }
  };

  // Função para cancelar exclusão
  const cancelarExclusao = () => {
    setDespesaParaExcluir(null);
  };

  // Cálculos para o período selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredData = useMemo(() => {
    const isInPeriod = (date: Date) => isWithinInterval(date, { start: monthStart, end: monthEnd });

    const alugueisAtivos = alugueis.filter(aluguel => 
      aluguel.status === 'ativo'
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

  // Cálculos de despesas fixas dos veículos
  const despesasFixasVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      const despesasFixas = [];
      
      // IPVA (divide anual por 12 meses)
      if (veiculo.ipva && veiculo.ipva > 0) {
        despesasFixas.push({
          tipo: 'IPVA',
          valor: parseFloat(veiculo.ipva) / 12,
          descricao: `IPVA mensal - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
        despesasFixas.push({
          tipo: 'Seguro',
          valor: parseFloat(veiculo.valorSeguroMensal),
          descricao: `Seguro ${veiculo.seguradora || 'não informado'} - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
        despesasFixas.push({
          tipo: 'Rastreador',
          valor: parseFloat(veiculo.valorRastreadorMensal),
          descricao: `Rastreador ${veiculo.rastreador || 'não informado'} - ${veiculo.placa}`,
          veiculo: veiculo.placa
        });
      }
      
      // Financiamento mensal
      if (veiculo.financiado && veiculo.valorFinanciamento && veiculo.quantidadeParcelas) {
        const valorMensal = parseFloat(veiculo.valorFinanciamento);
        despesasFixas.push({
          tipo: 'Financiamento',
          valor: valorMensal,
          descricao: `Financiamento - ${veiculo.placa}`,
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
        .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      const despesasManuaisAnuais = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento')
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
    
    // Incluir despesas fixas do veículo
    const despesaFixaVeiculo = despesasFixasVeiculos.find(df => df.veiculo === veiculo.placa);
    const despesasFixasMensais = despesaFixaVeiculo ? despesaFixaVeiculo.totalMensal : 0;
    
    const receitaMensal = aluguelVeiculo ? parseFloat(aluguelVeiculo.valorMensal || aluguelVeiculo.valorDiario) : 0;
    const despesasManuais = despesasVeiculo
      .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
    
    const despesasMensais = despesasManuais + despesasFixasMensais;
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

    // Detalhamento por categoria incluindo despesas fixas
    const despesasDetalhadas = [];
    
    // Despesas fixas
    if (despesaFixaVeiculo && despesaFixaVeiculo.despesas) {
      despesaFixaVeiculo.despesas.forEach(despesaFixa => {
        despesasDetalhadas.push({
          categoria: despesaFixa.tipo,
          valor: despesaFixa.valor,
          percentual: despesasMensais > 0 ? (despesaFixa.valor / despesasMensais) * 100 : 0
        });
      });
    }
    
    // Despesas manuais
    const categoriasManuais = [
      { key: 'manutencao', nome: 'Manutenção' },
      { key: 'licenciamento', nome: 'Licenciamento' },
      { key: 'multa', nome: 'Multas' },
      { key: 'lavagem', nome: 'Lavagem' },
      { key: 'outros', nome: 'Outros' }
    ];
    
    categoriasManuais.forEach(categoria => {
      const valor = despesasVeiculo
        .filter(d => d.categoria === categoria.key && d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      if (valor > 0) {
        despesasDetalhadas.push({
          categoria: categoria.nome,
          valor,
          percentual: despesasMensais > 0 ? (valor / despesasMensais) * 100 : 0
        });
      }
    });

    // Evolução dos últimos 6 meses - apenas meses com dados reais
    const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
      const mes = subMonths(new Date(), i);
      const mesStart = startOfMonth(mes);
      const mesEnd = endOfMonth(mes);
      
      // Verificar se o veículo já havia sido cadastrado neste período
      const dataCadastroVeiculo = new Date(veiculo.createdAt);
      const veiculoExistia = mesEnd >= dataCadastroVeiculo;
      
      if (!veiculoExistia) {
        return null; // Pular meses anteriores ao cadastro
      }
      
      // Verificar se existe aluguel ativo neste período
      const aluguelPeriodo = alugueis.find(a => 
        a.veiculoId === veiculo.id && 
        a.status === 'ativo' &&
        new Date(a.dataInicio) <= mesEnd &&
        new Date(a.dataFim) >= mesStart
      );
      
      // Só mostrar receita se há aluguel ativo no período
      const receitaMes = aluguelPeriodo ? parseFloat(aluguelPeriodo.valorMensal || 0) : 0;
      const despesasManuaisMes = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && isWithinInterval(new Date(d.data), { start: mesStart, end: mesEnd }))
        .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
      
      // Incluir despesas fixas no cálculo mensal
      const despesasTotalMes = despesasManuaisMes + despesasFixasMensais;
      
      return {
        mes: format(mes, 'MMM/yy', { locale: pt }),
        receita: receitaMes,
        despesas: despesasTotalMes,
        lucro: receitaMes - despesasTotalMes
      };
    }).reverse().filter(item => item !== null && (item.receita > 0 || item.despesas > 0)); // Mostrar apenas meses com dados reais

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
      {/* Seletor de mês e botão Nova Despesa */}
      <div className="flex justify-between items-center">
        <Button onClick={() => setModalNovaDespesa(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
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
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="despesas">Histórico</TabsTrigger>
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
                      <TableHead className="w-10"></TableHead>
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
                        <TableCell className="text-center">
                          {(() => {
                            const veiculoEncontrado = veiculos.find(v => v.placa === item.veiculo);
                            if (!veiculoEncontrado) {
                              return <Eye className="h-4 w-4 text-gray-400 mx-auto" />;
                            }
                            return (
                              <DetalhesVeiculoModal
                                {...gerarDadosDetalhados(veiculoEncontrado)}
                                trigger={
                                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                                    <Eye className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                                  </Button>
                                }
                              />
                            );
                          })()}
                        </TableCell>
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



        <TabsContent value="despesas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Despesas</CardTitle>
              <CardDescription>
                Todas as despesas manuais registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.despesasPeriodo.filter(d => d.tipo === 'despesa').length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.despesasPeriodo
                          .filter(d => d.tipo === 'despesa')
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((despesa) => {
                            const veiculo = veiculos.find(v => v.id === despesa.veiculoId);
                            return (
                              <TableRow key={despesa.id}>
                                <TableCell>
                                  {format(new Date(despesa.data), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{veiculo?.placa || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">{veiculo?.marca} {veiculo?.modelo}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {despesa.categoria}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="max-w-xs truncate">{despesa.descricao}</p>
                                </TableCell>
                                <TableCell className="font-medium text-red-600">
                                  {formatCurrency(parseFloat(despesa.valor || '0'))}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleClickExcluir(despesa.id)}
                                    disabled={despesaExcluindo === despesa.id}
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma despesa registrada para o período selecionado</p>
                    <p className="text-sm mt-2">As despesas aparecerão aqui conforme forem registradas</p>
                  </div>
                )}


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
                        <TableHead>Financiamento</TableHead>
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
                          <TableCell>
                            {veiculo.despesas.find(d => d.tipo === 'Financiamento') ? 
                              formatCurrency(veiculo.despesas.find(d => d.tipo === 'Financiamento')?.valor || 0) : 
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Financiamento Total</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(despesasFixasVeiculos.reduce((total, v) => 
                        total + (v.despesas.find(d => d.tipo === 'Financiamento')?.valor || 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                </div>

                {/* Análise por categoria */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Análise por Categoria</h3>
                  <div className="space-y-4">
                    {(() => {
                      const categoriasComDados = [];
                      
                      // Adicionar despesas fixas
                      const despesasFixasTotal = {
                        'ipva': despesasFixasVeiculos.reduce((total, v) => total + (v.despesas.find(d => d.tipo === 'IPVA')?.valor || 0), 0),
                        'seguro': despesasFixasVeiculos.reduce((total, v) => total + (v.despesas.find(d => d.tipo === 'Seguro')?.valor || 0), 0),
                        'rastreador': despesasFixasVeiculos.reduce((total, v) => total + (v.despesas.find(d => d.tipo === 'Rastreador')?.valor || 0), 0),
                        'financiamento': despesasFixasVeiculos.reduce((total, v) => total + (v.despesas.find(d => d.tipo === 'Financiamento')?.valor || 0), 0)
                      };
                      
                      // Adicionar despesas manuais (excluindo categorias que já estão nas despesas fixas)
                      const despesasManuaisTotal = {
                        'manutencao': filteredData.despesasPeriodo.filter(d => d.categoria === 'manutencao' && d.tipo === 'despesa').reduce((total, d) => total + parseFloat(d.valor || '0'), 0),
                        'multa': filteredData.despesasPeriodo.filter(d => d.categoria === 'multa' && d.tipo === 'despesa').reduce((total, d) => total + parseFloat(d.valor || '0'), 0),
                        'licenciamento': filteredData.despesasPeriodo.filter(d => d.categoria === 'licenciamento' && d.tipo === 'despesa').reduce((total, d) => total + parseFloat(d.valor || '0'), 0),
                        'lavagem': filteredData.despesasPeriodo.filter(d => d.categoria === 'lavagem' && d.tipo === 'despesa').reduce((total, d) => total + parseFloat(d.valor || '0'), 0),
                        'outros': filteredData.despesasPeriodo.filter(d => d.categoria === 'outros' && d.tipo === 'despesa').reduce((total, d) => total + parseFloat(d.valor || '0'), 0)
                      };
                      
                      // Combinar todas as categorias
                      const todasCategorias = {
                        'IPVA': despesasFixasTotal.ipva,
                        'Seguro': despesasFixasTotal.seguro,
                        'Rastreador': despesasFixasTotal.rastreador,
                        'Financiamento': despesasFixasTotal.financiamento,
                        'Manutenção': despesasManuaisTotal.manutencao,
                        'Multas': despesasManuaisTotal.multa,
                        'Licenciamento': despesasManuaisTotal.licenciamento,
                        'Lavagem': despesasManuaisTotal.lavagem,
                        'Outros': despesasManuaisTotal.outros
                      };
                      
                      // Filtrar apenas categorias com valores reais
                      Object.entries(todasCategorias).forEach(([categoria, valor]) => {
                        if (valor > 0) {
                          const percentage = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0;
                          categoriasComDados.push({ categoria, valor, percentage });
                        }
                      });
                      
                      // Ordenar por valor (maior primeiro)
                      categoriasComDados.sort((a, b) => b.valor - a.valor);
                      
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de nova despesa */}
      <Dialog open={modalNovaDespesa} onOpenChange={setModalNovaDespesa}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Registre uma nova despesa para um veículo
            </DialogDescription>
          </DialogHeader>
          <Form {...formNovaDespesa}>
            <form onSubmit={formNovaDespesa.handleSubmit(criarNovaDespesa)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formNovaDespesa.control}
                  name="veiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {veiculos.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={veiculo.id}>
                              {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovaDespesa.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="multa">Multa</SelectItem>
                          <SelectItem value="licenciamento">Licenciamento</SelectItem>
                          <SelectItem value="lavagem">Lavagem</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={formNovaDespesa.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da despesa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formNovaDespesa.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovaDespesa.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formNovaDespesa.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status do pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovaDespesa.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                          <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalNovaDespesa(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formNovaDespesa.formState.isSubmitting}>
                  {formNovaDespesa.formState.isSubmitting ? 'Criando...' : 'Criar Despesa'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!despesaParaExcluir} onOpenChange={() => setDespesaParaExcluir(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={cancelarExclusao}
              disabled={!!despesaExcluindo}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarExclusao}
              disabled={!!despesaExcluindo}
            >
              {despesaExcluindo ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}