import { AlertTriangle, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Pagamento } from '@shared/schema';

interface ExcluirPagamentoModalProps {
  open: boolean;
  onClose: () => void;
  pagamento: Pagamento;
  onConfirm: () => void;
}

export function ExcluirPagamentoModal({ open, onClose, pagamento, onConfirm }: ExcluirPagamentoModalProps) {
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'parcial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              Tem certeza que deseja excluir este pagamento?
            </p>
            <p className="text-red-700 text-sm mt-1">
              Esta ação não pode ser desfeita.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{pagamento.motoristaNome}</span>
                  {getTipoBadge(pagamento.tipo)}
                  {getStatusBadge(pagamento.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Valor Total:</span>
                    <p className="font-medium">{formatCurrency(pagamento.valorTotal)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor Pago:</span>
                    <p className="font-medium text-green-600">{formatCurrency(pagamento.valorPago)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Restante:</span>
                    <p className="font-medium text-red-600">{formatCurrency(pagamento.valorRestante)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <p className="font-medium">{formatDate(pagamento.dataPagamento)}</p>
                  </div>
                </div>

                {pagamento.descricao && (
                  <div>
                    <span className="text-gray-500 text-sm">Descrição:</span>
                    <p className="text-sm">{pagamento.descricao}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Excluir Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}