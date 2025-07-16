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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertManutencaoSchema } from '@shared/schema';
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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locadoraId: profile?.locadoraId || '',
      tipo: 'preventiva',
      descricao: '',
      oficina: '',
      contato: '',
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      dataPrevisao: format(new Date(), 'yyyy-MM-dd'),
      status: 'agendada',
      prioridade: 'normal',
      observacoes: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await createManutencao(data);
      toast({
        title: 'Manutenção criada com sucesso!',
        description: 'A manutenção foi agendada no sistema.',
      });
      form.reset();
      onClose();
    } catch (error) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Manutenção</DialogTitle>
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
                  {veiculos.map((veiculo) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...form.register('observacoes')}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
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