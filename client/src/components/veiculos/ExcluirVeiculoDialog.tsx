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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const handleConfirmar = () => {
    if (veiculo && confirmationText.toLowerCase() === 'excluir' && isConfirmed) {
      onConfirmarExclusao(veiculo);
      onOpenChange(false);
      setConfirmationText(''); // Limpar o campo após confirmação
      setIsConfirmed(false); // Limpar checkbox
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmationText(''); // Limpar o campo ao fechar
      setIsConfirmed(false); // Limpar checkbox ao fechar
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
<strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. O veículo será excluído permanentemente.
            <br /><br />
            <strong>✅ Histórico preservado:</strong> Os contratos, pagamentos e outros dados relacionados a este veículo serão mantidos para preservar o histórico.
            <br /><br />
            <strong>Importante:</strong> Certifique-se de que este veículo não possui contratos ativos antes de excluí-lo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Para confirmar, digite <strong>"excluir"</strong> abaixo:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite 'excluir' para confirmar"
              className="w-full"
              data-testid="input-confirm-delete"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="final-confirmation"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              data-testid="checkbox-confirm-delete"
            />
            <Label htmlFor="final-confirmation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tenho certeza que quero excluir este veículo
            </Label>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            disabled={confirmationText.toLowerCase() !== 'excluir' || !isConfirmed}
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