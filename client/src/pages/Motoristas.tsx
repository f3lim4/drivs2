/**
 * Página de gestão de motoristas do sistema DRIVS
 * Permite visualizar, buscar e gerenciar motoristas cadastrados
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMotoristas } from '@/hooks/useMotoristas';
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
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';

export default function Motoristas() {
  const { toast } = useToast();
  const { isAdmin, isLocadora, profile } = useAuth();
  const { motoristas, isLoading, deleteMotorista } = useMotoristas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);

  // Carregamento agora é feito automaticamente pelo hook useMotoristas

  // Função para calcular status da CNH baseado na data de vencimento
  const getStatusFromVencimento = (vencimentoCnh: string) => {
    try {
      const hoje = new Date();
      
      // Converte data no formato brasileiro (DD/MM/YYYY ou YYYY-MM-DD)
      let vencimento: Date;
      if (vencimentoCnh.includes('/')) {
        const [dia, mes, ano] = vencimentoCnh.split('/');
        vencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } else {
        vencimento = new Date(vencimentoCnh);
      }
      
      const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasParaVencer < 0) {
        return 'vencido'; // CNH vencida
      } else if (diasParaVencer <= 30) {
        return 'vencendo'; // CNH vencendo em até 30 dias
      } else {
        return 'ativo'; // CNH válida
      }
    } catch (error) {
      console.error('Erro ao processar data CNH:', error);
      return 'ativo'; // Retorna ativo em caso de erro
    }
  };

  // Filtra motoristas baseado na busca e filtros
  const filteredMotoristas = motoristas.filter(motorista => {
    const matchesSearch = motorista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motorista.cpf.includes(searchTerm) ||
                         motorista.cnh.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'todos' || motorista.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calcula estatísticas baseadas no status da CNH
  const stats = {
    total: motoristas.length,
    ativos: motoristas.filter(m => getStatusFromVencimento(m.vencimentoCnh) === 'ativo').length,
    cnhVencendo: motoristas.filter(m => getStatusFromVencimento(m.vencimentoCnh) === 'vencendo').length,
    cnhVencida: motoristas.filter(m => getStatusFromVencimento(m.vencimentoCnh) === 'vencido').length,
  };

  // Funções dos botões
  const handleNovoMotorista = () => {
    setModalOpen(true);
  };

  const handleMotoristaAdicionado = (novoMotorista: Motorista) => {
    toast({
      title: "Motorista Cadastrado",
      description: `${novoMotorista.nome} foi cadastrado com sucesso!`,
    });
    // A atualização da lista é feita automaticamente pelo hook
  };

  const handleEditarMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setEditModalOpen(true);
  };

  const handleMotoristaEditado = (motoristaAtualizado: Motorista) => {
    toast({
      title: "Motorista Atualizado",
      description: `${motoristaAtualizado.nome} foi atualizado com sucesso!`,
    });
    // A atualização da lista é feita automaticamente pelo hook
  };

  const handleExcluirMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setDeleteDialogOpen(true);
  };

  const handleConfirmarExclusao = async (motorista: Motorista) => {
    try {
      await deleteMotorista.mutateAsync(motorista.id);
      
      toast({
        title: "Motorista Excluído",
        description: `${motorista.nome} foi excluído com sucesso.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
      toast({
        title: "Erro ao excluir motorista",
        description: "Não foi possível excluir o motorista. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleVisualizarMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setViewModalOpen(true);
  };

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (motorista: Motorista) => {
    const statusCnh = getStatusFromVencimento(motorista.vencimentoCnh);
    
    switch (statusCnh) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          CNH Válida
        </Badge>;
      case 'vencendo':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          CNH Vencendo
        </Badge>;
      case 'vencido':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          CNH Vencida
        </Badge>;
      default:
        return <Badge variant="outline">{motorista.status}</Badge>;
    }
  };

  if (isLoading) {
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
                    {getStatusBadge(motorista)}
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