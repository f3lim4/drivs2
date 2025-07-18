/**
 * Página de gestão de veículos do sistema DRIVS
 * Permite visualizar, buscar e gerenciar a frota de veículos
 */

import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Car, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useVeiculos } from '@/hooks/useVeiculos';
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
import { Pagination } from '@/components/ui/pagination';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { NovoVeiculoModal } from '@/components/veiculos/NovoVeiculoModal';
import { EditarVeiculoModal } from '@/components/veiculos/EditarVeiculoModal';
import { ExcluirVeiculoDialog } from '@/components/veiculos/ExcluirVeiculoDialog';
import { VisualizarVeiculoModal } from '@/components/veiculos/VisualizarVeiculoModal';

import { Veiculo } from '@/types';
import { CheckCircle, AlertTriangle, Wrench, BarChart3 } from 'lucide-react';

// Função auxiliar para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para obter badge de status
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'disponivel':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Disponível</Badge>;
    case 'alugado':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Alugado</Badge>;
    case 'manutencao':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Manutenção</Badge>;
    case 'indisponivel':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Indisponível</Badge>;
    default:
      return <Badge variant="outline">Indefinido</Badge>;
  }
};

// Função para obter cor do ícone do veículo baseado na cor do veículo
const getVehicleIconColor = (cor: string) => {
  const colorMap: { [key: string]: string } = {
    'branco': 'bg-gray-100 text-gray-600',
    'preto': 'bg-gray-800 text-gray-100',
    'prata': 'bg-gray-300 text-gray-700',
    'cinza': 'bg-gray-500 text-gray-100',
    'azul': 'bg-blue-500 text-blue-100',
    'vermelho': 'bg-red-500 text-red-100',
    'verde': 'bg-green-500 text-green-100',
    'bege': 'bg-yellow-200 text-yellow-800',
    'amarelo': 'bg-yellow-400 text-yellow-900',
    'marrom': 'bg-amber-700 text-amber-100'
  };
  
  return colorMap[cor?.toLowerCase()] || 'bg-primary text-primary-foreground';
};

