import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { insertManutencaoSchema, type Manutencao, type Veiculo } from '@shared/schema';

const formSchema = insertManutencaoSchema.omit({ id: true });
type FormData = z.infer<typeof formSchema>;

interface EditarManutencaoModalProps {
  open: boolean;
  onClose: () => void;
  manutencao: Manutencao | null;
}

export function EditarManutencaoModal({ open, onClose, manutencao }: EditarManutencaoModalProps) {
  const { updateManutencao, isUpdating } = useManutencoes();
  const { veiculos } = useVeiculos();
  const { locais } = useLocais();
  const { toast } = useToast();
  
  const [useLocalCadastrado, setUseLocalCadastrado] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locadoraId: '',
      veiculoId: '',
      tipo: 'preventiva',
      descricao: '',
      oficina: '',
      contato: '',
      dataInicio: '',
      dataPrevisao: '',
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

  useEffect(() => {
    if (manutencao && open) {
      form.reset({
        locadoraId: manutencao.locadoraId,
        veiculoId: manutencao.veiculoId,
        tipo: manutencao.tipo,
        descricao: manutencao.descricao,
        oficina: manutencao.oficina,
        contato: manutencao.contato || '',
        valorOrcamento: manutencao.valorOrcamento || undefined,
        valorFinal: manutencao.valorFinal || undefined,
        dataInicio: manutencao.dataInicio,
        dataPrevisao: manutencao.dataPrevisao,
        dataConclusao: manutencao.dataConclusao || undefined,
        quilometragemInicio: manutencao.quilometragemInicio || undefined,
        quilometragemFim: manutencao.quilometragemFim || undefined,
        status: manutencao.status,
        prioridade: manutencao.prioridade,
        statusPagamento: manutencao.statusPagamento || 'em_aberto',
        formaPagamento: manutencao.formaPagamento || null,
        pecasSubstituidas: manutencao.pecasSubstituidas || '',
        proximaManutencao: manutencao.proximaManutencao || undefined,
        proximaManutencaoKm: manutencao.proximaManutencaoKm || 0,
      });
    }
  }, [manutencao, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!manutencao) return;
    
    try {
      await updateManutencao({
        id: manutencao.id,
        ...data,
      });
      toast({
        title: 'Manutenção atualizada com sucesso!',
        description: 'As informações da manutenção foram salvas.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar manutenção',
        description: 'Ocorreu um erro ao atualizar a manutenção. Tente novamente.',
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
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Editar Manutenção
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
                        <SelectTrigger data-testid="select-veiculo-edit">
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
                        <SelectTrigger data-testid="select-tipo-edit">
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
                      data-testid="textarea-descricao-edit"
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
                    id="local-manual-edit"
                    name="local-type-edit"
                    checked={!useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(false)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    data-testid="radio-local-manual-edit"
                  />
                  <label htmlFor="local-manual-edit" className="text-sm">Digitar manualmente</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local-cadastrado-edit"
                    name="local-type-edit"
                    checked={useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(true)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    data-testid="radio-local-cadastrado-edit"
                  />
                  <label htmlFor="local-cadastrado-edit" className="text-sm">Selecionar local cadastrado</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useLocalCadastrado ? (
                  <div className="md:col-span-2">
                    <FormLabel>Local Cadastrado</FormLabel>
                    <Select onValueChange={handleLocalSelection} value={localSelecionado}>
                      <SelectTrigger data-testid="select-local-cadastrado-edit">
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
                            <Input 
                              placeholder="Ex: Oficina do João, AutoPeças Central..." 
                              {...field} 
                              data-testid="input-oficina-edit"
                            />
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
                            <Input 
                              placeholder="(11) 9999-9999" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-contato-edit"
                            />
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
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-data-inicio-edit"
                      />
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
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-data-previsao-edit"
                      />
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
                        <SelectTrigger data-testid="select-prioridade-edit">
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

            {/* Data Conclusão, Valores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dataConclusao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Conclusão</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-data-conclusao-edit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorOrcamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Orçamento</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-valor-orcamento-edit"
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
                    <FormLabel>Valor Final</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-valor-final-edit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quilometragem e Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quilometragemInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilometragem Inicial</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                        data-testid="input-quilometragem-inicio-edit"
                      />
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
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                        data-testid="input-quilometragem-fim-edit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status-edit">
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
            </div>

            {/* Peças Substituídas */}
            <FormField
              control={form.control}
              name="pecasSubstituidas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peças Substituídas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Liste as peças substituídas" 
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      className="resize-none"
                      data-testid="textarea-pecas-edit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Próxima Manutenção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proximaManutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Manutenção</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-proxima-manutencao-edit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proximaManutencaoKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilometragem da Próxima Manutenção</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        value={field.value || ''}
                        data-testid="input-proxima-km-edit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statusPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status-pagamento-edit">
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
                        <SelectTrigger data-testid="select-forma-pagamento-edit">
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

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancelar-edit"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="flex-1"
                data-testid="button-salvar-edit"
              >
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}