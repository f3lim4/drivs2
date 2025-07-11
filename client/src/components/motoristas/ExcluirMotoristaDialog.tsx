/**
 * Dialog de confirmação para exclusão de motoristas
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
import { Motorista } from '@/types';

interface ExcluirMotoristaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
  onConfirmarExclusao: (motorista: Motorista) => void;
}

export function ExcluirMotoristaDialog({ 
  open, 
  onOpenChange, 
  motorista,
  onConfirmarExclusao
}: ExcluirMotoristaDialogProps) {
  const handleConfirmar = () => {
    if (motorista) {
      onConfirmarExclusao(motorista);
      onOpenChange(false);
    }
  };

  if (!motorista) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o motorista <strong>{motorista.nome}</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a este motorista serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Motorista
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}