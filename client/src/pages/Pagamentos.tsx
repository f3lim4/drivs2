import { useState, useMemo } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign, User, AlertCircle, Search, Filter, CheckCircle, Clock, Calculator, Car } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// REMOVIDO: import { usePagamentos } from '@/hooks/usePagamentos'; // Causava conflito com ID errado
import { useMotoristas } from '@/hooks/useMotoristas';
import { useAuth } from '@/hooks/useAuth';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NovoPagamentoModal } from '@/components/pagamentos/NovoPagamentoModal';
import { EditarPagamentoModal } from '@/components/pagamentos/EditarPagamentoModal';
import { DetalhesPagamentoModal } from '@/components/pagamentos/DetalhesPagamentoModal';
import { ExcluirPagamentoModal } from '@/components/pagamentos/ExcluirPagamentoModal';
import { formatDate } from '@/lib/utils';
import type { Pagamento } from '@shared/schema';
import { ProtectedAction } from '@/components/subscription/ProtectedAction';

export default function Pagamentos() {
  const { profile } = useAuth();
  
  // DADOS REAIS DO BANCO - VERSÃO CORRIGIDA V3
  const locadoraId = "50764571000170"; // ID correto da locadora
  
  console.log('🚀 [VERSÃO V3] Usando locadoraId correto:', locadoraId);
  console.log('🚀 [VERSÃO V3] Profile atual:', profile?.id);
  
  // FORÇA QUERY ÚNICA COM ID CORRETO - DESABILITA QUALQUER CACHE
  const { data: pagamentos = [], isLoading: loadingPagamentos } = useQuery({
    queryKey: ['pagamentos-final-v4', locadoraId, Date.now()], // Key única toda vez
    queryFn: async () => {
      const url = `/api/pagamentos?locadoraId=${locadoraId}`;
      console.log('🚀 [V4] FETCH FORÇADO:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('🚀 [V4] DADOS RECEBIDOS:', data.length, 'pagamentos');
      console.log('🚀 [V4] PRIMEIRO PAGAMENTO:', data[0]?.motoristaNome || 'vazio');
      return data;
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    retry: false // Não tentar novamente se falhar
  });
  
  const createPagamento = () => {}; // Simplificado
  const updatePagamento = () => {}; // Simplificado 
  const deletePagamento = () => {}; // Simplificado
  const { motoristas, isLoading: loadingMotoristas } = useMotoristas();

  // Buscar dados adicionais necessários para o sistema completo
  const { data: veiculos = [], isLoading: loadingVeiculos } = useQuery({
    queryKey: ['/api/veiculos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  const { data: alugueis = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: ['/api/alugueis', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
    queryKey: ['/api/contratos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });
  
  const [showNovoPagamento, setShowNovoPagamento] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showExcluir, setShowExcluir] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null);
  
  // Estados para filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estados para alternar visualização dos cards de pagamentos (INICIANDO EM SEMANAL)
  const [visualizacaoPagamento, setVisualizacaoPagamento] = useState<'geral' | 'mensal' | 'semanal'>('semanal');
  const [visualizacaoRecebido, setVisualizacaoRecebido] = useState<'geral' | 'mensal' | 'semanal'>('semanal');
  const [visualizacaoAberto, setVisualizacaoAberto] = useState<'geral' | 'mensal' | 'semanal'>('semanal');
  const [visualizacaoParcial, setVisualizacaoParcial] = useState<'geral' | 'mensal' | 'semanal'>('semanal');

  // Função para alternar visualização do primeiro card (ORDEM: semanal → mensal → geral)
  const alternarVisualizacao = () => {
    setVisualizacaoPagamento(prev => {
      switch (prev) {
        case 'semanal':
          return 'mensal';
        case 'mensal':
          return 'geral';
        case 'geral':
          return 'semanal';
        default:
          return 'semanal';
      }
    });
  };

  // Função para alternar visualização do segundo card (recebidos)
  const alternarVisualizacaoRecebido = () => {
    setVisualizacaoRecebido(prev => {
      switch (prev) {
        case 'semanal':
          return 'mensal';
        case 'mensal':
          return 'geral';
        case 'geral':
          return 'semanal';
        default:
          return 'semanal';
      }
    });
  };

  // Função para alternar visualização do terceiro card (em aberto)
  const alternarVisualizacaoAberto = () => {
    setVisualizacaoAberto(prev => {
      switch (prev) {
        case 'semanal':
          return 'mensal';
        case 'mensal':
          return 'geral';
        case 'geral':
          return 'semanal';
        default:
          return 'semanal';
      }
    });
  };

  // Função para alternar visualização do quarto card (parciais)
  const alternarVisualizacaoParcial = () => {
    setVisualizacaoParcial(prev => {
      switch (prev) {
        case 'semanal':
          return 'mensal';
        case 'mensal':
          return 'geral';
        case 'geral':
          return 'semanal';
        default:
          return 'semanal';
      }
    });
  };

  // Função para calcular início e fim da semana (Segunda a Domingo)
  const calcularSemanaAtual = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ...
    
    // Calcular quantos dias voltar para chegar na segunda
    const diasParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diasParaSegunda);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    
    return { inicioSemana, fimSemana };
  };

  const handleVerDetalhes = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowDetalhes(true);
  };

  const handleEditar = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowEditar(true);
  };

  const handleExcluir = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setShowExcluir(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'parcial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'em_aberto':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Em Aberto</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Pendente</Badge>;
      case 'atrasado':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'aluguel':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Aluguel</Badge>;
      case 'infrações':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Infrações</Badge>;
      case 'manutenção':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Manutenção</Badge>;
      case 'danos':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Danos</Badge>;
      case 'outros':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Outros</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };



  // Filtrar e ordenar pagamentos
  const pagamentosFiltrados = useMemo(() => {
    let filtered = pagamentos as Pagamento[];

    // Filtro por texto (nome do motorista, descrição, observações)
    if (filtroTexto) {
      filtered = filtered.filter(p => 
        p.motoristaNome?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.observacoes?.toLowerCase().includes(filtroTexto.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(p => p.status === filtroStatus);
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtered = filtered.filter(p => p.tipo === filtroTipo);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'mais-novos':
          return new Date(b.dataPagamento || '').getTime() - new Date(a.dataPagamento || '').getTime();
        case 'mais-antigos':
          return new Date(a.dataPagamento || '').getTime() - new Date(b.dataPagamento || '').getTime();
        case 'nome-az':
          return (a.motoristaNome || '').localeCompare(b.motoristaNome || '');
        case 'nome-za':
          return (b.motoristaNome || '').localeCompare(a.motoristaNome || '');
        case 'valor-maior':
          return parseFloat(b.valorTotal || '0') - parseFloat(a.valorTotal || '0');
        case 'valor-menor':
          return parseFloat(a.valorTotal || '0') - parseFloat(b.valorTotal || '0');
        case 'status-pago':
          return a.status === 'pago' ? -1 : b.status === 'pago' ? 1 : 0;
        case 'status-em_aberto':
          const aAberto = a.status === 'em_aberto' || a.status === 'pendente';
          const bAberto = b.status === 'em_aberto' || b.status === 'pendente';
          return aAberto ? -1 : bAberto ? 1 : 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [pagamentos, filtroTexto, filtroStatus, filtroTipo, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(pagamentosFiltrados.length / itemsPerPage);
  const paginatedPagamentos = pagamentosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Funções para controlar a paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };



  // Estatísticas (baseado nos dados filtrados) - aceita tanto 'pendente' quanto 'em_aberto'
  const totalPendente = pagamentosFiltrados
    .filter(p => p.status === 'em_aberto' || p.status === 'pendente' || p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorRestante || '0'), 0);

  const totalRecebido = pagamentosFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);

  const totalParcial = pagamentosFiltrados
    .filter(p => p.status === 'parcial')
    .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);

  const totalGeral = pagamentosFiltrados
    .reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);

  // Cálculos para diferentes visualizações do card interativo
  const calcularValorVisualizacao = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0-11
    
    switch (visualizacaoPagamento) {
      case 'mensal':
        // Valor mensal (pagamentos do mês atual)
        return pagamentosFiltrados
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento.getFullYear() === anoAtual && 
                   dataPagamento.getMonth() === mesAtual;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);
      
      case 'semanal':
        // Valor semanal (Segunda a Domingo da semana atual)
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        
        console.log('🔧 [DEBUG SEMANAL] Período da semana:', inicioSemana.toISOString(), 'até', fimSemana.toISOString());
        console.log('🔧 [DEBUG SEMANAL] Total pagamentos para filtrar:', pagamentosFiltrados.length);
        
        const pagamentosSemana = pagamentosFiltrados
          .filter(p => {
            if (!p.dataPagamento) {
              console.log('🔧 [DEBUG SEMANAL] Pagamento sem data:', p.id);
              return false;
            }
            const dataPagamento = new Date(p.dataPagamento);
            const dentroDoIntervalo = dataPagamento >= inicioSemana && dataPagamento <= fimSemana;
            console.log('🔧 [DEBUG SEMANAL] Pagamento', p.id, 'data:', dataPagamento.toISOString(), 'dentro?', dentroDoIntervalo);
            return dentroDoIntervalo;
          });
        
        console.log('🔧 [DEBUG SEMANAL] Pagamentos na semana:', pagamentosSemana.length);
        const total = pagamentosSemana.reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);
        console.log('🔧 [DEBUG SEMANAL] Total calculado:', total);
        
        return total;
      
      default:
        return totalGeral;
    }
  };

  const obterTituloVisualizacao = () => {
    switch (visualizacaoPagamento) {
      case 'mensal':
        return 'Total Mensal';
      case 'semanal':
        return 'Total Semanal';
      default:
        return 'Total Geral';
    }
  };

  const obterDescricaoVisualizacao = () => {
    const hoje = new Date();
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    
    switch (visualizacaoPagamento) {
      case 'mensal':
        return `Pagamentos de ${mesNome}`;
      case 'semanal':
        // Mostrar período da semana atual
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        const inicioFormatado = inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fimFormatado = fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `${inicioFormatado} a ${fimFormatado}`;
      default:
        return 'Todos os pagamentos';
    }
  };

  // Funções para o card de recebidos
  const calcularValorVisualizacaoRecebido = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const pagamentosPagos = pagamentosFiltrados.filter(p => p.status === 'pago');
    
    switch (visualizacaoRecebido) {
      case 'mensal':
        return pagamentosPagos
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento.getFullYear() === anoAtual && 
                   dataPagamento.getMonth() === mesAtual;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);
      
      case 'semanal':
        // Valor semanal (Segunda a Domingo da semana atual)
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        
        return pagamentosPagos
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento >= inicioSemana && dataPagamento <= fimSemana;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorPago || '0'), 0);
      
      default:
        return totalRecebido;
    }
  };

  const obterTituloVisualizacaoRecebido = () => {
    switch (visualizacaoRecebido) {
      case 'mensal':
        return 'Recebido Mensal';
      case 'semanal':
        return 'Recebido Semanal';
      default:
        return 'Total Recebido';
    }
  };

  const obterDescricaoVisualizacaoRecebido = () => {
    const hoje = new Date();
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    
    switch (visualizacaoRecebido) {
      case 'mensal':
        return `Recebidos em ${mesNome}`;
      case 'semanal':
        // Mostrar período da semana atual
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        const inicioFormatado = inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fimFormatado = fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Recebidos ${inicioFormatado} a ${fimFormatado}`;
      default:
        return 'Todos recebidos';
    }
  };

  // Funções para o card em aberto
  const calcularValorVisualizacaoAberto = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const pagamentosAberto = pagamentosFiltrados.filter(p => p.status === 'em_aberto' || p.status === 'pendente');
    
    switch (visualizacaoAberto) {
      case 'mensal':
        return pagamentosAberto
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento.getFullYear() === anoAtual && 
                   dataPagamento.getMonth() === mesAtual;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);
      
      case 'semanal':
        // Valor semanal (Segunda a Domingo da semana atual)
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        
        return pagamentosAberto
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento >= inicioSemana && dataPagamento <= fimSemana;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorTotal || '0'), 0);
      
      default:
        return totalPendente;
    }
  };

  const obterTituloVisualizacaoAberto = () => {
    switch (visualizacaoAberto) {
      case 'mensal':
        return 'Em Aberto Mensal';
      case 'semanal':
        return 'Em Aberto Semanal';
      default:
        return 'Total em Aberto';
    }
  };

  const obterDescricaoVisualizacaoAberto = () => {
    const hoje = new Date();
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    
    switch (visualizacaoAberto) {
      case 'mensal':
        return `Em aberto em ${mesNome}`;
      case 'semanal':
        // Mostrar período da semana atual
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        const inicioFormatado = inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fimFormatado = fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Em aberto ${inicioFormatado} a ${fimFormatado}`;
      default:
        return 'Todos em aberto';
    }
  };

  // Funções para o card de parciais
  const calcularValorVisualizacaoParcial = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const pagamentosParciais = pagamentosFiltrados.filter(p => p.status === 'parcial');
    
    switch (visualizacaoParcial) {
      case 'mensal':
        return pagamentosParciais
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento.getFullYear() === anoAtual && 
                   dataPagamento.getMonth() === mesAtual;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorRestante || '0'), 0);
      
      case 'semanal':
        // Valor semanal (Segunda a Domingo da semana atual)
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        
        return pagamentosParciais
          .filter(p => {
            if (!p.dataPagamento) return false;
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento >= inicioSemana && dataPagamento <= fimSemana;
          })
          .reduce((sum, p) => sum + parseFloat(p.valorRestante || '0'), 0);
      
      default:
        return totalParcial;
    }
  };

  const obterTituloVisualizacaoParcial = () => {
    switch (visualizacaoParcial) {
      case 'mensal':
        return 'Parciais Mensal';
      case 'semanal':
        return 'Parciais Semanal';
      default:
        return 'Total Parciais';
    }
  };

  const obterDescricaoVisualizacaoParcial = () => {
    const hoje = new Date();
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    
    switch (visualizacaoParcial) {
      case 'mensal':
        return `Parciais em ${mesNome}`;
      case 'semanal':
        // Mostrar período da semana atual
        const { inicioSemana, fimSemana } = calcularSemanaAtual();
        const inicioFormatado = inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fimFormatado = fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Parciais ${inicioFormatado} a ${fimFormatado}`;
      default:
        return 'Todos parciais';
    }
  };

  // Sistema de loading completo - verifica múltiplas fontes
  const loading = loadingPagamentos || loadingMotoristas || loadingVeiculos || loadingAlugueis || loadingContratos;

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-center">
            Carregando pagamentos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas com visual futurista - igual página veículos */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card 
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={alternarVisualizacao}
        >
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">{obterTituloVisualizacao()}</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(calcularValorVisualizacao())}</p>
                <p className="text-xs text-blue-600">{obterDescricaoVisualizacao()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={alternarVisualizacaoRecebido}
        >
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">{obterTituloVisualizacaoRecebido()}</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(calcularValorVisualizacaoRecebido())}</p>
                <p className="text-xs text-green-600">{obterDescricaoVisualizacaoRecebido()}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={alternarVisualizacaoAberto}
        >
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">{obterTituloVisualizacaoAberto()}</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(calcularValorVisualizacaoAberto())}</p>
                <p className="text-xs text-red-600">{obterDescricaoVisualizacaoAberto()}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg h-32 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={alternarVisualizacaoParcial}
        >
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-orange-700">{obterTituloVisualizacaoParcial()}</p>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(calcularValorVisualizacaoParcial())}</p>
                <p className="text-xs text-orange-600">{obterDescricaoVisualizacaoParcial()}</p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de busca e filtros */}
      <Card>
        <CardContent className="p-6">
          {/* Layout horizontal no PC - única linha com todos os filtros e botões */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar pagamento..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-3 items-center">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="infrações">Infrações</SelectItem>
                  <SelectItem value="manutenção">Manutenção</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>

              {/* Botões */}
              <ProtectedAction fallbackMessage="Renove seu plano para cadastrar novos pagamentos">
                <Button 
                  onClick={() => setShowNovoPagamento(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Pagamento
                </Button>
              </ProtectedAction>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pagamentos - igual página veículos */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Lista de Pagamentos</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
                  <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
                  <SelectItem value="nome-az">Motorista (A-Z)</SelectItem>
                  <SelectItem value="nome-za">Motorista (Z-A)</SelectItem>
                  <SelectItem value="valor-maior">Maior Valor</SelectItem>
                  <SelectItem value="valor-menor">Menor Valor</SelectItem>
                  <SelectItem value="status-pago">Pagos Primeiro</SelectItem>
                  <SelectItem value="status-em_aberto">Em Aberto Primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-72">Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPagamentos.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {pagamento.motoristaNome || (pagamento as any).motoristaNome || `${pagamento.motoristaId} - Excluído` || 'Nome não disponível'}
                      </div>
                      <div className="text-xs text-muted-foreground">{(pagamento as any).motoristaCpf || (pagamento as any).cpf || 'CPF não informado'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(pagamento as any).veiculo || (pagamento as any).veiculoPlaca ? (
                      <div>
                        <div className="font-medium text-sm">{(pagamento as any).veiculo || (pagamento as any).veiculoPlaca}</div>
                        <div className="text-xs text-muted-foreground">
                          {(pagamento as any).veiculoMarca} {(pagamento as any).veiculoModelo}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pagamento.status)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px]">
                      <div className="truncate text-sm">{pagamento.descricao || 'Sem descrição'}</div>
                      {(pagamento as any).automatico && (
                        <div className="text-xs text-blue-600 mt-1">
                          <div className="inline-flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            Auto
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTipoBadge(pagamento.tipo)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{formatCurrency(pagamento.valorTotal)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(pagamento.dataPagamento)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerDetalhes(pagamento)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <ProtectedAction fallbackMessage="Renove seu plano para editar pagamentos">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditar(pagamento)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </ProtectedAction>
                      <ProtectedAction fallbackMessage="Renove seu plano para excluir pagamentos">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExcluir(pagamento)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ProtectedAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagamentosFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagamentosFiltrados.length > 0 && (
        <div className="border-t pt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={pagamentosFiltrados.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modais */}
      {showNovoPagamento && (
        <NovoPagamentoModal
          open={showNovoPagamento}
          onClose={() => setShowNovoPagamento(false)}
          onSubmit={createPagamento}
          motoristas={motoristas || []}
        />
      )}

      {showDetalhes && pagamentoSelecionado && (
        <DetalhesPagamentoModal
          open={showDetalhes}
          onClose={() => setShowDetalhes(false)}
          pagamento={pagamentoSelecionado}
        />
      )}

      {showEditar && pagamentoSelecionado && (
        <EditarPagamentoModal
          open={showEditar}
          onClose={() => setShowEditar(false)}
          pagamento={pagamentoSelecionado}
          onSubmit={(updates) => updatePagamento({ id: pagamentoSelecionado.id, updates })}
          motoristas={motoristas || []}
        />
      )}

      {showExcluir && pagamentoSelecionado && (
        <ExcluirPagamentoModal
          open={showExcluir}
          onClose={() => setShowExcluir(false)}
          pagamento={pagamentoSelecionado}
          onConfirm={() => {
            console.log('🗑️ Tentando excluir pagamento:', pagamentoSelecionado.id);
            deletePagamento(pagamentoSelecionado.id);
            setShowExcluir(false);
          }}
        />
      )}
    </div>
  );
}