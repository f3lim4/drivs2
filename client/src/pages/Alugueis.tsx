/**
 * Página de gestão de aluguéis do sistema DRIVS
 * Permite visualizar e gerenciar contratos de locação ativos
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

import { Aluguel } from '@/types';
import { FileCheck, Clock, DollarSign, AlertCircle, Edit, Trash2, Eye, TrendingUp as Trending } from 'lucide-react';
import { NovoAluguelModal } from '@/components/alugueis/NovoAluguelModal';
import { EditarAluguelModal } from '@/components/alugueis/EditarAluguelModal';
import { ExcluirAluguelDialog } from '@/components/alugueis/ExcluirAluguelDialog';

export default function Alugueis() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const [alugueis, setAlugueis] = useState<Aluguel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showNovoAluguelModal, setShowNovoAluguelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAluguel, setSelectedAluguel] = useState<Aluguel | null>(null);

  // Carrega dados dos aluguéis
  useEffect(() => {
    const loadAlugueis = async () => {
      try {
        setLoading(true);
        
        // Para locadora, usar filtro específico
        let url = '/api/alugueis';
        if (isLocadora && profile?.locadoraId) {
          url += `?locadoraId=${profile.locadoraId}`;
          console.log('Alugueis - Fazendo requisição para locadora:', profile.locadoraId);
        }
        
        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const alugueisData = await response.json();
          
          // FILTRO TRIPLO DE SEGURANÇA: Garantir que locadora vê apenas seus aluguéis
          let alugueisParaProcessar = alugueisData;
          if (isLocadora && profile?.locadoraId) {
            alugueisParaProcessar = alugueisData.filter((aluguel: any) => aluguel.locadoraId === profile.locadoraId);
            
            // PROTEÇÃO EXTRA: Se ainda houver aluguéis de outras locadoras, limpar tudo
            const temAlugueisDeOutrasLocadoras = alugueisParaProcessar.some(a => a.locadoraId !== profile.locadoraId);
            if (temAlugueisDeOutrasLocadoras) {
              console.error('SECURITY ALERT: Aluguéis de outras locadoras detectados, limpando array');
              alugueisParaProcessar = [];
            }
          }
          
          // VALIDAÇÃO ADICIONAL: Garantir que todos os aluguéis pertencem à locadora correta
          if (isLocadora && profile?.locadoraId && alugueisParaProcessar.length > 0) {
            const todosAlugueisCorretos = alugueisParaProcessar.every(a => a.locadoraId === profile.locadoraId);
            if (!todosAlugueisCorretos) {
              console.error('SECURITY ALERT: Aluguéis de outras locadoras detectados, retornando array vazio');
              alugueisParaProcessar = [];
            }
          }
          
          const alugueisFormatados = alugueisParaProcessar.map((aluguel: any) => ({
            id: aluguel.id,
            motoristaId: aluguel.motoristaId,
            motoristaNome: aluguel.motoristaNome || 'Nome não encontrado',
            motoristaContato: aluguel.motoristaContato || 'Contato não encontrado',
            veiculoId: aluguel.veiculoId,
            veiculoModelo: aluguel.veiculoModelo || 'Modelo não encontrado',
            veiculoPlaca: aluguel.veiculoPlaca || 'Placa não encontrada',
            periodo: {
              inicio: new Date(aluguel.dataInicio).toLocaleDateString('pt-BR'),
              fim: new Date(aluguel.dataFim).toLocaleDateString('pt-BR'),
              dias: aluguel.tempoContrato,
            },
            valores: {
              diario: parseFloat(aluguel.valorMensal) / 30,
              total: parseFloat(aluguel.valorTotal),
              caucao: parseFloat(aluguel.caucao),
              taxaAdmin: parseFloat(aluguel.taxaAdministrativa || '0'),
            },
            status: aluguel.status,
          }));
          
          // Log apenas se houver problemas para debug
          if (isLocadora && alugueisParaProcessar.length > 0) {
            console.log('Alugueis - Verificando isolamento:', {
              locadoraId: profile?.locadoraId,
              alugueisTotal: alugueisParaProcessar.length,
              primeiroAluguel: alugueisParaProcessar[0]?.locadoraId
            });
          }
          
          setAlugueis(alugueisFormatados);
        }
      } catch (error) {
        console.error('Erro ao carregar aluguéis:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAlugueis();
  }, [isLocadora, profile?.locadoraId]);

  // Filtra aluguéis baseado na busca e filtros
  const filteredAlugueis = alugueis.filter(aluguel => {
    const matchesSearch = aluguel.motoristaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluguel.veiculoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluguel.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || aluguel.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Função para adicionar novo aluguel
  const handleAluguelAdicionado = (novoAluguel: Aluguel) => {
    setAlugueis(prev => [...prev, novoAluguel]);
  };

  // Função para editar aluguel
  const handleEditarAluguel = (aluguel: Aluguel) => {
    setSelectedAluguel(aluguel);
    setShowEditModal(true);
  };

  const handleAluguelEditado = (aluguelAtualizado: Aluguel) => {
    setAlugueis(prev => 
      prev.map(a => a.id === aluguelAtualizado.id ? aluguelAtualizado : a)
    );
  };

  // Função para excluir aluguel
  const handleExcluirAluguel = (aluguel: Aluguel) => {
    setSelectedAluguel(aluguel);
    setShowDeleteDialog(true);
  };

  const handleConfirmarExclusao = async (aluguel: Aluguel) => {
    try {
      const response = await fetch(`/api/alugueis/${aluguel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove da lista local
        setAlugueis(prev => prev.filter(a => a.id !== aluguel.id));
        toast({
          title: "Aluguel excluído",
          description: "O aluguel foi removido com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o aluguel. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir aluguel:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Calcula estatísticas
  const stats = {
    total: alugueis.length,
    ativos: alugueis.filter(a => a.status === 'ativo').length,
    pendentes: alugueis.filter(a => a.status === 'pendente').length,
    receita: alugueis.reduce((sum, a) => sum + a.valores.total, 0),
  };

  // Retorna badge de status com cor apropriada
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
      case 'pendente':
        return <Badge variant="default" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'finalizado':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
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
      {/* Header da página */}
      <DrivsHeader 
        title="Aluguéis"
        subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
      />

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Aluguéis"
          value={stats.total}
          icon={<Trending />}
          variant="blue"
        />
        <StatCard
          title="Ativos"
          value={stats.ativos}
          icon={<TrendingUp />}
          variant="green"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={<Clock />}
          variant="yellow"
        />
        <StatCard
          title="Receita Total"
          value={stats.receita}
          icon={<DollarSign />}
          variant="green"
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
                placeholder="Buscar aluguel..."
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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {isLocadora && (
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowNovoAluguelModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Aluguel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de aluguéis */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos de Locação</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAlugueis.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MOTORISTA</TableHead>
                  {isAdmin && <TableHead>LOCADORA</TableHead>}
                  <TableHead>VEÍCULO</TableHead>
                  <TableHead>PERÍODO</TableHead>
                  <TableHead>VALOR</TableHead>
                  <TableHead>CAUÇÃO</TableHead>
                  <TableHead>TAXA ADMIN</TableHead>
                  <TableHead>LIMITE KM</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlugueis.map((aluguel) => (
                  <TableRow key={aluguel.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{aluguel.motoristaNome}</p>
                        <p className="text-sm text-muted-foreground">{aluguel.motoristaContato}</p>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <span className="text-purple-600 text-xs font-medium">MR</span>
                          </div>
                          <span className="text-sm">MoveRent</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">{aluguel.veiculoModelo}</p>
                        <p className="text-sm text-muted-foreground">{aluguel.veiculoPlaca}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{aluguel.periodo.inicio} a {aluguel.periodo.fim}</p>
                        <p className="text-sm text-muted-foreground">
                          {aluguel.periodo.dias} mês(es) - {aluguel.periodo.dias * 30} dia(s)
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(aluguel.valores.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(aluguel.valores.diario)}/mês
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(aluguel.valores.caucao)}</p>
                        <p className="text-sm text-muted-foreground">Caução</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>limitado</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(aluguel.status)}
                    </TableCell>
                    {isLocadora && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleEditarAluguel(aluguel)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleExcluirAluguel(aluguel)}
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
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum aluguel encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou criar um novo contrato de locação
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals - apenas para locadoras */}
      {isLocadora && (
        <>
          {/* Modal Novo Aluguel */}
          <NovoAluguelModal
            open={showNovoAluguelModal}
            onOpenChange={setShowNovoAluguelModal}
            onAluguelAdicionado={handleAluguelAdicionado}
          />

          {/* Modal Editar Aluguel */}
          <EditarAluguelModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            aluguel={selectedAluguel}
            onAluguelEditado={handleAluguelEditado}
          />

          {/* Dialog Excluir Aluguel */}
          <ExcluirAluguelDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            aluguel={selectedAluguel}
            onConfirmarExclusao={handleConfirmarExclusao}
          />
        </>
      )}
    </div>
  );
}