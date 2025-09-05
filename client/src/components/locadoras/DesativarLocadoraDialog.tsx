/**
 * Dialog para confirmar alteração de status da locadora
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
import { Locadora } from '@/types/locadora';
import { UserX, Power } from 'lucide-react';

interface DesativarLocadoraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locadora: Locadora | null;
  onConfirm: () => void;
}

export function DesativarLocadoraDialog({ 
  open, 
  onOpenChange, 
  locadora, 
  onConfirm 
}: DesativarLocadoraDialogProps) {
  if (!locadora) return null;

  const isActive = locadora.status === 'ativa';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isActive ? (
              <>
                <UserX className="w-5 h-5 text-orange-600" />
                Desativar Locadora
              </>
            ) : (
              <>
                <Power className="w-5 h-5 text-green-600" />
                Ativar Locadora
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                Você tem certeza que deseja <strong>desativar</strong> a locadora <strong>{locadora.nome}</strong>?
                <br /><br />
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-orange-800 font-medium">⚠️ Ao desativar:</p>
                  <ul className="text-orange-700 text-sm mt-2 space-y-1">
                    <li>• A locadora <strong>não conseguirá fazer login</strong></li>
                    <li>• Os dados permanecerão <strong>salvos no sistema</strong></li>
                    <li>• Pode ser <strong>reativada</strong> a qualquer momento</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                Você tem certeza que deseja <strong>ativar</strong> a locadora <strong>{locadora.nome}</strong>?
                <br /><br />
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 font-medium">✅ Ao ativar:</p>
                  <ul className="text-green-700 text-sm mt-2 space-y-1">
                    <li>• A locadora <strong>poderá fazer login</strong> normalmente</li>
                    <li>• Terá acesso a <strong>todos os dados</strong></li>
                    <li>• Sistema funcionará <strong>completamente</strong></li>
                  </ul>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={
              isActive 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-green-600 hover:bg-green-700'
            }
          >
            {isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}