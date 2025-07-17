import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Wrench, Calendar, Clock, MapPin, Building2, Phone, Mail, Search, Filter, CheckCircle, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [novaManutencaoModalOpen, setNovaManutencaoModalOpen] = useState(false);
  const [novoLocalModalOpen, setNovoLocalModalOpen] = useState(false);
  const [gerenciarLocaisModalOpen, setGerenciarLocaisModalOpen] = useState(false);
  const [editarManutencaoModal, setEditarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });
  const [visualizarManutencaoModal, setVisualizarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });
  const [confirmDeleteManutencao, setConfirmDeleteManutencao] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [confirmDeleteLocal, setConfirmDeleteLocal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const handleDeleteManutencao = async (id: string) => {
    setConfirmDeleteManutencao({ open: true, id });
  };

  const handleDeleteLocal = async (id: string) => {
    setConfirmDeleteLocal({ open: true, id });
  };

  const confirmDeleteManutencaoAction = async () => {
    if (confirmDeleteManutencao.id) {
      await deleteManutencao(confirmDeleteManutencao.id);
      setConfirmDeleteManutencao({ open: false, id: null });
    }
  };

  const confirmDeleteLocalAction = async () => {
    if (confirmDeleteLocal.id) {
      await deleteLocal(confirmDeleteLocal.id);
      setConfirmDeleteLocal({ open: false, id: null });
    }
  };

  // Filtra e ordena manutenções baseado na busca e filtros
  const filteredManutencoes = manutencoes
    .filter(manutencao => {
      const matchesSearch = manutencao.veiculoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manutencao.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manutencao.oficina.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || manutencao.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'mais-novos':
          return new Date(b.dataInicio || '').getTime() - new Date(a.dataInicio || '').getTime();
        case 'mais-antigos':
          return new Date(a.dataInicio || '').getTime() - new Date(b.dataInicio || '').getTime();
        case 'veiculo-az':
          return a.veiculoModelo.localeCompare(b.veiculoModelo);
        case 'veiculo-za':
          return b.veiculoModelo.localeCompare(a.veiculoModelo);
        case 'valor-maior':
          return (b.valorFinal || b.valorOrcamento || 0) - (a.valorFinal || a.valorOrcamento || 0);
        case 'valor-menor':
          return (a.valorFinal || a.valorOrcamento || 0) - (b.valorFinal || b.valorOrcamento || 0);
        case 'oficina-az':
          return a.oficina.localeCompare(b.oficina);
        case 'prioridade-urgente':
          const prioridadeOrder = { 'urgente': 4, 'alta': 3, 'normal': 2, 'baixa': 1 };
          return (prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] || 0) - (prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] || 0);
        default:
          return 0;
      }
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manutenções da Frota</CardTitle>
              
              {/* Ordenação */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
                  <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
                  <SelectItem value="veiculo-az">Veículo (A-Z)</SelectItem>
                  <SelectItem value="veiculo-za">Veículo (Z-A)</SelectItem>
                  <SelectItem value="valor-maior">Valor (Maior)</SelectItem>
                  <SelectItem value="valor-menor">Valor (Menor)</SelectItem>
                  <SelectItem value="oficina-az">Oficina (A-Z)</SelectItem>
                  <SelectItem value="prioridade-urgente">Prioridade (Urgente)</SelectItem>
                </SelectContent>
              </Select>
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
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locais.map((local) => (
                        <TableRow key={local.id}>
                          <TableCell className="font-medium">{local.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {local.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {local.telefone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{local.telefone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {local.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{local.email}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {local.endereco ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{local.endereco}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLocal(local.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para exclusão de manutenção */}
      <ConfirmDialog
        open={confirmDeleteManutencao.open}
        onOpenChange={(open) => setConfirmDeleteManutencao({ open, id: null })}
        title="Excluir Manutenção"
        description="Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteManutencaoAction}
        onCancel={() => setConfirmDeleteManutencao({ open: false, id: null })}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Modal de confirmação para exclusão de local */}
      <ConfirmDialog
        open={confirmDeleteLocal.open}
        onOpenChange={(open) => setConfirmDeleteLocal({ open, id: null })}
        title="Excluir Local"
        description="Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteLocalAction}
        onCancel={() => setConfirmDeleteLocal({ open: false, id: null })}
        variant="destructive"
      />
    </div>
  );
}