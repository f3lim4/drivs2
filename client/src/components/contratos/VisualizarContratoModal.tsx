/**
 * Modal para visualização completa do contrato gerado
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Edit, Download, User, Car, FileText, Calendar } from 'lucide-react';
import { Contrato } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

interface VisualizarContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onEditar: () => void;
}

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
}

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  categoria: string;
}

export function VisualizarContratoModal({ 
  open, 
  onOpenChange, 
  contrato,
  onEditar
}: VisualizarContratoModalProps) {
  const { profile } = useAuth();
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);

  // Buscar dados do motorista
  const { data: motoristas } = useQuery({
    queryKey: ['/api/motoristas', profile?.locadoraId],
    enabled: !!profile?.locadoraId && !!contrato,
  });

  // Buscar dados do veículo
  const { data: veiculos } = useQuery({
    queryKey: ['/api/veiculos', profile?.locadoraId],
    enabled: !!profile?.locadoraId && !!contrato,
  });

  // Encontrar motorista e veículo específicos baseados no contrato
  useEffect(() => {
    if (!contrato || !motoristas || !veiculos) return;

    // Encontrar motorista pelo nome do cliente
    const motoristaEncontrado = motoristas.find((m: Motorista) => 
      m.nome.toLowerCase().includes(contrato.cliente.toLowerCase()) ||
      contrato.cliente.toLowerCase().includes(m.nome.toLowerCase())
    );
    setMotorista(motoristaEncontrado || null);

    // Encontrar veículo pelo ID (assumindo que existe campo veiculoId no contrato)
    const veiculoEncontrado = veiculos.find((v: Veiculo) => 
      v.id === contrato.veiculoId
    );
    setVeiculo(veiculoEncontrado || null);
  }, [contrato, motoristas, veiculos]);
  
  const handleBaixarArquivoAssinado = () => {
    if (contrato?.arquivoAssinado) {
      window.location.href = `/api/contratos/${contrato.id}/download`;
    }
  };
  
  const handleImprimir = async () => {
    if (!contrato) return;
    
    // Buscar dados da locadora
    const locadoraId = profile?.locadoraId;
    
    let dadosLocadora = null;
    if (locadoraId) {
      const response = await fetch(`/api/locadoras/${locadoraId}`);
      if (response.ok) {
        dadosLocadora = await response.json();
      }
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const cabecalhoEmpresa = dadosLocadora ? `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">${dadosLocadora.nome}</h2>
          <p style="margin: 2px 0; font-size: 10px;">CNPJ: ${dadosLocadora.cnpj}</p>
          <p style="margin: 2px 0; font-size: 10px;">${dadosLocadora.endereco}</p>
          <p style="margin: 2px 0; font-size: 10px;">${dadosLocadora.cidade}/${dadosLocadora.estado} - CEP: ${dadosLocadora.cep}</p>
          <p style="margin: 2px 0; font-size: 10px;">Tel: ${dadosLocadora.telefone} | Email: ${dadosLocadora.email}</p>
        </div>
      ` : '';
      
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
              .contract-info {
                margin-bottom: 20px;
                border: 1px solid #ddd;
                padding: 10px;
                background-color: #f9f9f9;
              }
              .contract-content {
                white-space: pre-line;
                text-align: justify;
              }
              .signatures {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #000;
                padding-top: 20px;
              }
              .signature-field {
                width: 45%;
                text-align: center;
              }
              .signature-line {
                border-bottom: 1px solid #000;
                margin-bottom: 5px;
                height: 30px;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${cabecalhoEmpresa}
            <h1>CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
            <div class="contract-info">
              <p><strong>Cliente:</strong> ${contrato.cliente}</p>
              <p><strong>Valor:</strong> R$ ${Number(contrato.valor).toFixed(2)}</p>
              <p><strong>Data de Início:</strong> ${new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</p>
              ${contrato.dataFim ? `<p><strong>Data de Término:</strong> ${new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
            <div class="contract-content">${contrato.template}</div>
            <div class="signatures">
              <div class="signature-field">
                <div class="signature-line"></div>
                <p>Assinatura do Locador</p>
                <p>${dadosLocadora ? dadosLocadora.responsavel : ''}</p>
              </div>
              <div class="signature-field">
                <div class="signature-line"></div>
                <p>Assinatura do Locatário</p>
                <p>${contrato.cliente}</p>
              </div>
            </div>
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
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'em_aberto':
        return 'outline';
      case 'ativo':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'encerrado':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_aberto':
        return 'Em Aberto';
      case 'ativo':
        return 'Ativo';
      case 'cancelado':
        return 'Cancelado';
      case 'encerrado':
        return 'Encerrado';
      default:
        return status;
    }
  };

  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span>{contrato.titulo}</span>
            </div>
            <Badge variant={getBadgeVariant(contrato.status)}>
              {getStatusLabel(contrato.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* INFORMAÇÕES DO CLIENTE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nome Completo</p>
                  <p className="font-semibold">{motorista?.nome || contrato.cliente}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">CPF</p>
                  <p className="font-semibold">{motorista?.cpf || 'Não informado'}</p>
                </div>
                {motorista?.telefone && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Telefone</p>
                    <p className="font-semibold">{motorista.telefone}</p>
                  </div>
                )}
                {motorista?.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="font-semibold">{motorista.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* VEÍCULO ALUGADO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Veículo Alugado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Placa</p>
                  <p className="font-semibold">{veiculo?.placa || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Marca/Modelo</p>
                  <p className="font-semibold">{veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Não informado'}</p>
                </div>
                {veiculo && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ano</p>
                      <p className="font-semibold">{veiculo.ano}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cor</p>
                      <p className="font-semibold">{veiculo.cor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categoria</p>
                      <p className="font-semibold">{veiculo.categoria}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* INFORMAÇÕES DO CONTRATO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Detalhes do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data de Início</p>
                  <p className="font-semibold">{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</p>
                </div>
                {contrato.dataFim && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data de Término</p>
                    <p className="font-semibold">{new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor</p>
                  <p className="font-semibold">R$ {Number(contrato.valor).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant={getBadgeVariant(contrato.status)}>
                    {getStatusLabel(contrato.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONTEÚDO DO CONTRATO */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {contrato.template}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleImprimir}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={handleBaixarPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
            {contrato.arquivoAssinado && (
              <Button
                variant="outline"
                onClick={handleBaixarArquivoAssinado}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Assinado
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onEditar}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}