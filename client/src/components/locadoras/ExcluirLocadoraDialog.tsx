/**
 * Dialog para confirmar exclusão da locadora
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
import { Trash2, AlertTriangle } from 'lucide-react';

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
  const [confirmText, setConfirmText] = useState('');
  const textoConfirmacao = 'excluir@locadora';
  const podeExcluir = confirmText === textoConfirmacao;

  // Resetar texto quando dialog abre/fecha
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('');
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (podeExcluir) {
      onConfirm();
      setConfirmText('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            EXCLUIR PERMANENTEMENTE
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <p>
                Você tem certeza que deseja <strong className="text-red-600">EXCLUIR PERMANENTEMENTE</strong> a locadora <strong>{locadora.nome}</strong>?
              </p>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-red-800 font-semibold">⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!</p>
                    <p className="text-red-700 text-sm font-medium">Será removido PERMANENTEMENTE do sistema:</p>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• <strong>Todos os veículos</strong> da locadora</li>
                      <li>• <strong>Todos os motoristas</strong> cadastrados</li>
                      <li>• <strong>Todos os contratos</strong> e aluguéis</li>
                      <li>• <strong>Histórico de pagamentos</strong></li>
                      <li>• <strong>Despesas e manutenções</strong></li>
                      <li>• <strong>Infrações e documentos</strong></li>
                      <li>• <strong>Dados de login</strong> (email, CNPJ, etc.)</li>
                    </ul>
                    <p className="text-red-800 font-semibold mt-2">💀 TUDO será apagado para sempre!</p>
                  </div>
                </div>
              </div>

              {/* Campo de confirmação obrigatório */}
              <div className="space-y-3 pt-4 border-t border-red-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 font-semibold text-sm">
                    🔒 Para confirmar a exclusão PERMANENTE, digite exatamente:
                  </p>
                  <p className="text-yellow-900 font-mono text-sm mt-1 bg-yellow-100 px-2 py-1 rounded">
                    {textoConfirmacao}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-text" className="text-sm font-medium text-red-700">
                    Digite o texto de confirmação:
                  </Label>
                  <Input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Digite: excluir@locadora"
                    className={`${
                      confirmText && !podeExcluir 
                        ? 'border-red-300 focus:border-red-500' 
                        : podeExcluir 
                        ? 'border-green-300 focus:border-green-500'
                        : ''
                    }`}
                    autoComplete="off"
                  />
                  {confirmText && !podeExcluir && (
                    <p className="text-red-600 text-xs">
                      Texto incorreto. Digite exatamente: {textoConfirmacao}
                    </p>
                  )}
                  {podeExcluir && (
                    <p className="text-green-600 text-xs font-medium">
                      ✅ Confirmação correta. Botão de exclusão habilitado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!podeExcluir}
            className={`${
              podeExcluir 
                ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {podeExcluir ? 'SIM, EXCLUIR TUDO PERMANENTEMENTE' : 'DIGITE O TEXTO PARA CONFIRMAR'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}