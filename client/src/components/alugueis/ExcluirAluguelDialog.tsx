/**
 * Dialog de confirmação para exclusão de aluguéis
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
import { Aluguel } from '@/types';

interface ExcluirAluguelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluguel: Aluguel | null;
  onConfirmarExclusao: (aluguel: Aluguel) => void;
}

export function ExcluirAluguelDialog({ 
  open, 
  onOpenChange, 
  aluguel,
  onConfirmarExclusao
}: ExcluirAluguelDialogProps) {
  const handleConfirmar = () => {
    if (aluguel) {
      onConfirmarExclusao(aluguel);
      onOpenChange(false);
    }
  };

  if (!aluguel) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o aluguel do motorista <strong>{aluguel.motoristaNome}</strong> para o veículo <strong>{aluguel.veiculoModelo}</strong>?
            <br /><br />
            <strong>Detalhes do contrato:</strong>
            <br />• Período: {aluguel.periodo.inicio} a {aluguel.periodo.fim}
            <br />• Status: {aluguel.status}
            <br />• Valor Total: R$ {aluguel.valores.total.toFixed(2)}
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
            Excluir Aluguel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}