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
import { Input } from '@/components/ui/input';
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
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluirPagamentos, setExcluirPagamentos] = useState(false);

  const podeConfirmar = textoConfirmacao.toLowerCase() === 'excluir' && confirmarExclusao;

  const handleConfirmar = () => {
    if (contrato && podeConfirmar) {
      onConfirmarExclusao(contrato, excluirPagamentos);
      onOpenChange(false);
      // Reset todos os campos
      setTextoConfirmacao('');
      setConfirmarExclusao(false);
      setExcluirPagamentos(false);
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset todos os campos quando fechar
      setTextoConfirmacao('');
      setConfirmarExclusao(false);
      setExcluirPagamentos(false);
    }
  };

  if (!contrato) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">⚠️ Confirmar Exclusão de Contrato</AlertDialogTitle>
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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-red-700 dark:text-red-300 font-semibold text-sm">
                🚨 ATENÇÃO: Esta ação é IRREVERSÍVEL!
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                O contrato será excluído permanentemente e não poderá ser recuperado.
              </p>
            </div>
            <br />
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="texto-confirmacao" className="text-sm font-medium">
                  Para confirmar, digite <strong>"excluir"</strong> no campo abaixo:
                </Label>
                <Input
                  id="texto-confirmacao"
                  type="text"
                  value={textoConfirmacao}
                  onChange={(e) => setTextoConfirmacao(e.target.value)}
                  placeholder="Digite: excluir"
                  className="mt-1"
                  data-testid="input-confirmacao"
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded border">
                <Checkbox 
                  id="confirmar-exclusao" 
                  checked={confirmarExclusao}
                  onCheckedChange={(checked) => setConfirmarExclusao(!!checked)}
                  data-testid="checkbox-confirmar-exclusao"
                />
                <Label 
                  htmlFor="confirmar-exclusao" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Tenho certeza que desejo excluir este contrato
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border">
                <Checkbox 
                  id="excluir-pagamentos" 
                  checked={excluirPagamentos}
                  onCheckedChange={(checked) => setExcluirPagamentos(!!checked)}
                  data-testid="checkbox-excluir-pagamentos"
                />
                <Label 
                  htmlFor="excluir-pagamentos" 
                  className="text-sm font-medium text-orange-800 dark:text-orange-200 cursor-pointer"
                >
                  Excluir também os pagamentos relacionados a este contrato
                </Label>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {excluirPagamentos 
                  ? "⚠️ Os pagamentos serão excluídos permanentemente" 
                  : "✅ Os pagamentos serão mantidos na página de pagamentos"
                }
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancelar-exclusao">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
            className={`${podeConfirmar 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="button-confirmar-exclusao"
          >
            ⚠️ Excluir Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}