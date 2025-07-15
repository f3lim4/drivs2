import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Pagamento, Motorista, InsertPagamento } from '@shared/schema';

const formSchema = z.object({
  motoristaId: z.string().min(1, 'Selecione um motorista'),
  tipo: z.enum(['aluguel', 'infrações', 'manutenção', 'danos', 'outros']),
  descricao: z.string().optional(),
  valorTotal: z.string().min(1, 'Valor total é obrigatório'),
  valorPago: z.string().min(1, 'Valor pago é obrigatório'),
  dataPagamento: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditarPagamentoModalProps {
  open: boolean;
  onClose: () => void;
  pagamento: Pagamento;
  onSubmit: (data: Partial<InsertPagamento>) => void;
  motoristas: Motorista[];
}

export function EditarPagamentoModal({ open, onClose, pagamento, onSubmit, motoristas }: EditarPagamentoModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motoristaId: pagamento.motoristaId,
      tipo: pagamento.tipo as any,
      descricao: pagamento.descricao || '',
      valorTotal: pagamento.valorTotal.toString(),
      valorPago: pagamento.valorPago.toString(),
      dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
      observacoes: pagamento.observacoes || '',
    },
  });

  // Atualizar valores quando o pagamento mudar
  useEffect(() => {
    if (pagamento) {
      form.reset({
        motoristaId: pagamento.motoristaId,
        tipo: pagamento.tipo as any,
        descricao: pagamento.descricao || '',
        valorTotal: pagamento.valorTotal.toString(),
        valorPago: pagamento.valorPago.toString(),
        dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
        observacoes: pagamento.observacoes || '',
      });
    }
  }, [pagamento, form]);

  const valorTotalInput = form.watch('valorTotal');
  const valorPagoInput = form.watch('valorPago');

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
    const updates: Partial<InsertPagamento> = {
      motoristaId: data.motoristaId,
      tipo: data.tipo,
      descricao: data.descricao || undefined,
      valorTotal: data.valorTotal,
      valorPago: data.valorPago,
      valorRestante: valorRestante.toString(),
      dataPagamento: data.dataPagamento,
      status: getStatus(),
      observacoes: data.observacoes || undefined,
    };

    onSubmit(updates);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Valor Pago */}
              <FormField
                control={form.control}
                name="valorPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago</FormLabel>
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
                      <p className="font-medium text-lg">{formatCurrency(valorTotal)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Pago:</span>
                      <p className="font-medium text-lg text-green-600">{formatCurrency(valorPago)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Restante:</span>
                      <p className="font-medium text-lg text-red-600">{formatCurrency(valorRestante)}</p>
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}