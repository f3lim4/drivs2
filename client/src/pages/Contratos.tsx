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
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { NovoContratoModal } from '@/components/contratos/NovoContratoModal';
import { VisualizarContratoModal } from '@/components/contratos/VisualizarContratoModal';
import { EditarContratoModal } from '@/components/contratos/EditarContratoModal';
import { Contrato } from '@/types';
import jsPDF from 'jspdf';

export default function Contratos() {
  const { isAdmin, isLocadora, profile } = useAuth();
  const { toast } = useToast();
  const { contratos, isLoading, createContrato, updateContrato, deleteContrato } = useContratos();
  const [templates, setTemplates] = useState<any[]>([]);
  const [showNovoContratoModal, setShowNovoContratoModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);

  const handleContratoGerado = async (novoContrato: Contrato) => {
    try {
      await createContrato.mutateAsync(novoContrato);
      toast({
        title: "Contrato Gerado",
        description: `Contrato para ${novoContrato.cliente} foi gerado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar contrato. Tente novamente.",
        variant: "destructive",
      });
    }
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
        
        pdf.text(`${dadosLocadora.rua}, ${dadosLocadora.numero} - ${dadosLocadora.bairro}`, pageWidth / 2, yPosition, { align: 'center' });
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

      {/* Seção principal de gestão de contratos */}
      <div className="space-y-6">
        {/* Header da seção */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Gerenciamento de Contratos</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Gerencie templates e gere contratos personalizados
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Subir seu contrato
              </Button>
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

        {/* Seção de templates */}
        {contratos.length === 0 ? (
          <div></div>
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

        {/* Seção de informações sobre contratos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-medium">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Upload do Template</h4>
                  <p className="text-sm text-muted-foreground">
                    Faça upload do seu modelo de contrato em formato Word ou PDF
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-medium">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Personalização</h4>
                  <p className="text-sm text-muted-foreground">
                    O sistema preenchera automaticamente com dados do motorista e veículo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-medium">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Geração</h4>
                  <p className="text-sm text-muted-foreground">
                    Gere contratos prontos para assinatura em segundos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-4">
                {/* Dados da Locadora */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-primary">📋 Dados da Locadora</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{NOME_LOCADORA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{CNPJ}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{ENDERECO_LOCADORA}}"}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Motorista */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-success">👤 Dados do Motorista</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{NOME_MOTORISTA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{DATA_NASCIMENTO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{CPF_MOTORISTA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{RG_MOTORISTA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{CNH_MOTORISTA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{TELEFONE_MOTORISTA}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{ENDERECO_MOTORISTA}}"}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Veículo */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-warning">🚗 Dados do Veículo</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{MODELO_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{MARCA_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{ANO_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{COR_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{PLACA_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{CHASSI_VEICULO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{RENAVAM_VEICULO}}"}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Contrato */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-destructive">📄 Dados do Contrato</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{DATA_INICIO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{MESES_CONTRATO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{VALOR_SEMANAL}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{CAUCAO}}"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-muted p-1 rounded">
                      <span>{"{{LIMITE_KM}}"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Como usar:</strong> Copie as chaves acima (incluindo as chaves duplas) e cole no seu template personalizado. 
                  O sistema irá substituir automaticamente pelos dados reais do motorista e veículo selecionados.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Novo Contrato */}
      <NovoContratoModal
        open={showNovoContratoModal}
        onOpenChange={setShowNovoContratoModal}
        onContratoGerado={handleContratoGerado}
      />

      {/* Modal Visualizar Contrato */}
      <VisualizarContratoModal
        open={showVisualizarModal}
        onOpenChange={setShowVisualizarModal}
        contrato={selectedContrato}
        onEditar={() => {
          setShowVisualizarModal(false);
          setShowEditarModal(true);
        }}
      />

      {/* Modal Editar Contrato */}
      <EditarContratoModal
        open={showEditarModal}
        onOpenChange={setShowEditarModal}
        contrato={selectedContrato}
        onContratoEditado={handleContratoEditado}
      />
    </div>
  );
}