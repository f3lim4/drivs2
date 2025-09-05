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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 border-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            SIM, EXCLUIR TUDO PERMANENTEMENTE
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}