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
import { Pagination } from '@/components/ui/pagination';
import { NovoMotoristaModal } from '@/components/motoristas/NovoMotoristaModal';
import { EditarMotoristaModal } from '@/components/motoristas/EditarMotoristaModal';
import { ExcluirMotoristaDialog } from '@/components/motoristas/ExcluirMotoristaDialog';
import { VisualizarMotoristaModal } from '@/components/motoristas/VisualizarMotoristaModal';
import { PesquisarCpfModal } from '@/components/motoristas/PesquisarCpfModal';
import { registrarAtividade } from '@/utils/activityLogger';


import { Motorista } from '@/types';
import { Users, UserCheck, UserX, Clock, Activity } from 'lucide-react';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';

export default function Motoristas() {
  const { toast } = useToast();
  const { isAdmin, isLocadora, profile } = useAuth();
  const { motoristas, isLoading, deleteMotorista, refetch } = useMotoristas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pesquisarCpfModalOpen, setPesquisarCpfModalOpen] = useState(false);

  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('nome-asc');

  // Buscar locadoras para exibir nome na coluna
  const { data: locadoras = [], isLoading: loadingLocadoras } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin, // Só busca se for admin
  });

  // Buscar dados adicionais necessários para o sistema completo
  const { data: alugueis = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: ['/api/alugueis', profile?.locadoraId],
    enabled: !!profile?.locadoraId && isLocadora,
  });

  const { data: veiculos = [], isLoading: loadingVeiculos } = useQuery({
    queryKey: ['/api/veiculos', profile?.locadoraId],
    enabled: !!profile?.locadoraId && isLocadora,
  });

  const { data: pagamentos = [], isLoading: loadingPagamentos } = useQuery({
    queryKey: ['/api/pagamentos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  // Função para encontrar o nome da locadora
  const getLocadoraName = (locadoraId: string) => {
    if (!locadoraId) return 'Locadora';
    const locadora = (locadoras as any[]).find((loc: any) => loc.id === locadoraId);
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

  // Função para ordenar motoristas
  const sortMotoristas = (motoristas: Motorista[]) => {
    return [...motoristas].sort((a, b) => {
      switch (sortBy) {
        case 'nome-asc':
          return a.nome.localeCompare(b.nome);
        case 'nome-desc':
          return b.nome.localeCompare(a.nome);
        case 'cpf-asc':
          return a.cpf.localeCompare(b.cpf);
        case 'cpf-desc':
          return b.cpf.localeCompare(a.cpf);
        case 'cnh-asc':
          return a.cnh.localeCompare(b.cnh);
        case 'cnh-desc':
          return b.cnh.localeCompare(a.cnh);
        case 'vencimento-asc':
          return new Date(a.vencimentoCnh).getTime() - new Date(b.vencimentoCnh).getTime();
        case 'vencimento-desc':
          return new Date(b.vencimentoCnh).getTime() - new Date(a.vencimentoCnh).getTime();
        default:
          return 0;
      }
    });
  };

  // Filtra e ordena motoristas baseado na busca e filtros
  const filteredMotoristas = sortMotoristas(motoristas.filter(motorista => {
    const matchesSearch = motorista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motorista.cpf.includes(searchTerm) ||
                         motorista.cnh.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'todos' || motorista.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }));

  // Paginação
  const totalPages = Math.ceil(filteredMotoristas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMotoristas = filteredMotoristas.slice(startIndex, endIndex);
  
  // Reset para primeira página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

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



  const handleEditarMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setEditModalOpen(true);
  };

  const handleMotoristaEditado = (motoristaAtualizado: Motorista) => {
    toast({
      title: "Motorista Atualizado",
      description: `${motoristaAtualizado.nome} foi atualizado com sucesso!`,
    });
    // Forçar atualização dos dados para refletir mudanças imediatamente
    refetch();
  };

  const handleExcluirMotorista = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setDeleteDialogOpen(true);
  };

  const handleConfirmarExclusao = async (motorista: Motorista) => {
    try {
      await deleteMotorista.mutateAsync(motorista.id);

      // Log da atividade
      await registrarAtividade(
        profile.locadoraId,
        profile.email || 'usuario@drivs.me',
        'excluir',
        'motorista',
        motorista.id,
        `Motorista excluído: ${motorista.nome} (CPF: ${motorista.cpf})`
      );
      
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

  const handleUploadImagens = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setUploadImagensModalOpen(true);
  };

  const handleUploadImagensSuccess = () => {
    // A atualização da lista é feita automaticamente pelo hook
    toast({
      title: "Imagens atualizadas",
      description: "As imagens do motorista foram atualizadas com sucesso!",
    });
  };

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (motorista: Motorista) => {
    // Para a coluna do motorista: mostra se foi negativado ou status básico
    if (motorista.negativado) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        Negativado
      </Badge>;
    }
    
    return <Badge variant={motorista.status === 'ativo' ? 'default' : 'outline'} className="text-xs">
      {motorista.status === 'ativo' ? 'Ativo' : 'Inativo'}
    </Badge>;
  };

  const getCnhStatusBadge = (motorista: Motorista) => {
    // Para a coluna CNH: mostra apenas o status da CNH
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
        return <Badge variant="outline">Status desconhecido</Badge>;
    }
  };

  // Sistema de loading completo - verifica múltiplas fontes
  const loading = isLoading || 
    (isAdmin && loadingLocadoras) || 
    (isLocadora && (loadingAlugueis || loadingVeiculos)) ||
    loadingPagamentos;

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-center">
            Carregando motoristas...
          </p>
        </div>
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
                <p className="text-xs font-medium text-blue-700">Total de Motoristas</p>
                <p className="text-xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Cadastrados</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">Ativos</p>
                <p className="text-xl font-bold text-green-800">{stats.ativos}</p>
                <p className="text-xs text-green-600">Habilitados</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-yellow-700">CNH Vencendo</p>
                <p className="text-xl font-bold text-yellow-800">{stats.cnhVencendo}</p>
                <p className="text-xs text-yellow-600">Próximo ao vencimento</p>
              </div>
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">CNH Vencida</p>
                <p className="text-xl font-bold text-red-800">{stats.cnhVencida}</p>
                <p className="text-xs text-red-600">Requer renovação</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-700" />
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setPesquisarCpfModalOpen(true)}
                    title="Pesquisar histórico de motorista por CPF"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleNovoMotorista}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Motorista
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de motoristas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Motoristas</CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="cpf-asc">CPF (Crescente)</SelectItem>
                <SelectItem value="cpf-desc">CPF (Decrescente)</SelectItem>
                <SelectItem value="cnh-asc">CNH (Crescente)</SelectItem>
                <SelectItem value="cnh-desc">CNH (Decrescente)</SelectItem>
                <SelectItem value="vencimento-asc">CNH Vence Primeiro</SelectItem>
                <SelectItem value="vencimento-desc">CNH Vence Último</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead>VENCIMENTO CNH / STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMotoristas.map((motorista) => (
                <TableRow key={motorista.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                        {motorista.imagem1 ? (
                          <img 
                            src={`/uploads/${motorista.imagem1}`} 
                            alt={motorista.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Se a imagem não carregar, mostra as iniciais
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span 
                          className="text-primary-foreground font-medium text-sm w-full h-full flex items-center justify-center"
                          style={{ display: motorista.imagem1 ? 'none' : 'flex' }}
                        >
                          {motorista.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{motorista.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(motorista)}
                        </div>
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
                    <div className="space-y-1">
                      <p className="text-sm">{motorista.vencimentoCnh}</p>
                      {getCnhStatusBadge(motorista)}
                    </div>
                  </TableCell>
                  {isLocadora && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleVisualizarMotorista(motorista)}
                          title="Ver Dados e Imagens"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditarMotorista(motorista)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExcluirMotorista(motorista)}
                          title="Excluir"
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

      {/* Paginação */}
      {filteredMotoristas.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredMotoristas.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Modals - apenas para locadoras */}
      {isLocadora && (
        <>
          {/* Modal de Novo Motorista */}
          <NovoMotoristaModal
            open={modalOpen}
            onOpenChange={setModalOpen}
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

          {/* Modal de Pesquisar CPF */}
          <PesquisarCpfModal
            open={pesquisarCpfModalOpen}
            onOpenChange={setPesquisarCpfModalOpen}
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