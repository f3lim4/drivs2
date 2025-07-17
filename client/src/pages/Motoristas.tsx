/**
 * Página de gestão de motoristas do sistema DRIVS
 * Permite visualizar, buscar e gerenciar motoristas cadastrados
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useQuery } from '@tanstack/react-query';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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

  // Buscar locadoras para exibir nome na coluna
  const { data: locadoras = [] } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin, // Só busca se for admin
  });

  // Função para encontrar o nome da locadora
  const getLocadoraName = (locadoraId: string) => {
    if (!locadoraId) return 'Locadora';
    const locadora = locadoras.find((loc: any) => loc.id === locadoraId);
    return locadora ? locadora.nome : locadoraId;
  };

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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas com visual futurista */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">Total de Motoristas</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Cadastrados</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">Ativos</p>
                <p className="text-2xl font-bold text-green-800">{stats.ativos}</p>
                <p className="text-xs text-green-600">Habilitados</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-700">CNH Vencendo</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.cnhVencendo}</p>
                <p className="text-xs text-yellow-600">Próximo ao vencimento</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700">CNH Vencida</p>
                <p className="text-2xl font-bold text-red-800">{stats.cnhVencida}</p>
                <p className="text-xs text-red-600">Requer renovação</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-700" />
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
                          <span className="text-blue-600 text-xs font-medium">
                            {(getLocadoraName(motorista.locadoraId) || 'L').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{getLocadoraName(motorista.locadoraId)}</span>
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