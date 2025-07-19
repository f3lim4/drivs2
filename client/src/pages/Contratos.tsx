/**
 * Página de gestão de contratos do sistema DRIVS
 * Permite gerenciar templates e gerar contratos personalizados
 */

import { useState } from 'react';
import { Plus, Upload, FileText, Download, Eye, Edit, Trash2, Filter, Search, X, TrendingUp, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '@/hooks/useContratos';
import { registrarAtividade } from '@/utils/activityLogger';
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
import { ExcluirContratoDialog } from '@/components/contratos/ExcluirContratoDialog';
import { useTemplateContratos } from '@/hooks/useTemplateContratos';
import { Contrato } from '@/types';
import jsPDF from 'jspdf';

export default function Contratos() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const { contratos, isLoading, createContrato, updateContrato, deleteContrato } = useContratos();
  const { templates, isLoading: isLoadingTemplates, deleteTemplate } = useTemplateContratos();
  const [showNovoContratoModal, setShowNovoContratoModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showUploadTemplateModal, setShowUploadTemplateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showUploadContratoModal, setShowUploadContratoModal] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<Contrato | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const [sortOrder, setSortOrder] = useState<string>('mais-novos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      await updateContrato.mutateAsync(contratoAtualizado);
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
    setShowExcluirDialog(true);
  };

  const handleConfirmarExclusao = async (contrato: Contrato) => {
    try {
      await deleteContrato.mutateAsync(contrato.id);
      
      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '',
        profile?.email || 'usuario@drivs.me',
        'excluir',
        'contrato',
        contrato.id,
        `Contrato excluído: ${contrato.cliente} - ${contrato.tipo}`
      );
      
      toast({
        title: "Contrato Excluído",
        description: `Contrato de ${contrato.cliente} foi excluído.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir contrato. Tente novamente.",
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
      
      // Cabeçalho com dados da empresa
      if (dadosLocadora) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(dadosLocadora.nome, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`CNPJ: ${dadosLocadora.cnpj}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4;
        
        pdf.text(`${dadosLocadora.endereco}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4;
        
        pdf.text(`${dadosLocadora.cidade}/${dadosLocadora.estado} - CEP: ${dadosLocadora.cep}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4;
        
        pdf.text(`Tel: ${dadosLocadora.telefone} | Email: ${dadosLocadora.email}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
        
        // Linha separadora
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      }
      
      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTRATO DE LOCAÇÃO DE VEÍCULO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Informações do contrato
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Cliente: ${contrato.cliente}`, margin, yPosition);
      yPosition += 6;
      
      pdf.text(`Valor: R$ ${Number(contrato.valor).toFixed(2)}`, margin, yPosition);
      yPosition += 6;
      
      pdf.text(`Data de Início: ${new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += 6;
      
      if (contrato.dataFim) {
        pdf.text(`Data de Término: ${new Date(contrato.dataFim).toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 4;
      
      // Conteúdo do contrato
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
      
      // Rodapé com assinaturas
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition = pageHeight - 40;
      
      // Linha separadora
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Campos de assinatura
      pdf.setFontSize(9);
      pdf.text('_________________________________', margin, yPosition);
      pdf.text('_________________________________', pageWidth - margin - 60, yPosition);
      yPosition += 4;
      
      pdf.text('Assinatura do Locador', margin, yPosition);
      pdf.text('Assinatura do Locatário', pageWidth - margin - 60, yPosition);
      yPosition += 6;
      
      if (dadosLocadora) {
        pdf.text(dadosLocadora.responsavel, margin, yPosition);
      }
      pdf.text(contrato.cliente, pageWidth - margin - 60, yPosition);
      
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
        case 'valor-maior':
          // Ordena por valor decrescente (maior primeiro)
          return (parseFloat(b.valor) || 0) - (parseFloat(a.valor) || 0);
        case 'valor-menor':
          // Ordena por valor crescente (menor primeiro)
          return (parseFloat(a.valor) || 0) - (parseFloat(b.valor) || 0);
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
  const valorTotal = contratos.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);

  // Formatar currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
      case 'finalizado':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

        {/* Valor Total */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-y-0.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-purple-700">VALOR TOTAL</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(valorTotal)}</p>
                <p className="text-xs text-purple-600">
                  Soma dos contratos
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
              
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 py-2 px-4 text-sm"
                onClick={() => setShowNovoContratoModal(true)}
              >
                <Plus className="w-4 h-4" />
                Gerar Contrato
              </Button>
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
                <CardTitle>Contratos Gerados ({contratosFiltrados.length})</CardTitle>
                
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
                    <SelectItem value="valor-maior">Valor (Maior)</SelectItem>
                    <SelectItem value="valor-menor">Valor (Menor)</SelectItem>
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
                      <TableHead>CLIENTE</TableHead>
                      <TableHead>TIPO</TableHead>
                      <TableHead>VALOR</TableHead>
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
                          <p className="font-medium">{contrato.cliente}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {contrato.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">R$ {parseFloat(contrato.valor).toFixed(2)}</p>
                        </TableCell>
                        <TableCell>
                          <p>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(contrato.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {contrato.arquivoAssinado ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Enviado</span>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleUploadContrato(contrato)}
                                title="Enviar Contrato Assinado"
                                className="text-xs"
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Enviar
                              </Button>
                            )}
                          </div>
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
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditarContrato(contrato)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleExcluirContrato(contrato)}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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

      <ExcluirContratoDialog
        open={showExcluirDialog}
        onOpenChange={setShowExcluirDialog}
        contrato={contratoParaExcluir}
        onConfirmarExclusao={handleConfirmarExclusao}
      />
    </div>
  );
}