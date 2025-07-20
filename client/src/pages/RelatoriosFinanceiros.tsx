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
  const isDataReady = despesas && veiculos && alugueis && pagamentos;
  
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
    if (!confirmDelete.id) return;
    
    try {
      await handleDelete(confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
    } catch (error) {
      console.error('Erro ao confirmar exclusão:', error);
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
          <Card>
            <CardHeader>
              <CardTitle>Despesas Fixas dos Veículos</CardTitle>
              <CardDescription>
                Despesas fixas mensais automáticas baseadas no cadastro dos veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise-veiculo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Veículo</CardTitle>
              <CardDescription>
                Análise detalhada de receitas e despesas por veículo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise-motorista" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Motorista</CardTitle>
              <CardDescription>
                Análise de pagamentos e comportamento dos motoristas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
              </div>
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
              <div className="text-center py-8">
                <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
              </div>
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
      <DetalhesVeiculoModal
        veiculo={modalDetalhes.veiculo}
        isOpen={modalDetalhes.aberto}
        onClose={() => setModalDetalhes({ aberto: false, veiculo: null })}
      />

      {/* Diálogo de confirmação */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={confirmarExclusao}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}