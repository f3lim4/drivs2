/**
 * Modal para pesquisar motorista por CPF
 * Verifica se o motorista teve problemas em outras locadoras
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  User, 
  Building2,
  Calendar,
  DollarSign,
  FileX,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Validação de CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

const pesquisaCpfSchema = z.object({
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .refine(validarCPF, 'CPF inválido'),
});

type PesquisaCpfFormData = z.infer<typeof pesquisaCpfSchema>;

interface HistoricoMotorista {
  motorista: {
    nome: string;
    cpf: string;
    telefone: string;
  };
  locadoras: Array<{
    nome: string;
    cnpj: string;
    problemas: Array<{
      tipo: 'inadimplencia' | 'cancelamento' | 'infracao' | 'dano';
      descricao: string;
      valor?: number;
      data: string;
    }>;
  }>;
}

interface PesquisarCpfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PesquisarCpfModal({ open, onOpenChange }: PesquisarCpfModalProps) {
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoMotorista | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const { toast } = useToast();

  const form = useForm<PesquisaCpfFormData>({
    resolver: zodResolver(pesquisaCpfSchema),
    defaultValues: {
      cpf: '',
    },
  });

  const onSubmit = async (data: PesquisaCpfFormData) => {
    setLoading(true);
    setHistorico(null);
    setNaoEncontrado(false);

    try {
      const cpfLimpo = data.cpf.replace(/\D/g, '');
      
      const response = await fetch(`/api/motoristas/pesquisar-historico/${cpfLimpo}`);
      
      if (response.status === 404) {
        setNaoEncontrado(true);
        toast({
          title: "Motorista não encontrado",
          description: "CPF não cadastrado em nenhuma locadora do sistema",
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao pesquisar histórico');
      }

      const historicoData = await response.json();
      setHistorico(historicoData);

      if (historicoData.locadoras.some((loc: any) => loc.problemas.length > 0)) {
        toast({
          title: "⚠️ Problemas encontrados",
          description: "Motorista possui histórico de problemas",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Histórico limpo",
          description: "Nenhum problema encontrado",
        });
      }
      
    } catch (error) {
      console.error('Erro ao pesquisar histórico:', error);
      toast({
        title: "Erro na pesquisa",
        description: "Não foi possível verificar o histórico do motorista",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 11) {
      return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return nums.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getProblemaIcon = (tipo: string) => {
    switch (tipo) {
      case 'inadimplencia':
        return <DollarSign className="w-4 h-4" />;
      case 'cancelamento':
        return <FileX className="w-4 h-4" />;
      case 'infracao':
        return <AlertTriangle className="w-4 h-4" />;
      case 'dano':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getProblemaColor = (tipo: string) => {
    switch (tipo) {
      case 'inadimplencia':
        return 'destructive';
      case 'cancelamento':
        return 'secondary';
      case 'infracao':
        return 'destructive';
      case 'dano':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const resetModal = () => {
    form.reset();
    setHistorico(null);
    setNaoEncontrado(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetModal();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Pesquisar Histórico de Motorista
          </DialogTitle>
          <DialogDescription>
            Digite o CPF para verificar se o motorista teve problemas com outras locadoras
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatarCPF(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Pesquisar Histórico
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Resultados */}
        {naoEncontrado && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Motorista não encontrado</AlertTitle>
            <AlertDescription>
              CPF não está cadastrado em nenhuma locadora do sistema DRIVS.
            </AlertDescription>
          </Alert>
        )}

        {historico && (
          <div className="space-y-4">
            {/* Dados do motorista */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5" />
                <h3 className="font-semibold">Dados do Motorista</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {historico.motorista.nome}
                </div>
                <div>
                  <span className="font-medium">CPF:</span> {historico.motorista.cpf}
                </div>
                <div>
                  <span className="font-medium">Telefone:</span> {historico.motorista.telefone}
                </div>
              </div>
            </div>

            {/* Histórico por locadora */}
            {historico.locadoras.map((locadora, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5" />
                  <h3 className="font-semibold">{locadora.nome}</h3>
                  <Badge variant="outline" className="text-xs">
                    CNPJ: {locadora.cnpj}
                  </Badge>
                </div>

                {locadora.problemas.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Histórico limpo</AlertTitle>
                    <AlertDescription>
                      Nenhum problema registrado nesta locadora.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Problemas encontrados</AlertTitle>
                      <AlertDescription>
                        {locadora.problemas.length} problema(s) registrado(s) nesta locadora.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      {locadora.problemas.map((problema, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded bg-red-50 dark:bg-red-950/20">
                          <div className="flex items-center gap-2">
                            {getProblemaIcon(problema.tipo)}
                            <div>
                              <div className="font-medium text-sm">{problema.descricao}</div>
                              <div className="text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(problema.data).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={getProblemaColor(problema.tipo) as any} className="text-xs">
                              {problema.tipo.toUpperCase()}
                            </Badge>
                            {problema.valor && (
                              <span className="text-xs font-medium text-red-600">
                                R$ {problema.valor.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}