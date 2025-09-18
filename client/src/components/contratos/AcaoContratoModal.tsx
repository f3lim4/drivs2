import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, DollarSign, XCircle, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AcaoContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelar: (motivo: string) => void;
  onExcluir: () => void;
  contratoNome: string;
  loading?: boolean;
  pagamentosAssociados?: number;
}

export function AcaoContratoModal({
  open,
  onOpenChange,
  onCancelar,
  onExcluir,
  contratoNome,
  loading = false,
  pagamentosAssociados = 0
}: AcaoContratoModalProps) {
  const [acao, setAcao] = useState<'cancelar' | 'excluir' | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [confirmouAcao, setConfirmouAcao] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acao) {
      toast({
        title: "Ação Obrigatória",
        description: "Selecione se deseja cancelar ou excluir o contrato.",
        variant: "destructive",
      });
      return;
    }

    if (acao === 'cancelar') {
      if (!motivoCancelamento.trim()) {
        toast({
          title: "Motivo Obrigatório",
          description: "Informe o motivo do cancelamento.",
          variant: "destructive",
        });
        return;
      }

      if (textoConfirmacao.toLowerCase() !== "cancelar") {
        toast({
          title: "Confirmação Incorreta",
          description: "Digite 'cancelar' para confirmar o cancelamento.",
          variant: "destructive",
        });
        return;
      }

      onCancelar(motivoCancelamento.trim());
    } else {
      if (textoConfirmacao.toLowerCase() !== "excluir") {
        toast({
          title: "Confirmação Incorreta",
          description: "Digite 'excluir' para confirmar a exclusão.",
          variant: "destructive",
        });
        return;
      }

      if (!confirmouAcao) {
        toast({
          title: "Confirmação Obrigatória",
          description: "Marque a caixa para confirmar que tem certeza da exclusão permanente.",
          variant: "destructive",
        });
        return;
      }

      onExcluir();
    }

    resetForm();
  };

  const resetForm = () => {
    setAcao(null);
    setMotivoCancelamento("");
    setTextoConfirmacao("");
    setConfirmouAcao(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ação do Contrato
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Escolha a ação para o contrato
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Contrato:
            </p>
            <p className="font-semibold text-blue-900 dark:text-blue-100 mt-1">
              {contratoNome}
            </p>
          </div>

          {pagamentosAssociados > 0 && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 p-4 mb-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Atenção: {pagamentosAssociados} Pagamento(s) Associado(s)
                </p>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Este contrato possui histórico de pagamentos registrados.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Ação */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selecione a ação desejada:
              </Label>
              
              <div className="grid gap-4">
                {/* Opção Cancelar */}
                <div 
                  onClick={() => setAcao('cancelar')}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    acao === 'cancelar' 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <Ban className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Cancelar Contrato
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ✅ Preserva histórico de pagamentos<br />
                        ✅ Libera veículo e motorista para novos contratos<br />
                        ✅ Mantém dados para relatórios financeiros
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opção Excluir */}
                <div 
                  onClick={() => setAcao('excluir')}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    acao === 'excluir' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Excluir Permanentemente
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ⚠️ Remove contrato e todos os pagamentos<br />
                        ⚠️ Ação irreversível<br />
                        ⚠️ Use apenas para correções de erros
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos específicos para cada ação */}
            {acao === 'cancelar' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivo do cancelamento *
                  </Label>
                  <Textarea
                    id="motivo"
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    placeholder="Ex: Cliente solicitou cancelamento antecipado"
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmacao" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Digite "cancelar" para confirmar:
                  </Label>
                  <Input
                    id="confirmacao"
                    type="text"
                    value={textoConfirmacao}
                    onChange={(e) => setTextoConfirmacao(e.target.value)}
                    placeholder="Digite: cancelar"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {acao === 'excluir' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                    ⚠️ Atenção: Exclusão Permanente
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Esta ação irá remover permanentemente:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-2 ml-4 list-disc">
                    <li>O contrato e todos seus dados</li>
                    <li>Todos os pagamentos associados ({pagamentosAssociados} registros)</li>
                    <li>Histórico financeiro relacionado</li>
                  </ul>
                </div>

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
                    checked={confirmouAcao}
                    onCheckedChange={(checked) => setConfirmouAcao(!!checked)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor="confirmar"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Entendo que esta é uma ação irreversível
                  </Label>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar Operação
              </Button>
              <Button
                type="submit"
                variant={acao === 'excluir' ? 'destructive' : 'default'}
                disabled={loading || !acao || (acao === 'cancelar' ? textoConfirmacao.toLowerCase() !== "cancelar" || !motivoCancelamento.trim() : textoConfirmacao.toLowerCase() !== "excluir" || !confirmouAcao)}
                className="flex-1"
              >
                {loading ? 
                  (acao === 'cancelar' ? "Cancelando..." : "Excluindo...") : 
                  (acao === 'cancelar' ? "Cancelar Contrato" : "Excluir Permanentemente")
                }
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}