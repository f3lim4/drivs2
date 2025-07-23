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
import { useToast } from '@/hooks/use-toast';
import { insertManutencaoSchema } from '@shared/schema';
import type { Manutencao, Veiculo } from '@shared/schema';
import { useEffect } from 'react';

const formSchema = insertManutencaoSchema.omit({ id: true });

interface EditarManutencaoModalProps {
  open: boolean;
  onClose: () => void;
  manutencao: Manutencao | null;
}

export function EditarManutencaoModal({ open, onClose, manutencao }: EditarManutencaoModalProps) {
  const { updateManutencao, isUpdating } = useManutencoes();
  const { veiculos } = useVeiculos();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
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
      proximaManutencaoKm: undefined,
    },
  });

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
        proximaManutencaoKm: manutencao.proximaManutencaoKm || undefined,
      });
    }
  }, [manutencao, open, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Manutenção</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...form.register('descricao')}
              placeholder="Descreva o serviço a ser realizado"
              rows={3}
            />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataConclusao">Data de Conclusão</Label>
              <Input
                id="dataConclusao"
                type="date"
                {...form.register('dataConclusao')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quilometragemInicio">Quilometragem Inicial</Label>
              <Input
                id="quilometragemInicio"
                type="number"
                {...form.register('quilometragemInicio', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quilometragemFim">Quilometragem Final</Label>
              <Input
                id="quilometragemFim"
                type="number"
                {...form.register('quilometragemFim', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
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
            <Label htmlFor="pecasSubstituidas">Peças Substituídas</Label>
            <Textarea
              id="pecasSubstituidas"
              {...form.register('pecasSubstituidas')}
              placeholder="Liste as peças substituídas"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proximaManutencao">Próxima Manutenção</Label>
            <Input
              id="proximaManutencao"
              type="date"
              {...form.register('proximaManutencao')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}