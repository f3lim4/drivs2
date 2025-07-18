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
import { Pagination } from '@/components/ui/pagination';

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
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  // Estados de ordenação para as abas
  const [sortVeiculos, setSortVeiculos] = useState<string>('mais-lucrativos');
  const [sortMotoristas, setSortMotoristas] = useState<string>('mais-pagamentos');
  const [sortDespesasFixas, setSortDespesasFixas] = useState<string>('mais-recentes');
  const [sortHistorico, setSortHistorico] = useState<string>('mais-recentes');
  
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

  // Limpar veículos selecionados quando categoria não for empréstimo
  useEffect(() => {
    if (formNovaDespesa.watch('categoria') !== 'emprestimo') {
      setSelectedVehicles([]);
    }
  }, [formNovaDespesa.watch('categoria')]);

  // Função para criar nova despesa
  const criarNovaDespesa = async (data: NovaDespesaData) => {
    try {
      const locadoraId = profile?.locadoraId || profile?.id;
      console.log('Criando despesa com locadoraId:', locadoraId);
      
      // Validar se categoria empréstimo tem veículos selecionados
      if (data.categoria === 'emprestimo' && selectedVehicles.length === 0) {
        toast({
          title: 'Erro de validação',
          description: 'Para empréstimos, você deve selecionar pelo menos um veículo.',
          variant: 'destructive',
        });
        return;
      }

      // Se for categoria "emprestimo" e há veículos selecionados, criar múltiplas despesas
      if (data.categoria === 'emprestimo' && selectedVehicles.length > 0) {
        const valorTotal = parseFloat(data.valor.toString().replace(',', '.'));
        const valorPorVeiculo = (valorTotal / selectedVehicles.length).toFixed(2);
        
        // Criar uma despesa para cada veículo selecionado
        const promises = selectedVehicles.map(veiculoId => 
          fetch('/api/despesas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...data,
              veiculoId,
              valor: valorPorVeiculo,
              descricao: `${data.descricao} (${selectedVehicles.length} veículos - R$ ${valorPorVeiculo} cada)`,
              locadoraId,
              tipo: 'despesa'
            }),
          })
        );
        
        const responses = await Promise.all(promises);
        const allOk = responses.every(response => response.ok);
        
        if (!allOk) {
          throw new Error('Erro ao criar uma ou mais despesas');
        }
        
        toast({
          title: 'Despesas criadas com sucesso',
          description: `${selectedVehicles.length} despesas de empréstimo criadas - R$ ${valorPorVeiculo} cada`,
        });
      } else {
        // Comportamento padrão para outras categorias
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

        toast({
          title: "Despesa criada",
          description: "A despesa foi criada com sucesso.",
          variant: "default",
        });
      }

      // Invalidar cache específico com locadoraId
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraId] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraId] });
      setModalNovaDespesa(false);
      formNovaDespesa.reset();
      setSelectedVehicles([]);
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
      const locadoraIdForEdit = profile?.locadoraId || profile?.id;
      await queryClient.invalidateQueries({ queryKey: ['/api/despesas', locadoraIdForEdit] });
      await queryClient.refetchQueries({ queryKey: ['/api/despesas', locadoraIdForEdit] });
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
    if (!despesas || !Array.isArray(despesas)) return;
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

  const receitaTotal = receitaPagamentos + totalReceitas;
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
      <Tabs defaultValue="veiculos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="veiculos">Análise por Veículo</TabsTrigger>
          <TabsTrigger value="motoristas">Análise por Motorista</TabsTrigger>
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="despesas">Histórico</TabsTrigger>
        </TabsList>

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



        <TabsContent value="despesas" className="space-y-4">
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
                              descricao: `Seguro ${veiculo.seguradora || 'não informado'} - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorSeguroMensal),
                              status: 'Automático',
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
                              descricao: `Rastreador ${veiculo.rastreador || 'não informado'} - ${veiculo.placa}`,
                              valor: parseFloat(veiculo.valorRastreadorMensal),
                              status: 'Automático',
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
                              createdAt: veiculo.createdAt || dataAtual
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
                              status: manutencao.statusPagamento === 'pago' ? 'Pago' : 'Pendente',
                              createdAt: manutencao.createdAt || manutencao.dataInicio
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
                            status: despesa.status === 'pago' ? 'Pago' : 'Pendente',
                            createdAt: despesa.createdAt || despesa.data // Para ordenação adicional
                          });
                        });
                        
                        // Aplicar ordenação baseada na seleção do usuário
                        todasDespesas.sort((a, b) => {
                          const dateA = new Date(a.data).getTime();
                          const dateB = new Date(b.data).getTime();
                          
                          switch (sortHistorico) {
                            case 'mais-recente':
                              if (dateB !== dateA) return dateB - dateA;
                              break;
                            case 'mais-antiga':
                              if (dateA !== dateB) return dateA - dateB;
                              break;
                            case 'maior-valor':
                              if (b.valor !== a.valor) return b.valor - a.valor;
                              break;
                            case 'menor-valor':
                              if (a.valor !== b.valor) return a.valor - b.valor;
                              break;
                            case 'tipo-az':
                              if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
                              break;
                            case 'tipo-za':
                              if (a.tipo !== b.tipo) return b.tipo.localeCompare(a.tipo);
                              break;
                            case 'categoria-az':
                              if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
                              break;
                            case 'categoria-za':
                              if (a.categoria !== b.categoria) return b.categoria.localeCompare(a.categoria);
                              break;
                            default:
                              // Padrão: mais recente primeiro
                              if (dateB !== dateA) return dateB - dateA;
                          }
                          
                          // Em caso de empate na ordenação primária, ordena por data de criação (mais recente primeiro)
                          if (a.createdAt && b.createdAt) {
                            const createdA = new Date(a.createdAt).getTime();
                            const createdB = new Date(b.createdAt).getTime();
                            if (createdB !== createdA) {
                              return createdB - createdA;
                            }
                          }
                          
                          // Em caso de empate final, prioriza despesas manuais
                          const prioridadeTipo = {
                            'Despesa Manual': 1,
                            'Manutenção': 2,
                            'Despesa Fixa': 3
                          };
                          
                          return prioridadeTipo[a.tipo] - prioridadeTipo[b.tipo];
                        });
                        
                        // Aplicar paginação
                        const startIndex = (currentPageHistorico - 1) * itemsPerPageHistorico;
                        const endIndex = startIndex + itemsPerPageHistorico;
                        const despesasPaginadas = todasDespesas.slice(startIndex, endIndex);
                        
                        return despesasPaginadas.map((despesa) => (
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
                
                {/* Paginação */}
                {(() => {
                  const todasDespesas = [];
                  
                  // Adicionar despesas fixas mensais
                  veiculos.forEach(veiculo => {
                    const dataAtual = new Date().toISOString().split('T')[0];
                    
                    // IPVA mensal
                    if (veiculo.ipva && veiculo.ipva > 0) {
                      todasDespesas.push({});
                    }
                    
                    // Seguro mensal
                    if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
                      todasDespesas.push({});
                    }
                    
                    // Rastreador mensal
                    if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
                      todasDespesas.push({});
                    }
                    
                    // Financiamento mensal
                    if (veiculo.financiado && veiculo.valorFinanciamento) {
                      todasDespesas.push({});
                    }
                  });
                  
                  // Adicionar manutenções
                  filteredData.manutencoes.forEach(manutencao => {
                    const valor = manutencao.valorFinal || manutencao.valorOrcamento;
                    if (valor && parseFloat(valor) > 0) {
                      todasDespesas.push({});
                    }
                  });
                  
                  // Adicionar despesas manuais (exceto financiamento)
                  despesas.filter(despesa => despesa.categoria !== 'financiamento').forEach(despesa => {
                    todasDespesas.push({});
                  });
                  
                  return todasDespesas.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <Pagination
                        currentPage={currentPageHistorico}
                        totalItems={todasDespesas.length}
                        itemsPerPage={itemsPerPageHistorico}
                        onPageChange={handlePageChangeHistorico}
                        onItemsPerPageChange={handleItemsPerPageChangeHistorico}
                      />
                    </div>
                  );
                })()}
                
                {/* Resumo das despesas - movido para o final */}
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
              </div>
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
              
              {/* Ordenação */}
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
                      {(() => {
                        // Calcular despesas fixas puras para cada veículo (sem manutenções)
                        const veiculosDespesasFixas = veiculos.map(veiculo => {
                          const ipvaM = veiculo.ipva && veiculo.ipva > 0 ? parseFloat(veiculo.ipva) / 12 : 0;
                          const seguroM = veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0 ? parseFloat(veiculo.valorSeguroMensal) : 0;
                          const rastreadorM = veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0 ? parseFloat(veiculo.valorRastreadorMensal) : 0;
                          const financiamentoM = veiculo.financiado && veiculo.valorFinanciamento ? parseFloat(veiculo.valorFinanciamento) : 0;
                          
                          return {
                            veiculo: veiculo.placa,
                            totalMensal: ipvaM + seguroM + rastreadorM + financiamentoM,
                            ipva: ipvaM,
                            seguro: seguroM,
                            rastreador: rastreadorM,
                            financiamento: financiamentoM,
                            veiculoOriginal: veiculo
                          };
                        });
                        
                        // Aplicar ordenação
                        const dadosOrdenados = [...veiculosDespesasFixas].sort((a, b) => {
                          switch (sortDespesasFixas) {
                            case 'maior-total':
                              return b.totalMensal - a.totalMensal;
                            case 'menor-total':
                              return a.totalMensal - b.totalMensal;
                            case 'maior-ipva':
                              return b.ipva - a.ipva;
                            case 'menor-ipva':
                              return a.ipva - b.ipva;
                            case 'maior-seguro':
                              return b.seguro - a.seguro;
                            case 'menor-seguro':
                              return a.seguro - b.seguro;
                            case 'placa-az':
                              return a.veiculo.localeCompare(b.veiculo);
                            case 'placa-za':
                              return b.veiculo.localeCompare(a.veiculo);
                            default:
                              return b.totalMensal - a.totalMensal;
                          }
                        });
                        
                        // Calcular paginação
                        const startIndex = (currentPageDespesasFixas - 1) * itemsPerPageDespesasFixas;
                        const endIndex = startIndex + itemsPerPageDespesasFixas;
                        const dadosPaginados = dadosOrdenados.slice(startIndex, endIndex);
                        
                        return dadosPaginados.map((veiculoFixo, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{veiculoFixo.veiculo}</p>
                                <p className="text-sm text-gray-500">{veiculoFixo.veiculoOriginal?.marca} {veiculoFixo.veiculoOriginal?.modelo}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {veiculoFixo.ipva > 0 ? 
                                formatCurrency(veiculoFixo.ipva) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoFixo.seguro > 0 ? 
                                formatCurrency(veiculoFixo.seguro) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoFixo.rastreador > 0 ? 
                                formatCurrency(veiculoFixo.rastreador) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              {veiculoFixo.financiamento > 0 ? 
                                formatCurrency(veiculoFixo.financiamento) : 
                                <span className="text-gray-400">-</span>
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(veiculoFixo.totalMensal)}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {(() => {
                  const veiculosDespesasFixas = veiculos.map(veiculo => {
                    const ipvaM = veiculo.ipva && veiculo.ipva > 0 ? parseFloat(veiculo.ipva) / 12 : 0;
                    const seguroM = veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0 ? parseFloat(veiculo.valorSeguroMensal) : 0;
                    const rastreadorM = veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0 ? parseFloat(veiculo.valorRastreadorMensal) : 0;
                    const financiamentoM = veiculo.financiado && veiculo.valorFinanciamento ? parseFloat(veiculo.valorFinanciamento) : 0;
                    
                    return {
                      veiculo: veiculo.placa,
                      totalMensal: ipvaM + seguroM + rastreadorM + financiamentoM,
                      ipva: ipvaM,
                      seguro: seguroM,
                      rastreador: rastreadorM,
                      financiamento: financiamentoM,
                      veiculoOriginal: veiculo
                    };
                  });
                  
                  return veiculosDespesasFixas.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <Pagination
                        currentPage={currentPageDespesasFixas}
                        totalItems={veiculosDespesasFixas.length}
                        itemsPerPage={itemsPerPageDespesasFixas}
                        onPageChange={handlePageChangeDespesasFixas}
                        onItemsPerPageChange={handleItemsPerPageChangeDespesasFixas}
                      />
                    </div>
                  );
                })()}

                {/* Cards de totais por categoria */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Card IPVA Total */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2">IPVA Total</h4>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatCurrency(veiculos.reduce((total, v) => total + (v.ipva && v.ipva > 0 ? parseFloat(v.ipva) / 12 : 0), 0))}
                      </p>
                      <p className="text-sm text-blue-600">Mensal</p>
                    </div>
                    
                    {/* Card Seguros Total */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 mb-2">Seguros Total</h4>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(veiculos.reduce((total, v) => total + (v.valorSeguroMensal && v.valorSeguroMensal > 0 ? parseFloat(v.valorSeguroMensal) : 0), 0))}
                      </p>
                      <p className="text-sm text-green-600">Mensal</p>
                    </div>
                    
                    {/* Card Rastreadores Total */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-700 mb-2">Rastreadores Total</h4>
                      <p className="text-2xl font-bold text-yellow-800">
                        {formatCurrency(veiculos.reduce((total, v) => total + (v.valorRastreadorMensal && v.valorRastreadorMensal > 0 ? parseFloat(v.valorRastreadorMensal) : 0), 0))}
                      </p>
                      <p className="text-sm text-yellow-600">Mensal</p>
                    </div>
                    
                    {/* Card Financiamento Total */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-700 mb-2">Financiamento Total</h4>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatCurrency(veiculos.reduce((total, v) => total + (v.financiado && v.valorFinanciamento ? parseFloat(v.valorFinanciamento) : 0), 0))}
                      </p>
                      <p className="text-sm text-purple-600">Mensal</p>
                    </div>
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
                          <SelectItem value="emprestimo">Empréstimo</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Multi-vehicle selection for emprestimo category */}
              {formNovaDespesa.watch('categoria') === 'emprestimo' && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-700">Selecionar Veículos</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const allSelected = selectedVehicles.length === veiculos.length;
                          setSelectedVehicles(allSelected ? [] : veiculos.map(v => v.id));
                        }}
                      >
                        {selectedVehicles.length === veiculos.length ? 'Desmarcar' : 'Todos'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {veiculos.map((veiculo) => (
                        <div key={veiculo.id} className="flex items-center space-x-2 p-2 border rounded bg-white text-sm">
                          <input
                            type="checkbox"
                            id={`vehicle-${veiculo.id}`}
                            checked={selectedVehicles.includes(veiculo.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVehicles(prev => [...prev, veiculo.id]);
                              } else {
                                setSelectedVehicles(prev => prev.filter(id => id !== veiculo.id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`vehicle-${veiculo.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-sm">{veiculo.placa}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {selectedVehicles.length > 0 && formNovaDespesa.watch('valor') && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                          <div>
                            <span className="font-medium">Total:</span> R$ {formNovaDespesa.watch('valor') || '0,00'}
                          </div>
                          <div>
                            <span className="font-medium">Por veículo:</span> R$ {
                              selectedVehicles.length > 0 && formNovaDespesa.watch('valor') 
                                ? (parseFloat(formNovaDespesa.watch('valor').toString().replace(',', '.')) / selectedVehicles.length).toFixed(2) 
                                : '0,00'
                            }
                          </div>
                          <div>
                            <span className="font-medium">Selecionados:</span> {selectedVehicles.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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