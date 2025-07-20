import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, FileText, Eye, Trash2, Plus, Edit, ChevronDown, X } from 'lucide-react';
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
import { NovaDespesaModal } from '@/components/despesas/NovaDespesaModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';

export default function RelatoriosFinanceiros() {
  const { profile, isAdmin } = useAuth();
  const { alugueis } = useAlugueis();
  const { pagamentos } = usePagamentos();
  const { infracoes } = useInfracoes();
  const { despesas, isLoading: despesasLoading } = useDespesas();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Estados básicos
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [despesaExcluindo, setDespesaExcluindo] = useState<string | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [sortVeiculos, setSortVeiculos] = useState<string>('mais-lucrativos');
  const [sortMotoristas, setSortMotoristas] = useState<string>('mais-pagamentos');
  const [sortDespesasFixas, setSortDespesasFixas] = useState<string>('maior-total');
  const [sortHistorico, setSortHistorico] = useState<string>('mais-recente');

  // Estados de paginação
  const [currentPageDespesasFixas, setCurrentPageDespesasFixas] = useState(1);
  const [currentPageAnaliseVeiculos, setCurrentPageAnaliseVeiculos] = useState(1);
  const [currentPageMotoristas, setCurrentPageMotoristas] = useState(1);
  const [currentPageHistorico, setCurrentPageHistorico] = useState(1);
  
  const [itemsPerPageDespesasFixas, setItemsPerPageDespesasFixas] = useState(10);
  const [itemsPerPageAnaliseVeiculos, setItemsPerPageAnaliseVeiculos] = useState(10);
  const [itemsPerPageMotoristas, setItemsPerPageMotoristas] = useState(10);
  const [itemsPerPageHistorico, setItemsPerPageHistorico] = useState(10);

  // Estados modais
  const [modalDetalhes, setModalDetalhes] = useState({ aberto: false, veiculo: null });
  const [modalNovaDespesa, setModalNovaDespesa] = useState({ aberto: false, veiculosSelecionados: [] });

  // Para admins, buscar dados consolidados
  const { data: locadoras = [] } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin,
  });

  // Verificar dados carregados
  const isDataReady = !!(despesas && veiculos && alugueis && pagamentos);
  
  // Cálculos básicos
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Hook despesas com manutenções
  const despesasComManutencoes = useMemo(() => {
    return despesas || [];
  }, [despesas]);

  // Dados filtrados por período
  const filteredData = useMemo(() => {
    if (!isDataReady) return { alugueisAtivos: [], pagamentosRealizados: [], infracoesPeriodo: [], despesasPeriodo: [], manutencoes: [] };
    
    const isInPeriod = (date: Date) => isWithinInterval(date, { start: monthStart, end: monthEnd });

    const alugueisAtivos = (alugueis || []).filter(aluguel => aluguel.status === 'ativo');
    const pagamentosRealizados = (pagamentos || []).filter(pagamento => 
      pagamento.status === 'realizado' && isInPeriod(new Date(pagamento.dataPagamento))
    );
    const infracoesPeriodo = (infracoes || []).filter(infracao => isInPeriod(new Date(infracao.dataInfracao)));
    const despesasPeriodo = (despesas || []).filter(despesa => isInPeriod(new Date(despesa.data)));
    const manutencoesPeriodo = (manutencoes || []).filter(manutencao => isInPeriod(new Date(manutencao.dataInicio)));

    return { alugueisAtivos, pagamentosRealizados, infracoesPeriodo, despesasPeriodo, manutencoes: manutencoesPeriodo };
  }, [alugueis, pagamentos, infracoes, despesas, manutencoes, monthStart, monthEnd, isDataReady]);

  // Calcular despesas fixas dos veículos
  const despesasFixas = useMemo(() => {
    if (!veiculos || veiculos.length === 0) return [];

    return veiculos.map((veiculo: any) => {
      // IPVA mensal (valor anual dividido por 12)
      const ipvaMensal = veiculo.ipva ? parseFloat(veiculo.ipva) / 12 : 0;
      
      // Seguro mensal
      const seguroMensal = veiculo.valorSeguro ? parseFloat(veiculo.valorSeguro) : 0;
      
      // Rastreador mensal
      const rastreadorMensal = veiculo.valorRastreadorMensal ? parseFloat(veiculo.valorRastreadorMensal) : 0;
      
      // Financiamento mensal (se aplicável)
      const financiamentoMensal = 0; // Remover até campo ser implementado

      const total = ipvaMensal + seguroMensal + rastreadorMensal + financiamentoMensal;

      return {
        veiculo,
        ipva: ipvaMensal,
        seguro: seguroMensal,
        rastreador: rastreadorMensal,
        financiamento: financiamentoMensal,
        total
      };
    });
  }, [veiculos]);

  // Ordenar despesas fixas
  const despesasFixasOrdenadas = useMemo(() => {
    if (!despesasFixas.length) return [];

    const sorted = [...despesasFixas];
    
    switch (sortDespesasFixas) {
      case 'maior-total':
        return sorted.sort((a, b) => b.total - a.total);
      case 'menor-total':
        return sorted.sort((a, b) => a.total - b.total);
      case 'maior-ipva':
        return sorted.sort((a, b) => b.ipva - a.ipva);
      case 'menor-ipva':
        return sorted.sort((a, b) => a.ipva - b.ipva);
      case 'maior-seguro':
        return sorted.sort((a, b) => b.seguro - a.seguro);
      case 'menor-seguro':
        return sorted.sort((a, b) => a.seguro - b.seguro);
      case 'placa-az':
        return sorted.sort((a, b) => a.veiculo.placa.localeCompare(b.veiculo.placa));
      case 'placa-za':
        return sorted.sort((a, b) => b.veiculo.placa.localeCompare(a.veiculo.placa));
      default:
        return sorted.sort((a, b) => b.total - a.total);
    }
  }, [despesasFixas, sortDespesasFixas]);

  // Paginação despesas fixas
  const totalPagesDespesasFixas = Math.ceil(despesasFixasOrdenadas.length / itemsPerPageDespesasFixas);
  const startIndexDespesasFixas = (currentPageDespesasFixas - 1) * itemsPerPageDespesasFixas;
  const despesasFixasPaginadas = despesasFixasOrdenadas.slice(startIndexDespesasFixas, startIndexDespesasFixas + itemsPerPageDespesasFixas);

  // Total de despesas fixas
  const totalDespesasFixas = despesasFixas.reduce((acc, item) => acc + item.total, 0);

  // Análise por categoria das despesas fixas
  const analiseCategoriaDespesasFixas = useMemo(() => {
    const totalIpva = despesasFixas.reduce((acc, item) => acc + item.ipva, 0);
    const totalSeguros = despesasFixas.reduce((acc, item) => acc + item.seguro, 0);
    const totalRastreadores = despesasFixas.reduce((acc, item) => acc + item.rastreador, 0);
    const totalFinanciamentos = despesasFixas.reduce((acc, item) => acc + item.financiamento, 0);

    const categorias = [
      { nome: 'IPVA', valor: totalIpva },
      { nome: 'Seguros', valor: totalSeguros },
      { nome: 'Rastreadores', valor: totalRastreadores },
      { nome: 'Financiamentos', valor: totalFinanciamentos }
    ].filter(cat => cat.valor > 0);

    return categorias.map(categoria => ({
      ...categoria,
      porcentagem: totalDespesasFixas > 0 ? (categoria.valor / totalDespesasFixas) * 100 : 0
    })).sort((a, b) => b.valor - a.valor);
  }, [despesasFixas, totalDespesasFixas]);

  // Análise por veículo
  const analiseVeiculos = useMemo(() => {
    if (!veiculos || veiculos.length === 0) return [];

    return veiculos.map((veiculo: any) => {
      // Encontrar aluguel ativo para receita
      const aluguelAtivo = filteredData.alugueisAtivos.find((a: any) => a.veiculoId === veiculo.id);
      const receitaMensal = aluguelAtivo ? parseFloat(aluguelAtivo.valorMensal || aluguelAtivo.valorDiario * 30 || '0') : 0;

      // Calcular despesas fixas do veículo
      const ipva = veiculo.ipva ? parseFloat(veiculo.ipva) / 12 : 0;
      const seguro = veiculo.valorSeguro ? parseFloat(veiculo.valorSeguro) : 0;
      const rastreador = veiculo.valorRastreadorMensal ? parseFloat(veiculo.valorRastreadorMensal) : 0;
      const financiamento = 0; // Campo de financiamento ainda não implementado

      // Somar despesas manuais do período para este veículo
      const despesasManuais = filteredData.despesasPeriodo
        .filter((d: any) => d.veiculos && d.veiculos.includes(veiculo.id))
        .reduce((acc: number, despesa: any) => acc + parseFloat(despesa.valor || '0'), 0);

      // Somar manutenções do período para este veículo
      const manutencoes = filteredData.manutencoes
        .filter((m: any) => m.veiculoId === veiculo.id)
        .reduce((acc: number, manutencao: any) => acc + parseFloat(manutencao.valorFinal || manutencao.valorEstimado || '0'), 0);

      const despesasMensais = ipva + seguro + rastreador + financiamento + despesasManuais + manutencoes;
      const lucro = receitaMensal - despesasMensais;
      const margem = receitaMensal > 0 ? (lucro / receitaMensal) * 100 : 0;

      return {
        veiculo,
        receitaMensal,
        despesasMensais,
        lucro,
        margem,
        status: veiculo.status || 'disponivel'
      };
    });
  }, [veiculos, filteredData]);

  // Ordenar análise por veículo
  const analiseVeiculosOrdenada = useMemo(() => {
    if (!analiseVeiculos.length) return [];

    const sorted = [...analiseVeiculos];
    
    switch (sortVeiculos) {
      case 'mais-lucrativos':
        return sorted.sort((a, b) => b.lucro - a.lucro);
      case 'menos-lucrativos':
        return sorted.sort((a, b) => a.lucro - b.lucro);
      case 'maior-receita':
        return sorted.sort((a, b) => b.receitaMensal - a.receitaMensal);
      case 'menor-receita':
        return sorted.sort((a, b) => a.receitaMensal - b.receitaMensal);
      case 'maior-despesa':
        return sorted.sort((a, b) => b.despesasMensais - a.despesasMensais);
      case 'menor-despesa':
        return sorted.sort((a, b) => a.despesasMensais - b.despesasMensais);
      case 'placa-az':
        return sorted.sort((a, b) => a.veiculo.placa.localeCompare(b.veiculo.placa));
      case 'placa-za':
        return sorted.sort((a, b) => b.veiculo.placa.localeCompare(a.veiculo.placa));
      default:
        return sorted.sort((a, b) => b.lucro - a.lucro);
    }
  }, [analiseVeiculos, sortVeiculos]);

  // Paginação análise por veículo
  const totalPagesAnaliseVeiculos = Math.ceil(analiseVeiculosOrdenada.length / itemsPerPageAnaliseVeiculos);
  const startIndexAnaliseVeiculos = (currentPageAnaliseVeiculos - 1) * itemsPerPageAnaliseVeiculos;
  const analiseVeiculosPaginada = analiseVeiculosOrdenada.slice(startIndexAnaliseVeiculos, startIndexAnaliseVeiculos + itemsPerPageAnaliseVeiculos);

  // Análise por motorista
  const analiseMotoristas = useMemo(() => {
    if (!motoristas || motoristas.length === 0) return [];

    return motoristas.map((motorista: any) => {
      // Pagamentos realizados por este motorista no período
      const pagamentosMotorista = filteredData.pagamentosRealizados.filter((p: any) => p.motoristaId === motorista.id);
      const totalPagamentos = pagamentosMotorista.reduce((acc: number, p: any) => acc + parseFloat(p.valor || '0'), 0);

      // Aluguel ativo do motorista
      const aluguelAtivo = filteredData.alugueisAtivos.find((a: any) => a.motoristaId === motorista.id);
      const valorMensalAluguel = aluguelAtivo ? parseFloat(aluguelAtivo.valorMensal || '0') : 0;

      // Infrações do motorista no período
      const infracoesMotorista = filteredData.infracoesPeriodo.filter((i: any) => i.motoristaId === motorista.id);
      const totalInfracoes = infracoesMotorista.reduce((acc: number, i: any) => acc + parseFloat(i.valor || '0'), 0);

      return {
        motorista,
        totalPagamentos,
        valorMensalAluguel,
        totalInfracoes,
        quantidadePagamentos: pagamentosMotorista.length,
        quantidadeInfracoes: infracoesMotorista.length,
        statusAluguel: aluguelAtivo ? 'Ativo' : 'Sem Aluguel'
      };
    });
  }, [motoristas, filteredData]);

  // Ordenar análise por motorista
  const analiseMotoristasOrdenada = useMemo(() => {
    if (!analiseMotoristas.length) return [];

    const sorted = [...analiseMotoristas];
    
    switch (sortMotoristas) {
      case 'mais-pagamentos':
        return sorted.sort((a, b) => b.totalPagamentos - a.totalPagamentos);
      case 'menos-pagamentos':
        return sorted.sort((a, b) => a.totalPagamentos - b.totalPagamentos);
      case 'maior-aluguel':
        return sorted.sort((a, b) => b.valorMensalAluguel - a.valorMensalAluguel);
      case 'menor-aluguel':
        return sorted.sort((a, b) => a.valorMensalAluguel - b.valorMensalAluguel);
      case 'mais-infracoes':
        return sorted.sort((a, b) => b.totalInfracoes - a.totalInfracoes);
      case 'menos-infracoes':
        return sorted.sort((a, b) => a.totalInfracoes - b.totalInfracoes);
      case 'nome-az':
        return sorted.sort((a, b) => a.motorista.nome.localeCompare(b.motorista.nome));
      case 'nome-za':
        return sorted.sort((a, b) => b.motorista.nome.localeCompare(a.motorista.nome));
      default:
        return sorted.sort((a, b) => b.totalPagamentos - a.totalPagamentos);
    }
  }, [analiseMotoristas, sortMotoristas]);

  // Paginação análise por motorista
  const totalPagesMotoristas = Math.ceil(analiseMotoristasOrdenada.length / itemsPerPageMotoristas);
  const startIndexMotoristas = (currentPageMotoristas - 1) * itemsPerPageMotoristas;
  const analiseMotoristaPaginada = analiseMotoristasOrdenada.slice(startIndexMotoristas, startIndexMotoristas + itemsPerPageMotoristas);

  // Histórico completo (despesas + manutenções)
  const historicoCompleto = useMemo(() => {
    const historico: any[] = [];

    // Adicionar despesas manuais
    (despesas || []).forEach((despesa: any) => {
      const veiculo = veiculos?.find((v: any) => 
        despesa.veiculos && despesa.veiculos.includes && despesa.veiculos.includes(v.id)
      );

      historico.push({
        id: despesa.id,
        tipo: 'manual',
        categoria: despesa.categoria || 'Outros',
        descricao: despesa.descricao || '',
        valor: parseFloat(despesa.valor || '0'),
        dataDespesa: new Date(despesa.data), // Data real da despesa
        dataCadastro: despesa.createdAt ? new Date(despesa.createdAt) : new Date(despesa.data), // Data de cadastro
        veiculo
      });
    });

    // Adicionar manutenções concluídas
    (manutencoes || [])
      .filter((manutencao: any) => manutencao.status === 'concluida')
      .forEach((manutencao: any) => {
        const veiculo = veiculos?.find((v: any) => v.id === manutencao.veiculoId);
        
        historico.push({
          id: manutencao.id,
          tipo: 'manutencao',
          categoria: 'Manutenção',
          descricao: manutencao.descricao || `${manutencao.tipoManutencao} - ${manutencao.localOficina}`,
          valor: parseFloat(manutencao.valorFinal || manutencao.valorEstimado || '0'),
          dataDespesa: manutencao.dataConclusao ? new Date(manutencao.dataConclusao) : new Date(manutencao.dataInicio), // Data da conclusão ou início
          dataCadastro: new Date(manutencao.dataInicio), // Data de cadastro/início
          veiculo
        });
      });

    return historico;
  }, [despesas, manutencoes, veiculos]);

  // Ordenar histórico
  const historicoOrdenado = useMemo(() => {
    if (!historicoCompleto.length) return [];

    const sorted = [...historicoCompleto];
    
    switch (sortHistorico) {
      case 'mais-recente':
        return sorted.sort((a, b) => {
          const diff = b.dataDespesa.getTime() - a.dataDespesa.getTime();
          // Em caso de empate, manutenções primeiro
          if (diff === 0) {
            if (a.tipo === 'manutencao' && b.tipo !== 'manutencao') return -1;
            if (b.tipo === 'manutencao' && a.tipo !== 'manutencao') return 1;
          }
          return diff;
        });
      case 'mais-antiga':
        return sorted.sort((a, b) => a.dataDespesa.getTime() - b.dataDespesa.getTime());
      case 'maior-valor':
        return sorted.sort((a, b) => b.valor - a.valor);
      case 'menor-valor':
        return sorted.sort((a, b) => a.valor - b.valor);
      case 'categoria-az':
        return sorted.sort((a, b) => a.categoria.localeCompare(b.categoria));
      case 'categoria-za':
        return sorted.sort((a, b) => b.categoria.localeCompare(a.categoria));
      case 'veiculo-az':
        return sorted.sort((a, b) => {
          const placaA = a.veiculo?.placa || '';
          const placaB = b.veiculo?.placa || '';
          return placaA.localeCompare(placaB);
        });
      case 'veiculo-za':
        return sorted.sort((a, b) => {
          const placaA = a.veiculo?.placa || '';
          const placaB = b.veiculo?.placa || '';
          return placaB.localeCompare(placaA);
        });
      default:
        return sorted.sort((a, b) => {
          const diff = b.dataDespesa.getTime() - a.dataDespesa.getTime();
          // Em caso de empate, manutenções primeiro
          if (diff === 0) {
            if (a.tipo === 'manutencao' && b.tipo !== 'manutencao') return -1;
            if (b.tipo === 'manutencao' && a.tipo !== 'manutencao') return 1;
          }
          return diff;
        });
    }
  }, [historicoCompleto, sortHistorico]);

  // Paginação do histórico
  const totalPagesHistorico = Math.ceil(historicoOrdenado.length / itemsPerPageHistorico);
  const startIndexHistorico = (currentPageHistorico - 1) * itemsPerPageHistorico;
  const historicoPaginado = historicoOrdenado.slice(startIndexHistorico, startIndexHistorico + itemsPerPageHistorico);

  // Funções auxiliares
  const handleEditarDespesa = (id: string) => {
    console.log('Editar despesa:', id);
    // Implementar edição de despesa
  };

  const handleExcluirDespesa = async (id: string) => {
    if (!id) return;

    setDespesaExcluindo(id);
    
    try {
      await queryClient.refetchQueries({ queryKey: ['/api/despesas'] });
      toast({
        title: 'Sucesso',
        description: 'Despesa excluída com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir despesa',
        variant: 'destructive'
      });
    } finally {
      setDespesaExcluindo(null);
      setConfirmDelete({ open: false, id: null });
    }
  };

  // Função para formatar datas que aceita Date ou string
  const formatDateSafe = (date: Date | string) => {
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } else {
        return formatDate(date);
      }
    } catch (error) {
      return '-';
    }
  };



  // Dados com busca e filtros
  const filteredDataBySearch = useMemo(() => {
    if (!searchTerm && filterType === 'todos') return filteredData;
    if (!isDataReady) return { alugueisAtivos: [], pagamentosRealizados: [], infracoesPeriodo: [], despesasPeriodo: [], manutencoes: [] };

    const searchLower = searchTerm.toLowerCase();
    
    const result = {
      alugueisAtivos: filteredData.alugueisAtivos,
      pagamentosRealizados: filteredData.pagamentosRealizados,
      infracoesPeriodo: filteredData.infracoesPeriodo,
      despesasPeriodo: filteredData.despesasPeriodo.filter(despesa => {
        const matchesSearch = !searchTerm || 
          despesa.descricao?.toLowerCase().includes(searchLower) ||
          despesa.categoria?.toLowerCase().includes(searchLower) ||
          (veiculos || []).find(v => v.id === despesa.veiculoId)?.placa?.toLowerCase().includes(searchLower) ||
          (veiculos || []).find(v => v.id === despesa.veiculoId)?.modelo?.toLowerCase().includes(searchLower);
          
        const matchesType = filterType === 'todos' || despesa.categoria === filterType;
        
        return matchesSearch && matchesType;
      }),
      manutencoes: filteredData.manutencoes.filter(manutencao => {
        const matchesSearch = !searchTerm ||
          manutencao.descricao?.toLowerCase().includes(searchLower) ||
          manutencao.tipo?.toLowerCase().includes(searchLower) ||
          manutencao.oficina?.toLowerCase().includes(searchLower) ||
          (veiculos || []).find(v => v.id === manutencao.veiculoId)?.placa?.toLowerCase().includes(searchLower);
          
        const matchesType = filterType === 'todos' || filterType === 'manutencao';
        
        return matchesSearch && matchesType;
      })
    };
    
    return result;
  }, [filteredData, searchTerm, filterType, veiculos, isDataReady]);

  // Cálculos dos totais - depois dos hooks de dados filtrados
  const receitaTotal = useMemo(() => {
    if (!isDataReady) return 0;
    return filteredData.alugueisAtivos.reduce((total, aluguel) => {
      const valorMensal = parseFloat(aluguel.valorMensal || aluguel.valorDiario || '0');
      return total + (isNaN(valorMensal) ? 0 : valorMensal);
    }, 0);
  }, [filteredData.alugueisAtivos, isDataReady]);

  const despesasTotal = useMemo(() => {
    if (!isDataReady || !veiculos) return 0;
    
    // Despesas fixas automáticas
    const fixas = (veiculos || []).reduce((total, veiculo) => {
      let despesasFixas = 0;
      
      if (veiculo.ipva && veiculo.ipva > 0) {
        despesasFixas += parseFloat(veiculo.ipva) / 12;
      }
      
      if (veiculo.valorSeguroMensal && veiculo.valorSeguroMensal > 0) {
        despesasFixas += parseFloat(veiculo.valorSeguroMensal);
      }
      
      if (veiculo.valorRastreadorMensal && veiculo.valorRastreadorMensal > 0) {
        despesasFixas += parseFloat(veiculo.valorRastreadorMensal);
      }
      
      if (veiculo.financiado && veiculo.valorFinanciamento) {
        despesasFixas += parseFloat(veiculo.valorFinanciamento);
      }
      
      return total + despesasFixas;
    }, 0);

    // Despesas manuais do período
    const manuais = filteredData.despesasPeriodo.reduce((total, despesa) => {
      const valor = parseFloat(despesa.valor || '0');
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);

    // Manutenções do período
    const manutencoes = filteredData.manutencoes.reduce((total, manutencao) => {
      const valor = parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0');
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);

    return fixas + manuais + manutencoes;
  }, [veiculos, filteredData.despesasPeriodo, filteredData.manutencoes, isDataReady]);

  const lucroLiquido = useMemo(() => {
    return receitaTotal - despesasTotal;
  }, [receitaTotal, despesasTotal]);

  const margemLucro = useMemo(() => {
    if (receitaTotal === 0) return 0;
    return (lucroLiquido / receitaTotal) * 100;
  }, [lucroLiquido, receitaTotal]);

  // Handlers de paginação
  const handlePageChange = (page: number, tipo: string) => {
    switch (tipo) {
      case 'despesasFixas':
        setCurrentPageDespesasFixas(page);
        break;
      case 'analiseVeiculos':
        setCurrentPageAnaliseVeiculos(page);
        break;
      case 'motoristas':
        setCurrentPageMotoristas(page);
        break;
      case 'historico':
        setCurrentPageHistorico(page);
        break;
    }
  };

  const handleItemsPerPageChange = (items: string, tipo: string) => {
    const itemsNum = parseInt(items);
    switch (tipo) {
      case 'despesasFixas':
        setItemsPerPageDespesasFixas(itemsNum);
        setCurrentPageDespesasFixas(1);
        break;
      case 'analiseVeiculos':
        setItemsPerPageAnaliseVeiculos(itemsNum);
        setCurrentPageAnaliseVeiculos(1);
        break;
      case 'motoristas':
        setItemsPerPageMotoristas(itemsNum);
        setCurrentPageMotoristas(1);
        break;
      case 'historico':
        setItemsPerPageHistorico(itemsNum);
        setCurrentPageHistorico(1);
        break;
    }
  };

  // Funções de manipulação de dados
  const handleDelete = async (id: string) => {
    if (!id) return;
    
    setDespesaExcluindo(id);
    
    try {
      const response = await fetch(`/api/despesas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
    } finally {
      setDespesaExcluindo(null);
    }
  };

  const confirmarExclusao = async () => {
    if (confirmDelete.id) {
      await handleDelete(confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
    }
  };

  // Loading e data não pronta
  if (despesasLoading || !isDataReady) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios financeiros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receitaTotal)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(despesasTotal)}</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${lucroLiquido >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lucroLiquido)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Margem de Lucro</CardTitle>
            <Car className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{margemLucro.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Seletor de mês e botão nova despesa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Select
            value={format(selectedMonth, 'yyyy-MM')}
            onValueChange={(value) => {
              const [year, month] = value.split('-');
              setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = subMonths(new Date(), i);
                return (
                  <SelectItem key={format(month, 'yyyy-MM')} value={format(month, 'yyyy-MM')}>
                    {format(month, 'MMMM yyyy', { locale: pt })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setModalNovaDespesa({ aberto: true, veiculosSelecionados: [] })}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Tabs com abas de relatórios */}
      <Tabs defaultValue="despesas-fixas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="despesas-fixas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="analise-veiculo">Análise por Veículo</TabsTrigger>
          <TabsTrigger value="analise-motorista">Análise por Motorista</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas-fixas" className="space-y-6">
          {/* Tabela de Despesas Fixas */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Despesas Fixas dos Veículos</CardTitle>
                  <CardDescription>
                    IPVA, Seguros, Rastreadores e Financiamentos calculados automaticamente
                  </CardDescription>
                </div>
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
              {isDataReady ? (
                <div className="space-y-4">
                  {/* Cards de Totais por Categoria */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Total IPVA</p>
                            <p className="text-lg font-bold text-yellow-800">
                              {formatCurrency(despesasFixasOrdenadas.reduce((acc, item) => acc + (item.ipva || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-green-700">Total Seguros</p>
                            <p className="text-lg font-bold text-green-800">
                              {formatCurrency(despesasFixasOrdenadas.reduce((acc, item) => acc + (item.seguro || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-blue-700">Total Rastreadores</p>
                            <p className="text-lg font-bold text-blue-800">
                              {formatCurrency(despesasFixasOrdenadas.reduce((acc, item) => acc + (item.rastreador || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-purple-700">Total Financiamentos</p>
                            <p className="text-lg font-bold text-purple-800">
                              {formatCurrency(despesasFixasOrdenadas.reduce((acc, item) => acc + (item.financiamento || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela Detalhada */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Veículo</TableHead>
                          <TableHead>IPVA</TableHead>
                          <TableHead>Seguro</TableHead>
                          <TableHead>Rastreador</TableHead>
                          <TableHead>Financiamento</TableHead>
                          <TableHead>Total Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {despesasFixasPaginadas.map((item) => (
                          <TableRow key={item.veiculo.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.veiculo.placa}</p>
                                <p className="text-sm text-gray-500">
                                  {item.veiculo.marca} {item.veiculo.modelo}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-yellow-600">
                              {item.ipva ? formatCurrency(item.ipva) : '-'}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {item.seguro ? formatCurrency(item.seguro) : '-'}
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {item.rastreador ? formatCurrency(item.rastreador) : '-'}
                            </TableCell>
                            <TableCell className="text-purple-600">
                              {item.financiamento ? formatCurrency(item.financiamento) : '-'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Mostrar</span>
                      <Select
                        value={itemsPerPageDespesasFixas.toString()}
                        onValueChange={(value) => {
                          setItemsPerPageDespesasFixas(Number(value));
                          setCurrentPageDespesasFixas(1);
                        }}
                      >
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-700">
                        de {despesasFixasOrdenadas.length} itens
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageDespesasFixas(Math.max(1, currentPageDespesasFixas - 1))}
                        disabled={currentPageDespesasFixas === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPageDespesasFixas} de {totalPagesDespesasFixas}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageDespesasFixas(Math.min(totalPagesDespesasFixas, currentPageDespesasFixas + 1))}
                        disabled={currentPageDespesasFixas === totalPagesDespesasFixas}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>

                  {/* Análise por Categoria */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Análise por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {analiseCategoriaDespesasFixas.map((categoria, index) => (
                          <div key={categoria.nome} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                categoria.nome === 'IPVA' ? 'bg-yellow-500' :
                                categoria.nome === 'Seguros' ? 'bg-green-500' :
                                categoria.nome === 'Rastreadores' ? 'bg-blue-500' :
                                'bg-purple-500'
                              }`}></div>
                              <span className="font-medium">{categoria.nome}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    categoria.nome === 'IPVA' ? 'bg-yellow-500' :
                                    categoria.nome === 'Seguros' ? 'bg-green-500' :
                                    categoria.nome === 'Rastreadores' ? 'bg-blue-500' :
                                    'bg-purple-500'
                                  }`}
                                  style={{ width: `${categoria.porcentagem}%` }}
                                ></div>
                              </div>
                              <span className="font-bold w-20 text-right">{formatCurrency(categoria.valor)}</span>
                              <span className="text-sm text-gray-500 w-12 text-right">{categoria.porcentagem.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 pt-4 border-t-2 border-red-200 bg-red-50 rounded px-3">
                          <span className="font-bold text-red-700">Total Despesas Fixas</span>
                          <span className="font-bold text-red-800 text-lg">
                            {formatCurrency(totalDespesasFixas)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise-veiculo" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise por Veículo</CardTitle>
                  <CardDescription>
                    Receitas, despesas e lucratividade detalhada de cada veículo
                  </CardDescription>
                </div>
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
              {isDataReady ? (
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Eye className="h-4 w-4" />
                          </TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Receita</TableHead>
                          <TableHead>Despesas</TableHead>
                          <TableHead>Lucro</TableHead>
                          <TableHead>Margem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analiseVeiculosPaginada.map((item) => (
                          <TableRow key={item.veiculo.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setModalDetalhes({ aberto: true, veiculo: item.veiculo })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.veiculo.placa}</p>
                                <p className="text-sm text-gray-500">
                                  {item.veiculo.marca} {item.veiculo.modelo}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.veiculo.status === 'alugado' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.veiculo.status === 'alugado' ? 'Alugado' : 'Disponível'}
                              </span>
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(item.receitaMensal)}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {formatCurrency(item.despesasMensais)}
                            </TableCell>
                            <TableCell className={`font-bold ${
                              item.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(item.lucro)}
                            </TableCell>
                            <TableCell className={`font-medium ${
                              item.margem >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.margem.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Mostrar</span>
                      <Select
                        value={itemsPerPageAnaliseVeiculos.toString()}
                        onValueChange={(value) => {
                          setItemsPerPageAnaliseVeiculos(Number(value));
                          setCurrentPageAnaliseVeiculos(1);
                        }}
                      >
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-700">
                        de {analiseVeiculosOrdenada.length} veículos
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageAnaliseVeiculos(Math.max(1, currentPageAnaliseVeiculos - 1))}
                        disabled={currentPageAnaliseVeiculos === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPageAnaliseVeiculos} de {totalPagesAnaliseVeiculos}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageAnaliseVeiculos(Math.min(totalPagesAnaliseVeiculos, currentPageAnaliseVeiculos + 1))}
                        disabled={currentPageAnaliseVeiculos === totalPagesAnaliseVeiculos}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise-motorista" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise por Motorista</CardTitle>
                  <CardDescription>
                    Pagamentos realizados, aluguéis e comportamento dos motoristas
                  </CardDescription>
                </div>
                <Select value={sortMotoristas} onValueChange={setSortMotoristas}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais-pagamentos">Mais Pagamentos</SelectItem>
                    <SelectItem value="menos-pagamentos">Menos Pagamentos</SelectItem>
                    <SelectItem value="maior-aluguel">Maior Aluguel</SelectItem>
                    <SelectItem value="menor-aluguel">Menor Aluguel</SelectItem>
                    <SelectItem value="mais-infracoes">Mais Infrações</SelectItem>
                    <SelectItem value="menos-infracoes">Menos Infrações</SelectItem>
                    <SelectItem value="nome-az">Nome (A-Z)</SelectItem>
                    <SelectItem value="nome-za">Nome (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isDataReady ? (
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Status Aluguel</TableHead>
                          <TableHead>Pagamentos Realizados</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Valor Aluguel</TableHead>
                          <TableHead>Infrações</TableHead>
                          <TableHead>Total Infrações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analiseMotoristaPaginada.map((item) => (
                          <TableRow key={item.motorista.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.motorista.nome}</p>
                                <p className="text-sm text-gray-500">{item.motorista.id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.statusAluguel === 'Ativo'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.statusAluguel}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{item.quantidadePagamentos}</span>
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(item.totalPagamentos)}
                            </TableCell>
                            <TableCell className="text-blue-600 font-medium">
                              {formatCurrency(item.valorMensalAluguel)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-medium ${
                                item.quantidadeInfracoes > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {item.quantidadeInfracoes}
                              </span>
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {item.totalInfracoes > 0 ? formatCurrency(item.totalInfracoes) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Mostrar</span>
                      <Select
                        value={itemsPerPageMotoristas.toString()}
                        onValueChange={(value) => {
                          setItemsPerPageMotoristas(Number(value));
                          setCurrentPageMotoristas(1);
                        }}
                      >
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-700">
                        de {analiseMotoristasOrdenada.length} motoristas
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageMotoristas(Math.max(1, currentPageMotoristas - 1))}
                        disabled={currentPageMotoristas === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPageMotoristas} de {totalPagesMotoristas}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageMotoristas(Math.min(totalPagesMotoristas, currentPageMotoristas + 1))}
                        disabled={currentPageMotoristas === totalPagesMotoristas}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Histórico de Despesas dos Veículos</CardTitle>
                  <CardDescription>
                    <strong>Dupla Datação:</strong> "Data da Despesa" é quando aconteceu, "Cadastrado em" é quando foi registrado no sistema
                  </CardDescription>
                </div>
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
              {isDataReady ? (
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-blue-600">Data da Despesa</TableHead>
                          <TableHead className="text-gray-500 text-xs">Cadastrado em</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicoPaginado.map((item) => (
                          <TableRow key={`${item.tipo}-${item.id}`}>
                            <TableCell>
                              {item.veiculo ? (
                                <div>
                                  <p className="font-medium">{item.veiculo.placa}</p>
                                  <p className="text-sm text-gray-500">
                                    {item.veiculo.marca} {item.veiculo.modelo}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {item.categoria}
                              </span>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-xs truncate">{item.descricao}</p>
                            </TableCell>
                            <TableCell className="text-blue-600 font-medium">
                              {formatDateSafe(item.dataDespesa)}
                            </TableCell>
                            <TableCell className="text-gray-500 text-xs">
                              {formatDateSafe(item.dataCadastro)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(item.valor)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.tipo === 'manual' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.tipo === 'manutencao'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.tipo === 'manual' ? 'Manual' : 
                                 item.tipo === 'manutencao' ? 'Manutenção' : 'Outros'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {item.tipo === 'manual' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditarDespesa(item.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setConfirmDelete({ open: true, id: item.id })}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Mostrar</span>
                      <Select
                        value={itemsPerPageHistorico.toString()}
                        onValueChange={(value) => {
                          setItemsPerPageHistorico(Number(value));
                          setCurrentPageHistorico(1);
                        }}
                      >
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-700">
                        de {historicoOrdenado.length} itens
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageHistorico(Math.max(1, currentPageHistorico - 1))}
                        disabled={currentPageHistorico === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPageHistorico} de {totalPagesHistorico}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageHistorico(Math.min(totalPagesHistorico, currentPageHistorico + 1))}
                        disabled={currentPageHistorico === totalPagesHistorico}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nova Despesa */}
      <NovaDespesaModal
        isOpen={modalNovaDespesa.aberto}
        onClose={() => setModalNovaDespesa({ aberto: false, veiculosSelecionados: [] })}
        veiculosSelecionados={modalNovaDespesa.veiculosSelecionados}
      />

      {/* Modal Detalhes Veículo */}
      {modalDetalhes.veiculo && (
        <DetalhesVeiculoModal
          veiculo={modalDetalhes.veiculo}
          analiseFinanceira={{
            receitaMensal: 0,
            despesasMensais: 0,
            lucro: 0,
            margem: 0,
            status: 'Parado'
          }}
          despesasDetalhadas={[]}
          evolucaoMensal={[]}
          isOpen={modalDetalhes.aberto}
          onClose={() => setModalDetalhes({ aberto: false, veiculo: null })}
        />
      )}

      {/* Diálogo de confirmação */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, id: open ? confirmDelete.id : null })}
        onConfirm={confirmarExclusao}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={!!despesaExcluindo}
      />
    </div>
  );
}