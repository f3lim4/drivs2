import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Wrench, Calendar, Clock, MapPin, Building2, Phone, Mail, Search, Filter, CheckCircle, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/StatCard';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useLocais } from '@/hooks/useLocais';
import { NovaManutencaoModal } from '@/components/manutencoes/NovaManutencaoModal';
import { EditarManutencaoModal } from '@/components/manutencoes/EditarManutencaoModal';
import { VisualizarManutencaoModal } from '@/components/manutencoes/VisualizarManutencaoModal';
import { NovoLocalModal } from '@/components/locais/NovoLocalModal';
import { formatDate } from '@/lib/utils';
import type { Manutencao, Local } from '@shared/schema';

export default function Manutencoes() {
  const { manutencoes, isLoading, deleteManutencao, isDeleting } = useManutencoes();
  const { locais, isLoading: isLoadingLocais, deleteLocal } = useLocais();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [novaManutencaoModalOpen, setNovaManutencaoModalOpen] = useState(false);
  const [novoLocalModalOpen, setNovoLocalModalOpen] = useState(false);
  const [gerenciarLocaisModalOpen, setGerenciarLocaisModalOpen] = useState(false);
  const [editarManutencaoModal, setEditarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });
  const [visualizarManutencaoModal, setVisualizarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });

  const handleDeleteManutencao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta manutenção?')) {
      deleteManutencao(id);
    }
  };

  const handleDeleteLocal = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este local?')) {
      deleteLocal(id);
    }
  };

  // Filtra manutenções baseado na busca e filtros
  const filteredManutencoes = manutencoes.filter(manutencao => {
    const matchesSearch = manutencao.veiculoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.oficina.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || manutencao.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calcula estatísticas
  const stats = {
    total: manutencoes.length,
    agendadas: manutencoes.filter(m => m.status === 'agendada').length,
    em_andamento: manutencoes.filter(m => m.status === 'em_andamento').length,
    concluidas: manutencoes.filter(m => m.status === 'concluida').length,
    valor_total: manutencoes.reduce((acc, m) => acc + (m.valorFinal || m.valorOrcamento || 0), 0),
    pagas: manutencoes.filter(m => m.statusPagamento === 'pago').length,
    em_aberto: manutencoes.filter(m => m.statusPagamento === 'em_aberto').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada':
        return <Badge className="bg-yellow-100 text-yellow-800">Agendada</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case 'concluida':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return <Badge variant="outline" className="text-green-600">Baixa</Badge>;
      case 'normal':
        return <Badge variant="outline" className="text-blue-600">Normal</Badge>;
      case 'alta':
        return <Badge variant="outline" className="text-yellow-600">Alta</Badge>;
      case 'urgente':
        return <Badge variant="outline" className="text-red-600">Urgente</Badge>;
      default:
        return <Badge variant="outline">{prioridade}</Badge>;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-6">
          {/* Cards de estatísticas com visual futurista */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-700">Total de Manutenções</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                    <p className="text-xs text-blue-600">Serviços</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-700">Agendadas</p>
                    <p className="text-2xl font-bold text-yellow-800">{stats.agendadas}</p>
                    <p className="text-xs text-yellow-600">Programadas</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-700">Em Andamento</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.em_andamento}</p>
                    <p className="text-xs text-orange-600">Executando</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-700">Concluídas</p>
                    <p className="text-2xl font-bold text-green-800">{stats.concluidas}</p>
                    <p className="text-xs text-green-600">Finalizadas</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles de busca e filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Busca */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar manutenção..."
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
                      <SelectItem value="agendada">Agendada</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline"
                    onClick={() => setGerenciarLocaisModalOpen(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Gerenciar Locais
                  </Button>
                  
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setNovaManutencaoModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Manutenção
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de manutenções */}
          <Card>
            <CardHeader>
              <CardTitle>Manutenções da Frota</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredManutencoes.length === 0 ? (
                <div className="p-8 text-center">
                  <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma manutenção encontrada</h3>
                  <p className="text-gray-500">Clique no botão "Nova Manutenção" para criar uma</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VEÍCULO</TableHead>
                      <TableHead>TIPO</TableHead>
                      <TableHead>OFICINA</TableHead>
                      <TableHead>DATA</TableHead>
                      <TableHead>VALOR</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>PAGAMENTO</TableHead>
                      <TableHead>AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManutencoes.map((manutencao) => (
                      <TableRow key={manutencao.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{manutencao.veiculoModelo}</p>
                              <p className="text-sm text-muted-foreground">
                                {manutencao.veiculoPlaca}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium capitalize">{manutencao.tipo}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {getPrioridadeBadge(manutencao.prioridade)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{manutencao.oficina}</p>
                            <p className="text-sm text-muted-foreground">
                              {manutencao.contato || 'Sem contato'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(manutencao.dataInicio)}</p>
                            <p className="text-sm text-muted-foreground">
                              Previsão: {formatDate(manutencao.dataPrevisao)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(manutencao.valorFinal || manutencao.valorOrcamento)}</p>
                            {manutencao.valorFinal && manutencao.valorOrcamento && (
                              <p className="text-sm text-muted-foreground">
                                Orçamento: {formatCurrency(manutencao.valorOrcamento)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(manutencao.status)}
                        </TableCell>
                        <TableCell>
                          <Badge className={manutencao.statusPagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {manutencao.statusPagamento === 'pago' ? 'Pago' : 'Em Aberto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setVisualizarManutencaoModal({ open: true, manutencao })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditarManutencaoModal({ open: true, manutencao })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteManutencao(manutencao.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Modais */}
      <NovaManutencaoModal
        open={novaManutencaoModalOpen}
        onClose={() => setNovaManutencaoModalOpen(false)}
      />

      <EditarManutencaoModal
        open={editarManutencaoModal.open}
        onClose={() => setEditarManutencaoModal({ open: false, manutencao: null })}
        manutencao={editarManutencaoModal.manutencao}
      />

      <VisualizarManutencaoModal
        open={visualizarManutencaoModal.open}
        onClose={() => setVisualizarManutencaoModal({ open: false, manutencao: null })}
        manutencao={visualizarManutencaoModal.manutencao}
      />

      <NovoLocalModal
        open={novoLocalModalOpen}
        onClose={() => setNovoLocalModalOpen(false)}
      />

      {/* Modal para gerenciar locais */}
      <Dialog open={gerenciarLocaisModalOpen} onOpenChange={setGerenciarLocaisModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Locais</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setNovoLocalModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Local
              </Button>
            </div>

            {isLoadingLocais ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : locais.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum local encontrado</h3>
                  <p className="text-gray-500">Clique no botão acima para cadastrar um novo local</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locais.map((local) => (
                  <Card key={local.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{local.nome}</CardTitle>
                          <p className="text-sm text-gray-500 capitalize">{local.tipo}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocal(local.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {local.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{local.telefone}</span>
                          </div>
                        )}
                        
                        {local.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{local.email}</span>
                          </div>
                        )}
                        
                        {local.endereco && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{local.endereco}</span>
                          </div>
                        )}
                        
                        {local.observacoes && (
                          <p className="text-sm text-gray-600 mt-2">{local.observacoes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}