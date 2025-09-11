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
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAluguelValorSemanal } from '@/hooks/usePagamentos';
import { useInfracoesByMotorista, useInfracoes } from '@/hooks/useInfracoes';
import type { Motorista, InsertPagamento, Infracao } from '@shared/schema';

const formSchema = z.object({
  motoristaId: z.string().min(1, 'Selecione um motorista'),
  tipo: z.string().min(1, 'Selecione um tipo de pagamento').refine(val => 
    ['aluguel', 'infrações', 'manutenção', 'danos', 'outros'].includes(val), {
    message: 'Tipo de pagamento inválido'
  }),
  aluguelId: z.string().optional(),
  valorTotal: z.string().min(1, 'Valor total é obrigatório'),
  valorPago: z.string().optional(),
  valorJuros: z.string().optional(),
  valorMulta: z.string().optional(),
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

interface InfracaoSelecionada {
  id: string;
  selecionada: boolean;
  valorPago: number;
}

export function NovoPagamentoModal({ open, onClose, onSubmit, motoristas }: NovoPagamentoModalProps) {
  const { profile } = useAuth();
  const { alugueis } = useAlugueis();
  const { veiculos } = useVeiculos();
  const [aluguelSelecionado, setAluguelSelecionado] = useState<string | null>(null);
  const [pagamentoAtrasado, setPagamentoAtrasado] = useState(false);
  const { data: valorSemanal } = useAluguelValorSemanal(aluguelSelecionado);
  const { updateInfracao } = useInfracoes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motoristaId: '',
      tipo: '',
      aluguelId: '',
      valorTotal: '',
      valorPago: '',
      valorJuros: '0',
      valorMulta: '0',
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

  // Buscar infrações em aberto do motorista selecionado
  const { data: infracoesByMotorista = [] } = useInfracoesByMotorista(motoristaId);
  const infracoesEmAberto = infracoesByMotorista?.filter(infracao => 
    infracao.status === 'pendente' && !infracao.dataPagamento
  ) || [];

  // Estado para controlar infrações selecionadas
  const [infracoesSelecionadas, setInfracoesSelecionadas] = useState<InfracaoSelecionada[]>([]);

  // Sincronizar infrações selecionadas quando as infrações mudarem
  useEffect(() => {
    if (infracoesEmAberto.length > 0) {
      setInfracoesSelecionadas(infracoesEmAberto.map(infracao => ({
        id: infracao.id,
        selecionada: false,
        valorPago: 0
      })));
    }
  }, [infracoesEmAberto.length]);

  // Limpar campos de juros e multa quando checkbox de pagamento atrasado for desmarcado
  useEffect(() => {
    if (!pagamentoAtrasado) {
      form.setValue('valorJuros', '0');
      form.setValue('valorMulta', '0');
    }
  }, [pagamentoAtrasado, form]);

  // Calcular valor total das infrações selecionadas
  const valorTotalInfracoesSelecionadas = infracoesSelecionadas
    ?.filter(inf => inf.selecionada)
    ?.reduce((total, inf) => {
      const infracao = infracoesEmAberto?.find(i => i.id === inf.id);
      return total + (infracao ? parseFloat(infracao.valorFinal) : 0);
    }, 0) || 0;

  // Função para toggle seleção de infração
  const toggleInfracaoSelecionada = (infracaoId: string) => {
    setInfracoesSelecionadas(prev => 
      prev.map(inf => 
        inf.id === infracaoId 
          ? { ...inf, selecionada: !inf.selecionada }
          : inf
      )
    );
  };

  // Função para selecionar todas as infrações
  const toggleTodasInfracoes = () => {
    const todasSelecionadas = infracoesSelecionadas.every(inf => inf.selecionada);
    setInfracoesSelecionadas(prev => 
      prev.map(inf => ({ ...inf, selecionada: !todasSelecionadas }))
    );
  };

  // Atualizar valor total quando infrações são selecionadas
  useEffect(() => {
    if (tipoSelecionado === 'infrações' && valorTotalInfracoesSelecionadas > 0) {
      form.setValue('valorTotal', valorTotalInfracoesSelecionadas.toFixed(2));
    }
  }, [valorTotalInfracoesSelecionadas, tipoSelecionado, form]);

  // Filtrar aluguéis ativos do motorista selecionado
  const alugueisDoMotorista = alugueis.filter(
    aluguel => aluguel.motoristaId === motoristaId && aluguel.status === 'ativo'
  );

  // Filtrar apenas motoristas que têm aluguéis ativos
  const motoristasComAlugueis = motoristas.filter(motorista => 
    alugueis.some(aluguel => 
      aluguel.motoristaId === motorista.id && aluguel.status === 'ativo'
    )
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

  const handleSubmit = async (data: FormData) => {
    const valorPagoFinal = data.valorPago || data.valorTotal;
    
    const pagamento: InsertPagamento = {
      id: crypto.randomUUID(),
      locadoraId: profile?.locadoraId || '',
      motoristaId: data.motoristaId,
      aluguelId: tipoSelecionado === 'aluguel' ? aluguelSelecionado : undefined,
      tipo: data.tipo,
      descricao: data.observacoes || undefined,
      valorTotal: data.valorTotal,
      valorPago: valorPagoFinal,
      valorRestante: (parseFloat(data.valorTotal) - parseFloat(valorPagoFinal)).toString(),
      valorJuros: data.valorJuros || '0.00',
      valorMulta: data.valorMulta || '0.00',
      dataPagamento: data.dataPagamento,
      status: getStatus(),
      observacoes: data.observacoes || undefined,
    };

    // Se for pagamento de infrações, processar as infrações selecionadas
    if (tipoSelecionado === 'infrações') {
      const infracoesSelecionadasParaPagamento = infracoesSelecionadas.filter(inf => inf.selecionada);
      const valorTotalSelecionado = valorTotalInfracoesSelecionadas;
      const valorPagoTotal = parseFloat(valorPagoFinal);
      
      // Determinar se o pagamento é total ou parcial
      const isPagamentoTotal = valorPagoTotal >= valorTotalSelecionado;
      
      // Atualizar cada infração selecionada
      for (const infracaoSelecionada of infracoesSelecionadasParaPagamento) {
        try {
          const updateData = {
            status: isPagamentoTotal ? 'pago' : 'pendente',
            dataPagamento: isPagamentoTotal ? data.dataPagamento : null,
          };
          
          await updateInfracao({ id: infracaoSelecionada.id, data: updateData });
        } catch (error) {
          console.error('Erro ao atualizar infração:', error);
        }
      }
    }

    onSubmit(pagamento);
    onClose();
    form.reset();
    setInfracoesSelecionadas([]);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setAluguelSelecionado(null);
    setInfracoesSelecionadas([]);
    setPagamentoAtrasado(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        {motoristasComAlugueis.length > 0 ? (
                          motoristasComAlugueis.map((motorista) => {
                            const aluguelAtivo = alugueis.find(a => 
                              a.motoristaId === motorista.id && a.status === 'ativo'
                            );
                            const veiculo = veiculos.find(v => v.id === aluguelAtivo?.veiculoId);
                            return (
                              <SelectItem key={motorista.id} value={motorista.id}>
                                {motorista.nome} - {veiculo?.placa || 'Placa não informada'}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="sem-motoristas" disabled>
                            Nenhum motorista com aluguel ativo
                          </SelectItem>
                        )}
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
                        <SelectItem value="aluguel">Aluguel</SelectItem>
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

            {/* Infrações em aberto quando tipo infrações for selecionado */}
            {tipoSelecionado === 'infrações' && motoristaId && infracoesEmAberto.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h4 className="text-sm font-medium text-red-800">Infrações em Aberto</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="selecionar-todas"
                      checked={infracoesSelecionadas.every(inf => inf.selecionada)}
                      onCheckedChange={toggleTodasInfracoes}
                    />
                    <label htmlFor="selecionar-todas" className="text-xs text-gray-600">
                      Selecionar todas
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  {infracoesEmAberto.map((infracao) => {
                    const infracaoSelecionada = infracoesSelecionadas.find(inf => inf.id === infracao.id);
                    return (
                      <div key={infracao.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded">
                        <Checkbox 
                          id={`infracao-${infracao.id}`}
                          checked={infracaoSelecionada?.selecionada || false}
                          onCheckedChange={() => toggleInfracaoSelecionada(infracao.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">Auto: {infracao.numeroAuto}</p>
                          <p className="text-gray-600">
                            {infracao.descricaoInfracao || infracao.codigoInfracao} - {infracao.tipoInfracao}
                          </p>
                          <p className="text-gray-500">Vencimento: {new Date(infracao.dataVencimento).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">R$ {parseFloat(infracao.valorFinal).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2">
                    <p className="text-sm font-medium text-red-800">
                      Total selecionado: R$ {valorTotalInfracoesSelecionadas.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aviso se não há infrações em aberto (apenas se tipo for infrações) */}
            {tipoSelecionado === 'infrações' && motoristaId && infracoesEmAberto.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Este motorista não possui infrações em aberto
                </p>
              </div>
            )}



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
                          readOnly={tipoSelecionado === 'infrações'}
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

              {/* Checkbox para pagamento atrasado */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pagamento-atrasado"
                  checked={pagamentoAtrasado}
                  onCheckedChange={setPagamentoAtrasado}
                />
                <label 
                  htmlFor="pagamento-atrasado" 
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

              {/* Checkbox para pagamento parcial (apenas para aluguéis) */}
              {tipoSelecionado === 'aluguel' && (
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
              )}

              {/* Valor Pago (para pagamento parcial de aluguel OU para infrações) */}
              {(isPagamentoParcial || tipoSelecionado === 'infrações') && (
                <FormField
                  control={form.control}
                  name="valorPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tipoSelecionado === 'infrações' ? 'Valor Pago' : 'Valor Pago Parcial'}
                      </FormLabel>
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
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}