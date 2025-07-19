import { useState, useMemo, useEffect } from 'react';
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
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye, Trash2, Plus, Edit, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
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
import { Pagination } from '@/components/ui/pagination';
// Recharts removed - using simple tables and cards instead

// Schema para formulário de nova despesa
const novaDespesaSchema = z.object({
  veiculoId: z.string().optional(), // Não obrigatório quando usa multi-seleção
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
  
  // Criar variável despesasComManutencoes usando dados do hook useDespesas
  const despesasComManutencoes = useMemo(() => {
    return despesas || [];
  }, [despesas]);

  // Debug - verificar se dados estão sendo carregados
  useEffect(() => {
    console.log('RelatoriosFinanceiros - Dados carregados:', {
      despesas: despesas?.length || 0,
      despesasComManutencoes: despesasComManutencoes?.length || 0,
      manutencoes: manutencoes?.length || 0,
      veiculos: veiculos?.length || 0
    });
  }, [despesas, despesasComManutencoes, manutencoes, veiculos]);
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
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarDespesa, setModalEditarDespesa] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  // Estados de ordenação para as abas
  const [sortVeiculos, setSortVeiculos] = useState<string>('mais-lucrativos');
  const [sortMotoristas, setSortMotoristas] = useState<string>('mais-pagamentos');
  const [sortDespesasFixas, setSortDespesasFixas] = useState<string>('maior-total');
  const [sortHistorico, setSortHistorico] = useState<string>('mais-recente');
  
  // Estados de paginação para a aba "Despesas Fixas"
  const [currentPageDespesasFixas, setCurrentPageDespesasFixas] = useState(1);
  const [itemsPerPageDespesasFixas, setItemsPerPageDespesasFixas] = useState(10);
  
  // Função para alterar página
  const handlePageChangeDespesasFixas = (page: number) => {
    setCurrentPageDespesasFixas(page);
  };
  
  // Função para alterar itens por página
  const handleItemsPerPageChangeDespesasFixas = (items: number) => {
    setItemsPerPageDespesasFixas(items);
    setCurrentPageDespesasFixas(1);
  };
  
  // Estados de paginação para a aba "Análise por Veículo"
  const [currentPageVeiculos, setCurrentPageVeiculos] = useState(1);
  const [itemsPerPageVeiculos, setItemsPerPageVeiculos] = useState(10);
  
  // Função para alterar página
  const handlePageChangeVeiculos = (page: number) => {
    setCurrentPageVeiculos(page);
  };
  
  // Função para alterar itens por página
  const handleItemsPerPageChangeVeiculos = (items: number) => {
    setItemsPerPageVeiculos(items);
    setCurrentPageVeiculos(1);
  };
  
  // Estados de paginação para a aba "Análise por Motorista"
  const [currentPageMotoristas, setCurrentPageMotoristas] = useState(1);
  const [itemsPerPageMotoristas, setItemsPerPageMotoristas] = useState(10);
  
  // Função para alterar página
  const handlePageChangeMotoristas = (page: number) => {
    setCurrentPageMotoristas(page);
  };
  
  // Função para alterar itens por página
  const handleItemsPerPageChangeMotoristas = (items: number) => {
    setItemsPerPageMotoristas(items);
    setCurrentPageMotoristas(1);
  };
  
  // Estados de paginação para a aba "Histórico"
  const [currentPageHistorico, setCurrentPageHistorico] = useState(1);
  const [itemsPerPageHistorico, setItemsPerPageHistorico] = useState(10);
  
  // Função para alterar página
  const handlePageChangeHistorico = (page: number) => {
    setCurrentPageHistorico(page);
  };
  
  // Função para alterar itens por página
  const handleItemsPerPageChangeHistorico = (items: number) => {
    setItemsPerPageHistorico(items);
    setCurrentPageHistorico(1);
  };

  // Schema atualizado para multi-seleção de veículos
  const formSchema = z.object({
    veiculoIds: z.array(z.string()).min(1, "Selecione pelo menos um veículo"),
    categoria: z.string().min(1, "Selecione uma categoria"),
    descricao: z.string().min(1, "Descrição é obrigatória"),
    valor: z.string().min(1, "Valor é obrigatório"),
    valorPorVeiculo: z.number().optional(),
    formaPagamento: z.string().min(1, "Selecione uma forma de pagamento"),
  });

  // Formulário principal
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculoIds: [],
      categoria: '',
      descricao: '',
      valor: '',
      valorPorVeiculo: 0,
      formaPagamento: '',
    }
  });

  // Função para enviar formulário
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const locadoraId = profile?.locadoraId || profile?.id;
      
      if (data.veiculoIds.length === 0) {
        toast({
          title: 'Erro',
          description: 'Selecione pelo menos um veículo.',
          variant: 'destructive',
        });
        return;
      }

      if (editando && despesaEditando) {
        // Modo edição - editar despesa existente
        const response = await fetch(`/api/despesas/${despesaEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            veiculoId: data.veiculoIds[0], // Para edição, usar apenas o primeiro veículo
            categoria: data.categoria,
            descricao: data.descricao,
            valor: parseFloat(data.valor.replace(',', '.')),
            formaPagamento: data.formaPagamento,
            locadoraId,
            tipo: 'despesa',
            fonte: 'manual'
          }),
        });

        if (!response.ok) throw new Error('Erro ao editar despesa');

        toast({
          title: 'Sucesso',
          description: 'Despesa editada com sucesso.',
        });
      } else {
        // Modo criação - criar novas despesas
        const valorTotal = parseFloat(data.valor.replace(',', '.'));
        const valorPorVeiculo = valorTotal / data.veiculoIds.length;

        for (const veiculoId of data.veiculoIds) {
          const despesaData = {
            locadoraId,
            veiculoId,
            categoria: data.categoria,
            descricao: data.descricao,
            valor: valorPorVeiculo.toFixed(2),
            data: format(new Date(), 'yyyy-MM-dd'),
            formaPagamento: data.formaPagamento,
            tipo: 'despesa',
            fonte: 'manual'
          };

          const response = await fetch('/api/despesas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(despesaData),
          });

          if (!response.ok) throw new Error('Erro ao criar despesa');
        }

        toast({
          title: 'Sucesso',
          description: `${data.veiculoIds.length} despesa(s) criada(s) com sucesso.`,
        });
      }

      setModalAberto(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
    } catch (error) {
      toast({
        title: 'Erro',
        description: editando ? 'Erro ao editar despesa.' : 'Erro ao criar despesa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar formulário quando modal fecha
  useEffect(() => {
    if (!modalAberto) {
      form.reset();
      setEditando(false);
      setDespesaEditando(null);
    }
  }, [modalAberto, form]);



  // Função para editar despesa - usando onSubmit quando em modo edição

  // Função para abrir modal de edição
  const abrirModalEdicao = (despesa: any) => {
    // Apenas permite editar despesas manuais
    if (despesa.fonte !== 'manual') {
      toast({
        title: 'Não é possível editar',
        description: 'Apenas despesas manuais podem ser editadas.',
        variant: 'destructive',
      });
      return;
    }
    
    setDespesaEditando(despesa);
    setEditando(true);
    form.reset({
      veiculoIds: [despesa.veiculoId],
      categoria: despesa.categoria || '',
      descricao: despesa.descricao || '',
      valor: despesa.valor?.toString() || '',
      formaPagamento: despesa.formaPagamento || '',
    });
    setModalAberto(true);
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
      const locadoraIdForDelete = profile?.locadoraId || profile?.id;
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraIdForDelete] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraIdForDelete] });
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

  // Total das despesas fixas mensais (incluindo manutenções)
  const totalDespesasFixas = useMemo(() => {
    return despesasFixasVeiculos.reduce((total, veiculo) => total + veiculo.totalMensal, 0);
  }, [despesasFixasVeiculos]);

  // Total das despesas fixas puras (sem manutenções) - para o card do histórico
  const totalDespesasFixasPuras = useMemo(() => {
    return veiculos.reduce((total, veiculo) => {
      let despesasFixas = 0;
      
      // IPVA mensal
      if (veiculo.ipva && veiculo.ipva > 0) {
        despesasFixas += parseFloat(veiculo.ipva) / 12;
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
        despesasFixas += parseFloat(veiculo.valorSeguroMensal);
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
        despesasFixas += parseFloat(veiculo.valorRastreadorMensal);
      }
      
      // Financiamento mensal
      if (veiculo.financiado && veiculo.valorFinanciamento) {
        despesasFixas += parseFloat(veiculo.valorFinanciamento);
      }
      
      return total + despesasFixas;
    }, 0);
  }, [veiculos]);

  // Cálculos financeiros
  const receitaAlugueis = useMemo(() => {
    return filteredData.alugueisAtivos.reduce((total, aluguel) => {
      // Garantir que o valor seja um número válido
      const valorMensal = parseFloat(aluguel.valorMensal || aluguel.valorDiario || '0');
      return total + (isNaN(valorMensal) ? 0 : valorMensal);
    }, 0);
  }, [filteredData.alugueisAtivos]);

  const receitaPagamentos = useMemo(() => {
    return pagamentos
      .filter(p => p.status === 'pago' && isWithinInterval(new Date(p.data), { start: monthStart, end: monthEnd }))
      .reduce((total, pagamento) => {
        const valor = parseFloat(pagamento.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [pagamentos, monthStart, monthEnd]);

  // Receita extra de juros e multas
  const receitaExtra = useMemo(() => {
    const pagamentosFiltrados = pagamentos
      .filter(p => p.status === 'pago' && isWithinInterval(new Date(p.data), { start: monthStart, end: monthEnd }));
    
    const totalJuros = pagamentosFiltrados.reduce((total, pagamento) => {
      const juros = parseFloat(pagamento.valorJuros || '0');
      return total + (isNaN(juros) ? 0 : juros);
    }, 0);

    const totalMultas = pagamentosFiltrados.reduce((total, pagamento) => {
      const multa = parseFloat(pagamento.valorMulta || '0');
      return total + (isNaN(multa) ? 0 : multa);
    }, 0);

    return {
      totalJuros,
      totalMultas,
      total: totalJuros + totalMultas
    };
  }, [pagamentos, monthStart, monthEnd]);

  // Despesas por categoria
  const despesasPorCategoria = useMemo(() => {
    const categorias = {};
    
    // Calcular despesas manuais por categoria (excluindo financiamento que já é calculado nas fixas)
    filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa' && despesa.fonte !== 'manutencao' && despesa.categoria !== 'financiamento')
      .forEach(despesa => {
        const categoria = despesa.categoria || 'outros';
        const valor = parseFloat(despesa.valor || '0');
        if (!isNaN(valor)) {
          categorias[categoria] = (categorias[categoria] || 0) + valor;
        }
      });
    
    // Adicionar manutenções do período selecionado
    filteredData.manutencoes.forEach(manutencao => {
      const valor = manutencao.valorFinal || manutencao.valorOrcamento;
      if (valor && parseFloat(valor) > 0) {
        const valorManutencao = parseFloat(valor);
        if (!isNaN(valorManutencao)) {
          categorias['manutencao'] = (categorias['manutencao'] || 0) + valorManutencao;
        }
      }
    });
    
    // Adicionar despesas fixas por categoria
    categorias['ipva'] = veiculos.reduce((total, veiculo) => {
      const ipva = veiculo.ipva ? parseFloat(veiculo.ipva) / 12 : 0;
      return total + (isNaN(ipva) ? 0 : ipva);
    }, 0);
    
    categorias['seguro'] = veiculos.reduce((total, veiculo) => {
      const seguro = veiculo.valorSeguroMensal ? parseFloat(veiculo.valorSeguroMensal) : 0;
      return total + (isNaN(seguro) ? 0 : seguro);
    }, 0);
    
    categorias['rastreador'] = veiculos.reduce((total, veiculo) => {
      const rastreador = veiculo.valorRastreadorMensal ? parseFloat(veiculo.valorRastreadorMensal) : 0;
      return total + (isNaN(rastreador) ? 0 : rastreador);
    }, 0);
    
    categorias['financiamento'] = veiculos.reduce((total, veiculo) => {
      const financiamento = veiculo.financiado && veiculo.valorFinanciamento ? parseFloat(veiculo.valorFinanciamento) : 0;
      return total + (isNaN(financiamento) ? 0 : financiamento);
    }, 0);
    
    // Remover categorias com valor zero
    Object.keys(categorias).forEach(key => {
      if (categorias[key] === 0) {
        delete categorias[key];
      }
    });
    
    return categorias;
  }, [filteredData.despesasPeriodo, filteredData.manutencoes, veiculos]);

  const totalDespesas = useMemo(() => {
    return Object.values(despesasPorCategoria).reduce((total, valor) => total + valor, 0);
  }, [despesasPorCategoria]);

  const totalReceitas = useMemo(() => {
    return filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'receita')
      .reduce((total, despesa) => {
        const valor = parseFloat(despesa.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [filteredData.despesasPeriodo]);

  const receitaTotal = receitaPagamentos + totalReceitas + receitaExtra.total;
  const lucroLiquido = receitaTotal - totalDespesas;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // Gráficos removidos - usando visualização simples com cards e tabelas

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
    if (!veiculos || veiculos.length === 0) return [];
    
    const analise = veiculos.map(veiculo => {
      const aluguelVeiculo = alugueis.find(a => a.veiculoId === veiculo.id && a.status === 'ativo');
      const despesasVeiculo = despesas.filter(d => d.veiculoId === veiculo.id);
      
      // Calcular despesas fixas puras para este veículo (sem manutenções)
      let despesasFixasMensais = 0;
      
      // IPVA mensal
      if (veiculo.ipva && veiculo.ipva > 0) {
        despesasFixasMensais += parseFloat(veiculo.ipva) / 12;
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
        despesasFixasMensais += parseFloat(veiculo.valorSeguroMensal);
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
        despesasFixasMensais += parseFloat(veiculo.valorRastreadorMensal);
      }
      
      // Financiamento mensal
      if (veiculo.financiado && veiculo.valorFinanciamento) {
        despesasFixasMensais += parseFloat(veiculo.valorFinanciamento);
      }
      
      // Calcular receita baseada nos pagamentos do motorista do veículo
      const pagamentosVeiculo = pagamentos.filter(p => {
        return aluguelVeiculo && p.motoristaNome === aluguelVeiculo.motoristaNome;
      });
      
      const receitaMensal = pagamentosVeiculo
        .filter(p => isWithinInterval(new Date(p.data), { start: monthStart, end: monthEnd }))
        .reduce((total, pagamento) => total + parseFloat(pagamento.valor || '0'), 0);
      
      const receitaAnual = pagamentosVeiculo
        .reduce((total, pagamento) => total + parseFloat(pagamento.valor || '0'), 0);
      
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
    
    // Aplicar ordenação
    return analise.sort((a, b) => {
      switch (sortVeiculos) {
        case 'mais-lucrativos':
          return b.lucro - a.lucro;
        case 'menos-lucrativos':
          return a.lucro - b.lucro;
        case 'maior-receita':
          return b.receitaMensal - a.receitaMensal;
        case 'menor-receita':
          return a.receitaMensal - b.receitaMensal;
        case 'maior-despesa':
          return b.despesasMensais - a.despesasMensais;
        case 'menor-despesa':
          return a.despesasMensais - b.despesasMensais;
        case 'placa-az':
          return a.veiculo.localeCompare(b.veiculo);
        case 'placa-za':
          return b.veiculo.localeCompare(a.veiculo);
        default:
          return b.lucro - a.lucro;
      }
    });
  }, [veiculos, alugueis, despesas, despesasFixasVeiculos, monthStart, monthEnd, sortVeiculos]);

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
    
    // Calcular despesas fixas puras do veículo (sem manutenções)
    let despesasFixasMensais = 0;
    
    // IPVA mensal
    if (veiculo.ipva && veiculo.ipva > 0) {
      despesasFixasMensais += parseFloat(veiculo.ipva) / 12;
    }
    
    // Seguro mensal
    if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
      despesasFixasMensais += parseFloat(veiculo.valorSeguroMensal);
    }
    
    // Rastreador mensal
    if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
      despesasFixasMensais += parseFloat(veiculo.valorRastreadorMensal);
    }
    
    // Financiamento mensal
    if (veiculo.financiado && veiculo.valorFinanciamento) {
      despesasFixasMensais += parseFloat(veiculo.valorFinanciamento);
    }
    
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

    // Detalhamento por categoria incluindo despesas fixas separadas
    const despesasDetalhadas = [];
    
    // Despesas fixas separadas
    if (veiculo.ipva && veiculo.ipva > 0) {
      const valorIpva = parseFloat(veiculo.ipva) / 12;
      despesasDetalhadas.push({
        categoria: 'IPVA',
        valor: valorIpva,
        percentual: despesasMensais > 0 ? (valorIpva / despesasMensais) * 100 : 0
      });
    }
    
    if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
      const valorSeguro = parseFloat(veiculo.valorSeguroMensal);
      despesasDetalhadas.push({
        categoria: 'Seguro',
        valor: valorSeguro,
        percentual: despesasMensais > 0 ? (valorSeguro / despesasMensais) * 100 : 0
      });
    }
    
    if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
      const valorRastreador = parseFloat(veiculo.valorRastreadorMensal);
      despesasDetalhadas.push({
        categoria: 'Rastreador',
        valor: valorRastreador,
        percentual: despesasMensais > 0 ? (valorRastreador / despesasMensais) * 100 : 0
      });
    }
    
    if (veiculo.financiado && veiculo.valorFinanciamento) {
      const valorFinanciamento = parseFloat(veiculo.valorFinanciamento);
      despesasDetalhadas.push({
        categoria: 'Financiamento',
        valor: valorFinanciamento,
        percentual: despesasMensais > 0 ? (valorFinanciamento / despesasMensais) * 100 : 0
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
      
      // Calcular receita baseada nos pagamentos do período
      const receitaMes = aluguelPeriodo ? pagamentosVeiculo
        .filter(p => isWithinInterval(new Date(p.data), { start: mesStart, end: mesEnd }))
        .reduce((total, pagamento) => total + parseFloat(pagamento.valor || '0'), 0) : 0;
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

    // Preparar histórico financeiro detalhado
    const historico = {
      receitas: pagamentos
        .filter(p => {
          // Encontrar o aluguel relacionado ao pagamento
          const aluguelRelacionado = alugueis.find(a => a.motoristaNome === p.motoristaNome);
          return aluguelRelacionado && aluguelRelacionado.veiculoId === veiculo.id;
        })
        .map(pagamento => ({
          id: pagamento.id,
          tipo: 'Pagamento',
          descricao: `Pagamento de ${pagamento.motoristaNome}`,
          valor: parseFloat(pagamento.valor || '0'),
          data: pagamento.data
        })),
      despesas: [
        // Despesas manuais
        ...despesasVeiculo
          .filter(d => d.tipo === 'despesa')
          .map(despesa => ({
            id: despesa.id,
            tipo: 'Despesa Manual',
            categoria: despesa.categoria,
            descricao: despesa.descricao || `Despesa de ${despesa.categoria}`,
            valor: parseFloat(despesa.valor || '0'),
            data: despesa.data
          })),
        // Despesas fixas separadas (transformar em histórico mensal)
        ...(veiculo.ipva && veiculo.ipva > 0 ? [{
          id: `ipva-${veiculo.id}`,
          tipo: 'Despesa Fixa',
          categoria: 'IPVA',
          descricao: 'IPVA mensal',
          valor: parseFloat(veiculo.ipva) / 12,
          data: format(new Date(), 'yyyy-MM-dd')
        }] : []),
        ...(veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0 ? [{
          id: `seguro-${veiculo.id}`,
          tipo: 'Despesa Fixa',
          categoria: 'Seguro',
          descricao: 'Seguro mensal',
          valor: parseFloat(veiculo.valorSeguroMensal),
          data: format(new Date(), 'yyyy-MM-dd')
        }] : []),
        ...(veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0 ? [{
          id: `rastreador-${veiculo.id}`,
          tipo: 'Despesa Fixa',
          categoria: 'Rastreador',
          descricao: 'Rastreador mensal',
          valor: parseFloat(veiculo.valorRastreadorMensal),
          data: format(new Date(), 'yyyy-MM-dd')
        }] : []),
        ...(veiculo.financiado && veiculo.valorFinanciamento ? [{
          id: `financiamento-${veiculo.id}`,
          tipo: 'Despesa Fixa',
          categoria: 'Financiamento',
          descricao: 'Financiamento mensal',
          valor: parseFloat(veiculo.valorFinanciamento),
          data: format(new Date(), 'yyyy-MM-dd')
        }] : [])
      ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    };

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
      evolucaoMensal,
      historico
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
            setModalAberto(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        )}
      </div>

      {/* Cards de Resumo Financeiro - apenas para locadoras */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">RECEITA TOTAL</p>
                <p className="text-lg font-bold text-green-800">
                  {formatCurrency(receitaTotal)}
                </p>
                <p className="text-xs text-green-600">
                  {variacaoReceita > 0 ? '+' : ''}{variacaoReceita.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">DESPESAS TOTAIS</p>
                <p className="text-lg font-bold text-red-800">
                  {formatCurrency(totalDespesas)}
                </p>
                <p className="text-xs text-red-600">
                  {variacaoDespesas > 0 ? '+' : ''}{variacaoDespesas.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">LUCRO LÍQUIDO</p>
                <p className={`text-lg font-bold ${lucroLiquido >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(lucroLiquido)}
                </p>
                <p className="text-xs text-blue-600">
                  {variacaoLucro > 0 ? '+' : ''}{variacaoLucro.toFixed(1)}% em relação ao mês anterior
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                <DollarSign className={`w-4 h-4 ${lucroLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">MARGEM DE LUCRO</p>
                <p className={`text-lg font-bold ${margemLucro >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                  {margemLucro.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600">
                  Meta: 30%
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className={`w-4 h-4 ${margemLucro >= 0 ? 'text-purple-700' : 'text-red-700'}`} />
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
      <Tabs defaultValue="despesas" className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: '1fr 1.2fr 1.5fr 1.5fr 1fr' }}>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="veiculos">Análise por Veículo</TabsTrigger>
          <TabsTrigger value="motoristas">Análise por Motorista</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas" className="space-y-4">
          {/* Cards pequenos de resumo removidos conforme solicitado */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Receitas por Tipo
                </CardTitle>
                <CardDescription>
                  Detalhamento das receitas do mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Pagamentos Recebidos</p>
                      <p className="text-sm text-green-600">Pagamentos de aluguéis</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(receitaPagamentos)}
                    </p>
                  </div>

                  {receitaExtra.total > 0 && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">Receita Extra</p>
                        <p className="text-sm text-yellow-600">
                          Juros: {formatCurrency(receitaExtra.totalJuros)} • 
                          Multas: {formatCurrency(receitaExtra.totalMultas)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-yellow-600">
                        {formatCurrency(receitaExtra.total)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div>
                      <p className="font-bold text-gray-800">TOTAL RECEITAS</p>
                      <p className="text-sm text-gray-600">Soma de todas as receitas</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(receitaTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Despesas por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Despesas por Categoria
                </CardTitle>
                <CardDescription>
                  Valor de cada categoria de despesa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(despesasPorCategoria)
                    .sort(([,a], [,b]) => b - a) // Ordenar por valor decrescente
                    .map(([categoria, valor]) => {
                      const nomeCategoria = categoria.charAt(0).toUpperCase() + categoria.slice(1);
                      const corBg = categoria === 'emprestimo' ? 'bg-purple-50' :
                                   categoria === 'lavagem' ? 'bg-blue-50' :
                                   categoria === 'ipva' ? 'bg-yellow-50' :
                                   categoria === 'seguro' ? 'bg-green-50' :
                                   categoria === 'rastreador' ? 'bg-indigo-50' :
                                   categoria === 'financiamento' ? 'bg-pink-50' :
                                   'bg-gray-50';
                      const corTexto = categoria === 'emprestimo' ? 'text-purple-800' :
                                      categoria === 'lavagem' ? 'text-blue-800' :
                                      categoria === 'ipva' ? 'text-yellow-800' :
                                      categoria === 'seguro' ? 'text-green-800' :
                                      categoria === 'rastreador' ? 'text-indigo-800' :
                                      categoria === 'financiamento' ? 'text-pink-800' :
                                      'text-gray-800';
                      const corValor = categoria === 'emprestimo' ? 'text-purple-600' :
                                      categoria === 'lavagem' ? 'text-blue-600' :
                                      categoria === 'ipva' ? 'text-yellow-600' :
                                      categoria === 'seguro' ? 'text-green-600' :
                                      categoria === 'rastreador' ? 'text-indigo-600' :
                                      categoria === 'financiamento' ? 'text-pink-600' :
                                      'text-gray-600';
                      
                      return (
                        <div key={categoria} className={`flex justify-between items-center p-2 ${corBg} rounded-lg`}>
                          <div>
                            <p className={`font-medium ${corTexto}`}>{nomeCategoria}</p>
                          </div>
                          <p className={`font-bold ${corValor}`}>
                            {formatCurrency(valor)}
                          </p>
                        </div>
                      );
                    })}
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 mt-3">
                    <div>
                      <p className="font-bold text-gray-800">TOTAL DESPESAS</p>
                      <p className="text-sm text-gray-600">Soma de todas as categorias</p>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(totalDespesas)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Resumo das despesas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-700 mb-2">Total Despesas Fixas</h4>
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(totalDespesasFixasPuras)}
              </p>
              <p className="text-sm text-red-600">Mensais</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-700 mb-2">Manutenções</h4>
              <p className="text-2xl font-bold text-orange-800">
                {formatCurrency(filteredData.manutencoes.reduce((total, m) => 
                  total + (parseFloat(m.valorFinal || m.valorOrcamento || '0') || 0), 0))}
              </p>
              <p className="text-sm text-orange-600">Período</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">Despesas Manuais</h4>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(despesasManuaisValor)}
              </p>
              <p className="text-sm text-blue-600">Período</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Despesas dos Veículos</CardTitle>
                <CardDescription>
                  Todas as despesas fixas e manutenções registradas no sistema - dados reais
                </CardDescription>
              </div>
              
              {/* Ordenação */}
              <Select value={sortHistorico} onValueChange={setSortHistorico}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-recente">Mais Recente</SelectItem>
                  <SelectItem value="mais-antiga">Mais Antiga</SelectItem>
                  <SelectItem value="maior-valor">Maior Valor</SelectItem>
                  <SelectItem value="menor-valor">Menor Valor</SelectItem>
                  <SelectItem value="tipo-az">Tipo (A-Z)</SelectItem>
                  <SelectItem value="tipo-za">Tipo (Z-A)</SelectItem>
                  <SelectItem value="categoria-az">Categoria (A-Z)</SelectItem>
                  <SelectItem value="categoria-za">Categoria (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                              status: 'Automático',
                              formaPagamento: 'Boleto',
                              createdAt: veiculo.createdAt || dataAtual
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
                              descricao: `Seguro mensal - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorSeguroMensal),
                              status: 'Automático',
                              formaPagamento: 'Boleto',
                              createdAt: veiculo.createdAt || dataAtual
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
                              descricao: `Rastreador mensal - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorRastreadorMensal),
                              status: 'Automático',
                              formaPagamento: 'Débito Automático',
                              createdAt: veiculo.createdAt || dataAtual
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
                              status: 'Automático',
                              formaPagamento: 'Débito Automático',
                              createdAt: veiculo.createdAt || dataAtual
                            });
                          }
                        });
                        
                        // Adicionar manutenções concluídas
                        filteredData.manutencoes.forEach(manutencao => {
                          const valor = manutencao.valorFinal || manutencao.valorOrcamento;
                          if (valor && parseFloat(valor) > 0) {
                            // Encontrar veículo
                            const veiculo = veiculos.find(v => v.id === manutencao.veiculoId);
                            const dataOriginal = manutencao.dataConclusao || manutencao.dataInicio;
                            
                            todasDespesas.push({
                              id: `manutencao-${manutencao.id}`,
                              data: dataOriginal,
                              veiculo: veiculo,
                              tipo: 'Manutenção',
                              categoria: 'Manutenção',
                              descricao: `${manutencao.tipo} - ${manutencao.oficina}`,
                              valor: parseFloat(valor),
                              status: manutencao.statusPagamento === 'pago' ? 'Pago' : 'Pendente',
                              formaPagamento: manutencao.formaPagamento || 'Não informado',
                              createdAt: dataOriginal
                            });
                          }
                        });
                        
                        // Adicionar despesas manuais
                        despesas.filter(despesa => despesa.categoria !== 'financiamento').forEach(despesa => {
                          const veiculo = veiculos.find(v => v.id === despesa.veiculoId);
                          todasDespesas.push({
                            id: `despesa-${despesa.id}`,
                            data: despesa.data,
                            veiculo: veiculo,
                            tipo: 'Despesa Manual',
                            categoria: despesa.categoria,
                            descricao: despesa.descricao,
                            valor: parseFloat(despesa.valor),
                            status: 'Manual',
                            formaPagamento: despesa.formaPagamento || 'Não informado',
                            createdAt: despesa.createdAt || despesa.data
                          });
                        });

                        // Aplicar ordenação
                        const despesasOrdenadas = todasDespesas.sort((a, b) => {
                          switch (sortHistorico) {
                            case 'mais-recente':
                              const dataA = new Date(a.data);
                              const dataB = new Date(b.data);
                              if (dataA.getTime() === dataB.getTime()) {
                                // Se as datas são iguais, priorizar manutenções
                                if (a.tipo === 'Manutenção' && b.tipo !== 'Manutenção') return -1;
                                if (a.tipo !== 'Manutenção' && b.tipo === 'Manutenção') return 1;
                                return 0;
                              }
                              return dataB.getTime() - dataA.getTime();
                            case 'mais-antiga':
                              return new Date(a.data).getTime() - new Date(b.data).getTime();
                            case 'maior-valor':
                              return b.valor - a.valor;
                            case 'menor-valor':
                              return a.valor - b.valor;
                            case 'tipo-az':
                              return a.tipo.localeCompare(b.tipo);
                            case 'tipo-za':
                              return b.tipo.localeCompare(a.tipo);
                            case 'categoria-az':
                              return a.categoria.localeCompare(b.categoria);
                            case 'categoria-za':
                              return b.categoria.localeCompare(a.categoria);
                            default:
                              return new Date(b.data).getTime() - new Date(a.data).getTime();
                          }
                        });

                        // Aplicar paginação
                        const startIndex = (currentPageHistorico - 1) * itemsPerPageHistorico;
                        const endIndex = startIndex + itemsPerPageHistorico;
                        const despesasPaginadas = despesasOrdenadas.slice(startIndex, endIndex);

                        return despesasPaginadas.map(despesa => {
                          return (
                          <TableRow key={despesa.id}>
                            <TableCell>{formatDate(despesa.data)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-medium">{despesa.veiculo?.placa || 'Não informado'}</p>
                                  <p className="text-sm text-gray-600">{despesa.veiculo?.marca} {despesa.veiculo?.modelo}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={despesa.tipo === 'Despesa Fixa' ? 'default' : 
                                            despesa.tipo === 'Manutenção' ? 'secondary' : 'destructive'}>
                                {despesa.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
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
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Paginação */}
                {(() => {
                  const totalItems = (() => {
                    let total = 0;
                    
                    // Contar despesas fixas
                    veiculos.forEach(veiculo => {
                      if (veiculo.ipva && veiculo.ipva > 0) total++;
                      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) total++;
                      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) total++;
                      if (veiculo.financiado && veiculo.valorFinanciamento) total++;
                    });
                    
                    // Contar manutenções
                    filteredData.manutencoes.forEach(manutencao => {
                      const valor = manutencao.valorFinal || manutencao.valorOrcamento;
                      if (valor && parseFloat(valor) > 0) total++;
                    });
                    
                    // Contar despesas manuais
                    despesas.filter(despesa => despesa.categoria !== 'financiamento').forEach(() => {
                      total++;
                    });
                    
                    return total;
                  })();
                  
                  return totalItems > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <Pagination
                        currentPage={currentPageHistorico}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPageHistorico}
                        onPageChange={handlePageChangeHistorico}
                        onItemsPerPageChange={handleItemsPerPageChangeHistorico}
                      />
                    </div>
                  );
                })()}


              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veiculos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  ANÁLISE FINANCEIRA POR VEÍCULO
                </CardTitle>
                <CardDescription>
                  Performance financeira detalhada de cada veículo da frota
                </CardDescription>
              </div>
              
              {/* Ordenação */}
              <Select value={sortVeiculos} onValueChange={setSortVeiculos}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-lucrativos">Mais Lucrativos</SelectItem>
                  <SelectItem value="menos-lucrativos">Menos Lucrativos</SelectItem>
                  <SelectItem value="maior-receita">Maior Receita</SelectItem>
                  <SelectItem value="menor-receita">Menor Receita</SelectItem>
                  <SelectItem value="maior-despesa">Maior Despesa</SelectItem>
                  <SelectItem value="menor-despesa">Menor Despesa</SelectItem>
                  <SelectItem value="placa-az">Placa (A-Z)</SelectItem>
                  <SelectItem value="placa-za">Placa (Z-A)</SelectItem>
                </SelectContent>
              </Select>
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
                    {(() => {
                      // Calcular paginação
                      const startIndex = (currentPageVeiculos - 1) * itemsPerPageVeiculos;
                      const endIndex = startIndex + itemsPerPageVeiculos;
                      const dadosPaginados = analiseVeiculos.slice(startIndex, endIndex);
                      
                      return dadosPaginados.map((item) => (
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
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              {analiseVeiculos.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <Pagination
                    currentPage={currentPageVeiculos}
                    totalItems={analiseVeiculos.length}
                    itemsPerPage={itemsPerPageVeiculos}
                    onPageChange={handlePageChangeVeiculos}
                    onItemsPerPageChange={handleItemsPerPageChangeVeiculos}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motoristas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análise por Motorista</CardTitle>
                <CardDescription>
                  Performance financeira baseada nos pagamentos de cada motorista
                </CardDescription>
              </div>
              
              {/* Ordenação */}
              <Select value={sortMotoristas} onValueChange={setSortMotoristas}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-pagamentos">Mais Pagamentos</SelectItem>
                  <SelectItem value="menos-pagamentos">Menos Pagamentos</SelectItem>
                  <SelectItem value="maior-valor">Maior Valor</SelectItem>
                  <SelectItem value="menor-valor">Menor Valor</SelectItem>
                  <SelectItem value="mais-atuais">Mais Atuais</SelectItem>
                  <SelectItem value="menos-atuais">Menos Atuais</SelectItem>
                  <SelectItem value="nome-az">Nome (A-Z)</SelectItem>
                  <SelectItem value="nome-za">Nome (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const dadosMotoristas = motoristas.map((motorista) => {
                    // Calcular pagamentos do motorista no período
                    const pagamentosMotorista = pagamentos.filter(p => 
                      p.motoristaNome === motorista.nome && 
                      p.status === 'pago' && 
                      isWithinInterval(new Date(p.data), { start: monthStart, end: monthEnd })
                    );
                    
                    const totalPagamentos = pagamentosMotorista.reduce((total, p) => 
                      total + parseFloat(p.valor || '0'), 0
                    );
                    
                    // Encontrar aluguel ativo do motorista
                    const aluguelAtivo = alugueis.find(a => 
                      a.motoristaNome === motorista.nome && a.status === 'ativo'
                    );
                    
                    return {
                      motorista,
                      totalPagamentos,
                      pagamentosMotorista,
                      aluguelAtivo,
                      temDados: totalPagamentos > 0 || aluguelAtivo
                    };
                  }).filter(item => item.temDados);
                  
                  // Aplicar ordenação
                  const dadosOrdenados = dadosMotoristas.sort((a, b) => {
                    switch (sortMotoristas) {
                      case 'mais-pagamentos':
                        return b.pagamentosMotorista.length - a.pagamentosMotorista.length;
                      case 'menos-pagamentos':
                        return a.pagamentosMotorista.length - b.pagamentosMotorista.length;
                      case 'maior-valor':
                        return b.totalPagamentos - a.totalPagamentos;
                      case 'menor-valor':
                        return a.totalPagamentos - b.totalPagamentos;
                      case 'nome-az':
                        return a.motorista.nome.localeCompare(b.motorista.nome);
                      case 'nome-za':
                        return b.motorista.nome.localeCompare(a.motorista.nome);
                      default:
                        return b.totalPagamentos - a.totalPagamentos;
                    }
                  });
                  
                  // Aplicar paginação
                  const startIndex = (currentPageMotoristas - 1) * itemsPerPageMotoristas;
                  const endIndex = startIndex + itemsPerPageMotoristas;
                  const dadosPaginados = dadosOrdenados.slice(startIndex, endIndex);
                  
                  return dadosPaginados.map(({motorista, totalPagamentos, pagamentosMotorista, aluguelAtivo}) => (
                    <div key={motorista.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{motorista.nome}</p>
                        {aluguelAtivo && (
                          <p className="text-sm text-gray-500">
                            {aluguelAtivo.veiculoModelo} - {aluguelAtivo.veiculoPlaca}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {pagamentosMotorista.length} pagamento{pagamentosMotorista.length !== 1 ? 's' : ''} este mês
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(totalPagamentos)}
                        </p>
                        <Badge variant={aluguelAtivo ? "default" : "secondary"}>
                          {aluguelAtivo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Paginação */}
              {(() => {
                const dadosMotoristas = motoristas.map((motorista) => {
                  // Calcular pagamentos do motorista no período
                  const pagamentosMotorista = pagamentos.filter(p => 
                    p.motoristaNome === motorista.nome && 
                    p.status === 'pago' && 
                    isWithinInterval(new Date(p.data), { start: monthStart, end: monthEnd })
                  );
                  
                  const totalPagamentos = pagamentosMotorista.reduce((total, p) => 
                    total + parseFloat(p.valor || '0'), 0
                  );
                  
                  // Encontrar aluguel ativo do motorista
                  const aluguelAtivo = alugueis.find(a => 
                    a.motoristaNome === motorista.nome && a.status === 'ativo'
                  );
                  
                  return {
                    motorista,
                    totalPagamentos,
                    pagamentosMotorista,
                    aluguelAtivo,
                    temDados: totalPagamentos > 0 || aluguelAtivo
                  };
                }).filter(item => item.temDados);
                
                return dadosMotoristas.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <Pagination
                      currentPage={currentPageMotoristas}
                      totalItems={dadosMotoristas.length}
                      itemsPerPage={itemsPerPageMotoristas}
                      onPageChange={handlePageChangeMotoristas}
                      onItemsPerPageChange={handleItemsPerPageChangeMotoristas}
                    />
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas-fixas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Despesas Fixas dos Veículos</CardTitle>
                <CardDescription>
                  Despesas automáticas baseadas no cadastro dos veículos (IPVA, Seguro, Rastreador)
                </CardDescription>
              </div>
              
              <Select value={sortDespesasFixas} onValueChange={setSortDespesasFixas}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maior-total">Maior Total</SelectItem>
                  <SelectItem value="menor-total">Menor Total</SelectItem>
                  <SelectItem value="maior-ipva">Maior IPVA</SelectItem>
                  <SelectItem value="menor-ipva">Menor IPVA</SelectItem>
                  <SelectItem value="maior-seguro">Maior Seguro</SelectItem>
                  <SelectItem value="menor-seguro">Menor Seguro</SelectItem>
                  <SelectItem value="placa-az">Placa (A-Z)</SelectItem>
                  <SelectItem value="placa-za">Placa (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      {(() => {
                        const veiculosDespesasFixas = veiculos.map(veiculo => {
                          const ipvaM = veiculo.ipva && veiculo.ipva > 0 ? parseFloat(veiculo.ipva) / 12 : 0;
                          const seguroM = veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0 ? parseFloat(veiculo.valorSeguroMensal) : 0;
                          const rastreadorM = veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0 ? parseFloat(veiculo.valorRastreadorMensal) : 0;
                          const financiamentoM = veiculo.financiado && veiculo.valorFinanciamento ? parseFloat(veiculo.valorFinanciamento) : 0;
                          const totalM = ipvaM + seguroM + rastreadorM + financiamentoM;
                          
                          return {
                            veiculo,
                            ipvaM,
                            seguroM,
                            rastreadorM,
                            financiamentoM,
                            totalM
                          };
                        });

                        const veiculosOrdenados = veiculosDespesasFixas.sort((a, b) => {
                          switch (sortDespesasFixas) {
                            case 'maior-total':
                              return b.totalM - a.totalM;
                            case 'menor-total':
                              return a.totalM - b.totalM;
                            case 'maior-ipva':
                              return b.ipvaM - a.ipvaM;
                            case 'menor-ipva':
                              return a.ipvaM - b.ipvaM;
                            case 'maior-seguro':
                              return b.seguroM - a.seguroM;
                            case 'menor-seguro':
                              return a.seguroM - b.seguroM;
                            case 'placa-az':
                              return a.veiculo.placa.localeCompare(b.veiculo.placa);
                            case 'placa-za':
                              return b.veiculo.placa.localeCompare(a.veiculo.placa);
                            default:
                              return b.totalM - a.totalM;
                          }
                        });

                        const startIndex = (currentPageDespesasFixas - 1) * itemsPerPageDespesasFixas;
                        const endIndex = startIndex + itemsPerPageDespesasFixas;
                        const veiculosPaginados = veiculosOrdenados.slice(startIndex, endIndex);

                        return veiculosPaginados.map(item => (
                          <TableRow key={item.veiculo.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-medium">{item.veiculo.placa}</p>
                                  <p className="text-sm text-gray-600">{item.veiculo.marca} {item.veiculo.modelo}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-amber-600">
                              {item.ipvaM > 0 ? formatCurrency(item.ipvaM) : '-'}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.seguroM > 0 ? formatCurrency(item.seguroM) : '-'}
                            </TableCell>
                            <TableCell className="font-medium text-indigo-600">
                              {item.rastreadorM > 0 ? formatCurrency(item.rastreadorM) : '-'}
                            </TableCell>
                            <TableCell className="font-medium text-pink-600">
                              {item.financiamentoM > 0 ? formatCurrency(item.financiamentoM) : '-'}
                            </TableCell>
                            <TableCell className="font-bold text-red-600">
                              {formatCurrency(item.totalM)}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
                
                {veiculos.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <Pagination
                      currentPage={currentPageDespesasFixas}
                      totalItems={veiculos.length}
                      itemsPerPage={itemsPerPageDespesasFixas}
                      onPageChange={handlePageChangeDespesasFixas}
                      onItemsPerPageChange={handleItemsPerPageChangeDespesasFixas}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Análise por Categoria das Despesas Fixas */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Análise por Categoria</CardTitle>
                <CardDescription>Distribuição das despesas fixas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const categorias = {};
                  let totalDespesasFixas = 0;
                  
                  // Calcular totais por categoria
                  veiculos.forEach(veiculo => {
                    // IPVA
                    if (veiculo.ipva && veiculo.ipva > 0) {
                      const valor = parseFloat(veiculo.ipva) / 12;
                      categorias['IPVA'] = (categorias['IPVA'] || 0) + valor;
                      totalDespesasFixas += valor;
                    }
                    
                    // Seguro
                    if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
                      const valor = parseFloat(veiculo.valorSeguroMensal);
                      categorias['Seguro'] = (categorias['Seguro'] || 0) + valor;
                      totalDespesasFixas += valor;
                    }
                    
                    // Rastreador
                    if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
                      const valor = parseFloat(veiculo.valorRastreadorMensal);
                      categorias['Rastreador'] = (categorias['Rastreador'] || 0) + valor;
                      totalDespesasFixas += valor;
                    }
                    
                    // Financiamento
                    if (veiculo.financiado && veiculo.valorFinanciamento) {
                      const valor = parseFloat(veiculo.valorFinanciamento);
                      categorias['Financiamento'] = (categorias['Financiamento'] || 0) + valor;
                      totalDespesasFixas += valor;
                    }
                  });
                  
                  // Ordenar por valor (maior para menor)
                  const categoriasOrdenadas = Object.entries(categorias).sort(([,a], [,b]) => b - a);
                  
                  return totalDespesasFixas > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="space-y-1">
                        {categoriasOrdenadas.map(([categoria, valor]) => {
                          const percentual = (valor / totalDespesasFixas) * 100;
                          
                          return (
                            <div key={categoria} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="font-medium text-red-700">{categoria}</p>
                                  <div className="text-right">
                                    <p className="font-bold text-red-600">{formatCurrency(valor)}</p>
                                    <p className="text-xs text-red-500">{percentual.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <div className="w-full bg-red-100 rounded-full h-1.5">
                                  <div 
                                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${percentual}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-md border border-red-200 mt-2">
                          <div>
                            <p className="font-bold text-red-800">TOTAL DESPESAS FIXAS</p>
                            <p className="text-xs text-red-600">Soma de todas as categorias fixas</p>
                          </div>
                          <p className="text-lg font-bold text-red-700">
                            {formatCurrency(totalDespesasFixas)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Atualize os dados da despesa.' : 'Adicione uma nova despesa manual.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="veiculoIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículos</FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            type="button"
                          >
                            {field.value?.length === 0 ? 'Selecionar' :
                             field.value?.length === 1 ? 
                               veiculos.find(v => v.id === field.value[0])?.placa + ' - ' + veiculos.find(v => v.id === field.value[0])?.modelo :
                               `${field.value?.length} veículos`}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full min-w-[300px]">
                          <div className="p-2">
                            <div className="flex gap-2 mb-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => field.onChange(veiculos.map(v => v.id))}
                              >
                                Todos
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => field.onChange([])}
                              >
                                Limpar
                              </Button>
                            </div>
                            {veiculos.map(veiculo => (
                              <DropdownMenuCheckboxItem
                                key={veiculo.id}
                                checked={field.value?.includes(veiculo.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, veiculo.id]);
                                  } else {
                                    field.onChange(current.filter(id => id !== veiculo.id));
                                  }
                                }}
                              >
                                {veiculo.placa} - {veiculo.modelo}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="combustivel">Combustível</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="licenciamento">Licenciamento</SelectItem>
                          <SelectItem value="lavagem">Lavagem</SelectItem>
                          <SelectItem value="emprestimo">Empréstimo</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : editando ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={confirmDelete.open} onOpenChange={(open) => setConfirmDelete({ ...confirmDelete, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete({ open: false, id: '' })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusao}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
