/**
 * Dialog de confirmação para exclusão de contratos
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Contrato } from '@/types';

interface ExcluirContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onConfirmarExclusao: (contrato: Contrato) => void;
}

export function ExcluirContratoDialog({ 
  open, 
  onOpenChange, 
  contrato,
  onConfirmarExclusao
}: ExcluirContratoDialogProps) {
  const handleConfirmar = () => {
    if (contrato) {
      onConfirmarExclusao(contrato);
      onOpenChange(false);
    }
  };

  if (!contrato) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o contrato de <strong>{contrato.cliente}</strong>?
            <br /><br />
            <strong>Detalhes do contrato:</strong>
            <br />• Veículo: {contrato.veiculo}
            <br />• Valor: R$ {typeof contrato.valor === 'number' ? contrato.valor.toFixed(2) : parseFloat(contrato.valor || '0').toFixed(2)}
            <br />• Data de início: {contrato.dataInicio}
            <br />• Data de fim: {contrato.dataFim}
            <br /><br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a este contrato serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Contrato
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}