export default function Veiculos() {
  const { toast } = useToast();
  const { isAdmin, isLocadora } = useAuth();
  const { veiculos, loading, adicionarVeiculo, atualizarVeiculo, removerVeiculo } = useVeiculos();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  // Filtra e ordena veículos baseado na busca, filtros e ordenação
  const filteredVeiculos = veiculos
    .filter(veiculo => {
      const matchesSearch = veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || veiculo.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'mais-novos':
          // Ordena por data de cadastro decrescente (mais novos primeiro)
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'mais-antigos':
          // Ordena por data de cadastro crescente (mais antigos primeiro)
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case 'placa-az':
          // Ordena por placa A-Z
          return a.placa.localeCompare(b.placa);
        case 'placa-za':
          // Ordena por placa Z-A
          return b.placa.localeCompare(a.placa);
        case 'modelo-az':
          // Ordena por modelo A-Z
          return a.modelo.localeCompare(b.modelo);
        case 'modelo-za':
          // Ordena por modelo Z-A
          return b.modelo.localeCompare(a.modelo);
        case 'ano-novo':
          // Ordena por ano decrescente (mais novos primeiro)
          return (b.ano || 0) - (a.ano || 0);
        case 'ano-antigo':
          // Ordena por ano crescente (mais antigos primeiro)
          return (a.ano || 0) - (b.ano || 0);
        default:
          return 0;
      }
    });

  // Paginação
  const totalItems = filteredVeiculos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVeiculos = filteredVeiculos.slice(startIndex, endIndex);

  // Redefine página atual quando filtros mudam
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Volta para primeira página
  };

  // Calcula estatísticas
  const stats = {
    total: veiculos.length,
    disponiveis: veiculos.filter(v => v.status === 'disponivel').length,
    alugados: veiculos.filter(v => v.status === 'alugado').length,
    manutencao: veiculos.filter(v => v.status === 'manutencao').length,
  };

  // Funções dos botões
  const handleNovoVeiculo = () => {
    setModalOpen(true);
  };

  const handleVeiculoAdicionado = (novoVeiculo: Veiculo) => {
    adicionarVeiculo(novoVeiculo);
  };

  const handleEditarVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setEditModalOpen(true);
  };

  const handleVeiculoEditado = (veiculoAtualizado: Veiculo) => {
    atualizarVeiculo(veiculoAtualizado);
    toast({
      title: "Veículo Atualizado",
      description: `${veiculoAtualizado.marca} ${veiculoAtualizado.modelo} foi atualizado com sucesso!`,
    });
  };

  const handleExcluirVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setDeleteDialogOpen(true);
  };

  const handleConfirmarExclusao = async (veiculo: Veiculo) => {
    try {
      const response = await fetch(`/api/veiculos/${veiculo.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir veículo');
      }
      
      // Remove do estado local após sucesso na API
      removerVeiculo(veiculo.id);
      
      toast({
        title: "Veículo Excluído",
        description: `${veiculo.marca} ${veiculo.modelo} foi excluído com sucesso.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      toast({
        title: "Erro ao excluir veículo",
        description: "Não foi possível excluir o veículo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleVisualizarVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setViewModalOpen(true);
  };

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge variant="default" className="bg-success text-success-foreground">Disponível</Badge>;
      case 'alugado':
        return <Badge variant="default" className="bg-primary text-primary-foreground">Alugado</Badge>;
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
                <p className="text-xs font-medium text-blue-700">Total de Veículos</p>
                <p className="text-xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Frota completa</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">Disponíveis</p>
                <p className="text-xl font-bold text-green-800">{stats.disponiveis}</p>
                <p className="text-xs text-green-600">Prontos para locação</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">Alugados</p>
                <p className="text-xl font-bold text-purple-800">{stats.alugados}</p>
                <p className="text-xs text-purple-600">Em uso</p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-orange-700">Manutenção</p>
                <p className="text-xl font-bold text-orange-800">{stats.manutencao}</p>
                <p className="text-xs text-orange-600">Em reparo</p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-700" />
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
                placeholder="Buscar veículo..."
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
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>



              {isLocadora && (
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleNovoVeiculo}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Veículo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de veículos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Frota de Veículos</CardTitle>
          
          {/* Ordenação */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
              <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
              <SelectItem value="placa-az">Placa (A-Z)</SelectItem>
              <SelectItem value="placa-za">Placa (Z-A)</SelectItem>
              <SelectItem value="modelo-az">Modelo (A-Z)</SelectItem>
              <SelectItem value="modelo-za">Modelo (Z-A)</SelectItem>
              <SelectItem value="ano-novo">Ano (Mais Novo)</SelectItem>
              <SelectItem value="ano-antigo">Ano (Mais Antigo)</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VEÍCULO</TableHead>
                <TableHead>PLACA</TableHead>
                {isAdmin && <TableHead>LOCADORA</TableHead>}
                <TableHead>VALORES</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVeiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getVehicleIconColor(veiculo.cor)}`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{veiculo.marca} {veiculo.modelo}</p>
                        <p className="text-sm text-muted-foreground">
                          {veiculo.ano} • {veiculo.cor} • {veiculo.categoria}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{veiculo.placa}</p>
                  </TableCell>
                   {isAdmin && (
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                           <span className="text-blue-600 text-xs font-medium">
                             {veiculo.locadoraNome?.substring(0, 2).toUpperCase() || 'LO'}
                           </span>
                         </div>
                         <span className="text-sm">{veiculo.locadoraNome || 'Locadora'}</span>
                       </div>
                     </TableCell>
                   )}
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(veiculo.valorSemanal)}/sem</p>
                      <p className="text-sm text-muted-foreground">
                        Caução: {formatCurrency(veiculo.caucao)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(veiculo.status)}
                  </TableCell>
                  {isLocadora && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditarVeiculo(veiculo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExcluirVeiculo(veiculo)}
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
                        onClick={() => handleVisualizarVeiculo(veiculo)}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVeiculos.length === 0 && (
            <div className="text-center py-8">
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum veículo encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou adicionar um novo veículo
              </p>
            </div>
          )}
        </CardContent>
        
        {/* Paginação */}
        {filteredVeiculos.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </Card>

      {/* Modals - apenas para locadoras */}
      {isLocadora && (
        <>
          {/* Modal de Novo Veículo */}
          <NovoVeiculoModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onVeiculoAdicionado={handleVeiculoAdicionado}
          />

          {/* Modal de Editar Veículo */}
          <EditarVeiculoModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            veiculo={selectedVeiculo}
            onVeiculoEditado={handleVeiculoEditado}
          />

          {/* Dialog de Excluir Veículo */}
          <ExcluirVeiculoDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            veiculo={selectedVeiculo}
            onConfirmarExclusao={handleConfirmarExclusao}
          />
        </>
      )}

      {/* Modal de Visualizar - para todos os usuários */}
      <VisualizarVeiculoModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        veiculo={selectedVeiculo}
      />
    </div>
  );
}