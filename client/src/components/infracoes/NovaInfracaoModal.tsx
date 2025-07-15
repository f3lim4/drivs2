import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useInfracoes } from '@/hooks/useInfracoes';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAlugueis } from '@/hooks/useAlugueis';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertInfracaoSchema } from '@shared/schema';
import { Calendar, AlertTriangle } from 'lucide-react';

const formSchema = insertInfracaoSchema.extend({
  numeroAuto: z.string().min(1, 'Número do auto é obrigatório'),
  codigoInfracao: z.string().min(1, 'Código da infração é obrigatório'),
  tipoInfracao: z.string().min(1, 'Tipo da infração é obrigatório'),
  dataInfracao: z.string().min(1, 'Data da infração é obrigatória'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataNotificacao: z.string().optional(),
  dataPagamento: z.string().optional(),
  valorOriginal: z.string().min(1, 'Valor original é obrigatório'),
  valorDesconto: z.string().optional(),
  valorFinal: z.string().min(1, 'Valor final é obrigatório'),
  localInfracao: z.string().min(1, 'Local da infração é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  orgaoAutuador: z.string().min(1, 'Órgão autuador é obrigatório'),
  motoristaId: z.string().min(1, 'Motorista é obrigatório'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
}).omit({ id: true, pontuacao: true, agente: true });

type FormData = z.infer<typeof formSchema>;

interface NovaInfracaoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovaInfracaoModal({ open, onClose }: NovaInfracaoModalProps) {
  const { createInfracao, isCreating } = useInfracoes();
  const { motoristas } = useMotoristas();
  const { veiculos } = useVeiculos();
  const { alugueis } = useAlugueis();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locadoraId: user?.locadoraId || '',
      motoristaId: '',
      veiculoId: '',
      aluguelId: 'sem-aluguel',
      numeroAuto: '',
      codigoInfracao: '',
      descricaoInfracao: '',
      tipoInfracao: '',

      valorOriginal: '',
      valorDesconto: '0.00',
      valorFinal: '',
      dataInfracao: '',
      dataVencimento: '',
      dataNotificacao: '',
      dataPagamento: '',
      localInfracao: '',
      cidade: '',
      estado: '',
      orgaoAutuador: '',
      status: 'pendente',
      situacao: 'ativo',
      responsavel: 'motorista',
      observacoes: '',
    },
  });

  // Estados para controlar o modo de seleção
  const [selecaoManual, setSelecaoManual] = React.useState(false);
  const [aluguelSelecionado, setAluguelSelecionado] = React.useState<string>('');

  // Filtrar motoristas com aluguéis ativos
  const motoristasComAluguel = React.useMemo(() => {
    return alugueis.filter(aluguel => aluguel.status === 'ativo').map(aluguel => ({
      aluguelId: aluguel.id,
      motoristaId: aluguel.motoristaId,
      motoristaNome: aluguel.motoristaNome,
      veiculoId: aluguel.veiculoId,
      veiculoModelo: aluguel.veiculoModelo,
      veiculoPlaca: aluguel.veiculoPlaca,
    }));
  }, [alugueis]);

  // Função para selecionar aluguel ativo
  const handleSelectAluguel = (aluguelId: string) => {
    const aluguel = motoristasComAluguel.find(a => a.aluguelId === aluguelId);
    if (aluguel) {
      setAluguelSelecionado(aluguelId);
      form.setValue('aluguelId', aluguelId);
      form.setValue('motoristaId', aluguel.motoristaId);
      form.setValue('veiculoId', aluguel.veiculoId);
    }
  };

  // Reset quando muda o modo de seleção
  React.useEffect(() => {
    if (selecaoManual) {
      setAluguelSelecionado('');
      form.setValue('aluguelId', 'sem-aluguel');
      form.setValue('motoristaId', '');
      form.setValue('veiculoId', '');
    }
  }, [selecaoManual, form]);

  const watchedValues = form.watch(['valorOriginal', 'valorDesconto']);

  // Reset formulário quando o modal abrir
  React.useEffect(() => {
    if (open) {
      console.log('Motoristas carregados:', motoristas);
      console.log('Veículos carregados:', veiculos);
      console.log('Aluguéis carregados:', alugueis);
      // Reset formulário quando o modal abrir
      form.reset({
        locadoraId: user?.locadoraId || '',
        motoristaId: '',
        veiculoId: '',
        aluguelId: 'sem-aluguel',
        numeroAuto: '',
        codigoInfracao: '',
        descricaoInfracao: '',
        tipoInfracao: '',

        valorOriginal: '',
        valorDesconto: '0.00',
        valorFinal: '',
        dataInfracao: '',
        dataVencimento: '',
        dataNotificacao: '',
        dataPagamento: '',
        localInfracao: '',
        cidade: '',
        estado: '',
        orgaoAutuador: '',
        observacoes: '',
      });
      // Reset estados locais
      setSelecaoManual(false);
      setAluguelSelecionado('');
    }
  }, [open, motoristas, veiculos, alugueis, form, user?.locadoraId]);

  // Calcular valor final automaticamente
  const calculateValorFinal = () => {
    const valorOriginal = parseFloat(watchedValues[0] || '0');
    const taxaAdminPercent = parseFloat(watchedValues[1] || '0');
    const taxaAdminValor = (valorOriginal * taxaAdminPercent) / 100;
    const valorFinal = valorOriginal + taxaAdminValor;
    form.setValue('valorFinal', valorFinal.toFixed(2));
  };

  // Atualizar valor final quando valores mudam
  React.useEffect(() => {
    calculateValorFinal();
  }, [watchedValues]);



  const onSubmit = async (data: FormData) => {
    console.log('OnSubmit chamado com dados:', data);
    console.log('Erros do formulário:', form.formState.errors);
    console.log('Dados do usuário:', user);
    
    try {
      // Converter valores para decimal
      const taxaAdminPercent = parseFloat(data.valorDesconto || '0');
      const valorOriginal = parseFloat(data.valorOriginal);
      const taxaAdminValor = (valorOriginal * taxaAdminPercent) / 100;
      
      const infracaoData = {
        ...data,
        locadoraId: user?.locadoraId || user?.id || '',
        valorOriginal: valorOriginal.toFixed(2),
        valorDesconto: taxaAdminValor.toFixed(2), // Salva o valor calculado da taxa, não a porcentagem
        valorFinal: parseFloat(data.valorFinal).toFixed(2),

        dataInfracao: data.dataInfracao,
        dataVencimento: data.dataVencimento,
        dataNotificacao: data.dataNotificacao || null,
        dataPagamento: data.dataPagamento || null,
        aluguelId: data.aluguelId === 'sem-aluguel' ? null : data.aluguelId,
        observacoes: data.observacoes || null,
        // Valores fixos que não aparecem na interface
        status: 'pendente',
        situacao: 'ativo', 
        responsavel: 'motorista',
      };

      await createInfracao(infracaoData);
      
      toast({
        title: "Infração criada com sucesso!",
        description: "A infração foi registrada no sistema.",
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar infração:', error);
      toast({
        title: "Erro ao criar infração",
        description: "Ocorreu um erro ao registrar a infração. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Nova Infração de Trânsito
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados do Motorista e Veículo */}
              <div className="space-y-2">
                
                {/* Seleção de Motorista com Aluguel Ativo */}
                {!selecaoManual && (
                  <div className="space-y-2">
                    <FormLabel className="text-sm">Motorista com Aluguel Ativo</FormLabel>
                    <Select onValueChange={handleSelectAluguel} value={aluguelSelecionado}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione o motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        {motoristasComAluguel.length > 0 ? (
                          motoristasComAluguel.map((item) => (
                            <SelectItem key={item.aluguelId} value={item.aluguelId}>
                              {item.motoristaNome} - {item.veiculoModelo} ({item.veiculoPlaca})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Nenhum motorista com aluguel ativo
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Checkbox para seleção manual */}
                <div className="flex items-center space-x-2 -mt-2">
                  <input
                    type="checkbox"
                    id="selecaoManual"
                    checked={selecaoManual}
                    onChange={(e) => setSelecaoManual(e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selecaoManual" className="text-xs text-gray-600">
                    Seleção manual
                  </label>
                </div>

                {/* Campos manuais quando checkbox marcado */}
                {selecaoManual && (
                  <div className="space-y-3 bg-gray-50 p-3 rounded border">
                    <FormField
                      control={form.control}
                      name="motoristaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Motorista</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione o motorista" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {motoristas.length > 0 ? (
                                motoristas.map((motorista) => (
                                  <SelectItem key={motorista.id} value={motorista.id}>
                                    {motorista.nome} - {motorista.id}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Carregando motoristas...
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="veiculoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Veículo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {veiculos.length > 0 ? (
                                veiculos.map((veiculo) => (
                                  <SelectItem key={veiculo.id} value={veiculo.id}>
                                    {veiculo.modelo} - {veiculo.placa}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Carregando veículos...
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Campo de Tipo da Infração */}
                <FormField
                  control={form.control}
                  name="tipoInfracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Tipo da Infração</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leve">Leve (3 pontos)</SelectItem>
                          <SelectItem value="media">Média (4 pontos)</SelectItem>
                          <SelectItem value="grave">Grave (5 pontos)</SelectItem>
                          <SelectItem value="gravissima">Gravíssima (7 pontos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo oculto para aluguelId */}
                <FormField
                  control={form.control}
                  name="aluguelId"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />
              </div>

              {/* Dados da Infração */}
              <div className="space-y-3">

                <FormField
                  control={form.control}
                  name="numeroAuto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Número do Auto</FormLabel>
                      <FormControl>
                        <Input className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigoInfracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Código da Infração</FormLabel>
                      <FormControl>
                        <Input className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Descrição da Infração */}
            <FormField
              control={form.control}
              name="descricaoInfracao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="" 
                      {...field} 
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valores Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valorOriginal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Original (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorDesconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa Admin % (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Final (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="" 
                        {...field}
                        readOnly
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInfracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Infração</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataNotificacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Notificação (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataPagamento"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Data do Pagamento (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

            {/* Local da Infração e Órgão Autuador */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="localInfracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Infração</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orgaoAutuador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órgão Autuador</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="" 
                      {...field} 
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                onClick={(e) => {
                  console.log('Botão clicado');
                  console.log('Form valid:', form.formState.isValid);
                  console.log('Form errors:', form.formState.errors);
                  console.log('Form values:', form.getValues());
                }}
              >
                {isCreating ? 'Criando...' : 'Criar Infração'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}