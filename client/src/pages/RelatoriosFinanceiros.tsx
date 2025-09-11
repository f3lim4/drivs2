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
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye, Trash2, Plus, Edit, ChevronDown, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useDespesas } from '@/hooks/useDespesas';
import { useReceitas } from '@/hooks/useReceitas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DetalhesVeiculoAnaliseModal } from '@/components/relatorios/DetalhesVeiculoAnaliseModal';
import { NovaDespesaModal } from '@/components/despesas/NovaDespesaModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
// Recharts removed - using simple tables and cards instead

// Removido schema duplicado - usando o do componente NovaDespesaModal

export default function RelatoriosFinanceiros() {
  const { profile, isAdmin } = useAuth();
  const { alugueis, isLoading: alugueisLoading } = useAlugueis();
  const { pagamentos, isLoading: pagamentosLoading } = usePagamentos();
  const { infracoes, isLoading: infracoesLoading } = useInfracoes();
  const { despesas, isLoading: despesasLoading } = useDespesas();
  
  const { data: receitas = [], isLoading: receitasLoading } = useReceitas(profile?.locadoraId);
  const { veiculos, loading: veiculosLoading } = useVeiculos();
  const { motoristas, isLoading: motoristasLoading } = useMotoristas();
  const { manutencoes, isLoading: manutencoesLoading } = useManutencoes();

  // ✅ VERIFICAR SE TODOS OS DADOS ESTÃO CARREGADOS
  const isLoadingData = alugueisLoading || pagamentosLoading || infracoesLoading || 
                        despesasLoading || receitasLoading || veiculosLoading || motoristasLoading || manutencoesLoading;
  
  // Criar variável despesasComManutencoes usando dados do hook useDespesas
  const despesasComManutencoes = useMemo(() => {
    return despesas || [];
  }, [despesas]);


  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Para admins, buscar dados consolidados de todas as locadoras
  const { data: locadoras = [] } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin,
  });

  // Para admins, buscar dados consolidados financeiros em tempo real
  const { data: dadosConsolidados = [], isLoading: isLoadingConsolidados } = useQuery({
    queryKey: ['/api/admin/consolidado'],
    enabled: isAdmin,
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos (reduzir recarregamentos)
  });

  const [despesaExcluindo, setDespesaExcluindo] = useState<string | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);
  // Removido estados do modal duplicado - usando componente NovaDespesaModal
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  // Estados de busca/filtro principal
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  
  // Estado para o modal de detalhes do veículo
  const [veiculoDetalhes, setVeiculoDetalhes] = useState<any>(null);
  
  
  // Estados de ordenação para as abas
  const [sortVeiculos, setSortVeiculos] = useState<string>('mais-lucrativos');
  const [sortDespesasFixas, setSortDespesasFixas] = useState<string>('maior-total');
  const [sortHistorico, setSortHistorico] = useState<string>('mais-recente');

  // Estados de paginação para histórico
  const [currentPageHistorico, setCurrentPageHistorico] = useState(1);
  const [itemsPerPageHistorico, setItemsPerPageHistorico] = useState(10);

  
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
      const locadoraId = profile?.locadoraId;
      
      if (data.veiculoIds.length === 0) {
        toast({
          title: 'Erro',
          description: 'Selecione pelo menos um veículo.',
          variant: 'destructive',
        });
        return;
      }

      // Criar novas despesas
      const valorTotal = parseFloat(data.valor.replace(',', '.'));
      const valorPorVeiculo = valorTotal / data.veiculoIds.length;

      for (const veiculoId of data.veiculoIds) {
        const despesaData = {
          locadoraId,
          veiculoId,
          categoria: data.categoria,
          descricao: data.descricao,
          valor: valorPorVeiculo,
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

      queryClient.invalidateQueries({ queryKey: ['/api/despesas'] });
      form.reset();

    } catch (error) {
      console.error('Erro ao processar despesas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar despesas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para deletar despesa
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir despesa');
      }

      toast({
        title: 'Sucesso',
        description: 'Despesa excluída com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/despesas'] });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir despesa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para excluir despesa com confirmação
  const handleExcluirDespesa = (despesaId: string) => {
    setConfirmDelete({ open: true, id: despesaId });
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

      toast({
        title: 'Sucesso',
        description: 'Despesa excluída com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/despesas'] });
      setConfirmDelete({ open: false, id: null });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir despesa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };


  // Cálculos para o período selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredData = useMemo(() => {
    const isInPeriodSafe = (dateStr: string) => {
      if (!dateStr) return false;
      const dateParts = dateStr.split('-');
      const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    };

    const alugueisAtivos = alugueis.filter(aluguel => 
      aluguel.status === 'ativo'
    );

    const pagamentosRealizados = pagamentos.filter(pagamento => 
      pagamento.status === 'realizado' && isInPeriodSafe(pagamento.dataPagamento)
    );

    const infracoesPeriodo = infracoes.filter(infracao => 
      isInPeriodSafe(infracao.dataInfracao)
    );

    const despesasPeriodo = despesas.filter(despesa => 
      isInPeriodSafe(despesa.data)
    );

    const manutencoesPeriodo = manutencoes.filter(manutencao => 
      isInPeriodSafe(manutencao.dataInicio)
    );

    return { alugueisAtivos, pagamentosRealizados, infracoesPeriodo, despesasPeriodo, manutencoes: manutencoesPeriodo };
  }, [alugueis, pagamentos, infracoes, despesas, manutencoes, monthStart, monthEnd]);

  // Função de filtro de busca global
  const filteredDataBySearch = useMemo(() => {
    if (!searchTerm && filterType === 'todos') return filteredData;

    const searchLower = searchTerm.toLowerCase();
    
    const result = {
      alugueisAtivos: filteredData.alugueisAtivos,
      pagamentosRealizados: filteredData.pagamentosRealizados,
      infracoesPeriodo: filteredData.infracoesPeriodo.filter(infracao => {
        const matchesSearch = !searchTerm ||
          infracao.numeroAuto?.toLowerCase().includes(searchLower) ||
          infracao.tipoInfracao?.toLowerCase().includes(searchLower) ||
          veiculos.find(v => v.id === infracao.veiculoId)?.placa?.toLowerCase().includes(searchLower);
          
        const matchesType = filterType === 'todos' || filterType === 'infracao';
        
        return matchesSearch && matchesType;
      }),
      despesasPeriodo: filteredData.despesasPeriodo.filter(despesa => {
        const matchesSearch = !searchTerm || 
          despesa.descricao?.toLowerCase().includes(searchLower) ||
          despesa.categoria?.toLowerCase().includes(searchLower) ||
          veiculos.find(v => v.id === despesa.veiculoId)?.placa?.toLowerCase().includes(searchLower) ||
          veiculos.find(v => v.id === despesa.veiculoId)?.modelo?.toLowerCase().includes(searchLower);
          
        const matchesType = filterType === 'todos' || despesa.categoria === filterType;
        
        return matchesSearch && matchesType;
      }),
      manutencoes: filteredData.manutencoes.filter(manutencao => {
        const matchesSearch = !searchTerm ||
          manutencao.descricao?.toLowerCase().includes(searchLower) ||
          manutencao.tipo?.toLowerCase().includes(searchLower) ||
          manutencao.oficina?.toLowerCase().includes(searchLower) ||
          veiculos.find(v => v.id === manutencao.veiculoId)?.placa?.toLowerCase().includes(searchLower);
          
        const matchesType = filterType === 'todos' || filterType === 'manutencao';
        
        return matchesSearch && matchesType;
      })
    };
    
    return result;
  }, [filteredData, searchTerm, filterType, veiculos]);

  // Dados do histórico ordenados e paginados
  const historicoOrdenado = useMemo(() => {
    // Combinar saídas (despesas/manutenções) e entradas (pagamentos)
    const itensCombinados = [
      // SAÍDAS - Despesas manuais
      ...filteredDataBySearch.despesasPeriodo
        .filter(despesa => !despesa.id.startsWith('manutencao_'))
        .map(despesa => ({
          ...despesa,
          tipo: 'saida',
          data: despesa.data,
          valor: parseFloat(despesa.valor || '0'),
          categoria: despesa.categoria,
          descricao: despesa.descricao,
          veiculoId: despesa.veiculoId
        })),
      // SAÍDAS - Manutenções
      ...filteredDataBySearch.manutencoes.map(manutencao => {
        // Para manutenções concluídas, usar data de conclusão; caso contrário, data de início
        const dataManutencao = manutencao.status === 'concluida' && manutencao.dataConclusao 
          ? manutencao.dataConclusao 
          : manutencao.dataInicio;
        
        return {
          ...manutencao,
          tipo: 'saida',
          data: dataManutencao,
          valor: parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0'),
          categoria: 'manutencao',
          descricao: manutencao.descricao,
          veiculoId: manutencao.veiculoId
        };
      }),
      // ENTRADAS - Pagamentos de aluguel
      ...pagamentos
        .filter(pagamento => {
          if (pagamento.status !== 'pago') return false;
          const dataStr = pagamento.dataPagamento || pagamento.data;
          if (!dataStr) return false;
          
          // Verificar se está no período selecionado
          const dateParts = dataStr.split('-');
          const dataPagamento = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          return isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
        })
        .map(pagamento => {
          // Buscar o veículo através do aluguel/motorista
          const aluguel = alugueis.find(a => a.id === pagamento.aluguelId);
          const veiculoId = aluguel?.veiculoId || pagamento.veiculoId;
          const motorista = motoristas.find(m => m.id === pagamento.motoristaId);
          
          return {
            ...pagamento,
            id: `pagamento_${pagamento.id}`,
            tipo: 'entrada',
            data: pagamento.dataPagamento || pagamento.data,
            valor: parseFloat(pagamento.valorPago || pagamento.valorTotal || '0'),
            categoria: pagamento.tipo === 'taxa administrativa' ? 'taxa_administrativa' : 'aluguel',
            descricao: pagamento.tipo === 'taxa administrativa' 
              ? `Taxa Administrativa - ${pagamento.descricao || 'Pagamento'}`
              : `Pagamento Aluguel - ${motorista?.nome || 'Motorista'} - ${pagamento.descricao || 'Mensalidade'}`,
            veiculoId: veiculoId
          };
        }),
      // ENTRADAS - Infrações pagas
      ...filteredDataBySearch.infracoesPeriodo
        .filter(infracao => infracao.status === 'pago' && infracao.valorFinal)
        .map(infracao => ({
          ...infracao,
          id: `infracao_${infracao.id}`,
          tipo: 'entrada',
          data: infracao.dataPagamento || infracao.dataInfracao,
          valor: parseFloat(infracao.valorFinal || '0'),
          categoria: 'infracao',
          descricao: `Pagamento de Infração - ${infracao.tipoInfracao} - ${infracao.numeroAuto}`,
          veiculoId: infracao.veiculoId
        }))
    ];

    // Aplicar ordenação
    const itensOrdenados = itensCombinados.sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      const createdAtA = new Date(a.createdAt || a.data);
      const createdAtB = new Date(b.createdAt || b.data);
      
      switch (sortHistorico) {
        case 'mais-recente':
          // Primeiro por data de criação/alteração, depois por data da despesa
          if (createdAtB.getTime() !== createdAtA.getTime()) {
            return createdAtB.getTime() - createdAtA.getTime();
          }
          if (dataB.getTime() !== dataA.getTime()) {
            return dataB.getTime() - dataA.getTime();
          }
          // Se mesma data, manutenções concluídas primeiro
          if (a.tipo === 'manutencao' && a.status === 'concluida' && b.tipo !== 'manutencao') return -1;
          if (b.tipo === 'manutencao' && b.status === 'concluida' && a.tipo !== 'manutencao') return 1;
          return 0;
        case 'mais-antiga':
          // Primeiro por data de criação/alteração, depois por data da despesa
          if (createdAtA.getTime() !== createdAtB.getTime()) {
            return createdAtA.getTime() - createdAtB.getTime();
          }
          if (dataA.getTime() !== dataB.getTime()) {
            return dataA.getTime() - dataB.getTime();
          }
          // Se mesma data, manutenções concluídas primeiro
          if (a.tipo === 'manutencao' && a.status === 'concluida' && b.tipo !== 'manutencao') return -1;
          if (b.tipo === 'manutencao' && b.status === 'concluida' && a.tipo !== 'manutencao') return 1;
          return 0;
        case 'maior-valor':
          return b.valor - a.valor;
        case 'menor-valor':
          return a.valor - b.valor;
        case 'categoria-az':
          return a.categoria.localeCompare(b.categoria);
        case 'categoria-za':
          return b.categoria.localeCompare(a.categoria);
        case 'veiculo-az':
          const veiculoA = veiculos.find(v => v.id === a.veiculoId)?.placa || '';
          const veiculoB = veiculos.find(v => v.id === b.veiculoId)?.placa || '';
          return veiculoA.localeCompare(veiculoB);
        case 'veiculo-za':
          const veiculoA2 = veiculos.find(v => v.id === a.veiculoId)?.placa || '';
          const veiculoB2 = veiculos.find(v => v.id === b.veiculoId)?.placa || '';
          return veiculoB2.localeCompare(veiculoA2);
        default:
          // Padrão: mais recente por data de criação
          if (createdAtB.getTime() !== createdAtA.getTime()) {
            return createdAtB.getTime() - createdAtA.getTime();
          }
          if (dataB.getTime() !== dataA.getTime()) {
            return dataB.getTime() - dataA.getTime();
          }
          if (a.tipo === 'manutencao' && a.status === 'concluida' && b.tipo !== 'manutencao') return -1;
          if (b.tipo === 'manutencao' && b.status === 'concluida' && a.tipo !== 'manutencao') return 1;
          return 0;
      }
    });

    return itensOrdenados;
  }, [filteredDataBySearch.despesasPeriodo, filteredDataBySearch.manutencoes, filteredDataBySearch.infracoesPeriodo, pagamentos, alugueis, motoristas, sortHistorico, veiculos, monthStart, monthEnd]);

  // Paginação do histórico
  const historicoPaginado = useMemo(() => {
    const startIndex = (currentPageHistorico - 1) * itemsPerPageHistorico;
    const endIndex = startIndex + itemsPerPageHistorico;
    return historicoOrdenado.slice(startIndex, endIndex);
  }, [historicoOrdenado, currentPageHistorico, itemsPerPageHistorico]);

  const totalPaginasHistorico = Math.ceil(historicoOrdenado.length / itemsPerPageHistorico);

  // Cálculo simplificado das despesas fixas dos veículos
  const despesasFixasVeiculos = useMemo(() => {
    return veiculos.map(veiculo => {
      // Calcular despesas mensais do veículo
      let despesasMensais = 0;
      
      // IPVA mensal (anual dividido por 12)
      if (veiculo.ipva && Number(veiculo.ipva) > 0) {
        despesasMensais += Number(veiculo.ipva) / 12;
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && Number(veiculo.valorSeguroMensal) > 0) {
        despesasMensais += Number(veiculo.valorSeguroMensal);
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && Number(veiculo.valorRastreadorMensal) > 0) {
        despesasMensais += Number(veiculo.valorRastreadorMensal);
      }
      
      // Financiamento mensal (valorFinanciamento já é valor mensal)
      if (veiculo.valorFinanciamento && Number(veiculo.valorFinanciamento) > 0) {
        despesasMensais += Number(veiculo.valorFinanciamento); // Valor já é mensal
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

  // Total das despesas fixas puras (sem manutenções)
  const totalDespesasFixasPuras = useMemo(() => {
    return veiculos.reduce((total, veiculo) => {
      let despesasFixas = 0;
      
      // IPVA mensal
      if (veiculo.ipva && Number(veiculo.ipva) > 0) {
        despesasFixas += Number(veiculo.ipva) / 12;
      }
      
      // Seguro mensal
      if (veiculo.valorSeguroMensal && Number(veiculo.valorSeguroMensal) > 0) {
        despesasFixas += Number(veiculo.valorSeguroMensal);
      }
      
      // Rastreador mensal
      if (veiculo.valorRastreadorMensal && Number(veiculo.valorRastreadorMensal) > 0) {
        despesasFixas += Number(veiculo.valorRastreadorMensal);
      }
      
      // Financiamento mensal
      if (veiculo.valorFinanciamento && Number(veiculo.valorFinanciamento) > 0) {
        despesasFixas += Number(veiculo.valorFinanciamento); // Valor já é mensal
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
      .filter(p => {
        if (p.status !== 'pago') return false;
        const dataStr = p.dataPagamento || p.data;
        if (!dataStr) return false;
        
        // Criar data no fuso horário local para evitar problemas com UTC
        const dateParts = dataStr.split('-');
        const dataPagamento = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        return isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
      })
      .reduce((total, pagamento) => {
        const valor = Number(pagamento.valorPago || pagamento.valorTotal || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [pagamentos, monthStart, monthEnd]);

  // Taxa administrativa de aluguéis
  const receitaTaxaAdministrativa = useMemo(() => {
    return pagamentos
      .filter(p => {
        if (p.status !== 'pago' || p.tipo !== 'taxa administrativa') return false;
        const dataStr = p.dataPagamento || p.data;
        if (!dataStr) return false;
        
        // Criar data no fuso horário local para evitar problemas com UTC
        const dateParts = dataStr.split('-');
        const dataPagamento = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        return isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
      })
      .reduce((total, pagamento) => {
        const valor = Number(pagamento.valorPago || pagamento.valorTotal || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [pagamentos, monthStart, monthEnd]);

  // Receita extra de juros e multas
  const receitaExtra = useMemo(() => {
    const pagamentosFiltrados = pagamentos
      .filter(p => {
        if (p.status !== 'pago') return false;
        const dataStr = p.data || p.dataPagamento;
        if (!dataStr) return false;
        
        // Criar data no fuso horário local para evitar problemas com UTC
        const dateParts = dataStr.split('-');
        const dataPagamento = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        return isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
      });
    
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
    
    // Calcular despesas manuais por categoria (incluindo financiamentos manuais)
    filteredData.despesasPeriodo
      .filter(despesa => despesa.tipo === 'despesa')
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
    
    // Adicionar financiamentos automáticos dos veículos (apenas se não há despesas manuais de financiamento)
    const financiamentoVeiculos = veiculos.reduce((total, veiculo) => {
      const financiamento = veiculo.financiado && veiculo.valorFinanciamento ? parseFloat(veiculo.valorFinanciamento) : 0;
      return total + (isNaN(financiamento) ? 0 : financiamento);
    }, 0);
    
    // Se já há despesas manuais de financiamento, somar com as automáticas
    if (categorias['financiamento']) {
      categorias['financiamento'] += financiamentoVeiculos;
    } else {
      categorias['financiamento'] = financiamentoVeiculos;
    }
    
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

  const receitaTotal = receitaPagamentos + receitaTaxaAdministrativa + totalReceitas + receitaExtra.total;
  const lucroLiquido = receitaTotal - totalDespesas;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // Gráficos removidos - usando visualização simples com cards e tabelas

  // Debug detalhado para verificar valores (incluindo financiamentos manuais)
  const despesasManuaisFiltradas = filteredData.despesasPeriodo.filter(d => d.tipo === 'despesa' && d.fonte !== 'manutencao');
  const despesasManuaisValor = despesasManuaisFiltradas.reduce((total, despesa) => {
    const valor = parseFloat(despesa.valor || '0');
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);
  


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
        .filter(p => {
          if (!p.data) return false;
          const dateParts = p.data.split('-');
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((total, pagamento) => total + parseFloat(pagamento.valor || '0'), 0);
      
      const receitaAnual = pagamentosVeiculo
        .reduce((total, pagamento) => total + parseFloat(pagamento.valor || '0'), 0);
      
      const despesasManuaisMensais = despesasVeiculo
        .filter(d => {
          if (d.tipo !== 'despesa' || d.categoria === 'financiamento' || d.categoria === 'manutencao' || !d.data) return false;
          const dateParts = d.data.split('-');
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((total, despesa) => {
          const valor = parseFloat(despesa.valor || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);
      
      // Incluir manutenções do período no cálculo das despesas mensais
      const manutencoesMensais = manutencoes
        .filter(m => {
          if (m.veiculoId !== veiculo.id || m.status !== 'concluida') return false;
          const dataManutencao = m.dataConclusao || m.dataInicio;
          if (!dataManutencao) return false;
          const dateParts = dataManutencao.split('-');
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((total, manutencao) => {
          const valorFinal = parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0');
          return total + (isNaN(valorFinal) ? 0 : valorFinal);
        }, 0);
      
      const despesasManuaisAnuais = despesasVeiculo
        .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && d.categoria !== 'manutencao')
        .reduce((total, despesa) => {
          const valor = parseFloat(despesa.valor || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);
      
      // Incluir manutenções anuais
      const manutencoesAnuais = manutencoes
        .filter(m => m.veiculoId === veiculo.id && m.status === 'concluida')
        .reduce((total, manutencao) => {
          const valorFinal = parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0');
          return total + (isNaN(valorFinal) ? 0 : valorFinal);
        }, 0);
      


      // Somar despesas manuais + manutenções + fixas
      const despesasMensais = despesasManuaisMensais + manutencoesMensais + despesasFixasMensais;
      const despesasAnuais = despesasManuaisAnuais + manutencoesAnuais + (despesasFixasMensais * 12);
      
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

  // Verificar se dados estão carregando
  const isDataLoading = alugueisLoading || pagamentosLoading || despesasLoading || veiculosLoading;

  const variacaoReceita = receitaMesAnterior > 0 ? ((receitaTotal - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;
  const variacaoDespesas = despesasMesAnterior > 0 ? ((totalDespesas - despesasMesAnterior) / despesasMesAnterior) * 100 : 0;
  const variacaoLucro = (receitaMesAnterior - despesasMesAnterior) > 0 ? ((lucroLiquido - (receitaMesAnterior - despesasMesAnterior)) / (receitaMesAnterior - despesasMesAnterior)) * 100 : 0;

  // Função para gerar dados detalhados do veículo com histórico completo
  const gerarDadosDetalhados = (veiculo: any) => {
    const aluguelVeiculo = alugueis.find(a => a.veiculoId === veiculo.id && a.status === 'ativo');
    const motorista = aluguelVeiculo ? motoristas.find(m => m.id === aluguelVeiculo.motoristaId) : null;
    const despesasVeiculo = despesas.filter(d => d.veiculoId === veiculo.id);
    
    // Histórico completo do veículo
    const historicoAlugueis = alugueis.filter(a => a.veiculoId === veiculo.id);
    const historicoManutencoes = manutencoes?.filter(m => m.veiculoId === veiculo.id) || [];
    const historicoPagamentos = pagamentos?.filter(p => p.veiculoId === veiculo.id) || [];
    const historicoInfracoes = infracoes?.filter(i => i.veiculoId === veiculo.id) || [];
    
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
    
    // Receita do aluguel
    const receitaAluguel = aluguelVeiculo ? parseFloat(aluguelVeiculo.valorMensal || aluguelVeiculo.valorDiario) : 0;
    
    // Adicionar infrações pagas como entradas (receita)
    const infracoesVeiculo = infracoes.filter(infracao => 
      infracao.veiculoId === veiculo.id && 
      infracao.status === 'pago' &&
      infracao.valorFinal &&
      isWithinInterval(new Date(infracao.dataPagamento || infracao.dataInfracao), { start: monthStart, end: monthEnd })
    );
    
    const receitaInfracoes = infracoesVeiculo
      .reduce((total, infracao) => total + parseFloat(infracao.valorFinal || '0'), 0);
    
    const receitaMensal = receitaAluguel + receitaInfracoes;
    const despesasManuais = despesasVeiculo
      .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && d.categoria !== 'manutencao' && isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
      .reduce((total, despesa) => total + parseFloat(despesa.valor || '0'), 0);
    
    // Incluir manutenções no período
    const manutencoesVeiculo = manutencoes?.filter(m => {
      if (m.veiculoId !== veiculo.id) return false;
      
      const dataManutencao = m.dataConclusao ? new Date(m.dataConclusao) : new Date(m.dataAgendamento);
      const valor = m.valorFinal || m.valorOrcamento;
      
      return valor && parseFloat(valor) > 0 && isWithinInterval(dataManutencao, { start: monthStart, end: monthEnd });
    }) || [];
    
    const manutencoesMensais = manutencoesVeiculo.reduce((total, manutencao) => {
      const valorFinal = parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0');
      return total + (isNaN(valorFinal) ? 0 : valorFinal);
    }, 0);
    
    const despesasMensais = despesasManuais + manutencoesMensais + despesasFixasMensais;
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
    
    // Manutenções
    if (manutencoesMensais > 0) {
      despesasDetalhadas.push({
        categoria: 'Manutenção',
        valor: manutencoesMensais,
        percentual: despesasMensais > 0 ? (manutencoesMensais / despesasMensais) * 100 : 0
      });
    }
    
    // Despesas manuais (excluindo financiamento e manutenção que já foram incluídas acima)
    const despesasManuaisAgrupadas = despesasVeiculo
      .filter(d => d.tipo === 'despesa' && d.categoria !== 'financiamento' && d.categoria !== 'manutencao' && 
                   isWithinInterval(new Date(d.data), { start: monthStart, end: monthEnd }))
      .reduce((grupos, despesa) => {
        const categoria = despesa.categoria || 'outros';
        if (!grupos[categoria]) {
          grupos[categoria] = { total: 0, nome: '' };
        }
        grupos[categoria].total += parseFloat(despesa.valor || '0');
        
        // Mapear nome amigável da categoria
        const nomesCategoria = {
          'emprestimo': 'Empréstimo',
          'combustivel': 'Combustível', 
          'licenciamento': 'Licenciamento',
          'multa': 'Multas',
          'lavagem': 'Lavagem',
          'pneu': 'Pneus',
          'seguro': 'Seguro',
          'ipva': 'IPVA',
          'outros': 'Outros'
        };
        
        grupos[categoria].nome = nomesCategoria[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1);
        return grupos;
      }, {});

    // Adicionar cada categoria de despesa manual ao detalhamento
    Object.values(despesasManuaisAgrupadas).forEach(categoria => {
      if (categoria.total > 0) {
        despesasDetalhadas.push({
          categoria: categoria.nome,
          valor: categoria.total,
          percentual: despesasMensais > 0 ? (categoria.total / despesasMensais) * 100 : 0
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
      historico: {
        alugueis: historicoAlugueis,
        manutencoes: historicoManutencoes,
        pagamentos: historicoPagamentos,
        infracoes: historicoInfracoes,
        despesas: despesasVeiculo
      }
    };
  };

  // Dados para aba "Despesas Fixas" - ordenação e paginação
  const despesasFixasDetalhadas = useMemo(() => {
    return veiculos.map(veiculo => {
      const ipva = veiculo.ipva ? Number(veiculo.ipva) / 12 : 0;
      const seguro = veiculo.valorSeguroMensal ? Number(veiculo.valorSeguroMensal) : 0;
      const rastreador = veiculo.valorRastreadorMensal ? Number(veiculo.valorRastreadorMensal) : 0;
      const financiamento = veiculo.valorFinanciamento ? Number(veiculo.valorFinanciamento) : 0;
      const totalMensal = ipva + seguro + rastreador + financiamento;
      
      return {
        veiculo: veiculo.placa || 'N/A',
        ipva,
        seguro,
        rastreador,
        financiamento,
        totalMensal
      };
    });
  }, [veiculos]);

  const despesasFixasOrdenadas = useMemo(() => {
    return [...despesasFixasDetalhadas].sort((a, b) => {
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
  }, [despesasFixasDetalhadas, sortDespesasFixas]);

  const totalPaginasDespesasFixas = Math.ceil(despesasFixasOrdenadas.length / itemsPerPageDespesasFixas);
  const despesasFixasPaginadas = despesasFixasOrdenadas.slice(
    (currentPageDespesasFixas - 1) * itemsPerPageDespesasFixas,
    currentPageDespesasFixas * itemsPerPageDespesasFixas
  );



  // ✅ EXIBIR LOADING COM ÍCONES DE VEÍCULOS ANIMADOS
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* Cards de Resumo Financeiro - apenas para locadoras */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">ENTRADAS TOTAIS</p>
                {isDataLoading ? (
                  <>
                    <div className="h-6 w-20 bg-green-200 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-green-100 rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-green-800">
                      {formatCurrency(receitaTotal)}
                    </p>
                    <p className="text-xs text-green-600">
                      {variacaoReceita > 0 ? '+' : ''}{variacaoReceita.toFixed(1)}% vs mês anterior
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center ml-auto">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">SAÍDAS TOTAIS</p>
                {isDataLoading ? (
                  <>
                    <div className="h-6 w-20 bg-red-200 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-red-100 rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-red-800">
                      {formatCurrency(totalDespesas)}
                    </p>
                    <p className="text-xs text-red-600">
                      {variacaoDespesas > 0 ? '+' : ''}{variacaoDespesas.toFixed(1)}% vs mês anterior
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center ml-auto">
                <TrendingDown className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">LUCRO LÍQUIDO</p>
                {isDataLoading ? (
                  <>
                    <div className="h-6 w-20 bg-blue-200 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-blue-100 rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      {formatCurrency(lucroLiquido)}
                    </p>
                    <p className="text-xs text-blue-600">
                      {variacaoLucro > 0 ? '+' : ''}{variacaoLucro.toFixed(1)}% vs mês anterior
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center ml-auto">
                <DollarSign className={`w-6 h-6 ${lucroLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">MARGEM DE LUCRO</p>
                {isDataLoading ? (
                  <>
                    <div className="h-6 w-16 bg-purple-200 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-purple-100 rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className={`text-xl font-bold ${margemLucro >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                      {margemLucro.toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-600">
                      Meta: 30%
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center ml-auto">
                <TrendingUp className={`w-6 h-6 ${margemLucro >= 0 ? 'text-purple-700' : 'text-red-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>


        </div>
      )}

      {/* Seção especial para admins - Dados consolidados de todas as locadoras */}
      {isAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dados Consolidados por Locadora</CardTitle>
            <CardDescription>Resumo financeiro de todas as locadoras do sistema - Tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingConsolidados ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Carregando dados em tempo real...</span>
              </div>
            ) : dadosConsolidados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma locadora encontrada no sistema
              </div>
            ) : (
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
                    {dadosConsolidados.map((dados: any) => (
                      <TableRow key={dados.locadoraId}>
                        <TableCell className="font-medium">{dados.locadora}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(dados.receita)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(dados.despesas)}
                        </TableCell>
                        <TableCell className={`font-semibold ${dados.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(dados.lucro)}
                        </TableCell>
                        <TableCell className={`font-semibold ${dados.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {dados.margem.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtro de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por descrição, categoria, veículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas as categorias</option>
                <option value="emprestimo">Empréstimo</option>
                <option value="combustivel">Combustível</option>
                <option value="manutencao">Manutenção</option>
                <option value="seguro">Seguro</option>
                <option value="ipva">IPVA</option>
                <option value="financiamento">Financiamento</option>
                <option value="licenciamento">Licenciamento</option>
                <option value="lavagem">Lavagem</option>
                <option value="outros">Outros</option>
              </select>
              {!isAdmin && (
                <NovaDespesaModal />
              )}
              {(searchTerm || filterType !== 'todos') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('todos');
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Análise */}
      {/* ADMIN: Mostrar apenas dados consolidados sem abas */}
      {isAdmin ? (
        <div>
          {/* Conteúdo admin sem abas será renderizado aqui */}
        </div>
      ) : (
        <Tabs defaultValue="veiculos" className="space-y-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="veiculos">Análise por Veículo</TabsTrigger>
            <TabsTrigger value="despesas-fixas">Saídas Fixas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

        {/* Aba Despesas Fixas */}
        <TabsContent value="despesas-fixas" className="space-y-2">

          {/* Tabela detalhada por veículo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Despesas Fixas por Veículo</CardTitle>
                <CardDescription>
                  Detalhamento das despesas fixas mensais de cada veículo
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={sortDespesasFixas} onValueChange={setSortDespesasFixas}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
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
              </div>
            </CardHeader>
            <CardContent>
              {despesasFixasOrdenadas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum veículo com despesas fixas encontrado.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 border-b">Veículo</th>
                          <th className="text-left p-3 border-b">IPVA</th>
                          <th className="text-left p-3 border-b">Seguro</th>
                          <th className="text-left p-3 border-b">Rastreador</th>
                          <th className="text-left p-3 border-b">Financiamento</th>
                          <th className="text-left p-3 border-b font-bold">Total Mensal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {despesasFixasPaginadas.map((item) => (
                          <tr key={item.veiculo} className="hover:bg-gray-50">
                            <td className="p-3 border-b">
                              <div className="font-medium">{item.veiculo}</div>
                            </td>
                            <td className="p-3 border-b text-yellow-600">
                              {formatCurrency(item.ipva)}
                            </td>
                            <td className="p-3 border-b text-green-600">
                              {formatCurrency(item.seguro)}
                            </td>
                            <td className="p-3 border-b text-indigo-600">
                              {formatCurrency(item.rastreador)}
                            </td>
                            <td className="p-3 border-b text-pink-600">
                              {formatCurrency(item.financiamento)}
                            </td>
                            <td className="p-3 border-b">
                              <span className="font-bold text-red-600">
                                {formatCurrency(item.totalMensal)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {totalPaginasDespesasFixas > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Itens por página:</span>
                        <Select value={itemsPerPageDespesasFixas.toString()} onValueChange={(value) => setItemsPerPageDespesasFixas(parseInt(value))}>
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPageDespesasFixas(Math.max(1, currentPageDespesasFixas - 1))}
                          disabled={currentPageDespesasFixas === 1}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                          {currentPageDespesasFixas} de {totalPaginasDespesasFixas}
                        </span>
                        <button
                          onClick={() => setCurrentPageDespesasFixas(Math.min(totalPaginasDespesasFixas, currentPageDespesasFixas + 1))}
                          disabled={currentPageDespesasFixas === totalPaginasDespesasFixas}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Análise por categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
              <CardDescription>
                Distribuição das despesas fixas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* IPVA */}
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-800">IPVA</p>
                    <p className="text-sm text-yellow-600">Imposto sobre veículos</p>
                  </div>
                  <p className="text-lg font-bold text-yellow-600">
                    {formatCurrency(
                      veiculos.reduce((total, v) => total + (v.ipva ? Number(v.ipva) / 12 : 0), 0)
                    )}
                  </p>
                </div>

                {/* Seguros */}
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Seguros</p>
                    <p className="text-sm text-green-600">Seguro dos veículos</p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      veiculos.reduce((total, v) => total + (v.valorSeguroMensal ? Number(v.valorSeguroMensal) : 0), 0)
                    )}
                  </p>
                </div>

                {/* Rastreadores */}
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <div>
                    <p className="font-medium text-indigo-800">Rastreadores</p>
                    <p className="text-sm text-indigo-600">Monitoramento GPS</p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">
                    {formatCurrency(
                      veiculos.reduce((total, v) => total + (v.valorRastreadorMensal ? Number(v.valorRastreadorMensal) : 0), 0)
                    )}
                  </p>
                </div>

                {/* Financiamento */}
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <div>
                    <p className="font-medium text-pink-800">Financiamento</p>
                    <p className="text-sm text-pink-600">Parcelas mensais</p>
                  </div>
                  <p className="text-lg font-bold text-pink-600">
                    {formatCurrency(
                      veiculos.reduce((total, v) => total + (v.valorFinanciamento ? Number(v.valorFinanciamento) : 0), 0)
                    )}
                  </p>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div>
                    <p className="font-bold text-gray-800">TOTAL MENSAL</p>
                    <p className="text-sm text-gray-600">Soma de todas as despesas fixas</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(totalDespesasFixasPuras)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Histórico */}
        <TabsContent value="historico" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Entradas e Saídas dos Veículos</CardTitle>
                <CardDescription>
                  Histórico completo de entradas (pagamentos) e saídas (despesas) por veículo
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
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
                <Select value={sortHistorico} onValueChange={setSortHistorico}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais-recente">Mais Recente</SelectItem>
                    <SelectItem value="mais-antiga">Mais Antiga</SelectItem>
                    <SelectItem value="maior-valor">Maior Valor</SelectItem>
                    <SelectItem value="menor-valor">Menor Valor</SelectItem>
                    <SelectItem value="categoria-az">Categoria (A-Z)</SelectItem>
                    <SelectItem value="categoria-za">Categoria (Z-A)</SelectItem>
                    <SelectItem value="veiculo-az">Veículo (A-Z)</SelectItem>
                    <SelectItem value="veiculo-za">Veículo (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historicoOrdenado.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {searchTerm || filterType !== 'todos' 
                      ? 'Nenhum resultado encontrado para os filtros aplicados.' 
                      : 'Nenhuma movimentação encontrada no período selecionado.'}
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 border-b">Veículo</th>
                            <th className="text-left p-3 border-b">Categoria</th>
                            <th className="text-left p-3 border-b">Descrição</th>
                            <th className="text-left p-3 border-b">Valor</th>
                            <th className="text-left p-3 border-b">Data Feita</th>
                            <th className="text-left p-3 border-b">Data Criação</th>
                            <th className="text-left p-3 border-b">Tipo</th>
                            <th className="text-left p-3 border-b">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historicoPaginado.map((item) => {
                            const veiculo = veiculos.find(v => v.id === item.veiculoId);
                            return (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{veiculo?.placa || 'N/A'}</td>
                                <td className="p-3 capitalize">{item.categoria}</td>
                                <td className="p-3">{item.descricao}</td>
                                <td className={`p-3 font-semibold ${
                                  item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(item.valor)}
                                </td>
                                <td className="p-3">
                                  <div className="text-sm font-medium">
                                    {format(new Date(item.data), 'dd/MM/yyyy')}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-xs text-gray-500">
                                    {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.tipo === 'entrada' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {item.tipo === 'entrada' ? 'Entrada' : item.categoria === 'manutencao' ? 'Saída - Manutenção' : 'Saída'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {/* Saídas manuais (IDs normais) podem ser excluídas, infrações não podem */}
                                  {!item.id.startsWith('manutencao_') && !item.id.startsWith('financiamento_') && !item.id.startsWith('infracao_') && item.tipo === 'saida' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleExcluirDespesa(item.id)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Entradas (pagamentos, infrações) e saídas automáticas não podem ser excluídas */}
                                  {(item.id.startsWith('manutencao_') || item.id.startsWith('financiamento_') || item.id.startsWith('infracao_') || item.id.startsWith('pagamento_') || item.tipo === 'entrada') && (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            Itens por página:
                          </span>
                          <Select
                            value={itemsPerPageHistorico.toString()}
                            onValueChange={(value) => handleItemsPerPageChangeHistorico(parseInt(value))}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            Página {currentPageHistorico} de {totalPaginasHistorico} 
                            ({historicoOrdenado.length} itens)
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeHistorico(currentPageHistorico - 1)}
                              disabled={currentPageHistorico === 1}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeHistorico(currentPageHistorico + 1)}
                              disabled={currentPageHistorico === totalPaginasHistorico}
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Análise por Veículo */}
        <TabsContent value="veiculos" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análise por Veículo</CardTitle>
                <CardDescription>
                  Relatório detalhado de entradas e saídas por veículo
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={sortVeiculos} onValueChange={setSortVeiculos}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais-lucrativos">Mais Lucrativos</SelectItem>
                    <SelectItem value="menos-lucrativos">Menos Lucrativos</SelectItem>
                    <SelectItem value="maior-receita">Maiores Entradas</SelectItem>
                    <SelectItem value="menor-receita">Menores Entradas</SelectItem>
                    <SelectItem value="maior-despesa">Maiores Saídas</SelectItem>
                    <SelectItem value="menor-despesa">Menores Saídas</SelectItem>
                    <SelectItem value="placa-az">Placa (A-Z)</SelectItem>
                    <SelectItem value="placa-za">Placa (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analiseVeiculos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum veículo encontrado.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 border-b w-16">Ver</th>
                            <th className="text-left p-3 border-b">Veículo</th>
                            <th className="text-left p-3 border-b">Status</th>
                            <th className="text-left p-3 border-b">Receita Mensal</th>
                            <th className="text-left p-3 border-b">Despesas Mensais</th>
                            <th className="text-left p-3 border-b">Lucro Líquido</th>
                            <th className="text-left p-3 border-b">Margem %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analiseVeiculos.slice((currentPageVeiculos - 1) * itemsPerPageVeiculos, currentPageVeiculos * itemsPerPageVeiculos).map((analiseItem) => {
                            const veiculo = veiculos.find(v => v.placa === analiseItem.veiculo);
                            if (!veiculo) return null;
                            
                            return (
                              <tr key={veiculo.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVeiculoDetalhes(gerarDadosDetalhados(veiculo))}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </td>
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium">{veiculo.placa}</div>
                                    <div className="text-sm text-gray-500">{veiculo.marca} {veiculo.modelo}</div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    analiseItem.status === 'Lucrativo' 
                                      ? 'bg-green-100 text-green-700' 
                                      : analiseItem.status === 'Parado'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {analiseItem.status}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-green-600">
                                  {formatCurrency(analiseItem.receitaMensal)}
                                </td>
                                <td className="p-3 font-semibold text-red-600">
                                  {formatCurrency(analiseItem.despesasMensais)}
                                </td>
                                <td className="p-3 font-semibold">
                                  <span className={analiseItem.lucro >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(analiseItem.lucro)}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold">
                                  <span className={analiseItem.margem >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {analiseItem.margem.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            Itens por página:
                          </span>
                          <Select
                            value={itemsPerPageVeiculos.toString()}
                            onValueChange={(value) => handleItemsPerPageChangeVeiculos(parseInt(value))}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            Página {currentPageVeiculos} de {Math.ceil(analiseVeiculos.length / itemsPerPageVeiculos)} 
                            ({analiseVeiculos.length} itens)
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeVeiculos(currentPageVeiculos - 1)}
                              disabled={currentPageVeiculos === 1}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeVeiculos(currentPageVeiculos + 1)}
                              disabled={currentPageVeiculos === Math.ceil(veiculos.length / itemsPerPageVeiculos)}
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
      )}

      {/* Modal de detalhes do veículo */}
      {veiculoDetalhes && (
        <DetalhesVeiculoAnaliseModal
          isOpen={!!veiculoDetalhes}
          onClose={() => setVeiculoDetalhes(null)}
          dadosVeiculo={veiculoDetalhes}
          selectedMonth={selectedMonth}
        />
      )}


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
