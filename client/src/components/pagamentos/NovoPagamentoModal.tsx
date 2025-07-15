import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, DollarSign, FileText, User, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useAlugueis } from '@/hooks/useAlugueis';
import { useAluguelValorSemanal } from '@/hooks/usePagamentos';
import type { Motorista, InsertPagamento } from '@shared/schema';

const formSchema = z.object({
  motoristaId: z.string().min(1, 'Selecione um motorista'),
  tipo: z.enum(['aluguel', 'infrações', 'manutenção', 'danos', 'outros']),
  aluguelId: z.string().optional(),
  descricao: z.string().optional(),
  valorTotal: z.string().min(1, 'Valor total é obrigatório'),
  valorPago: z.string().optional(),
  dataPagamento: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
  isPagamentoParcial: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovoPagamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InsertPagamento) => void;
  motoristas: Motorista[];
}

export function NovoPagamentoModal({ open, onClose, onSubmit, motoristas }: NovoPagamentoModalProps) {
  const { profile } = useAuth();
  const { alugueis } = useAlugueis();
  const [aluguelSelecionado, setAluguelSelecionado] = useState<string | null>(null);
  const { data: valorSemanal } = useAluguelValorSemanal(aluguelSelecionado);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motoristaId: '',
      tipo: 'aluguel',
      aluguelId: '',
      descricao: '',
      valorTotal: '',
      valorPago: '',
      dataPagamento: new Date().toISOString().split('T')[0],
      observacoes: '',
      isPagamentoParcial: false,
    },
  });

  const tipoSelecionado = form.watch('tipo');
  const valorTotalInput = form.watch('valorTotal');
  const valorPagoInput = form.watch('valorPago');
  const motoristaId = form.watch('motoristaId');
  const isPagamentoParcial = form.watch('isPagamentoParcial');

  // Filtrar aluguéis ativos do motorista selecionado
  const alugueisDoMotorista = alugueis.filter(
    aluguel => aluguel.motoristaId === motoristaId && aluguel.status === 'ativo'
  );

  // Selecionar automaticamente o primeiro aluguel ativo quando tipo for aluguel
  useEffect(() => {
    if (tipoSelecionado === 'aluguel' && alugueisDoMotorista.length > 0) {
      const primeiroAluguel = alugueisDoMotorista[0];
      form.setValue('aluguelId', primeiroAluguel.id);
      setAluguelSelecionado(primeiroAluguel.id);
    }
  }, [tipoSelecionado, alugueisDoMotorista, form]);

  // Atualizar valor semanal quando selecionar aluguel
  useEffect(() => {
    if (tipoSelecionado === 'aluguel' && valorSemanal) {
      form.setValue('valorTotal', valorSemanal.toString());
      // Se não é pagamento parcial, define valorPago igual ao valorTotal
      if (!isPagamentoParcial) {
        form.setValue('valorPago', valorSemanal.toString());
      }
    }
  }, [valorSemanal, tipoSelecionado, isPagamentoParcial, form]);

  // Ajustar valor pago quando checkbox muda
  useEffect(() => {
    if (tipoSelecionado === 'aluguel' && valorTotalInput) {
      if (isPagamentoParcial) {
        form.setValue('valorPago', '');
      } else {
        form.setValue('valorPago', valorTotalInput);
      }
    }
  }, [isPagamentoParcial, valorTotalInput, tipoSelecionado, form]);

  // Calcular valor restante
  const valorTotal = parseFloat(valorTotalInput) || 0;
  const valorPago = parseFloat(valorPagoInput) || 0;
  const valorRestante = valorTotal - valorPago;

  // Determinar status
  const getStatus = () => {
    if (valorPago === 0) return 'pendente';
    if (valorPago >= valorTotal) return 'pago';
    return 'parcial';
  };

  const handleSubmit = (data: FormData) => {
    const valorPagoFinal = data.valorPago || data.valorTotal;
    
    const pagamento: InsertPagamento = {
      id: crypto.randomUUID(),
      locadoraId: profile?.locadoraId || '',
      motoristaId: data.motoristaId,
      aluguelId: tipoSelecionado === 'aluguel' ? aluguelSelecionado : undefined,
      tipo: data.tipo,
      descricao: data.descricao || undefined,
      valorTotal: data.valorTotal,
      valorPago: valorPagoFinal,
      valorRestante: (parseFloat(data.valorTotal) - parseFloat(valorPagoFinal)).toString(),
      dataPagamento: data.dataPagamento,
      status: getStatus(),
      observacoes: data.observacoes || undefined,
    };

    onSubmit(pagamento);
    onClose();
    form.reset();
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setAluguelSelecionado(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Motorista */}
              <FormField
                control={form.control}
                name="motoristaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            {motorista.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel Semanal</SelectItem>
                        <SelectItem value="infrações">Infrações</SelectItem>
                        <SelectItem value="manutenção">Manutenção</SelectItem>
                        <SelectItem value="danos">Danos</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Aviso se não há aluguéis ativos (apenas se tipo for aluguel) */}
            {tipoSelecionado === 'aluguel' && motoristaId && alugueisDoMotorista.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum aluguel ativo encontrado para este motorista
                </p>
              </div>
            )}

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição do pagamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor Total */}
                <FormField
                  control={form.control}
                  name="valorTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data */}
                <FormField
                  control={form.control}
                  name="dataPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Pagamento</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Checkbox para pagamento parcial */}
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isPagamentoParcial"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        Pagamento Parcial
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Valor Pago (apenas se pagamento parcial estiver marcado) */}
              {isPagamentoParcial && (
                <FormField
                  control={form.control}
                  name="valorPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Pago Parcial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Resumo */}
            {valorTotal > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Valor Total:</span>
                      <p className="font-medium text-lg">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorTotal)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Pago:</span>
                      <p className="font-medium text-lg text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorPago)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Restante:</span>
                      <p className="font-medium text-lg text-red-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorRestante)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium text-lg capitalize">{getStatus()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}