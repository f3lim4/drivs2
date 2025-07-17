import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { Aluguel } from '@/types';
import { FileCheck, Clock, DollarSign, AlertCircle, Edit, Trash2, Eye, TrendingUp as Trending } from 'lucide-react';
import { NovoAluguelModal } from '@/components/alugueis/NovoAluguelModal';
import { EditarAluguelModal } from '@/components/alugueis/EditarAluguelModal';
import { ExcluirAluguelDialog } from '@/components/alugueis/ExcluirAluguelDialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Alugueis() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showNovoAluguelModal, setShowNovoAluguelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAluguel, setSelectedAluguel] = useState<Aluguel | null>(null);

  // Carregamento de dados com React Query
  const { data: alugueis = [], isLoading: loading } = useQuery({
    queryKey: ['/api/alugueis', profile?.locadoraId],
    queryFn: async () => {
      if (!profile) return [];
      
      // Para admin, buscar todos os aluguéis
      if (isAdmin) {
        const response = await fetch('/api/alugueis');
        return response.json();
      }
      
      // Para locadora, buscar apenas os aluguéis da locadora
      if (!profile.locadoraId) return [];
      const response = await fetch(`/api/alugueis?locadoraId=${profile.locadoraId}`);
      return response.json();
    },
    enabled: !!profile && (isAdmin || !!profile.locadoraId),
    staleTime: 0, // Evita cache antigo
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['/api/pagamentos', profile?.locadoraId],
    queryFn: async () => {
      if (!profile) return [];
      
      // Para admin, buscar todos os pagamentos
      if (isAdmin) {
        const response = await fetch('/api/pagamentos');
        return response.json();
      }
      
      // Para locadora, buscar apenas os pagamentos da locadora
      if (!profile.locadoraId) return [];
      const response = await fetch(`/api/pagamentos?locadoraId=${profile.locadoraId}`);
      return response.json();
    },
    enabled: !!profile && (isAdmin || !!profile.locadoraId),
  });

  const { data: locadoras = [], isLoading: locadorasLoading } = useQuery({
    queryKey: ['/api/locadoras'],
    enabled: isAdmin || isLocadora,
  });

  // Função para encontrar o nome da locadora
  const getLocadoraName = (locadoraId: string) => {
    if (!locadoraId) return 'Locadora';
    if (locadorasLoading) return 'Carregando...';
    if (!locadoras || locadoras.length === 0) return 'Sem dados';
    
    const locadora = locadoras.find((loc: any) => loc.id === locadoraId);
    return locadora ? locadora.nome : `ID: ${locadoraId}`;
  };

  // Para usuários locadora, buscar o nome da locadora diretamente usando o locadoraId
  const nomeLocadoraAtual = isLocadora && profile?.locadoraId ? getLocadoraName(profile.locadoraId) : null;

  // Calcula estatísticas
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    // Calcular receita esperada (soma dos valores mensais dos aluguéis ativos)
    const receitaEsperada = alugueis
      .filter(a => a && a.status === 'ativo')
      .reduce((sum, a) => sum + (parseFloat(a.valorMensal) || 0), 0);
    
    // Calcular receita real baseada nos pagamentos do mês
    const receitaReal = pagamentos
      .filter(p => {
        // Verificar se o pagamento tem data válida
        if (!p.data) {
          console.log('Pagamento sem data:', p);
          return false;
        }
        
        const dataPagamento = new Date(p.data);
        
        // Verificar se a data é válida
        if (isNaN(dataPagamento.getTime())) {
          console.log('Data inválida para pagamento:', p);
          return false;
        }
        
        const dentroDoMes = isWithinInterval(dataPagamento, { start: monthStart, end: monthEnd });
        
        console.log('Pagamento filtro:', {
          id: p.id,
          valor: p.valor,
          status: p.status,
          data: p.data,
          dataPagamento: dataPagamento.toISOString(),
          monthStart: monthStart.toISOString(),
          monthEnd: monthEnd.toISOString(),
          dentroDoMes,
          statusPago: p.status === 'pago'
        });
        
        return p.status === 'pago' && dentroDoMes;
      })
      .reduce((total, pagamento) => {
        const valor = parseFloat(pagamento.valor || '0');
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    return {
      total: alugueis.length,
      ativos: alugueis.filter(a => a.status === 'ativo').length,
      pendentes: alugueis.filter(a => a.status === 'pendente').length,
      receitaEsperada,
      receitaReal,
    };
  }, [alugueis, pagamentos]);

  // Filtrar aluguéis
  const aluguelsFiltrados = useMemo(() => {
    if (!alugueis || !Array.isArray(alugueis)) return [];
    
    return alugueis.filter(aluguel => {
      // Verificar se o aluguel tem os campos necessários
      if (!aluguel || !aluguel.motoristaNome || !aluguel.veiculoModelo || !aluguel.veiculoPlaca) {
        return false;
      }
      
      const matchesSearch = 
        aluguel.motoristaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluguel.veiculoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluguel.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || aluguel.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [alugueis, searchTerm, statusFilter]);

  // Handlers
  const handleEditAluguel = (aluguel: Aluguel) => {
    setSelectedAluguel(aluguel);
    setShowEditModal(true);
  };

  const handleDeleteAluguel = (aluguel: Aluguel) => {
    setSelectedAluguel(aluguel);
    setShowDeleteDialog(true);
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-blue-100 text-blue-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">Total de Aluguéis</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Todos os status</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">Aluguéis Ativos</p>
                <p className="text-2xl font-bold text-green-800">{stats.ativos}</p>
                <p className="text-xs text-green-600">Em andamento</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <Trending className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-700">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.pendentes}</p>
                <p className="text-xs text-yellow-600">Aguardando</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-700">Receita Mensal</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats.receitaEsperada)}</p>
                <p className="text-xs text-emerald-600">
                  Recebido: {formatCurrency(stats.receitaReal)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input
            placeholder="Buscar por motorista, veículo ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setShowNovoAluguelModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Novo Aluguel
        </Button>
      </div>

      {/* Tabela de aluguéis */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Aluguéis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Locadora</TableHead>}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluguelsFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                    Nenhum aluguel encontrado
                  </TableCell>
                </TableRow>
              ) : (
                aluguelsFiltrados.map((aluguel) => (
                  <TableRow key={aluguel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{aluguel.motoristaNome}</div>
                        <div className="text-sm text-gray-500">{aluguel.motoristaContato}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{aluguel.veiculoModelo}</div>
                        <div className="text-sm text-gray-500">{aluguel.veiculoPlaca}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(aluguel.dataInicio).toLocaleDateString('pt-BR')} - {new Date(aluguel.dataFim).toLocaleDateString('pt-BR')}</div>
                        <div className="text-gray-500">{aluguel.tempoContrato} meses</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(parseFloat(aluguel.valorMensal))}</div>
                        <div className="text-gray-500">{formatCurrency(parseFloat(aluguel.valorMensal) / 4)}/semana</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getBadgeColor(aluguel.status)}>
                        {aluguel.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-blue-800">
                              {getLocadoraName(aluguel.locadoraId || '')?.substring(0, 2) || 'LC'}
                            </span>
                          </div>
                          <span className="text-sm">{getLocadoraName(aluguel.locadoraId || '')}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAluguel(aluguel)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAluguel(aluguel)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modais */}
      {showNovoAluguelModal && (
        <NovoAluguelModal
          open={showNovoAluguelModal}
          onOpenChange={setShowNovoAluguelModal}
          onAluguelAdicionado={(aluguel) => {
            // Invalidar queries para atualizar dados
            queryClient.invalidateQueries({ queryKey: ['/api/alugueis'] });
            queryClient.invalidateQueries({ queryKey: ['/api/veiculos'] });
            setShowNovoAluguelModal(false);
            toast({
              title: "Aluguel criado com sucesso!",
              description: "O aluguel foi cadastrado no sistema.",
            });
          }}
        />
      )}

      {showEditModal && selectedAluguel && (
        <EditarAluguelModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          aluguel={selectedAluguel}
        />
      )}

      {showDeleteDialog && selectedAluguel && (
        <ExcluirAluguelDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          aluguel={selectedAluguel}
        />
      )}
    </div>
  );
}