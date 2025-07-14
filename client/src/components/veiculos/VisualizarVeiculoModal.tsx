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
import { Car, Fuel, Calendar, DollarSign, Shield, Gauge } from 'lucide-react';
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
      case 'manutencao':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Manutenção</Badge>;
      case 'parado':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Parado</Badge>;
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
                    {formatCurrency(veiculo.valorDiario)}/sem
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Caução</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(veiculo.valorCaucao)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limite de KM</p>
                <p className="text-sm flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  {veiculo.kmLimite}
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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}