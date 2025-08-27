/**
 * Página de gestão de contratos do sistema DRIVS
 * Permite gerenciar templates e gerar contratos personalizados
 */

import { useState } from 'react';
import { Plus, Upload, FileText, Download, Eye, EyeOff, Edit, Trash2, Filter, Search, X, TrendingUp, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '@/hooks/useContratos';
import { useQuery } from '@tanstack/react-query';
import { registrarAtividade } from '@/utils/activityLogger';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { NovoContratoModal } from '@/components/contratos/NovoContratoModal';
import { VisualizarContratoModal } from '@/components/contratos/VisualizarContratoModal';
import { EditarContratoModal } from '@/components/contratos/EditarContratoModal';
import { UploadTemplateModal } from '@/components/contratos/UploadTemplateModal';
import { TemplatesModal } from '@/components/contratos/TemplatesModal';
import { UploadContratoModal } from '@/components/contratos/UploadContratoModal';
import { ConfirmarSenhaModal } from '@/components/contratos/ConfirmarSenhaModal';
import { useTemplateContratos } from '@/hooks/useTemplateContratos';
import { Contrato } from '@/types';
import jsPDF from 'jspdf';
import { calcularContratoExato } from '@/utils/contratoCalculos';
import { ProtectedAction } from '@/components/subscription/ProtectedAction';

export default function Contratos() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const { contratos, isLoading, createContrato, updateContrato, deleteContrato } = useContratos();
  const { templates, isLoading: isLoadingTemplates, deleteTemplate } = useTemplateContratos();
  
  // Buscar dados adicionais necessários para o sistema completo
  const { data: motoristas = [], isLoading: loadingMotoristas } = useQuery({
    queryKey: ['/api/motoristas', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  const { data: veiculos = [], isLoading: loadingVeiculos } = useQuery({
    queryKey: ['/api/veiculos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });

  const { data: alugueis = [], isLoading: loadingAlugueis } = useQuery({
    queryKey: ['/api/alugueis', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
  });
  const [showNovoContratoModal, setShowNovoContratoModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showUploadTemplateModal, setShowUploadTemplateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showUploadContratoModal, setShowUploadContratoModal] = useState(false);
  const [showConfirmarSenhaModal, setShowConfirmarSenhaModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<Contrato | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAllColumns, setShowAllColumns] = useState(true);

  const handleContratoGerado = (novoContrato: Contrato) => {
    // O contrato já foi criado no modal, só precisamos mostrar o toast de sucesso
    toast({
      title: "Contrato Gerado",
      description: `Contrato para ${novoContrato.cliente} foi gerado com sucesso!`,
    });
  };

  const handleVisualizarContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setShowVisualizarModal(true);
  };

  const handleEditarContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setShowEditarModal(true);
  };

  const handleContratoEditado = async (contratoAtualizado: Contrato) => {
    try {
      // Garantir que o valor seja string para o backend
      const contratoParaAtualizar = {
        ...contratoAtualizado,
        valor: contratoAtualizado.valor.toString(),
        valorSemanal: contratoAtualizado.valorSemanal?.toString() || null,
      };
      await updateContrato.mutateAsync(contratoParaAtualizar as any);
      toast({
        title: "Contrato Atualizado",
        description: `Contrato de ${contratoAtualizado.cliente} foi atualizado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirTemplate = async (templateId: string) => {
    try {
      await deleteTemplate.mutateAsync(templateId);
      toast({
        title: "Template Excluído",
        description: "Template foi excluído com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir template. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirContrato = (contrato: Contrato) => {
    setContratoParaExcluir(contrato);
    setShowConfirmarSenhaModal(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!contratoParaExcluir) return;
    
    try {
      await deleteContrato.mutateAsync(contratoParaExcluir.id);
      
      // Registrar atividade
      try {
        await registrarAtividade(
          profile?.locadoraId || '',
          profile?.email || 'usuario@drivs.me',
          'excluir',
          'contrato',
          contratoParaExcluir.id,
          `Contrato excluído: ${contratoParaExcluir.cliente} - ${contratoParaExcluir.tipo}`
        );
      } catch (activityError) {
        console.warn('Erro ao registrar atividade:', activityError);
      }

      toast({
        title: "Contrato Excluído",
        description: `Contrato de ${contratoParaExcluir.cliente} foi excluído com sucesso.`,
      });
      
      setShowConfirmarSenhaModal(false);
      setContratoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };



  const handleUploadContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setShowUploadContratoModal(true);
  };



  const handleUploadSuccess = (contratoId: string, arquivoAssinado: string) => {
    // Recarregar os contratos para refletir as mudanças
    toast({
      title: "Upload Concluído",
      description: "Contrato assinado foi enviado com sucesso!",
    });
    
    // Atualizar o contrato na lista local
    // A query será revalidada automaticamente
  };

  const handleBaixarPDF = async (contrato: Contrato) => {
    try {
      // Buscar dados da locadora
      const locadoraId = profile?.locadoraId;
      
      let dadosLocadora = null;
      if (locadoraId) {
        const response = await fetch(`/api/locadoras/${locadoraId}`);
        if (response.ok) {
          dadosLocadora = await response.json();
        }
      }
      
      // Cria um novo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configurações do PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 5;
      const maxWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Título do contrato
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTRATO DE LOCAÇÃO DE VEÍCULO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Conteúdo do contrato com fonte menor
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const lines = (contrato.template || '').split('\n');
      
      for (const line of lines) {
        // Verifica se precisa de nova página
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        if (line.trim() === '') {
          yPosition += lineHeight / 2;
          continue;
        }
        
        // Quebra linhas longas
        const wrappedLines = pdf.splitTextToSize(line, maxWidth);
        
        for (const wrappedLine of wrappedLines) {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        }
      }
      
      // Sem rodapé de assinaturas
      
      // Salva o PDF
      const fileName = `Contrato_${contrato.cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Baixado",
        description: `Contrato de ${contrato.cliente} foi baixado com sucesso!`,
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Filtrar e ordenar contratos
  const contratosFiltrados = contratos
    .filter(contrato => {
      const passaBusca = busca === '' || 
        contrato.cliente.toLowerCase().includes(busca.toLowerCase()) ||
        contrato.tipo.toLowerCase().includes(busca.toLowerCase());
      
      const passaStatus = filtroStatus === 'todos' || contrato.status === filtroStatus;
      
      return passaBusca && passaStatus;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'mais-novos':
          // Ordena por data de criação decrescente (mais novos primeiro)
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'mais-antigos':
          // Ordena por data de criação crescente (mais antigos primeiro)
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case 'cliente-az':
          // Ordena por nome do cliente A-Z
          return a.cliente.localeCompare(b.cliente);
        case 'cliente-za':
          // Ordena por nome do cliente Z-A
          return b.cliente.localeCompare(a.cliente);

        case 'data-inicio':
          // Ordena por data de início mais recente
          return new Date(b.dataInicio || '').getTime() - new Date(a.dataInicio || '').getTime();
        case 'data-fim':
          // Ordena por data de fim mais próxima
          return new Date(a.dataFim || '').getTime() - new Date(b.dataFim || '').getTime();
        default:
          return 0;
      }
    });

  // Paginação
  const paginatedContratos = contratosFiltrados.slice(
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

  // Estatísticas
  const totalContratos = contratos.length;
  const contratosAtivos = contratos.filter(c => c.status === 'ativo').length;
  const contratosFinalizados = contratos.filter(c => c.status === 'finalizado').length;
  const contratosCancelados = contratos.filter(c => c.status === 'cancelado').length;
  
  // SOMA DOS VALORES MENSAIS DOS CONTRATOS
  const valorTotalMensal = contratos.reduce((sum, c) => {
    if (c.valorSemanal) {
      // Converte valor semanal para mensal: valorSemanal * 4.35 (baseado em 30.44 dias/mês ÷ 7 dias/semana)
      const valorMensalContrato = parseFloat(c.valorSemanal) * 4.35;
      return sum + valorMensalContrato;
    }
    // Fallback para contratos antigos sem valorSemanal
    return sum + (parseFloat(c.valor) || 0);
  }, 0);

  // SOMA DOS VALORES TOTAIS DOS CONTRATOS (valor completo dos contratos)
  const valorTotalGeral = contratos.reduce((sum, c) => {
    return sum + (parseFloat(c.valor) || 0);
  }, 0);

  // Formatar currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_aberto':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Em Aberto</Badge>;
      case 'ativo':
        return <Badge variant="default" className="bg-green-600 text-white">Ativo</Badge>;
      case 'cancelado':
        return <Badge variant="destructive" className="bg-red-600 text-white">Cancelado</Badge>;
      case 'encerrado':
        return <Badge variant="secondary" className="bg-gray-600 text-white">Encerrado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Sistema de loading completo - verifica múltiplas fontes
  const loading = isLoading || isLoadingTemplates || loadingMotoristas || loadingVeiculos || loadingAlugueis;

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-center">
            Carregando contratos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Contratos */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-blue-700">TOTAL DE CONTRATOS</p>
                <p className="text-xl font-bold text-blue-800">{totalContratos}</p>
                <p className="text-xs text-blue-600">
                  {contratosAtivos} ativos
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center ml-auto">
                <FileText className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos Ativos */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-green-700">CONTRATOS ATIVOS</p>
                <p className="text-xl font-bold text-green-800">{contratosAtivos}</p>
                <p className="text-xs text-green-600">
                  {contratosFinalizados} finalizados
                </p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center ml-auto">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor Mensal */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">VALOR MENSAL</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(valorTotalMensal)}</p>
                <p className="text-xs text-purple-600">
                  Receita mensal dos contratos
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center ml-auto">
                <DollarSign className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos Cancelados */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-red-700">CANCELADOS</p>
                <p className="text-xl font-bold text-red-800">{contratosCancelados}</p>
                <p className="text-xs text-red-600">
                  Contratos cancelados
                </p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center ml-auto">
                <X className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-50/50 border-gray-200">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div className="space-y-2 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar contrato..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 text-sm"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 md:col-span-2">
              <Button 
                variant="outline"
                onClick={() => setShowTemplatesModal(true)}
                className="flex items-center gap-2 py-2 px-4 text-sm"
              >
                <FileText className="w-4 h-4" />
                Templates
              </Button>
              
              <ProtectedAction fallbackMessage="Renove seu plano para gerar novos contratos">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 py-2 px-4 text-sm"
                  onClick={() => setShowNovoContratoModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Gerar Contrato
                </Button>
              </ProtectedAction>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de contratos */}
      {contratos.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contrato gerado ainda</p>
                  <p className="text-sm">Clique em "Gerar Contrato" para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : contratosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contrato encontrado com os filtros aplicados</p>
                  <p className="text-sm">Tente ajustar os filtros de busca</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Contratos Gerados ({contratosFiltrados.length})</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAllColumns(!showAllColumns)}
                    title={showAllColumns ? "Esconder colunas extras" : "Mostrar todas as colunas"}
                    data-testid="button-toggle-columns"
                  >
                    {showAllColumns ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Ordenação */}
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais-novos">Mais Novos Primeiro</SelectItem>
                    <SelectItem value="mais-antigos">Mais Antigos Primeiro</SelectItem>
                    <SelectItem value="cliente-az">Cliente (A-Z)</SelectItem>
                    <SelectItem value="cliente-za">Cliente (Z-A)</SelectItem>
                    <SelectItem value="data-inicio">Data de Início</SelectItem>
                    <SelectItem value="data-fim">Data de Fim</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MOTORISTA/CLIENTE</TableHead>
                      <TableHead>VEÍCULO</TableHead>
                      <TableHead>DATA INÍCIO</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>UPLOAD</TableHead>
                      <TableHead>AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContratos.map((contrato) => (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          <p className="font-medium">{contrato.motoristaNome || contrato.cliente || 'N/A'}</p>
                          {contrato.motoristaCpf && (
                            <p className="text-xs text-muted-foreground">{contrato.motoristaCpf}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {showAllColumns ? (
                            contrato.veiculoPlaca ? (
                              <div>
                                <p className="font-medium">{contrato.veiculoPlaca}</p>
                                <p className="text-xs text-muted-foreground">
                                  {contrato.veiculoMarca} {contrato.veiculoModelo}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {showAllColumns ? (
                            <p>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {showAllColumns ? (
                            getStatusBadge(contrato.status)
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {showAllColumns ? (
                            contrato.arquivoAssinado ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Enviado
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUploadContrato(contrato)}
                                className="h-7 text-xs"
                              >
                                Enviar
                              </Button>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleVisualizarContrato(contrato)}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleBaixarPDF(contrato)}
                              title="Baixar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {isLocadora && (
                              <>
                                <ProtectedAction fallbackMessage="Renove seu plano para editar contratos">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEditarContrato(contrato)}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </ProtectedAction>
                                <ProtectedAction fallbackMessage="Renove seu plano para excluir contratos">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleExcluirContrato(contrato)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </ProtectedAction>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

      {/* Paginação */}
      {contratosFiltrados.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={contratosFiltrados.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modais */}
      <NovoContratoModal 
        open={showNovoContratoModal}
        onOpenChange={setShowNovoContratoModal}
        onContratoGerado={handleContratoGerado}
      />

      <UploadTemplateModal
        open={showUploadTemplateModal}
        onOpenChange={setShowUploadTemplateModal}
        onTemplateUploaded={() => {
          setShowUploadTemplateModal(false);
          toast({
            title: "Template salvo!",
            description: "Template de contrato foi salvo com sucesso.",
          });
        }}
      />

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
      />

      {selectedContrato && (
        <>
          <VisualizarContratoModal 
            open={showVisualizarModal}
            onOpenChange={setShowVisualizarModal}
            contrato={selectedContrato}
            onEditar={() => {
              setShowVisualizarModal(false);
              setShowEditarModal(true);
            }}
          />
          
          <EditarContratoModal 
            open={showEditarModal}
            onOpenChange={setShowEditarModal}
            contrato={selectedContrato}
            onContratoEditado={handleContratoEditado}
          />
          
          <UploadContratoModal 
            open={showUploadContratoModal}
            onOpenChange={setShowUploadContratoModal}
            contrato={selectedContrato}
            onUploadSuccess={handleUploadSuccess}
          />
        </>
      )}

      <ConfirmarSenhaModal
        open={showConfirmarSenhaModal}
        onOpenChange={setShowConfirmarSenhaModal}
        onConfirm={handleConfirmarExclusao}
        contratoNome={contratoParaExcluir ? `${contratoParaExcluir.cliente} - ${contratoParaExcluir.tipo}` : ''}
        loading={deleteContrato.isPending}
      />
    </div>
  );
}