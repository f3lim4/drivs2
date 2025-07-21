import { useState, useMemo } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign, User, AlertCircle, Search, Filter, CheckCircle, Clock, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useAuth } from '@/hooks/useAuth';
import { Pagination } from '@/components/ui/pagination';
import { NovoPagamentoModal } from '@/components/pagamentos/NovoPagamentoModal';
import { EditarPagamentoModal } from '@/components/pagamentos/EditarPagamentoModal';
import { DetalhesPagamentoModal } from '@/components/pagamentos/DetalhesPagamentoModal';
import { ExcluirPagamentoModal } from '@/components/pagamentos/ExcluirPagamentoModal';
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
      case 'pendente':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Pendente</Badge>;
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
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
        case 'status-pendente':
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

  // Debug: Log dos pagamentos para verificar estrutura
  console.log('[PAGAMENTOS DEBUG] Total de pagamentos:', pagamentosFiltrados.length);
  console.log('[PAGAMENTOS DEBUG] Primeiro pagamento:', pagamentosFiltrados[0]);

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

  console.log('[PAGAMENTOS DEBUG] Totais calculados:', {
    totalPendente,
    totalRecebido,
    totalParcial,
    totalGeral,
    statusEmAberto: pagamentosFiltrados.filter(p => p.status === 'em_aberto').length,
    statusPago: pagamentosFiltrados.filter(p => p.status === 'pago').length
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white space-y-6">
      {/* Estatísticas com visual futurista */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">Total Pendente</p>
                <p className="text-lg font-bold text-red-800">{formatCurrency(totalPendente)}</p>
                <p className="text-xs text-red-600">
                  {pagamentosFiltrados.filter(p => p.status === 'em_aberto' || p.status === 'parcial').length} pagamentos
                </p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">Total Recebido</p>
                <p className="text-lg font-bold text-green-800">{formatCurrency(totalRecebido)}</p>
                <p className="text-xs text-green-600">
                  {pagamentosFiltrados.filter(p => p.status === 'pago').length} pagamentos
                </p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-yellow-700">Parciais</p>
                <p className="text-lg font-bold text-yellow-800">{formatCurrency(totalParcial)}</p>
                <p className="text-xs text-yellow-600">
                  {pagamentosFiltrados.filter(p => p.status === 'parcial').length} pagamentos
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">Total Geral</p>
                <p className="text-lg font-bold text-blue-800">{formatCurrency(totalGeral)}</p>
                <p className="text-xs text-blue-600">
                  {pagamentosFiltrados.length} pagamentos
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros acima da tabela */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por motorista, descrição..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
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
              <SelectTrigger>
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
              Novo Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pagamentos */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Todos os Pagamentos</h2>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-56">
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
            <SelectItem value="status-pendente">Pendentes Primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo da tabela */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {paginatedPagamentos.map((pagamento) => (
              <div
                key={pagamento.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {pagamento.motoristaNome || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pagamento.descricao || 'Sem descrição'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(pagamento.status)}
                      {getTipoBadge(pagamento.tipo)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatCurrency(pagamento.valorTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vencimento: {formatDate(pagamento.dataPagamento)}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerDetalhes(pagamento)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditar(pagamento)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExcluir(pagamento)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagamentosFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pagamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={pagamentosFiltrados.length}
      />

      {/* Modais */}
      {showNovoPagamento && (
        <NovoPagamentoModal
          open={showNovoPagamento}
          onClose={() => setShowNovoPagamento(false)}
          onSubmit={createPagamento}
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
          onSubmit={(data) => updatePagamento({ id: pagamentoSelecionado.id, ...data })}
        />
      )}

      {showExcluir && pagamentoSelecionado && (
        <ExcluirPagamentoModal
          open={showExcluir}
          onClose={() => setShowExcluir(false)}
          pagamento={pagamentoSelecionado}
          onConfirm={() => deletePagamento(pagamentoSelecionado.id)}
        />
      )}
    </div>
  );
}