/**
 * Modal para visualização completa do contrato gerado
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Edit, Download } from 'lucide-react';
import { Contrato } from '@/types';
import jsPDF from 'jspdf';

interface VisualizarContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onEditar: () => void;
}

export function VisualizarContratoModal({ 
  open, 
  onOpenChange, 
  contrato,
  onEditar
}: VisualizarContratoModalProps) {
  const handleImprimir = () => {
    if (!contrato) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contrato de Locação - ${contrato.cliente}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.5;
                margin: 20px;
                color: #000;
              }
              h1 {
                text-align: center;
                font-size: 16px;
                margin-bottom: 20px;
              }
              .contract-content {
                white-space: pre-line;
                text-align: justify;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="contract-content">${contrato.template}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleBaixarPDF = async () => {
    if (!contrato) return;
    
    try {
      // Cria um novo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configurações do PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 5;
      const maxWidth = pageWidth - (margin * 2);
      
      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTRATO DE LOCAÇÃO DE VEÍCULO', pageWidth / 2, margin + 10, { align: 'center' });
      
      // Conteúdo
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      let yPosition = margin + 25;
      
      // Divide o conteúdo em linhas
      const lines = contrato.template.split('\n');
      
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
      
      // Salva o PDF
      const fileName = `Contrato_${contrato.cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{contrato.titulo}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditar}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBaixarPDF}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprimir}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{contrato.cliente}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">R$ {contrato.valor.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Início</p>
              <p className="font-medium">{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Término</p>
              <p className="font-medium">{contrato.dataFim ? new Date(contrato.dataFim).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Conteúdo do Contrato</h3>
            <div 
              className="whitespace-pre-line text-sm font-mono bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto"
              style={{ fontSize: '11px', lineHeight: '1.4' }}
            >
              {contrato.template}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}