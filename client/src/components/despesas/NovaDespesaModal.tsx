import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertDespesaSchema } from '@shared/schema';

const despesaFormSchema = insertDespesaSchema.omit({ id: true });

export function NovaDespesaModal() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { createDespesa, isCreating } = useDespesas();
  const { veiculos } = useVeiculos();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof despesaFormSchema>>({
    resolver: zodResolver(despesaFormSchema),
    defaultValues: {
      locadoraId: profile?.locadoraId || '',
      veiculoId: '',
      categoria: '',
      descricao: '',
      valor: '',
      data: new Date(),
      tipo: 'despesa',
      status: 'pendente',
      observacoes: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof despesaFormSchema>) => {
    try {
      await createDespesa(data);
      toast({
        title: 'Despesa criada com sucesso',
        description: 'A despesa foi cadastrada no sistema.',
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating despesa:', error);
      toast({
        title: 'Erro ao criar despesa',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  const categorias = [
    'combustivel',
    'manutencao',
    'seguro',
    'licenciamento',
    'ipva',
    'multa',
    'lavagem',
    'pneus',
    'revisao',
    'reparo',
    'outros'
  ];

  const categoriasLabels = {
    combustivel: 'Combustível',
    manutencao: 'Manutenção',
    seguro: 'Seguro',
    licenciamento: 'Licenciamento',
    ipva: 'IPVA',
    multa: 'Multa',
    lavagem: 'Lavagem',
    pneus: 'Pneus',
    revisao: 'Revisão',
    reparo: 'Reparo',
    outros: 'Outros'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoriasLabels[categoria as keyof typeof categoriasLabels]}
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
                name="veiculoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sem-veiculo">Nenhum veículo</SelectItem>
                        {veiculos.map((veiculo) => (
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
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição da despesa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0,00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: pt })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Observações adicionais" 
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Despesa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}