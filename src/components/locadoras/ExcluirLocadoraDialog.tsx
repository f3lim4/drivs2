/**
 * Dialog para confirmar exclusão da locadora
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

interface Locadora {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'basico' | 'premium' | 'enterprise';
  dataCadastro: string;
}

interface ExcluirLocadoraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locadora: Locadora;
  onConfirm: () => void;
}

export function ExcluirLocadoraDialog({ 
  open, 
  onOpenChange, 
  locadora, 
  onConfirm 
}: ExcluirLocadoraDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Locadora</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a locadora <strong>{locadora.nome}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e todos os dados relacionados a esta locadora serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}