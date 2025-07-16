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
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { NovoVeiculoModal } from '@/components/veiculos/NovoVeiculoModal';
import { EditarVeiculoModal } from '@/components/veiculos/EditarVeiculoModal';
import { ExcluirVeiculoDialog } from '@/components/veiculos/ExcluirVeiculoDialog';
import { VisualizarVeiculoModal } from '@/components/veiculos/VisualizarVeiculoModal';

import { Veiculo } from '@/types';
import { CheckCircle, AlertTriangle, Wrench, BarChart3 } from 'lucide-react';

export default function Veiculos() {
  const { toast } = useToast();
  const { isAdmin, isLocadora } = useAuth();
  const { veiculos, loading, adicionarVeiculo, atualizarVeiculo, removerVeiculo } = useVeiculos();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);


  // Filtra veículos baseado na busca e filtros
  const filteredVeiculos = veiculos.filter(veiculo => {
    const matchesSearch = veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || veiculo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Veículos"
          value={stats.total}
          icon={<BarChart3 />}
          variant="blue"
        />
        <StatCard
          title="Disponíveis"
          value={stats.disponiveis}
          icon={<CheckCircle />}
          variant="green"
        />
        <StatCard
          title="Alugados"
          value={stats.alugados}
          icon={<Car />}
          variant="blue"
        />
        <StatCard
          title="Manutenção"
          value={stats.manutencao}
          icon={<Wrench />}
          variant="yellow"
        />
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
        <CardHeader>
          <CardTitle>Frota de Veículos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VEÍCULO</TableHead>
                {isAdmin && <TableHead>LOCADORA</TableHead>}
                <TableHead>VALORES</TableHead>
                <TableHead>LIMITE KM</TableHead>
                <TableHead>SEGURO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{veiculo.placa} • {veiculo.marca} {veiculo.modelo}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{veiculo.ano} • {veiculo.cor} • </span>
                          <Badge variant="outline" className="capitalize text-xs px-1 py-0 h-4">{veiculo.categoria}</Badge>
                        </div>
                      </div>
                    </div>
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
                    <p className="capitalize">{veiculo.kmLimite}</p>
                  </TableCell>
                  <TableCell>
                    <p>{veiculo.seguro}</p>
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