/**
 * Modal para visualizar detalhes do veículo
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Car, Fuel, Calendar, DollarSign, Shield, Gauge, Eye, FileText, Download } from 'lucide-react';
import { Veiculo } from '@/types';

interface VisualizarVeiculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo: Veiculo | null;
}

export function VisualizarVeiculoModal({ open, onOpenChange, veiculo }: VisualizarVeiculoModalProps) {
  if (!veiculo) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'alugado':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Alugado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {veiculo.modelo} - {veiculo.placa}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do veículo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(veiculo.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Categoria:</span>
              <Badge variant="outline" className="capitalize">{veiculo.categoria}</Badge>
            </div>
          </div>

          <Separator />

          {/* Informações do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-4 h-4" />
                Informações do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                  <p className="text-sm">{veiculo.modelo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ano</p>
                  <p className="text-sm">{veiculo.ano}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Placa</p>
                  <p className="text-sm font-mono">{veiculo.placa}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cor</p>
                  <p className="text-sm">{veiculo.cor}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Combustível</p>
                <p className="text-sm flex items-center gap-1">
                  <Fuel className="w-3 h-3" />
                  {veiculo.combustivel || 'Flex'}
                </p>
              </div>
              
              
              {/* Campo Visualizar sempre exibido quando presente */}
              {(veiculo as any).visualizar && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Observações Visuais do Veículo</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {(veiculo as any).visualizar}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valores e Locação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Semanal</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(veiculo.valorSemanal)}/sem
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Caução</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(veiculo.caucao)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limite de KM</p>
                <p className="text-sm flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  {veiculo.limiteQuilometragem}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seguro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Seguro e Proteção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Seguro</p>
                <p className="text-sm">{veiculo.seguro}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documentação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Documentação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">RENAVAM</p>
                <p className="text-sm font-mono">{veiculo.renavam || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chassi</p>
                <p className="text-sm font-mono">{veiculo.chassi || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>
          {/* Observações Visuais - Destaque especial */}
          {(veiculo as any).visualizar && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Eye className="w-5 h-5" />
                  Observações Visuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  {(veiculo as any).visualizar}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Documentos do Veículo - Compacto */}
          {(() => {
            const documentos = veiculo.documentos;
            console.log('[DEBUG] Documentos do veículo:', documentos);
            console.log('[DEBUG] Veículo completo:', veiculo);
            
            return (
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documentos
                    </div>
                    {documentos && documentos.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {documentos.length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {!documentos || documentos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum documento</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {documentos.map((doc: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('[DEBUG] Abrindo documento:', doc);
                            window.open(doc, '_blank');
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Doc {index + 1}
                          <Download className="w-3 h-3" />
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}