/**
 * Página de gestão de motoristas do sistema DRIVS
 * Permite visualizar, buscar e gerenciar motoristas cadastrados
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
import { NovoMotoristaModal } from '@/components/motoristas/NovoMotoristaModal';
import { EditarMotoristaModal } from '@/components/motoristas/EditarMotoristaModal';
import { ExcluirMotoristaDialog } from '@/components/motoristas/ExcluirMotoristaDialog';
import { VisualizarMotoristaModal } from '@/components/motoristas/VisualizarMotoristaModal';

import { Motorista } from '@/types';
import { Users, UserCheck, UserX, Clock, Activity } from 'lucide-react';

export default function Motoristas() {
  const { toast } = useToast();
  const { isAdmin, isLocadora } = useAuth();
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);

  // Carrega dados dos motoristas
  useEffect(() => {
    // Sem dados por enquanto
    setLoading(false);
  }, []);

  // Filtra motoristas baseado na busca e filtros
  const filteredMotoristas = motoristas.filter(motorista => {
    const matchesSearch = motorista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motorista.cpf.includes(searchTerm) ||
                         motorista.cnh.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'todos' || motorista.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calcula estatísticas
  const stats = {
    total: motoristas.length,
    ativos: motoristas.filter(m => m.status === 'ativo').length,
    cnhVencendo: motoristas.filter(m => m.status === 'ativo').length, // Simplificado
    cnhVencida: motoristas.filter(m => m.status === 'vencido').length,
  };

  // Funções dos botões
  const handleNovoMotorista = () => {
    setModalOpen(true);
  };

  const handleMotoristaAdicionado = (novoMotorista: Motorista) => {
    setMotoristas(prev => [...prev, novoMotorista]);
    toast({
      title: "Motorista Cadastrado",
      description: `${novoMotorista.nome} foi cadastrado com sucesso!`,
    });
  };

  const handleEditarMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setEditModalOpen(true);
  };

  const handleMotoristaEditado = (motoristaAtualizado: Motorista) => {
    setMotoristas(prev => 
      prev.map(m => m.id === motoristaAtualizado.id ? motoristaAtualizado : m)
    );
    toast({
      title: "Motorista Atualizado",
      description: `${motoristaAtualizado.nome} foi atualizado com sucesso!`,
    });
  };

  const handleExcluirMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setDeleteDialogOpen(true);
  };

  const handleConfirmarExclusao = (motorista: Motorista) => {
    setMotoristas(prev => prev.filter(m => m.id !== motorista.id));
    toast({
      title: "Motorista Excluído",
      description: `${motorista.nome} foi excluído com sucesso.`,
      variant: "destructive",
    });
  };

  const handleVisualizarMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setViewModalOpen(true);
  };

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'vencido':
        return <Badge variant="destructive">CNH Vencida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      {/* Header da página */}
      <DrivsHeader 
        title="Motoristas"
        subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
      />

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Motoristas"
          value={stats.total}
          icon={<Users />}
          variant="blue"
        />
        <StatCard
          title="Ativos"
          value={stats.ativos}
          icon={<UserCheck />}
          variant="green"
        />
        <StatCard
          title="CNH Vencendo"
          value={stats.cnhVencendo}
          icon={<Clock />}
          variant="yellow"
        />
        <StatCard
          title="CNH Vencida"
          value={stats.cnhVencida}
          icon={<UserX />}
          variant="red"
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
                placeholder="Buscar motorista..."
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
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="vencido">CNH Vencida</SelectItem>
                </SelectContent>
              </Select>

              {isLocadora && (
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleNovoMotorista}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Motorista
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de motoristas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MOTORISTA</TableHead>
                {isAdmin && <TableHead>LOCADORA</TableHead>}
                <TableHead>CPF</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>CONTATO</TableHead>
                <TableHead>VENCIMENTO CNH</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMotoristas.map((motorista) => (
                <TableRow key={motorista.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {motorista.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{motorista.nome}</p>
                        {motorista.localizacao && (
                          <p className="text-sm text-muted-foreground">{motorista.localizacao}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">AL</span>
                        </div>
                        <span className="text-sm">AutoRent Premium</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p>{motorista.cpf}</p>
                      <p className="text-sm text-muted-foreground">RG: {motorista.cpf.slice(0, 9)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{motorista.cnh}</p>
                      <p className="text-sm text-muted-foreground">{motorista.categoria}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p>{motorista.telefone || motorista.contato}</p>
                  </TableCell>
                  <TableCell>
                    <p>{motorista.vencimentoCnh}</p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(motorista.status)}
                  </TableCell>
                  {isLocadora && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditarMotorista(motorista)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExcluirMotorista(motorista)}
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
                        onClick={() => handleVisualizarMotorista(motorista)}
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

          {filteredMotoristas.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum motorista encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou adicionar um novo motorista
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals - apenas para locadoras */}
      {isLocadora && (
        <>
          {/* Modal de Novo Motorista */}
          <NovoMotoristaModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onMotoristaAdicionado={handleMotoristaAdicionado}
          />

          {/* Modal de Editar Motorista */}
          <EditarMotoristaModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            motorista={selectedMotorista}
            onMotoristaEditado={handleMotoristaEditado}
          />

          {/* Dialog de Excluir Motorista */}
          <ExcluirMotoristaDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            motorista={selectedMotorista}
            onConfirmarExclusao={handleConfirmarExclusao}
          />
        </>
      )}

      {/* Modal de Visualizar - para todos os usuários */}
      <VisualizarMotoristaModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        motorista={selectedMotorista}
      />
    </div>
  );
}