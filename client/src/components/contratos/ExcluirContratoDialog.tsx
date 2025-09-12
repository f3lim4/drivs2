/**
 * Dialog de confirmação para exclusão de contratos
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Contrato } from '@/types';

interface ExcluirContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onConfirmarExclusao: (contrato: Contrato, excluirPagamentos: boolean) => void;
}

export function ExcluirContratoDialog({ 
  open, 
  onOpenChange, 
  contrato,
  onConfirmarExclusao
}: ExcluirContratoDialogProps) {
  const [excluirPagamentos, setExcluirPagamentos] = useState(false);

  const handleConfirmar = () => {
    if (contrato) {
      onConfirmarExclusao(contrato, excluirPagamentos);
      onOpenChange(false);
      setExcluirPagamentos(false); // Reset checkbox
    }
  };

  if (!contrato) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {contrato.id.startsWith('aluguel_') ? 'o aluguel ativo' : 'o contrato'} de <strong>{(contrato as any).motoristaNome || contrato.cliente || 'N/A'}</strong>?
            <br /><br />
            <strong>Detalhes:</strong>
            {(contrato as any).veiculoPlaca && (
              <>
                <br />• Veículo: {(contrato as any).veiculoPlaca} - {(contrato as any).veiculoMarca} {(contrato as any).veiculoModelo}
              </>
            )}
            {(contrato as any).veiculo && !(contrato as any).veiculoPlaca && (
              <>
                <br />• Veículo: {(contrato as any).veiculo}
              </>
            )}
            <br />• Valor: R$ {(contrato as any).valorMensal ? parseFloat((contrato as any).valorMensal).toFixed(2) : (typeof contrato.valor === 'number' ? contrato.valor.toFixed(2) : parseFloat(contrato.valor || '0').toFixed(2))}
            <br />• Data de início: {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}
            {contrato.dataFim && (
              <>
                <br />• Data de fim: {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}
              </>
            )}
            <br /><br />
            Esta ação não pode ser desfeita.
            <br /><br />
            <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border">
              <Checkbox 
                id="excluir-pagamentos" 
                checked={excluirPagamentos}
                onCheckedChange={(checked) => setExcluirPagamentos(!!checked)}
              />
              <Label 
                htmlFor="excluir-pagamentos" 
                className="text-sm font-medium text-orange-800 dark:text-orange-200 cursor-pointer"
              >
                Excluir também os pagamentos relacionados a este contrato
              </Label>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {excluirPagamentos 
                ? "⚠️ Os pagamentos serão excluídos permanentemente" 
                : "✅ Os pagamentos serão mantidos na página de pagamentos"
              }
            </p>
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