/**
 * Dialog de confirmação para exclusão de veículos
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
import { Veiculo } from '@/types';

interface ExcluirVeiculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo: Veiculo | null;
  onConfirmarExclusao: (veiculo: Veiculo) => void;
}

export function ExcluirVeiculoDialog({ 
  open, 
  onOpenChange, 
  veiculo,
  onConfirmarExclusao
}: ExcluirVeiculoDialogProps) {
  const handleConfirmar = () => {
    if (veiculo) {
      onConfirmarExclusao(veiculo);
      onOpenChange(false);
    }
  };

  if (!veiculo) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o veículo <strong>{veiculo.marca} {veiculo.modelo}</strong> (Placa: {veiculo.placa})?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a este veículo serão removidos permanentemente.
            <br /><br />
            <strong>Atenção:</strong> Certifique-se de que este veículo não possui contratos ativos antes de excluí-lo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Veículo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}