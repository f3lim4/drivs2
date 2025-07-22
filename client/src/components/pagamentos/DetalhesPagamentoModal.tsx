import { Calendar, DollarSign, FileText, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import type { Pagamento } from '@shared/schema';

interface DetalhesPagamentoModalProps {
  open: boolean;
  onClose: () => void;
  pagamento: Pagamento;
}

export function DetalhesPagamentoModal({ open, onClose, pagamento }: DetalhesPagamentoModalProps) {
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };



  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'parcial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'em_aberto':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Em Aberto</Badge>;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Motorista:</span>
                  <p className="font-medium">{pagamento.motoristaNome}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CPF:</span>
                  <p className="font-medium">{pagamento.motoristaId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <div className="mt-1">{getTipoBadge(pagamento.tipo)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(pagamento.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pagamento.descricao && (
                  <div>
                    <span className="text-sm text-gray-500">Descrição:</span>
                    <p className="font-medium">{pagamento.descricao}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Código do Pagamento:</span>
                  <p className="font-mono text-sm font-bold text-blue-600">{pagamento.codigoPagamento || 'Não definido'}</p>
                </div>
              </div>

              {/* Informações do Veículo */}
              {(pagamento as any).veiculoPlaca && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-sm text-gray-500 font-medium mb-2 block">Veículo:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Placa:</span>
                        <p className="font-medium">{(pagamento as any).veiculoPlaca}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Marca:</span>
                        <p className="font-medium">{(pagamento as any).veiculoMarca}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Modelo:</span>
                        <p className="font-medium">{(pagamento as any).veiculoModelo}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informações financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(pagamento.valorTotal)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Valor Pago</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(pagamento.valorPago)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Valor Restante</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(pagamento.valorRestante)}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Data do Pagamento: {formatDate(pagamento.dataPagamento)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {pagamento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{pagamento.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Informações de auditoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Criado em:</span>
                  <p className="font-medium">{formatDateTime(pagamento.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Última atualização:</span>
                  <p className="font-medium">{formatDateTime(pagamento.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}