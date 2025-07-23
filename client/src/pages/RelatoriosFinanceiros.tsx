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
  const { veiculos, isLoading: veiculosLoading } = useVeiculos();
  const { motoristas, isLoading: motoristasLoading } = useMotoristas();
  const { manutencoes, isLoading: manutencoesLoading } = useManutencoes();

  // ✅ VERIFICAR SE TODOS OS DADOS ESTÃO CARREGADOS
  const isLoadingData = alugueisLoading || pagamentosLoading || infracoesLoading || 
                        despesasLoading || veiculosLoading || motoristasLoading || manutencoesLoading;
  
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
  
  // Estado para o modal de detalhes do motorista
  const [motoristaDetalhes, setMotoristaDetalhes] = useState<any>(null);
  
  // Estados de ordenação para as abas
  const [sortVeiculos, setSortVeiculos] = useState<string>('mais-lucrativos');
  const [sortMotoristas, setSortMotoristas] = useState<string>('mais-pagamentos');
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

  // Função para ver detalhes do motorista
  const handleVerDetalhesMotorista = (item: any) => {
    // Encontrar o veículo do motorista
    const veiculo = veiculos.find(v => v.placa === item.veiculoPlaca);
    if (veiculo) {
      // Gerar dados detalhados do veículo associado ao motorista
      const dadosDetalhados = gerarDadosDetalhados(veiculo, selectedMonth);
      setMotoristaDetalhes(dadosDetalhados);
    }
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

  // Função de filtro de busca global
  const filteredDataBySearch = useMemo(() => {
    if (!searchTerm && filterType === 'todos') return filteredData;

    const searchLower = searchTerm.toLowerCase();
    
    const result = {
      alugueisAtivos: filteredData.alugueisAtivos,
      pagamentosRealizados: filteredData.pagamentosRealizados,
      infracoesPeriodo: filteredData.infracoesPeriodo,
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
    // Combinar despesas e manutenções
    const itensCombinados = [
      // Filtrar despesas para remover as convertidas de manutenções (evitar duplicatas)
      ...filteredDataBySearch.despesasPeriodo
        .filter(despesa => !despesa.id.startsWith('manutencao_'))
        .map(despesa => ({
          ...despesa,
          tipo: 'despesa',
          data: despesa.data,
          valor: parseFloat(despesa.valor || '0'),
          categoria: despesa.categoria,
          descricao: despesa.descricao,
          veiculoId: despesa.veiculoId
        })),
      ...filteredDataBySearch.manutencoes.map(manutencao => {
        // Para manutenções concluídas, usar data de conclusão; caso contrário, data de início
        const dataManutencao = manutencao.status === 'concluida' && manutencao.dataConclusao 
          ? manutencao.dataConclusao 
          : manutencao.dataInicio;
        
        return {
          ...manutencao,
          tipo: 'manutencao',
          data: dataManutencao,
          valor: parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0'),
          categoria: 'manutencao',
          descricao: manutencao.descricao,
          veiculoId: manutencao.veiculoId
        };
      })
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
  }, [filteredDataBySearch.despesasPeriodo, filteredDataBySearch.manutencoes, sortHistorico, veiculos]);

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

  // Análise por Motorista
  const analiseMotoristas = useMemo(() => {
    const motoristasData = [];
    
    // Para cada aluguel ativo, buscar os dados do motorista e pagamentos
    filteredData.alugueisAtivos.forEach(aluguel => {
      const motorista = motoristas.find(m => m.id === aluguel.motoristaId);
      const veiculo = veiculos.find(v => v.id === aluguel.veiculoId);
      
      if (motorista && veiculo) {
        // Calcular pagamentos do período para este motorista
        const pagamentosMotorista = pagamentos.filter(p => 
          p.motoristaId === motorista.id && 
          p.status === 'pago' && 
          isWithinInterval(new Date(p.dataPagamento || p.dataVencimento), { start: monthStart, end: monthEnd })
        );
        
        const totalPagamentos = pagamentosMotorista.reduce((total, pagamento) => {
          const valor = Number(pagamento.valorTotal || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);
        
        motoristasData.push({
          motoristaId: motorista.id,
          motoristaNome: motorista.nome,
          motoristaCpf: motorista.cpf,
          veiculoId: veiculo.id,
          veiculoPlaca: veiculo.placa,
          valorAluguel: Number(aluguel.valorMensal || aluguel.valorDiario || 0),
          totalPagamentos: totalPagamentos
        });
      }
    });
    
    // Aplicar ordenação
    return motoristasData.sort((a, b) => {
      switch (sortMotoristas) {
        case 'maior-pagamento':
          return b.totalPagamentos - a.totalPagamentos;
        case 'menor-pagamento':
          return a.totalPagamentos - b.totalPagamentos;
        case 'maior-valor-aluguel':
          return b.valorAluguel - a.valorAluguel;
        case 'menor-valor-aluguel':
          return a.valorAluguel - b.valorAluguel;
        case 'nome-az':
          return a.motoristaNome.localeCompare(b.motoristaNome);
        case 'nome-za':
          return b.motoristaNome.localeCompare(a.motoristaNome);
        default:
          return b.totalPagamentos - a.totalPagamentos;
      }
    });
  }, [filteredData.alugueisAtivos, motoristas, veiculos, pagamentos, monthStart, monthEnd, sortMotoristas]);

  // Paginação da análise por motoristas
  const totalPaginasMotoristas = Math.ceil(analiseMotoristas.length / itemsPerPageMotoristas);
  const analiseMotoristasPaginada = analiseMotoristas.slice(
    (currentPageMotoristas - 1) * itemsPerPageMotoristas,
    currentPageMotoristas * itemsPerPageMotoristas
  );

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
      .filter(p => p.status === 'pago' && isWithinInterval(new Date(p.dataPagamento || p.dataVencimento), { start: monthStart, end: monthEnd }))
      .reduce((total, pagamento) => {
        const valor = Number(pagamento.valorTotal || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
  }, [pagamentos, monthStart, monthEnd]);

  // Taxa administrativa de aluguéis
  const receitaTaxaAdministrativa = useMemo(() => {
    return pagamentos
      .filter(p => p.status === 'pago' && p.tipo === 'taxa administrativa' && isWithinInterval(new Date(p.dataPagamento || p.dataVencimento), { start: monthStart, end: monthEnd }))
      .reduce((total, pagamento) => {
        const valor = Number(pagamento.valorTotal || '0');
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

  const receitaTotal = receitaPagamentos + receitaTaxaAdministrativa + totalReceitas + receitaExtra.total;
  const lucroLiquido = receitaTotal - totalDespesas;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // Gráficos removidos - usando visualização simples com cards e tabelas

  // Debug detalhado para verificar valores
  const despesasManuaisFiltradas = filteredData.despesasPeriodo.filter(d => d.tipo === 'despesa' && d.fonte !== 'manutencao' && d.categoria !== 'financiamento');
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

  // Verificar se dados estão carregando
  const isDataLoading = alugueisLoading || pagamentosLoading || despesasLoading || veiculosLoading;

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
          <NovaDespesaModal />
        )}
      </div>

      {/* Cards de Resumo Financeiro - apenas para locadoras */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">RECEITA TOTAL</p>
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
                <p className="text-xs font-medium text-red-700">DESPESAS TOTAIS</p>
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
                    // Usar dados reais ao invés de valores aleatórios
                    const receitaLocadora = 0; // Dados reais não disponíveis no momento
                    const despesasLocadora = 0; // Dados reais não disponíveis no momento
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
      <Tabs defaultValue="despesas" className="space-y-2">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="veiculos">Análise por Veículo</TabsTrigger>
          <TabsTrigger value="motoristas">Análise por Motorista</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas" className="space-y-2">
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
                      <p className="font-medium text-green-800">Receita dos Aluguéis</p>
                      <p className="text-sm text-green-600">Pagamentos recebidos no período</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(receitaPagamentos)}
                    </p>
                  </div>

                  {receitaTaxaAdministrativa > 0 && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800">Taxa Administrativa</p>
                        <p className="text-sm text-blue-600">Taxas cobradas nos aluguéis</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(receitaTaxaAdministrativa)}
                      </p>
                    </div>
                  )}

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
                                   categoria === 'combustivel' ? 'bg-orange-50' :
                                   categoria === 'gasolina' ? 'bg-red-50' :
                                   categoria === 'despachante' ? 'bg-teal-50' :
                                   'bg-gray-50';
                      const corTexto = categoria === 'emprestimo' ? 'text-purple-800' :
                                      categoria === 'lavagem' ? 'text-blue-800' :
                                      categoria === 'ipva' ? 'text-yellow-800' :
                                      categoria === 'seguro' ? 'text-green-800' :
                                      categoria === 'rastreador' ? 'text-indigo-800' :
                                      categoria === 'financiamento' ? 'text-pink-800' :
                                      categoria === 'combustivel' ? 'text-orange-800' :
                                      categoria === 'gasolina' ? 'text-red-800' :
                                      categoria === 'despachante' ? 'text-teal-800' :
                                      'text-gray-800';
                      const corValor = categoria === 'emprestimo' ? 'text-purple-600' :
                                      categoria === 'lavagem' ? 'text-blue-600' :
                                      categoria === 'ipva' ? 'text-yellow-600' :
                                      categoria === 'seguro' ? 'text-green-600' :
                                      categoria === 'rastreador' ? 'text-indigo-600' :
                                      categoria === 'financiamento' ? 'text-pink-600' :
                                      categoria === 'combustivel' ? 'text-orange-600' :
                                      categoria === 'gasolina' ? 'text-red-600' :
                                      categoria === 'despachante' ? 'text-teal-600' :
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
                <CardTitle>Histórico de Despesas dos Veículos</CardTitle>
                <CardDescription>
                  Histórico filtrado baseado na busca realizada - dados reais
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
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
                      : 'Nenhuma despesa encontrada no período selecionado.'}
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
                                  item.tipo === 'despesa' ? 'text-red-600' : 'text-orange-600'
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
                                    item.tipo === 'despesa' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {item.tipo === 'despesa' ? 'Despesa' : 'Manutenção'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {/* Despesas manuais (IDs normais) podem ser excluídas */}
                                  {!item.id.startsWith('manutencao_') && !item.id.startsWith('financiamento_') && item.tipo === 'despesa' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleExcluirDespesa(item.id)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Despesas automáticas (manutenção, financiamento) não podem ser excluídas */}
                                  {(item.id.startsWith('manutencao_') || item.id.startsWith('financiamento_')) && (
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
                  Relatório detalhado de receitas e despesas por veículo
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
                    <SelectItem value="maior-receita">Maior Receita</SelectItem>
                    <SelectItem value="menor-receita">Menor Receita</SelectItem>
                    <SelectItem value="maior-despesa">Maior Despesa</SelectItem>
                    <SelectItem value="menor-despesa">Menor Despesa</SelectItem>
                    <SelectItem value="placa-az">Placa (A-Z)</SelectItem>
                    <SelectItem value="placa-za">Placa (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {veiculos.length === 0 ? (
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
                          {veiculos.slice((currentPageVeiculos - 1) * itemsPerPageVeiculos, currentPageVeiculos * itemsPerPageVeiculos).map((veiculo) => {
                            // Buscar aluguel ativo para este veículo
                            const aluguelAtivo = filteredData.alugueisAtivos.find(a => a.veiculoId === veiculo.id);
                            const receitaMensal = aluguelAtivo ? Number(aluguelAtivo.valorMensal || 0) : 0;
                            
                            // Calcular despesas fixas do veículo
                            const despesasFixasVeiculo = 
                              (veiculo.ipva ? Number(veiculo.ipva) / 12 : 0) +
                              (veiculo.valorSeguroMensal ? Number(veiculo.valorSeguroMensal) : 0) +
                              (veiculo.valorRastreadorMensal ? Number(veiculo.valorRastreadorMensal) : 0);
                            
                            const lucroLiquido = receitaMensal - despesasFixasVeiculo;
                            const margemLucro = receitaMensal > 0 ? (lucroLiquido / receitaMensal) * 100 : 0;
                            
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
                                    veiculo.status === 'alugado' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {veiculo.status === 'alugado' ? 'Alugado' : 'Disponível'}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-green-600">
                                  {formatCurrency(receitaMensal)}
                                </td>
                                <td className="p-3 font-semibold text-red-600">
                                  {formatCurrency(despesasFixasVeiculo)}
                                </td>
                                <td className="p-3 font-semibold">
                                  <span className={lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(lucroLiquido)}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold">
                                  <span className={margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {margemLucro.toFixed(1)}%
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
                            Página {currentPageVeiculos} de {Math.ceil(veiculos.length / itemsPerPageVeiculos)} 
                            ({veiculos.length} itens)
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

        {/* Aba Análise por Motorista */}
        <TabsContent value="motoristas" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análise por Motorista</CardTitle>
                <CardDescription>
                  Relatório de pagamentos e aluguéis por motorista
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={sortMotoristas} onValueChange={setSortMotoristas}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maior-pagamento">Maior Pagamento</SelectItem>
                    <SelectItem value="menor-pagamento">Menor Pagamento</SelectItem>
                    <SelectItem value="maior-valor-aluguel">Maior Valor Aluguel</SelectItem>
                    <SelectItem value="menor-valor-aluguel">Menor Valor Aluguel</SelectItem>
                    <SelectItem value="nome-az">Nome (A-Z)</SelectItem>
                    <SelectItem value="nome-za">Nome (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analiseMotoristas.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum motorista com aluguel ativo encontrado.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 border-b">Ver</th>
                            <th className="text-left p-3 border-b">Motorista</th>
                            <th className="text-left p-3 border-b">CPF</th>
                            <th className="text-left p-3 border-b">Veículo</th>
                            <th className="text-left p-3 border-b">Valor Aluguel</th>
                            <th className="text-left p-3 border-b">Pagamentos Período</th>
                            <th className="text-left p-3 border-b">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analiseMotoristasPaginada.map((item) => (
                            <tr key={item.motoristaId} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerDetalhesMotorista(item)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                              <td className="p-3 font-medium">{item.motoristaNome}</td>
                              <td className="p-3 text-gray-600">{item.motoristaCpf}</td>
                              <td className="p-3">{item.veiculoPlaca}</td>
                              <td className="p-3 font-semibold text-blue-600">
                                {formatCurrency(item.valorAluguel)}
                              </td>
                              <td className="p-3 font-semibold text-green-600">
                                {formatCurrency(item.totalPagamentos)}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  item.totalPagamentos >= item.valorAluguel 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.totalPagamentos >= item.valorAluguel ? 'Em dia' : 'Pendente'}
                                </span>
                              </td>
                            </tr>
                          ))}
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
                            value={itemsPerPageMotoristas.toString()}
                            onValueChange={(value) => handleItemsPerPageChangeMotoristas(parseInt(value))}
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
                            Página {currentPageMotoristas} de {totalPaginasMotoristas} 
                            ({analiseMotoristas.length} itens)
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeMotoristas(currentPageMotoristas - 1)}
                              disabled={currentPageMotoristas === 1}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChangeMotoristas(currentPageMotoristas + 1)}
                              disabled={currentPageMotoristas === totalPaginasMotoristas}
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



      {/* Modal duplicado removido - usando componente NovaDespesaModal */}

      {/* Modal de detalhes do veículo */}
      {veiculoDetalhes && (
        <DetalhesVeiculoAnaliseModal
          isOpen={!!veiculoDetalhes}
          onClose={() => setVeiculoDetalhes(null)}
          dadosVeiculo={veiculoDetalhes}
          selectedMonth={selectedMonth}
        />
      )}

      {/* Modal de detalhes do motorista */}
      {motoristaDetalhes && (
        <DetalhesVeiculoAnaliseModal
          isOpen={!!motoristaDetalhes}
          onClose={() => setMotoristaDetalhes(null)}
          dadosVeiculo={motoristaDetalhes}
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
