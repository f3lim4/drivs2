/**
 * Página de gestão de contratos do sistema DRIVS
 * Permite gerenciar templates e gerar contratos personalizados
 */

import { useState } from 'react';
import { Plus, Upload, FileText, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '@/hooks/useContratos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { NovoContratoModal } from '@/components/contratos/NovoContratoModal';
import { VisualizarContratoModal } from '@/components/contratos/VisualizarContratoModal';
import { EditarContratoModal } from '@/components/contratos/EditarContratoModal';
import { UploadTemplateModal } from '@/components/contratos/UploadTemplateModal';
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
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);

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

  const handleExcluirContrato = async (contrato: Contrato) => {
    try {
      await deleteContrato.mutateAsync(contrato.id);
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
      {/* Header da página */}
      <DrivsHeader 
        title="Contratos"
        subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
      />

      {/* Botão de ação no topo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              onClick={() => setShowNovoContratoModal(true)}
            >
              <Plus className="w-4 h-4" />
              Gerar Contrato
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar contratos e templates */}
      <Tabs defaultValue="contratos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contratos">Contratos Gerados</TabsTrigger>
          <TabsTrigger value="templates">Meus Templates</TabsTrigger>
        </TabsList>
        
        {/* Aba de Contratos */}
        <TabsContent value="contratos" className="space-y-4">

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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contratos Gerados</CardTitle>
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
                      <TableHead>AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratos.map((contrato) => (
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
        </TabsContent>

        {/* Aba de Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Meus Templates</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Gerencie seus templates personalizados de contratos
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowUploadTemplateModal(true)}
                >
                  <Upload className="w-4 h-4" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Lista de templates */}
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template personalizado ainda</p>
                  <p className="text-sm">Clique em "Novo Template" para criar seu primeiro template</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Templates Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NOME</TableHead>
                      <TableHead>CRIADO EM</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <p className="font-medium">{template.nome}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.ativo ? "default" : "secondary"}>
                            {template.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleExcluirTemplate(template.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
        </>
      )}
    </div>
  );
}