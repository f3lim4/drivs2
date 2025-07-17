import { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, DollarSign, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useAuth } from '@/hooks/useAuth';
import { useLocadoras } from '@/hooks/useLocadoras';
import type { Infracao } from '@shared/schema';
import { NovaInfracaoModal } from '@/components/infracoes/NovaInfracaoModal';
import { EditarInfracaoModal } from '@/components/infracoes/EditarInfracaoModal';

export default function Infracoes() {
  const { infracoes, isLoading, isDeleting, deleteInfracao } = useInfracoes();
  const { profile } = useAuth();
  const { locadoras } = useLocadoras();
  const isAdmin = profile?.tipo === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [showNovaInfracao, setShowNovaInfracao] = useState(false);
  const [editingInfracao, setEditingInfracao] = useState<Infracao | null>(null);

  // Função para obter o nome da locadora pelo ID
  const getLocadoraName = (locadoraId: string) => {
    const locadora = locadoras.find(loc => loc.id === locadoraId);
    return locadora?.nome || 'Locadora';
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };



  // Filtros
  const filteredInfracoes = infracoes.filter(infracao => {
    const matchesSearch = searchTerm === '' || 
      infracao.numeroAuto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      infracao.motoristaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      infracao.veiculoPlaca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      infracao.descricaoInfracao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || infracao.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || infracao.tipoInfracao === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Estatísticas
  const totalInfracoes = infracoes.length;
  const infracoesAtivas = infracoes.filter(i => i.status === 'pendente').length;
  const valorTotal = infracoes.reduce((sum, i) => sum + parseFloat(i.valorFinal), 0);
  const valorPendente = infracoes.filter(i => i.status === 'pendente').reduce((sum, i) => sum + parseFloat(i.valorFinal), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'pago':
        return <Badge variant="secondary">Pago</Badge>;
      case 'contestado':
        return <Badge variant="outline">Contestado</Badge>;
      case 'cancelado':
        return <Badge>Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'leve':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Leve</Badge>;
      case 'media':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Média</Badge>;
      case 'grave':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Grave</Badge>;
      case 'gravissima':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Gravíssima</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const handleDeleteInfracao = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta infração?')) {
      deleteInfracao(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando infrações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border-l-4 border-blue-500 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrações de Trânsito</h1>
          <p className="text-gray-600 mt-1">Gerencie e controle as infrações de trânsito</p>
        </div>
        <Button onClick={() => setShowNovaInfracao(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Infração
        </Button>
      </div>

      {/* Estatísticas com visual futurista */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">Total de Infrações</p>
                <p className="text-2xl font-bold text-blue-800">{totalInfracoes}</p>
                <p className="text-xs text-blue-600">Todas as infrações</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700">Infrações Ativas</p>
                <p className="text-2xl font-bold text-red-800">{infracoesAtivas}</p>
                <p className="text-xs text-red-600">Aguardando pagamento</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">Valor Total</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(valorTotal)}</p>
                <p className="text-xs text-green-600">Valor total das infrações</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700">Valor Pendente</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(valorPendente)}</p>
                <p className="text-xs text-orange-600">Aguardando pagamento</p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(valorPendente)}</div>
            <p className="text-xs text-muted-foreground">Valor a pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número do auto, motorista, placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="contestado">Contestado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
                <SelectItem value="gravissima">Gravíssima</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Infrações ({filteredInfracoes.length})</CardTitle>
          <CardDescription>Lista de todas as infrações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Auto</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  {isAdmin && <TableHead>Locadora</TableHead>}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInfracoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">Nenhuma infração encontrada</p>
                        <p className="text-gray-500 mt-2">
                          {searchTerm || statusFilter !== 'all' || tipoFilter !== 'all' 
                            ? 'Tente ajustar os filtros para encontrar infrações'
                            : 'Comece cadastrando uma nova infração'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInfracoes.map((infracao) => (
                    <TableRow key={infracao.id}>
                      <TableCell className="font-medium">{infracao.numeroAuto}</TableCell>
                      <TableCell>{infracao.motoristaNome}</TableCell>
                      <TableCell>{infracao.veiculoPlaca}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {getLocadoraName(infracao.locadoraId).charAt(0)}
                            </div>
                            <span className="text-sm">{getLocadoraName(infracao.locadoraId)}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{getTipoBadge(infracao.tipoInfracao)}</TableCell>
                      <TableCell className="max-w-48 truncate">{infracao.descricaoInfracao}</TableCell>
                      <TableCell>{formatDate(infracao.dataInfracao)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(parseFloat(infracao.valorFinal))}</TableCell>
                      <TableCell>{getStatusBadge(infracao.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingInfracao(infracao)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteInfracao(infracao.id)}
                            disabled={isDeleting}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      {showNovaInfracao && (
        <NovaInfracaoModal
          open={showNovaInfracao}
          onClose={() => setShowNovaInfracao(false)}
        />
      )}

      {editingInfracao && (
        <EditarInfracaoModal
          open={!!editingInfracao}
          onClose={() => setEditingInfracao(null)}
          infracao={editingInfracao}
        />
      )}
    </div>
  );
}