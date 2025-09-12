import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [confirmouExclusao, setConfirmouExclusao] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (textoConfirmacao.toLowerCase() !== "excluir") {
      toast({
        title: "Confirmação Incorreta",
        description: "Digite 'excluir' para confirmar a exclusão.",
        variant: "destructive",
      });
      return;
    }

    if (!confirmouExclusao) {
      toast({
        title: "Confirmação Obrigatória",
        description: "Marque a caixa para confirmar que tem certeza da exclusão.",
        variant: "destructive",
      });
      return;
    }

    // Executar exclusão diretamente
    onConfirm();
    setTextoConfirmacao("");
    setConfirmouExclusao(false);
  };

  const handleCancel = () => {
    setTextoConfirmacao("");
    setConfirmouExclusao(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
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
              <Label htmlFor="confirmacao" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Digite "excluir" para confirmar:
              </Label>
              <Input
                id="confirmacao"
                type="text"
                value={textoConfirmacao}
                onChange={(e) => setTextoConfirmacao(e.target.value)}
                placeholder="Digite: excluir"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmar"
                checked={confirmouExclusao}
                onCheckedChange={(checked) => setConfirmouExclusao(!!checked)}
                disabled={loading}
              />
              <Label
                htmlFor="confirmar"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Tenho certeza que quero excluir este contrato
              </Label>
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
                disabled={loading || textoConfirmacao.toLowerCase() !== "excluir" || !confirmouExclusao}
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