import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useLocais } from '@/hooks/useLocais';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertManutencaoSchema, type Veiculo } from '@shared/schema';
import { format } from 'date-fns';

const formSchema = insertManutencaoSchema.omit({ id: true });

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

  const form = useForm<z.infer<typeof formSchema>>({
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

  // Atualizar locadoraId quando o profile mudar
  React.useEffect(() => {
    if (profile?.locadoraId) {
      form.setValue('locadoraId', profile.locadoraId);
    }
  }, [profile?.locadoraId, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log('Dados do formulário:', data);
      console.log('Profile locadoraId:', profile?.locadoraId);
      console.log('Validação do formulário:', form.formState.errors);
      
      // Garantir que o locadoraId está correto
      const dataComLocadora = {
        ...data,
        locadoraId: profile?.locadoraId || data.locadoraId
      };
      
      console.log('Dados finais:', dataComLocadora);
      
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
      <DialogContent className="w-[90vw] sm:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle>Nova Manutenção</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="veiculoId">Veículo</Label>
              <Select 
                value={form.watch('veiculoId')} 
                onValueChange={(value) => form.setValue('veiculoId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {veiculos.map((veiculo: Veiculo) => (
                    <SelectItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.modelo} - {veiculo.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={form.watch('tipo')} 
                onValueChange={(value) => form.setValue('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2: Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...form.register('descricao')}
              placeholder="Descreva o serviço a ser realizado"
              rows={2}
            />
          </div>

          {/* Linha 3: Local/Oficina e Contato na mesma linha */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Local/Oficina</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local-manual"
                    name="local-type"
                    checked={!useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(false)}
                  />
                  <Label htmlFor="local-manual">Digitar manualmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local-cadastrado"
                    name="local-type"
                    checked={useLocalCadastrado}
                    onChange={() => handleTipoLocalChange(true)}
                  />
                  <Label htmlFor="local-cadastrado">Selecionar local cadastrado</Label>
                </div>
              </div>
            </div>

            {useLocalCadastrado ? (
              <div className="space-y-2">
                <Label htmlFor="local-select">Selecionar Local</Label>
                <Select 
                  value={localSelecionado} 
                  onValueChange={handleLocalSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um local" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oficina">Oficina</Label>
                  <Input
                    id="oficina"
                    {...form.register('oficina')}
                    placeholder="Nome da oficina"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    {...form.register('contato')}
                    placeholder="Telefone da oficina"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Linha 4: Data de Início, Data Prevista, Valor do Orçamento, Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                {...form.register('dataInicio')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPrevisao">Data Prevista</Label>
              <Input
                id="dataPrevisao"
                type="date"
                {...form.register('dataPrevisao')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorOrcamento">Valor do Orçamento</Label>
              <Input
                id="valorOrcamento"
                type="number"
                step="0.01"
                {...form.register('valorOrcamento')}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select 
                value={form.watch('prioridade')} 
                onValueChange={(value) => form.setValue('prioridade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Campos condicionais quando a manutenção está concluída */}
          {form.watch('status') === 'concluida' && (
            <>
              <div className="border-t pt-4 md:col-span-2 lg:col-span-3">
                <h4 className="text-lg font-semibold mb-4">Conclusão da Manutenção</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataConclusao">Data de Conclusão</Label>
                    <Input
                      id="dataConclusao"
                      type="date"
                      {...form.register('dataConclusao')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorFinal">Valor Final</Label>
                    <Input
                      id="valorFinal"
                      type="number"
                      step="0.01"
                      {...form.register('valorFinal')}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quilometragemFim">Quilometragem Final</Label>
                    <Input
                      id="quilometragemFim"
                      type="number"
                      {...form.register('quilometragemFim', { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proximaManutencaoKm">Próxima Manutenção (km) *</Label>
                    <Input
                      id="proximaManutencaoKm"
                      type="number"
                      {...form.register('proximaManutencaoKm', { valueAsNumber: true })}
                      placeholder="Ex: 80000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proximaManutencao">Próxima Manutenção (Data) - Opcional</Label>
                    <Input
                      id="proximaManutencao"
                      type="date"
                      {...form.register('proximaManutencao')}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="pecasSubstituidas">Peças Substituídas</Label>
                  <Textarea
                    id="pecasSubstituidas"
                    {...form.register('pecasSubstituidas')}
                    placeholder="Liste as peças que foram substituídas"
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}

          {/* Linha 5: Quilometragem, Status, Status Pagamento, Forma de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quilometragemInicio">Quilometragem Atual</Label>
              <Input
                id="quilometragemInicio"
                type="number"
                {...form.register('quilometragemInicio', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusPagamento">Status do Pagamento</Label>
              <Select 
                value={form.watch('statusPagamento')} 
                onValueChange={(value) => form.setValue('statusPagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select 
                value={form.watch('formaPagamento') || ''} 
                onValueChange={(value) => form.setValue('formaPagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar Manutenção'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}