/**
 * Página de gestão de aluguéis do sistema DRIVS
 * Permite visualizar e gerenciar contratos de locação ativos
 */

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Pagination } from '@/components/ui/pagination';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { Aluguel } from '@/types';
import { FileCheck, Clock, DollarSign, AlertCircle, Edit, Trash2, Eye, TrendingUp as Trending } from 'lucide-react';
import { NovoAluguelModal } from '@/components/alugueis/NovoAluguelModal';
import { EditarAluguelModal } from '@/components/alugueis/EditarAluguelModal';
import { ExcluirAluguelDialog } from '@/components/alugueis/ExcluirAluguelDialog';
import { formatCurrency } from '@/lib/utils';
import { registrarAtividade } from '@/utils/activityLogger';

export default function Alugueis() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [showNovoAluguelModal, setShowNovoAluguelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAluguel, setSelectedAluguel] = useState<any>(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Buscar locadoras para exibir nome na coluna (para admin) ou exibir nome da locadora atual (para locadora)
  const { data: locadoras = [], isLoading: locadorasLoading } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin || isLocadora,
  });

  // Carregamento de aluguéis usando React Query
  const { data: alugueis = [], isLoading: loading } = useQuery({
    queryKey: ['/api/alugueis', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  // Buscar pagamentos para cálculo da receita real
  const { data: pagamentos = [] } = useQuery({
    queryKey: ['/api/pagamentos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  // Buscar veículos para ter acesso ao valor semanal
  const { data: veiculos = [] } = useQuery({
    queryKey: ['/api/veiculos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });



  // Função para encontrar o nome da locadora
  const getLocadoraName = (locadoraId: string) => {
    if (!locadoraId) return 'Locadora';
    if (locadorasLoading) return 'Carregando...';
    if (!Array.isArray(locadoras) || locadoras.length === 0) return 'Sem dados';
    
    const locadora = locadoras.find((loc: any) => loc.id === locadoraId);
    return locadora ? locadora.nome : `ID: ${locadoraId}`;
  };

  // Para usuários locadora, buscar o nome da locadora diretamente usando o locadoraId do perfil
  const nomeLocadoraAtual = isLocadora && profile?.locadoraId ? getLocadoraName(profile.locadoraId) : null;

  // Limpar cache de queries antigas quando o profile muda
  useEffect(() => {
    if (profile?.locadoraId) {
      // Invalidar TODAS as queries antigas que podem ter dados de outras locadoras
      queryClient.clear();
    }
  }, [profile?.locadoraId, queryClient]);



  // Formatação dos aluguéis para exibição
  const alugueisFormatados = useMemo(() => {
    if (!Array.isArray(alugueis)) return [];
    return alugueis.map((aluguel: any) => {
      // Buscar dados do veículo para ter acesso ao valor semanal
      const veiculo = Array.isArray(veiculos) ? veiculos.find((v: any) => v.id === aluguel.veiculoId) : null;
      const valorSemanal = veiculo?.valorSemanal ? parseFloat(veiculo.valorSemanal) : 0;
      
      return {
        id: aluguel.id,
        motoristaId: aluguel.motoristaId,
        motoristaNome: aluguel.motoristaNome || 'Nome não encontrado',
        motoristaContato: aluguel.motoristaContato || 'Contato não encontrado',
        veiculoId: aluguel.veiculoId,
        veiculoModelo: aluguel.veiculoModelo || 'Modelo não encontrado',
        veiculoPlaca: aluguel.veiculoPlaca || 'Placa não encontrada',
        locadoraId: aluguel.locadoraId,
        periodo: {
          inicio: new Date(aluguel.dataInicio).toLocaleDateString('pt-BR'),
          fim: new Date(aluguel.dataFim).toLocaleDateString('pt-BR'),
          dias: aluguel.tempoContrato,
        },
        valores: {
          mensal: parseFloat(aluguel.valorMensal),
          semanal: valorSemanal,
          diario: parseFloat(aluguel.valorMensal) / 30,
          total: parseFloat(aluguel.valorTotal),
          caucao: parseFloat(aluguel.caucao),
          taxaAdmin: parseFloat(aluguel.taxaAdministrativa || '0'),
        },
        status: aluguel.status,
      };
    });
  }, [alugueis, veiculos]);

  // Filtra e ordena aluguéis baseado na busca, filtros e ordenação
  const filteredAlugueis = useMemo(() => {
    return alugueisFormatados
      .filter(aluguel => {
        const matchesSearch = aluguel.motoristaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             aluguel.veiculoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             aluguel.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'todos' || aluguel.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'mais-novos':
            return new Date(b.periodo.inicio).getTime() - new Date(a.periodo.inicio).getTime();
          case 'mais-antigos':
            return new Date(a.periodo.inicio).getTime() - new Date(b.periodo.inicio).getTime();
          case 'motorista-az':
            return a.motoristaNome.localeCompare(b.motoristaNome);
          case 'motorista-za':
            return b.motoristaNome.localeCompare(a.motoristaNome);
          case 'veiculo-az':
            return a.veiculoModelo.localeCompare(b.veiculoModelo);
          case 'veiculo-za':
            return b.veiculoModelo.localeCompare(a.veiculoModelo);
          case 'valor-maior':
            return b.valores.mensal - a.valores.mensal;
          case 'valor-menor':
            return a.valores.mensal - b.valores.mensal;
          default:
            return 0;
        }
      });
  }, [alugueisFormatados, searchTerm, statusFilter, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAlugueis.length / itemsPerPage);
  const paginatedAlugueis = filteredAlugueis.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  // Funções para controlar a paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset page when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder]);

  // Função para invalidar cache após mudanças
  const handleAluguelAdicionado = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/alugueis'] });
  };

  // Função para editar aluguel
  const handleEditarAluguel = (aluguel: any) => {
    setSelectedAluguel(aluguel);
    setShowEditModal(true);
  };

  const handleAluguelEditado = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/alugueis'] });
  };

  // Função para excluir aluguel
  const handleExcluirAluguel = (aluguel: any) => {
    setSelectedAluguel(aluguel);
    setShowDeleteDialog(true);
  };

  const handleConfirmarExclusao = async (aluguel: any) => {
    try {
      const response = await fetch(`/api/alugueis/${aluguel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Log da atividade
        await registrarAtividade(
          profile?.locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'excluir',
          'aluguel',
          aluguel.id,
          `Aluguel excluído: ${aluguel.motoristaNome} - ${aluguel.veiculoModelo} (${aluguel.veiculoPlaca})`
        );

        // Invalidar cache para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['/api/alugueis'] });
        queryClient.invalidateQueries({ queryKey: ['/api/veiculos'] });
        
        toast({
          title: "Aluguel excluído",
          description: "O aluguel foi removido e o veículo está disponível novamente.",
        });
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o aluguel. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir aluguel:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Calcula estatísticas
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    // Calcular receita esperada (soma dos valores mensais dos aluguéis ativos)
    const receitaEsperada = alugueisFormatados
      .filter(a => a.status === 'ativo')
      .reduce((sum, a) => sum + a.valores.mensal, 0);
    
    // Calcular receita real baseada nos pagamentos do mês
    const receitaReal = pagamentos
      .filter(p => {
        if (!p.data) return false;
        
        const dataPagamento = new Date(p.data);
        if (isNaN(dataPagamento.getTime())) return false;
        
        const dentroDoMes = isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
        
        console.log('Pagamento filtro:', {
          id: p.id,
          valor: p.valor,
          status: p.status,
          data: p.data,
          dataPagamento: dataPagamento.toISOString(),
          monthStart: monthStart.toISOString(),
          monthEnd: monthEnd.toISOString(),
          dentroDoMes,
          statusPago: p.status === 'pago'
        });
        
        return p.status === 'pago' && dentroDoMes;
      })
      .reduce((total, pagamento) => {
        const valor = parseFloat(pagamento.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    return {
      total: alugueisFormatados.length,
      ativos: alugueisFormatados.filter(a => a.status === 'ativo').length,
      pendentes: alugueisFormatados.filter(a => a.status === 'pendente').length,
      receitaEsperada,
      receitaReal,
    };
  }, [alugueisFormatados, pagamentos]);

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
      case 'pendente':
        return <Badge variant="default" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'finalizado':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Formata valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas com visual futurista */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">Total de Aluguéis</p>
                <p className="text-xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Contratos</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">Ativos</p>
                <p className="text-xl font-bold text-green-800">{stats.ativos}</p>
                <p className="text-xs text-green-600">Em andamento</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-yellow-700">Pendentes</p>
                <p className="text-xl font-bold text-yellow-800">{stats.pendentes}</p>
                <p className="text-xs text-yellow-600">Aguardando</p>
              </div>
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-emerald-700">Receita Mensal</p>
                <p className="text-xl font-bold text-emerald-800">{formatCurrency(stats.receitaEsperada)}</p>
                <p className="text-xs text-emerald-600">
                  Recebido: {formatCurrency(stats.receitaReal)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Controles de busca e filtros */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar aluguel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {isLocadora && (
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowNovoAluguelModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Aluguel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de aluguéis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Contratos de Locação</CardTitle>
          
          {/* Ordenação posicionada no lado oposto */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
              <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
              <SelectItem value="motorista-az">Motorista (A-Z)</SelectItem>
              <SelectItem value="motorista-za">Motorista (Z-A)</SelectItem>
              <SelectItem value="veiculo-az">Veículo (A-Z)</SelectItem>
              <SelectItem value="veiculo-za">Veículo (Z-A)</SelectItem>
              <SelectItem value="valor-maior">Maior valor</SelectItem>
              <SelectItem value="valor-menor">Menor valor</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAlugueis.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MOTORISTA</TableHead>
                  {isAdmin && <TableHead>LOCADORA</TableHead>}
                  <TableHead>VEÍCULO</TableHead>
                  <TableHead>PERÍODO</TableHead>
                  <TableHead>VALOR</TableHead>
                  <TableHead>CAUÇÃO</TableHead>
                  <TableHead>LIMITE KM</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlugueis.map((aluguel) => (
                  <TableRow key={aluguel.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{aluguel.motoristaNome}</p>
                        <p className="text-sm text-muted-foreground">{aluguel.motoristaContato}</p>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <span className="text-purple-600 text-xs font-medium">
                              {(getLocadoraName(aluguel.locadoraId) || 'L').substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{getLocadoraName(aluguel.locadoraId)}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">{aluguel.veiculoModelo}</p>
                        <p className="text-sm text-muted-foreground">{aluguel.veiculoPlaca}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{aluguel.periodo.inicio} a {aluguel.periodo.fim}</p>
                        <p className="text-sm text-muted-foreground">
                          {aluguel.periodo.dias} mês(es) - {aluguel.periodo.dias * 30} dia(s)
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(aluguel.valores.mensal)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(aluguel.valores.semanal)}/semana
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(aluguel.valores.caucao)}</p>
                        <p className="text-sm text-muted-foreground">Caução</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{aluguel.limiteKm || 'Ilimitado'}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(aluguel.status)}
                    </TableCell>
                    {isLocadora && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleEditarAluguel(aluguel)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleExcluirAluguel(aluguel)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum aluguel encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou criar um novo contrato de locação
              </p>
            </div>
          )}
        </CardContent>
        
        {/* Paginação */}
        {filteredAlugueis.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAlugueis.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </Card>

      {/* Modais - apenas para locadoras */}
      {isLocadora && (
        <>
          {/* Modal Novo Aluguel */}
          <NovoAluguelModal
            open={showNovoAluguelModal}
            onOpenChange={setShowNovoAluguelModal}
            onAluguelAdicionado={handleAluguelAdicionado}
          />

          {/* Modal Editar Aluguel */}
          <EditarAluguelModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            aluguel={selectedAluguel}
            onAluguelEditado={handleAluguelEditado}
          />

          {/* Dialog Excluir Aluguel */}
          <ExcluirAluguelDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            aluguel={selectedAluguel}
            onConfirmarExclusao={handleConfirmarExclusao}
          />
        </>
      )}
    </div>
  );
}