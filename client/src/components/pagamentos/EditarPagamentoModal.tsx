import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Pagamento, Motorista, InsertPagamento } from '@shared/schema';

const formSchema = z.object({
  motoristaId: z.string().min(1, 'Selecione um motorista'),
  tipo: z.enum(['aluguel', 'infrações', 'manutenção', 'danos', 'outros']),
  descricao: z.string().optional(),
  valorTotal: z.string().min(1, 'Valor total é obrigatório'),
  valorPago: z.string().min(1, 'Valor pago é obrigatório'),
  valorJuros: z.string().optional(),
  valorMulta: z.string().optional(),
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
  // Estado para controlar se é pagamento atrasado
  const [pagamentoAtrasado, setPagamentoAtrasado] = useState(false);
  // Estado para controlar o checkbox de copiar valor total
  const [copiarValorTotal, setCopiarValorTotal] = useState(false);
  
  // Verificar se é um pagamento gerado automaticamente
  const isPagamentoAutomatico = (pagamento as any).automatico === true || pagamento.observacoes?.includes('Pagamento criado automaticamente') || false;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motoristaId: pagamento.motoristaId,
      tipo: pagamento.tipo as any,
      descricao: pagamento.descricao || '',
      valorTotal: pagamento.valorTotal.toString(),
      valorPago: pagamento.valorPago.toString(),
      valorJuros: pagamento.valorJuros?.toString() || '0',
      valorMulta: pagamento.valorMulta?.toString() || '0',
      dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
      observacoes: pagamento.observacoes || '',
    },
  });

  // Atualizar valores quando o pagamento mudar
  useEffect(() => {
    if (pagamento) {
      const temJurosOuMulta = (pagamento.valorJuros && Number(pagamento.valorJuros) > 0) || (pagamento.valorMulta && Number(pagamento.valorMulta) > 0);
      setPagamentoAtrasado(!!temJurosOuMulta);
      
      form.reset({
        motoristaId: pagamento.motoristaId,
        tipo: pagamento.tipo as any,
        descricao: pagamento.descricao || '',
        valorTotal: pagamento.valorTotal.toString(),
        valorPago: pagamento.valorPago.toString(),
        valorJuros: pagamento.valorJuros?.toString() || '0',
        valorMulta: pagamento.valorMulta?.toString() || '0',
        dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
        observacoes: pagamento.observacoes || '',
      });
    }
  }, [pagamento, form]);

  // Limpar campos de juros e multa quando checkbox de pagamento atrasado for desmarcado
  useEffect(() => {
    if (!pagamentoAtrasado) {
      form.setValue('valorJuros', '0');
      form.setValue('valorMulta', '0');
    }
  }, [pagamentoAtrasado, form]);

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
      // Para pagamentos automáticos, não permitir alterar motorista, tipo e descrição
      ...(isPagamentoAutomatico ? {} : {
        motoristaId: data.motoristaId,
        tipo: data.tipo,
        descricao: data.descricao || undefined,
      }),
      // Sempre permitir alterar valores e datas
      valorTotal: data.valorTotal,
      valorPago: data.valorPago,
      valorJuros: data.valorJuros || '0.00',
      valorMulta: data.valorMulta || '0.00',
      valorRestante: valorRestante.toString(),
      dataPagamento: data.dataPagamento,
      status: getStatus(),
      observacoes: data.observacoes || undefined,
    };

    onSubmit(updates);
    handleClose();
  };

  const handleClose = () => {
    setPagamentoAtrasado(false);
    setCopiarValorTotal(false);
    onClose();
  };

  // Função para copiar valor total para valor pago
  const handleCopiarValorTotal = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setCopiarValorTotal(isChecked);
    if (isChecked) {
      const valorTotal = form.getValues('valorTotal');
      form.setValue('valorPago', valorTotal);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                    <FormLabel>
                      Motorista
                      {isPagamentoAutomatico && (
                        <span className="text-xs text-muted-foreground ml-1">(Automático)</span>
                      )}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isPagamentoAutomatico}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => {
                          // Buscar placa do veículo do pagamento se for o motorista atual
                          const placaVeiculo = pagamento && motorista.id === pagamento.motoristaId ? 
                            (pagamento as any).veiculoPlaca : '';
                          
                          return (
                            <SelectItem key={motorista.id} value={motorista.id}>
                              {motorista.nome}{placaVeiculo ? ` - ${placaVeiculo}` : ''}
                            </SelectItem>
                          );
                        })}
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
                    <FormLabel>
                      Tipo de Pagamento
                      {isPagamentoAutomatico && (
                        <span className="text-xs text-muted-foreground ml-1">(Automático)</span>
                      )}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isPagamentoAutomatico}
                    >
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
                  <FormLabel>
                    Descrição
                    {isPagamentoAutomatico && (
                      <span className="text-xs text-muted-foreground ml-1">(Automático)</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição do pagamento..."
                      disabled={isPagamentoAutomatico}
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

            {/* Checkbox para pagamento total */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pagamento-total-edit"
                checked={copiarValorTotal}
                onCheckedChange={handleCopiarValorTotal}
              />
              <label 
                htmlFor="pagamento-total-edit" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pagamento Total
              </label>
            </div>

            {/* Checkbox para pagamento atrasado */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pagamento-atrasado-edit"
                checked={pagamentoAtrasado}
                onCheckedChange={(checked) => setPagamentoAtrasado(checked === true)}
              />
              <label 
                htmlFor="pagamento-atrasado-edit" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pagamento Atrasado
              </label>
            </div>

            {/* Seção de Receita Extra - só aparece se pagamento atrasado estiver marcado */}
            {pagamentoAtrasado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Receita Extra
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Juros */}
                  <FormField
                    control={form.control}
                    name="valorJuros"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros (R$)</FormLabel>
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

                  {/* Multa */}
                  <FormField
                    control={form.control}
                    name="valorMulta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa (R$)</FormLabel>
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
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Valores de juros e multa aparecerão como receita extra nos relatórios financeiros
                </p>
              </div>
            )}

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