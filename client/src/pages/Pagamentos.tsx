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
        p.motoristaNome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
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
          return new Date(b.data || '').getTime() - new Date(a.data || '').getTime();
        case 'mais-antigos':
          return new Date(a.data || '').getTime() - new Date(b.data || '').getTime();
        case 'nome-az':
          return a.motoristaNome.localeCompare(b.motoristaNome);
        case 'nome-za':
          return b.motoristaNome.localeCompare(a.motoristaNome);
        case 'valor-maior':
          return parseFloat(b.valor) - parseFloat(a.valor);
        case 'valor-menor':
          return parseFloat(a.valor) - parseFloat(b.valor);
        case 'status-pago':
          return a.status === 'pago' ? -1 : b.status === 'pago' ? 1 : 0;
        case 'status-pendente':
          return a.status === 'pendente' ? -1 : b.status === 'pendente' ? 1 : 0;
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

  // Estatísticas (baseado nos dados filtrados)
  const totalPendente = pagamentosFiltrados
    .filter(p => p.status === 'pendente' || p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorRestante), 0);

  const totalRecebido = pagamentosFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + parseFloat(p.valorPago), 0);

  const totalParcial = pagamentosFiltrados
    .filter(p => p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorPago), 0);

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
                  {pagamentosFiltrados.filter(p => p.status === 'pendente' || p.status === 'parcial').length} pagamentos
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
                <p className="text-lg font-bold text-blue-800">
                  {formatCurrency(pagamentosFiltrados.reduce((sum, p) => sum + parseFloat(p.valorTotal), 0))}
                </p>
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
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
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
                <SelectItem value="danos">Danos</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowNovoPagamento(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Todos os Pagamentos</CardTitle>
            <CardDescription>
              {pagamentosFiltrados.length === 0 
                ? 'Nenhum pagamento encontrado' 
                : `${pagamentosFiltrados.length} pagamento${pagamentosFiltrados.length > 1 ? 's' : ''} encontrado${pagamentosFiltrados.length > 1 ? 's' : ''}`
              }
            </CardDescription>
          </div>
          
          {/* Ordenação */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
              <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
              <SelectItem value="nome-az">Nome (A-Z)</SelectItem>
              <SelectItem value="nome-za">Nome (Z-A)</SelectItem>
              <SelectItem value="valor-maior">Valor (Maior)</SelectItem>
              <SelectItem value="valor-menor">Valor (Menor)</SelectItem>
              <SelectItem value="status-pago">Status (Pago)</SelectItem>
              <SelectItem value="status-pendente">Status (Pendente)</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {pagamentosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {pagamentos.length === 0 
                  ? 'Nenhum pagamento cadastrado ainda.' 
                  : 'Nenhum pagamento encontrado com os filtros aplicados.'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {pagamentos.length === 0 
                  ? 'Clique em "Novo Pagamento" para começar.' 
                  : 'Tente ajustar os filtros para encontrar pagamentos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPagamentos.map((pagamento) => (
                <div key={pagamento.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{pagamento.motoristaNome}</span>
                        {getTipoBadge(pagamento.tipo)}
                        {getStatusBadge(pagamento.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor Total:</span>
                          <p className="font-medium">{formatCurrency(pagamento.valorTotal)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor Pago:</span>
                          <p className="font-medium text-green-600">{formatCurrency(pagamento.valorPago)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Restante:</span>
                          <p className="font-medium text-red-600">{formatCurrency(pagamento.valorRestante)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Data:</span>
                          <p className="font-medium">{formatDate(pagamento.dataPagamento)}</p>
                        </div>
                      </div>
                      
                      {pagamento.descricao && (
                        <p className="text-sm text-gray-600 mt-2">{pagamento.descricao}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDetalhes(pagamento)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditar(pagamento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExcluir(pagamento)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagamentosFiltrados.length > 0 && (
        <div className="border-t pt-4 mt-4">
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
      <NovoPagamentoModal
        open={showNovoPagamento}
        onClose={() => setShowNovoPagamento(false)}
        onSubmit={createPagamento}
        motoristas={motoristas}
      />

      {pagamentoSelecionado && (
        <>
          <DetalhesPagamentoModal
            open={showDetalhes}
            onClose={() => setShowDetalhes(false)}
            pagamento={pagamentoSelecionado}
          />

          <EditarPagamentoModal
            open={showEditar}
            onClose={() => setShowEditar(false)}
            pagamento={pagamentoSelecionado}
            onSubmit={(updates) => updatePagamento({ id: pagamentoSelecionado.id, updates })}
            motoristas={motoristas}
          />

          <ExcluirPagamentoModal
            open={showExcluir}
            onClose={() => setShowExcluir(false)}
            pagamento={pagamentoSelecionado}
            onConfirm={() => deletePagamento(pagamentoSelecionado.id)}
          />
        </>
      )}
    </div>
  );
}