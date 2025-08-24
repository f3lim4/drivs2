/**
 * Dialog de confirmação para exclusão de veículos
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
  const [confirmationText, setConfirmationText] = useState('');
  
  const handleConfirmar = () => {
    if (veiculo && confirmationText.toLowerCase() === 'tenho certeza que quero excluir este contrato') {
      onConfirmarExclusao(veiculo);
      onOpenChange(false);
      setConfirmationText(''); // Limpar o campo após confirmação
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmationText(''); // Limpar o campo ao fechar
    }
    onOpenChange(isOpen);
  };

  if (!veiculo) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmation">
            Para confirmar, digite <strong>"Tenho certeza que quero excluir este contrato"</strong> abaixo:
          </Label>
          <Input
            id="confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Digite 'Tenho certeza que quero excluir este contrato' para confirmar"
            className="w-full"
            data-testid="input-confirm-delete"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            disabled={confirmationText.toLowerCase() !== 'tenho certeza que quero excluir este contrato'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-confirm-delete"
          >
            Excluir Veículo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}