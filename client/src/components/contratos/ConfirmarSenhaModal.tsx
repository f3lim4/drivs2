import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ConfirmarSenhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contratoNome: string;
  loading?: boolean;
}

export function ConfirmarSenhaModal({
  open,
  onOpenChange,
  onConfirm,
  contratoNome,
  loading = false
}: ConfirmarSenhaModalProps) {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senha.trim()) {
      toast({
        title: "Senha Obrigatória",
        description: "Digite sua senha para confirmar a exclusão.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verificar senha através da API
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: senha
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Senha Incorreta",
          description: errorData.message || "A senha digitada está incorreta.",
          variant: "destructive",
        });
        return;
      }

      // Senha correta, executar exclusão
      onConfirm();
      setSenha("");
      setMostrarSenha(false);
      
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      toast({
        title: "Erro de Autenticação",
        description: "Não foi possível verificar a senha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setSenha("");
    setMostrarSenha(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Esta ação não pode ser desfeita
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">
              Você está prestes a excluir o contrato:
            </p>
            <p className="font-semibold text-red-900 dark:text-red-100 mt-1">
              {contratoNome}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Digite sua senha para confirmar:
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="pr-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  disabled={loading}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loading || !senha.trim()}
                className="flex-1"
              >
                {loading ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}