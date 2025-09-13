import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Wrench } from 'lucide-react';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useLocais } from '@/hooks/useLocais';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertManutencaoSchema, type Veiculo } from '@shared/schema';
import { format } from 'date-fns';

const formSchema = insertManutencaoSchema.omit({ id: true });
type FormData = z.infer<typeof formSchema>;

interface NovaManutencaoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovaManutencaoModal({ open, onClose }: NovaManutencaoModalProps) {
  const { profile } = useAuth();
  const { createManutencao, isCreating } = useManutencoes();
  const { veiculos } = useVeiculos();
  const { locais } = useLocais();
  const { toast } = useToast();
  
  const [useLocalCadastrado, setUseLocalCadastrado] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locadoraId: profile?.locadoraId || '',
      veiculoId: '',
      tipo: 'preventiva',
      descricao: '',
      oficina: '',
      contato: '',
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      dataPrevisao: format(new Date(), 'yyyy-MM-dd'),
      status: 'agendada',
      prioridade: 'normal',
      statusPagamento: 'em_aberto',
      formaPagamento: null,
      proximaManutencaoKm: 0,
    },
  });

  const handleLocalSelection = (localId: string) => {
    setLocalSelecionado(localId);
    const local = locais.find(l => l.id === localId);
    if (local) {
      form.setValue('oficina', local.nome);
      form.setValue('contato', local.telefone || '');
    }
  };

  const handleTipoLocalChange = (useCadastrado: boolean) => {
    setUseLocalCadastrado(useCadastrado);
    if (!useCadastrado) {
      setLocalSelecionado('');
      form.setValue('oficina', '');
      form.setValue('contato', '');
    }
  };

  // Atualizar locadoraId quando o profile mudar
  React.useEffect(() => {
    if (profile?.locadoraId) {
      form.setValue('locadoraId', profile.locadoraId);
    }
  }, [profile?.locadoraId, form]);

  // Reset formulário quando o modal abrir
  React.useEffect(() => {
    if (open) {
      form.reset({
        locadoraId: profile?.locadoraId || '',
        veiculoId: '',
        tipo: 'preventiva',
        descricao: '',
        oficina: '',
        contato: '',
        dataInicio: format(new Date(), 'yyyy-MM-dd'),
        dataPrevisao: format(new Date(), 'yyyy-MM-dd'),
        status: 'agendada',
        prioridade: 'normal',
        statusPagamento: 'em_aberto',
        formaPagamento: null,
        proximaManutencaoKm: 0,
      });
      setUseLocalCadastrado(false);
      setLocalSelecionado('');
    }
  }, [open, profile?.locadoraId, form]);

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Dados do formulário:', data);
      
      // Garantir que o locadoraId está correto
      const dataComLocadora = {
        ...data,
        locadoraId: profile?.locadoraId || data.locadoraId
      };
      
      await createManutencao(dataComLocadora);
      toast({
        title: 'Manutenção criada com sucesso!',
        description: 'A manutenção foi agendada no sistema.',
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar manutenção:', error);
      toast({
        title: 'Erro ao criar manutenção',
        description: 'Ocorreu um erro ao criar a manutenção. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Nova Manutenção
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Primeira linha: Veículo e Tipo de Manutenção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="veiculoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculos.map((veiculo: Veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id}>
                            {veiculo.modelo} - {veiculo.placa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Manutenção</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="preventiva">Preventiva</SelectItem>
                        <SelectItem value="corretiva">Corretiva</SelectItem>
                        <SelectItem value="revisao">Revisão</SelectItem>
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
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o serviço a ser realizado, peças necessárias, problemas identificados..." 
                      {...field} 
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Local */}
            <div className="space-y-4">
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local-manual"
                    name="local-type"
                    checked={!useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(false)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="local-manual" className="text-sm">Digitar manualmente</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local-cadastrado"
                    name="local-type"
                    checked={useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(true)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="local-cadastrado" className="text-sm">Selecionar local cadastrado</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useLocalCadastrado ? (
                  <div className="md:col-span-2">
                    <FormLabel>Local Cadastrado</FormLabel>
                    <Select onValueChange={handleLocalSelection} value={localSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um local cadastrado" />
                      </SelectTrigger>
                      <SelectContent>
                        {locais.map((local) => (
                          <SelectItem key={local.id} value={local.id}>
                            {local.nome} - {local.tipo === 'oficina' ? 'Oficina' : 
                             local.tipo === 'concessionaria' ? 'Concessionária' : 
                             local.tipo === 'lava_jato' ? 'Lava Jato' : 'Outros'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="oficina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Oficina</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Oficina do João, AutoPeças Central..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contato"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone de Contato</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="(11) 9999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Datas e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataPrevisao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status, Quilometragem e Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quilometragemInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilometragem Atual</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statusPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="em_aberto">Em Aberto</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos condicionais quando a manutenção está concluída */}
            {form.watch('status') === 'concluida' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded border">
                <h4 className="text-lg font-semibold">Conclusão da Manutenção</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dataConclusao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Conclusão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
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
                        <FormLabel>Valor Final</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quilometragemFim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quilometragem Final</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proximaManutencaoKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima Manutenção (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 80000" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proximaManutencao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima Manutenção (Data)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pecasSubstituidas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peças Substituídas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Liste as peças que foram substituídas" 
                          {...field} 
                          value={field.value || ""}
                          rows={2}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Manutenção'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}