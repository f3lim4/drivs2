import { useState, useMemo } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign, User, AlertCircle, Search, Filter, CheckCircle, Clock, Calculator, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useAuth } from '@/hooks/useAuth';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NovoPagamentoModal } from '@/components/pagamentos/NovoPagamentoModal';
import { EditarPagamentoModal } from '@/components/pagamentos/EditarPagamentoModal';
import { DetalhesPagamentoModal } from '@/components/pagamentos/DetalhesPagamentoModal';
import { ExcluirPagamentoModal } from '@/components/pagamentos/ExcluirPagamentoModal';
import { formatDate } from '@/lib/utils';
import type { Pagamento } from '@shared/schema';

export default function Pagamentos() {
  const { profile } = useAuth();
  const { pagamentos, isLoading, createPagamento, updatePagamento, deletePagamento } = usePagamentos();
  const { motoristas } = useMotoristas();
  
  const [showNovoPagamento, setShowNovoPagamento] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showExcluir, setShowExcluir] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null);
  
  // Estados para filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleVerDetalhes = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowDetalhes(true);
  };

  const handleEditar = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowEditar(true);
  };

  const handleExcluir = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowExcluir(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'parcial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'em_aberto':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Em Aberto</Badge>;
      case 'atrasado':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'aluguel':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Aluguel</Badge>;
      case 'infrações':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Infrações</Badge>;
      case 'manutenção':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Manutenção</Badge>;
      case 'danos':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Danos</Badge>;
      case 'outros':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Outros</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };



  // Filtrar e ordenar pagamentos
  const pagamentosFiltrados = useMemo(() => {
    let filtered = pagamentos;

    // Filtro por texto (nome do motorista, descrição, observações)
    if (filtroTexto) {
      filtered = filtered.filter(p => 
        p.motoristaNome?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.observacoes?.toLowerCase().includes(filtroTexto.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(p => p.status === filtroStatus);
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtered = filtered.filter(p => p.tipo === filtroTipo);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'mais-novos':
          return new Date(b.dataPagamento || '').getTime() - new Date(a.dataPagamento || '').getTime();
        case 'mais-antigos':
          return new Date(a.dataPagamento || '').getTime() - new Date(b.dataPagamento || '').getTime();
        case 'nome-az':
          return (a.motoristaNome || '').localeCompare(b.motoristaNome || '');
        case 'nome-za':
          return (b.motoristaNome || '').localeCompare(a.motoristaNome || '');
        case 'valor-maior':
          return parseFloat(b.valorTotal || '0') - parseFloat(a.valorTotal || '0');
        case 'valor-menor':
          return parseFloat(a.valorTotal || '0') - parseFloat(b.valorTotal || '0');
        case 'status-pago':
          return a.status === 'pago' ? -1 : b.status === 'pago' ? 1 : 0;
        case 'status-em_aberto':
          return a.status === 'em_aberto' ? -1 : b.status === 'em_aberto' ? 1 : 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [pagamentos, filtroTexto, filtroStatus, filtroTipo, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(pagamentosFiltrados.length / itemsPerPage);
  const paginatedPagamentos = pagamentosFiltrados.slice(
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



  // Estatísticas (baseado nos dados filtrados) - usando 'em_aberto' em vez de 'pendente'
  const totalPendente = pagamentosFiltrados
    .filter(p => p.status === 'em_aberto' || p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorRestante || '0'), 0);

  const totalRecebido = pagamentosFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);

  const totalParcial = pagamentosFiltrados
    .filter(p => p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);

  const totalGeral = pagamentosFiltrados
    .reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas com visual futurista - igual página veículos */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">Total Geral</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(totalGeral)}</p>
                <p className="text-xs text-blue-600">{pagamentosFiltrados.length} pagamentos</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">Total Recebido</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(totalRecebido)}</p>
                <p className="text-xs text-green-600">{pagamentosFiltrados.filter(p => p.status === 'pago').length} pagamentos</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">Total em Aberto</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(totalPendente)}</p>
                <p className="text-xs text-red-600">{pagamentosFiltrados.filter(p => p.status === 'em_aberto').length} pagamentos</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-orange-700">Total Parciais</p>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(totalParcial)}</p>
                <p className="text-xs text-orange-600">{pagamentosFiltrados.filter(p => p.status === 'parcial').length} pagamentos</p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de busca e filtros - igual página veículos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar pagamento..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="infrações">Infrações</SelectItem>
                  <SelectItem value="manutenção">Manutenção</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>



              <Button onClick={() => setShowNovoPagamento(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pagamentos - igual página veículos */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Lista de Pagamentos</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
                  <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
                  <SelectItem value="nome-az">Motorista (A-Z)</SelectItem>
                  <SelectItem value="nome-za">Motorista (Z-A)</SelectItem>
                  <SelectItem value="valor-maior">Maior Valor</SelectItem>
                  <SelectItem value="valor-menor">Menor Valor</SelectItem>
                  <SelectItem value="status-pago">Pagos Primeiro</SelectItem>
                  <SelectItem value="status-em_aberto">Em Aberto Primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead width="120">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPagamentos.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pagamento.motoristaNome || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{pagamento.motoristaId || 'CPF não informado'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pagamento.veiculoPlaca ? (
                      <div>
                        <div className="font-medium text-sm">{pagamento.veiculoPlaca}</div>
                        <div className="text-xs text-muted-foreground">
                          {pagamento.veiculoMarca} {pagamento.veiculoModelo}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pagamento.status)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="truncate">{pagamento.descricao || 'Sem descrição'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTipoBadge(pagamento.tipo)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{formatCurrency(pagamento.valorTotal)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(pagamento.dataPagamento)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerDetalhes(pagamento)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditar(pagamento)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluir(pagamento)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagamentosFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagamentosFiltrados.length > 0 && (
        <div className="border-t pt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={pagamentosFiltrados.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modais */}
      {showNovoPagamento && (
        <NovoPagamentoModal
          open={showNovoPagamento}
          onClose={() => setShowNovoPagamento(false)}
          onSubmit={createPagamento}
          motoristas={motoristas || []}
        />
      )}

      {showDetalhes && pagamentoSelecionado && (
        <DetalhesPagamentoModal
          open={showDetalhes}
          onClose={() => setShowDetalhes(false)}
          pagamento={pagamentoSelecionado}
        />
      )}

      {showEditar && pagamentoSelecionado && (
        <EditarPagamentoModal
          open={showEditar}
          onClose={() => setShowEditar(false)}
          pagamento={pagamentoSelecionado}
          onSubmit={(updates) => updatePagamento({ id: pagamentoSelecionado.id, updates })}
          motoristas={motoristas || []}
        />
      )}

      {showExcluir && pagamentoSelecionado && (
        <ExcluirPagamentoModal
          open={showExcluir}
          onClose={() => setShowExcluir(false)}
          pagamento={pagamentoSelecionado}
          onConfirm={() => {
            console.log('🗑️ Tentando excluir pagamento:', pagamentoSelecionado.id);
            deletePagamento(pagamentoSelecionado.id);
            setShowExcluir(false);
          }}
        />
      )}
    </div>
  );
}