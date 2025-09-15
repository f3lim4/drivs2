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
            <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. O contrato será excluído permanentemente.
            <br /><br />
            <strong>✅ Histórico preservado:</strong> Os pagamentos relacionados a este contrato serão mantidos para preservar o histórico financeiro e permitir análises futuras.
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