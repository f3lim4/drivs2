/**
 * Dialog de confirmação para exclusão de motoristas
 */

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { Motorista } from '@/types';

interface ExcluirMotoristaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
  onConfirmarExclusao: (motorista: Motorista, confirmationText: string, hasAgreed: boolean) => Promise<boolean>;
}

export function ExcluirMotoristaDialog({ 
  open, 
  onOpenChange, 
  motorista,
  onConfirmarExclusao
}: ExcluirMotoristaDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmar = async () => {
    if (motorista) {
      setIsLoading(true);
      const success = await onConfirmarExclusao(motorista, confirmationText, hasAgreed);
      setIsLoading(false);
      
      if (success) {
        onOpenChange(false);
        // Reset form
        setConfirmationText('');
        setHasAgreed(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset form when closing
      setConfirmationText('');
      setHasAgreed(false);
    }
  };

  if (!motorista) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o motorista <strong>{motorista.nome}</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a este motorista serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Para confirmar, digite <strong>"excluir"</strong> no campo abaixo:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite 'excluir' para confirmar"
              className="focus:border-destructive"
              data-testid="input-confirmation"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree"
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(!!checked)}
              data-testid="checkbox-agree"
            />
            <Label htmlFor="agree" className="text-sm">
              Concordo que desejo excluir este motorista permanentemente
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            disabled={isLoading || confirmationText.toLowerCase().trim() !== 'excluir' || !hasAgreed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            data-testid="button-confirm-delete"
          >
            {isLoading ? 'Excluindo...' : 'Excluir Motorista'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}