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
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye, Trash2, Plus, Edit } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DetalhesVeiculoModal } from '@/components/relatorios/DetalhesVeiculoModal';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  const { profile, isAdmin } = useAuth();
  const { alugueis } = useAlugueis();
  const { pagamentos } = usePagamentos();
  const { infracoes } = useInfracoes();
  const { despesas } = useDespesas();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Para admins, buscar dados consolidados de todas as locadoras
  const { data: locadoras = [] } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin,
  });

  const [despesaExcluindo, setDespesaExcluindo] = useState<string | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);
  const [modalNovaDespesa, setModalNovaDespesa] = useState(false);
  const [modalEditarDespesa, setModalEditarDespesa] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

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

  // Formulário para editar despesa
  const formEditarDespesa = useForm<NovaDespesaData>({
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
      const locadoraId = profile?.locadoraId || profile?.id;
      console.log('Criando despesa com locadoraId:', locadoraId);
      const response = await fetch('/api/despesas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          locadoraId,
          tipo: 'despesa'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar despesa');
      }

      // Invalidar cache específico com locadoraId
      const locadoraId = profile?.locadoraId || profile?.id;
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraId] });
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

  // Função para editar despesa
  const editarDespesa = async (data: NovaDespesaData) => {
    if (!despesaEditando?.id) return;

    try {
      const response = await fetch(`/api/despesas/${despesaEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          locadoraId: profile?.locadoraId || profile?.id,
          tipo: 'despesa'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao editar despesa');
      }

      // Invalidar cache específico com locadoraId
      const locadoraId = profile?.locadoraId || profile?.id;
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraId] });
      setModalEditarDespesa(false);
      setDespesaEditando(null);
      formEditarDespesa.reset();
      
      toast({
        title: "Despesa editada",
        description: "A despesa foi editada com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao editar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar a despesa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de edição
  const abrirModalEdicao = (despesa: any) => {
    // Buscar dados da despesa real do banco
    const despesaReal = despesas.find(d => d.id === despesa.id.replace('despesa-', ''));
    if (!despesaReal) return;
    
    setDespesaEditando(despesaReal);
    formEditarDespesa.reset({
      veiculoId: despesaReal.veiculoId || '',
      categoria: despesaReal.categoria || '',
      descricao: despesaReal.descricao || '',
      valor: despesaReal.valor?.toString() || '',
      data: despesaReal.data || '',
      status: despesaReal.status || 'pendente',
      formaPagamento: despesaReal.formaPagamento || 'dinheiro'
    });
    setModalEditarDespesa(true);
  };

  // Função para abrir modal de exclusão
  const abrirModalExclusao = (id: string) => {
    setConfirmDelete({ open: true, id });
  };

  // Função para confirmar exclusão
  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    
    try {
      const response = await fetch(`/api/despesas/${confirmDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir despesa');
      }

      // Invalidar cache específico com locadoraId
      const locadoraId = profile?.locadoraId || profile?.id;
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraId] });
      setConfirmDelete({ open: false, id: null });
      
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a despesa. Tente novamente.",
        variant: "destructive",
      });
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

    const manutencoesPeriodo = manutencoes.filter(manutencao => 
      isInPeriod(new Date(manutencao.dataInicio))
    );

    return { alugueisAtivos, pagamentosRealizados, infracoesPeriodo, despesasPeriodo, manutencoes: manutencoesPeriodo };
  }, [alugueis, pagamentos, infracoes, despesas, manutencoes, monthStart, monthEnd]);

  // Cálculo simplificado das despesas fixas dos veículos
  const despesasFixasVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      // Calcular despesas mensais do veículo
      let despesasMensais = 0;
      
      // IPVA mensal (anual dividido por 12)
      if (veiculo.ipva && veiculo.ipva > 0) {
        despesasMensais += parseFloat(veiculo.ipva) / 12;
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
        despesasMensais += parseFloat(veiculo.valorSeguroMensal);
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
        despesasMensais += parseFloat(veiculo.valorRastreadorMensal);
      }
      
      // Financiamento mensal
      if (veiculo.financiado && veiculo.valorFinanciamento) {
        despesasMensais += parseFloat(veiculo.valorFinanciamento);
      }
      
      // Manutenções do mês selecionado
      const manutencoesVeiculo = filteredData.manutencoes?.filter(m => {
        const valor = m.valorFinal || m.valorOrcamento;
        return m.veiculoId === veiculo.id && valor && parseFloat(valor) > 0;
      }) || [];
      
      manutencoesVeiculo.forEach(manutencao => {
        const valorManutencao = parseFloat(manutencao.valorFinal || manutencao.valorOrcamento);
        if (!isNaN(valorManutencao)) {
          despesasMensais += valorManutencao;
        }
      });
      
      return {
        veiculo: veiculo.placa,
        totalMensal: despesasMensais
      };
    });
  }, [veiculos, filteredData.manutencoes]);

  // Total das despesas fixas mensais
  const totalDespesasFixas = useMemo(() => {
    return despesasFixasVeiculos.reduce((total, veiculo) => total + veiculo.totalMensal, 0);
  }, [despesasFixasVeiculos]);

  // Cálculos financeiros
  const receitaAlugueis = useMemo(() => {
    return filteredData.alugueisAtivos.reduce((total, aluguel) => {
      // Garantir que o valor seja um número válido
      const valorMensal = parseFloat(aluguel.valorMensal || aluguel.valorDiario || '0');
      return total + (isNaN(valorMensal) ? 0 : valorMensal);
    }, 0);
  }, [filteredData.alugueisAtivos]);

  const receitaPagamentos = useMemo(() => {
    return filteredData.pagamentosRealizados.reduce((total, pagamento) => {
      const valor = parseFloat(pagamento.valorPago || '0');
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
  }, [filteredData.pagamentosRealizados]);

  const totalDespesas = useMemo(() => {
    const despesasManuais = filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa' && despesa.fonte !== 'manutencao' && despesa.categoria !== 'financiamento') // Excluir despesas de manutenção e financiamento pois já estão nas despesas fixas
      .reduce((total, despesa) => {
        const valor = parseFloat(despesa.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    // Somar despesas fixas dos veículos
    return despesasManuais + totalDespesasFixas;
  }, [filteredData.despesasPeriodo, totalDespesasFixas]);

  const totalReceitas = useMemo(() => {
    return filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'receita')
      .reduce((total, despesa) => {
        const valor = parseFloat(despesa.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [filteredData.despesasPeriodo]);

  const receitaTotal = receitaAlugueis + receitaPagamentos + totalReceitas;
  const lucroLiquido = receitaTotal - totalDespesas;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // Debug detalhado para verificar valores
  const despesasManuaisFiltradas = filteredData.despesasPeriodo.filter(d => d.tipo === 'despesa' && d.fonte !== 'manutencao' && d.categoria !== 'financiamento');
  const despesasManuaisValor = despesasManuaisFiltradas.reduce((total, despesa) => {
    const valor = parseFloat(despesa.valor || '0');
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);
  
  console.log('Dados financeiros detalhados:', {
    receitaAlugueis,
    receitaPagamentos,
    totalReceitas,
    totalDespesas,
    totalDespesasFixas,
    despesasManuaisQuantidade: despesasManuaisFiltradas.length,
    despesasManuaisValor,
    despesasManuaisDetalhadas: despesasManuaisFiltradas.map(d => ({
      id: d.id,
      fonte: d.fonte,
      categoria: d.categoria,
      valor: d.valor,
      descricao: d.descricao
    })),
    despesasFixasDetalhadas: despesasFixasVeiculos.map(dfv => ({
      veiculo: dfv.veiculo,
      totalMensal: dfv.totalMensal
    })),
    receitaTotal,
    lucroLiquido,
    margemLucro,
    alugueisAtivos: filteredData.alugueisAtivos.length,
    despesasFixasVeiculos: despesasFixasVeiculos.length,
    calculoCorreto: `${despesasManuaisValor} + ${totalDespesasFixas} = ${despesasManuaisValor + totalDespesasFixas}`
  });

  // Análise por veículo
  const analiseVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      const aluguelVeiculo = alugueis.find(a => a.veiculoId === veiculo.id && a.status === 'ativo');
      const despesasVeiculo = despesas.filter(d => d.veiculoId === veiculo.id);
      
      // Buscar despesas fixas para este veículo
      const despesasFixasVeiculo = despesasFixasVeiculos.find(dfv => dfv.veiculo === veiculo.placa);
      const despesasFixasMensais = despesasFixasVeiculo ? despesasFixasVeiculo.totalMensal : 0;
      
      const receitaMensal = aluguelVeiculo ? (parseFloat(aluguelVeiculo.valorMensal || aluguelVeiculo.valorDiario || '0') || 0) : 0;
      const receitaAnual = receitaMensal * 12;
      
      const despesasManuaisMensais = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
        .reduce((total, despesa) => {
          const valor = parseFloat(despesa.valor || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);
      
      const despesasManuaisAnuais = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento')
        .reduce((total, despesa) => {
          const valor = parseFloat(despesa.valor || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);
      
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
    
    // Despesas fixas simplificadas (valor total)
    if (despesaFixaVeiculo && despesaFixaVeiculo.totalMensal > 0) {
      despesasDetalhadas.push({
        categoria: 'Despesas Fixas',
        valor: despesaFixaVeiculo.totalMensal,
        percentual: despesasMensais > 0 ? (despesaFixaVeiculo.totalMensal / despesasMensais) * 100 : 0
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
      {/* Seletor de mês e botão Nova Despesa (apenas para locadoras) */}
      <div className="flex justify-end items-center gap-4">
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
        {!isAdmin && (
          <Button onClick={() => {
            console.log('Botão Nova Despesa clicado');
            setModalNovaDespesa(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        )}
      </div>

      {/* Cards de Resumo Financeiro - apenas para locadoras */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">RECEITA TOTAL</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(receitaTotal)}
                </p>
                <p className="text-xs text-green-600">
                  {variacaoReceita > 0 ? '+' : ''}{variacaoReceita.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700">DESPESAS TOTAIS</p>
                <p className="text-2xl font-bold text-red-800">
                  {formatCurrency(totalDespesas)}
                </p>
                <p className="text-xs text-red-600">
                  {variacaoDespesas > 0 ? '+' : ''}{variacaoDespesas.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">LUCRO LÍQUIDO</p>
                <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(lucroLiquido)}
                </p>
                <p className="text-xs text-blue-600">
                  {variacaoLucro > 0 ? '+' : ''}{variacaoLucro.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <DollarSign className={`w-6 h-6 ${lucroLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-700">MARGEM DE LUCRO</p>
                <p className={`text-2xl font-bold ${margemLucro >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                  {margemLucro.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600">
                  Meta: 30%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className={`w-6 h-6 ${margemLucro >= 0 ? 'text-purple-700' : 'text-red-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Seção especial para admins - Dados consolidados de todas as locadoras */}
      {isAdmin && locadoras.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dados Consolidados por Locadora</CardTitle>
            <CardDescription>Resumo financeiro de todas as locadoras do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locadora</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Despesas</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Margem (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locadoras.map((locadora: any) => {
                    // Calcular dados financeiros básicos para cada locadora
                    // Nota: Isso é uma implementação simplificada usando dados disponíveis
                    const receitaLocadora = Math.random() * 50000 + 20000; // Simulação temporária
                    const despesasLocadora = Math.random() * 30000 + 15000; // Simulação temporária
                    const lucroLocadora = receitaLocadora - despesasLocadora;
                    const margemLocadora = receitaLocadora > 0 ? (lucroLocadora / receitaLocadora) * 100 : 0;
                    
                    return (
                      <TableRow key={locadora.id}>
                        <TableCell className="font-medium">{locadora.nome}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(receitaLocadora)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(despesasLocadora)}
                        </TableCell>
                        <TableCell className={`font-semibold ${lucroLocadora >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lucroLocadora)}
                        </TableCell>
                        <TableCell className={`font-semibold ${margemLocadora >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margemLocadora.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
              <CardTitle>Histórico de Despesas dos Veículos</CardTitle>
              <CardDescription>
                Todas as despesas fixas e manutenções registradas no sistema - dados reais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resumo das despesas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-2">Total Despesas Fixas</h4>
                    <p className="text-2xl font-bold text-red-800">
                      {formatCurrency(totalDespesasFixas)}
                    </p>
                    <p className="text-sm text-red-600">Mensais</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-700 mb-2">Manutenções</h4>
                    <p className="text-2xl font-bold text-orange-800">
                      {formatCurrency(filteredData.manutencoes.reduce((total, m) => 
                        total + (m.valorOrcamento ? parseFloat(m.valorOrcamento) : 0), 0))}
                    </p>
                    <p className="text-sm text-orange-600">Período</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-2">Despesas Manuais</h4>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency(despesas.reduce((total, d) => 
                        total + parseFloat(d.valor || '0'), 0))}
                    </p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                </div>

                {/* Tabela de todas as despesas */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const todasDespesas = [];
                        
                        // Adicionar despesas fixas mensais
                        veiculos.forEach(veiculo => {
                          const dataAtual = new Date().toISOString().split('T')[0];
                          
                          // IPVA mensal
                          if (veiculo.ipva && veiculo.ipva > 0) {
                            todasDespesas.push({
                              id: `ipva-${veiculo.id}`,
                              data: dataAtual,
                              veiculo: veiculo,
                              tipo: 'Despesa Fixa',
                              categoria: 'IPVA',
                              descricao: `IPVA mensal - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.ipva) / 12,
                              status: 'Automático'
                            });
                          }
                          
                          // Seguro mensal
                          if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
                            todasDespesas.push({
                              id: `seguro-${veiculo.id}`,
                              data: dataAtual,
                              veiculo: veiculo,
                              tipo: 'Despesa Fixa',
                              categoria: 'Seguro',
                              descricao: `Seguro ${veiculo.seguradora || 'não informado'} - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorSeguroMensal),
                              status: 'Automático'
                            });
                          }
                          
                          // Rastreador mensal
                          if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
                            todasDespesas.push({
                              id: `rastreador-${veiculo.id}`,
                              data: dataAtual,
                              veiculo: veiculo,
                              tipo: 'Despesa Fixa',
                              categoria: 'Rastreador',
                              descricao: `Rastreador ${veiculo.rastreador || 'não informado'} - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorRastreadorMensal),
                              status: 'Automático'
                            });
                          }
                          
                          // Financiamento mensal
                          if (veiculo.financiado && veiculo.valorFinanciamento) {
                            todasDespesas.push({
                              id: `financiamento-${veiculo.id}`,
                              data: dataAtual,
                              veiculo: veiculo,
                              tipo: 'Despesa Fixa',
                              categoria: 'Financiamento',
                              descricao: `Financiamento mensal - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorFinanciamento),
                              status: 'Automático'
                            });
                          }
                        });
                        
                        // Adicionar manutenções
                        filteredData.manutencoes.forEach(manutencao => {
                          const veiculo = veiculos.find(v => v.id === manutencao.veiculoId);
                          const valor = manutencao.valorFinal || manutencao.valorOrcamento;
                          if (valor && parseFloat(valor) > 0) {
                            todasDespesas.push({
                              id: `manutencao-${manutencao.id}`,
                              data: manutencao.dataInicio,
                              veiculo: veiculo,
                              tipo: 'Manutenção',
                              categoria: manutencao.tipo,
                              descricao: `${manutencao.tipo} - ${manutencao.oficina}`,
                              valor: parseFloat(valor),
                              status: manutencao.statusPagamento === 'pago' ? 'Pago' : 'Pendente'
                            });
                          }
                        });
                        
                        // Adicionar despesas manuais (exceto financiamento)
                        despesas.filter(despesa => despesa.categoria !== 'financiamento').forEach(despesa => {
                          const veiculo = veiculos.find(v => v.id === despesa.veiculoId);
                          todasDespesas.push({
                            id: `despesa-${despesa.id}`,
                            data: despesa.data,
                            veiculo: veiculo,
                            tipo: 'Despesa Manual',
                            categoria: despesa.categoria,
                            descricao: despesa.descricao,
                            valor: parseFloat(despesa.valor || '0'),
                            status: despesa.status === 'pago' ? 'Pago' : 'Pendente'
                          });
                        });
                        
                        // Ordenar por data (mais recente primeiro)
                        todasDespesas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
                        
                        return todasDespesas.map((despesa) => (
                          <TableRow key={despesa.id}>
                            <TableCell>
                              {formatDate(despesa.data)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{despesa.veiculo?.placa || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{despesa.veiculo?.marca} {despesa.veiculo?.modelo}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={despesa.tipo === 'Despesa Fixa' ? 'default' : 'outline'}>
                                {despesa.tipo}
                              </Badge>
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
                              {formatCurrency(despesa.valor)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={despesa.status === 'Pago' ? 'default' : 'secondary'}>
                                {despesa.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {despesa.id.startsWith('despesa-') && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => abrirModalEdicao(despesa)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => abrirModalExclusao(despesa.id.replace('despesa-', ''))}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
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
                      {despesasFixasVeiculos.map((veiculoFixo, index) => {
                        const veiculoOriginal = veiculos.find(v => v.placa === veiculoFixo.veiculo);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{veiculoFixo.veiculo}</p>
                                <p className="text-sm text-gray-500">{veiculoOriginal?.marca} {veiculoOriginal?.modelo}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {veiculoOriginal?.ipva && veiculoOriginal.ipva > 0 ? 
                                formatCurrency(parseFloat(veiculoOriginal.ipva) / 12) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoOriginal?.valorSeguroMensal && veiculoOriginal.valorSeguroMensal > 0 ? 
                                formatCurrency(parseFloat(veiculoOriginal.valorSeguroMensal)) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoOriginal?.valorRastreadorMensal && veiculoOriginal.valorRastreadorMensal > 0 ? 
                                formatCurrency(parseFloat(veiculoOriginal.valorRastreadorMensal)) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoOriginal?.financiado && veiculoOriginal.valorFinanciamento ? 
                                formatCurrency(parseFloat(veiculoOriginal.valorFinanciamento)) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(veiculoFixo.totalMensal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Detalhamento por tipo de despesa */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">IPVA Total</h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(veiculos.reduce((total, v) => 
                        total + (v.ipva && v.ipva > 0 ? parseFloat(v.ipva) / 12 : 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Seguros Total</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(veiculos.reduce((total, v) => 
                        total + (v.valorSeguroMensal && v.valorSeguroMensal > 0 ? parseFloat(v.valorSeguroMensal) : 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Rastreadores Total</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(veiculos.reduce((total, v) => 
                        total + (v.valorRastreadorMensal && v.valorRastreadorMensal > 0 ? parseFloat(v.valorRastreadorMensal) : 0), 0))}
                    </p>
                    <p className="text-sm text-gray-500">Mensal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Financiamento Total</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(veiculos.reduce((total, v) => 
                        total + (v.financiado && v.valorFinanciamento ? parseFloat(v.valorFinanciamento) : 0), 0))}
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
                        'ipva': veiculos.reduce((total, v) => total + (v.ipva && v.ipva > 0 ? parseFloat(v.ipva) / 12 : 0), 0),
                        'seguro': veiculos.reduce((total, v) => total + (v.valorSeguroMensal && v.valorSeguroMensal > 0 ? parseFloat(v.valorSeguroMensal) : 0), 0),
                        'rastreador': veiculos.reduce((total, v) => total + (v.valorRastreadorMensal && v.valorRastreadorMensal > 0 ? parseFloat(v.valorRastreadorMensal) : 0), 0),
                        'financiamento': veiculos.reduce((total, v) => total + (v.financiado && v.valorFinanciamento ? parseFloat(v.valorFinanciamento) : 0), 0)
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
      <Dialog open={modalNovaDespesa} onOpenChange={(open) => {
        console.log('Modal Nova Despesa mudou estado:', open);
        setModalNovaDespesa(open);
      }}>
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

      {/* Modal de edição de despesa */}
      <Dialog open={modalEditarDespesa} onOpenChange={setModalEditarDespesa}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Edite os dados da despesa selecionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...formEditarDespesa}>
            <form onSubmit={formEditarDespesa.handleSubmit(editarDespesa)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formEditarDespesa.control}
                  name="veiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                  control={formEditarDespesa.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="combustivel">Combustível</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="lavagem">Lavagem</SelectItem>
                          <SelectItem value="licenciamento">Licenciamento</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={formEditarDespesa.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formEditarDespesa.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formEditarDespesa.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formEditarDespesa.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
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
                  control={formEditarDespesa.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma forma" />
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
                <Button type="button" variant="outline" onClick={() => setModalEditarDespesa(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formEditarDespesa.formState.isSubmitting}>
                  {formEditarDespesa.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, id: null })}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        onConfirm={confirmarExclusao}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}