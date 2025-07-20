import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus, Info } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertDespesaSchema } from '@shared/schema';
import { parse } from 'date-fns';

const despesaFormSchema = insertDespesaSchema.omit({ id: true });

// Função para converter data brasileira (dd/MM/yyyy) para Date
const parseDate = (dateStr: string): Date | undefined => {
  try {
    if (dateStr.includes('/')) {
      return parse(dateStr, 'dd/MM/yyyy', new Date());
    }
    return new Date(dateStr);
  } catch {
    return undefined;
  }
};

export function NovaDespesaModal() {
  const [open, setOpen] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
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
      valor: 0,
      data: format(new Date(), 'dd/MM/yyyy'),
      tipo: 'despesa',
      status: 'pendente',
      observacoes: '',
    },
  });

  // Observar mudanças nos campos categoria e veiculoId
  const categoria = form.watch('categoria');
  const veiculoId = form.watch('veiculoId');
  const valorTotal = form.watch('valor');

  // Preenchimento automático quando categoria é seguro e veículo selecionado
  useEffect(() => {
    if (categoria === 'seguro' && veiculoId && veiculoId !== 'sem-veiculo') {
      const veiculo = veiculos.find(v => v.id === veiculoId);
      if (veiculo && veiculo.valorSeguroMensal) {
        form.setValue('valor', parseFloat(veiculo.valorSeguroMensal.toString()));
        form.setValue('descricao', `Seguro ${veiculo.seguradora || 'mensal'} - ${veiculo.placa}`);
      }
    }
  }, [categoria, veiculoId, veiculos, form]);

  // Limpar veículos selecionados quando categoria não for empréstimo
  useEffect(() => {
    if (categoria !== 'emprestimo') {
      setSelectedVehicles([]);
    }
  }, [categoria]);

  // Funções para gerenciar seleção de veículos
  const handleVehicleSelection = (veiculoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, veiculoId]);
    } else {
      setSelectedVehicles(prev => prev.filter(id => id !== veiculoId));
    }
  };

  const handleSelectAllVehicles = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(veiculos.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  // Calcular valor por veículo para empréstimos
  const valorPorVeiculo = categoria === 'emprestimo' && selectedVehicles.length > 0 && valorTotal
    ? (parseFloat(valorTotal.toString().replace(',', '.')) / selectedVehicles.length).toFixed(2)
    : '0.00';

  const onSubmit = async (data: z.infer<typeof despesaFormSchema>) => {
    try {
      // Validar se categoria empréstimo tem veículos selecionados
      if (data.categoria === 'emprestimo' && selectedVehicles.length === 0) {
        toast({
          title: 'Erro de validação',
          description: 'Para empréstimos, você deve selecionar pelo menos um veículo.',
          variant: 'destructive',
        });
        return;
      }

      // Se for categoria "emprestimo" e há veículos selecionados, criar múltiplas despesas
      if (data.categoria === 'emprestimo' && selectedVehicles.length > 0) {
        const valorTotal = parseFloat(data.valor.toString().replace(',', '.'));
        const valorPorVeiculo = (valorTotal / selectedVehicles.length).toFixed(2);
        
        // Criar uma despesa para cada veículo selecionado
        const promises = selectedVehicles.map(veiculoId => 
          createDespesa({
            ...data,
            veiculoId,
            valor: parseFloat(valorPorVeiculo),
            descricao: `${data.descricao} (${selectedVehicles.length} veículos - R$ ${valorPorVeiculo} cada)`,
          })
        );
        
        await Promise.all(promises);
        
        toast({
          title: 'Despesas criadas com sucesso',
          description: `${selectedVehicles.length} despesas de empréstimo criadas - R$ ${valorPorVeiculo} cada`,
        });
      } else {
        // Comportamento padrão para outras categorias
        await createDespesa(data);
        toast({
          title: 'Despesa criada com sucesso',
          description: 'A despesa foi cadastrada no sistema.',
        });
      }
      
      setOpen(false);
      form.reset();
      setSelectedVehicles([]);
    } catch (error) {
      console.error('Error creating despesa:', error);
      
      if (error.message === 'DUPLICATE') {
        toast({
          title: 'Despesa duplicada',
          description: 'Uma despesa igual já existe para este veículo na mesma data com o mesmo valor.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar despesa',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    }
  };

  const categorias = [
    'combustivel',
    'gasolina',
    'despachante',
    'manutencao',
    'seguro',
    'licenciamento',
    'ipva',
    'multa',
    'lavagem',
    'pneus',
    'revisao',
    'reparo',
    'emprestimo',
    'outros'
  ];

  // Debug: forçar reload das categorias
  console.log('Categorias disponíveis:', categorias);

  const categoriasLabels = {
    combustivel: 'Combustível',
    gasolina: 'Gasolina',
    despachante: 'Despachante',
    manutencao: 'Manutenção',
    seguro: 'Seguro',
    licenciamento: 'Licenciamento',
    ipva: 'IPVA',
    multa: 'Multa',
    lavagem: 'Lavagem',
    pneus: 'Pneus',
    revisao: 'Revisão',
    reparo: 'Reparo',
    emprestimo: 'Empréstimo',
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

              {categoria === 'emprestimo' ? (
                <FormItem>
                  <FormLabel>Veículos para Empréstimo</FormLabel>
                  <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all"
                        checked={selectedVehicles.length === veiculos.length}
                        onCheckedChange={handleSelectAllVehicles}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Selecionar todos os veículos ({veiculos.length})
                      </label>
                    </div>
                    {veiculos.map((veiculo) => (
                      <div key={veiculo.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={veiculo.id}
                          checked={selectedVehicles.includes(veiculo.id)}
                          onCheckedChange={(checked) => handleVehicleSelection(veiculo.id, checked as boolean)}
                        />
                        <label htmlFor={veiculo.id} className="text-sm">
                          {veiculo.modelo} - {veiculo.placa}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedVehicles.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <Info className="h-4 w-4" />
                      <span>
                        {selectedVehicles.length} veículos selecionados
                        {valorTotal && ` - R$ ${valorPorVeiculo} por veículo`}
                      </span>
                    </div>
                  )}
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="veiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
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
              )}
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
                    <FormLabel>
                      Valor
                      {categoria === 'seguro' && veiculoId && veiculoId !== 'sem-veiculo' && (
                        <span className="text-xs text-green-600 ml-2">(preenchido automaticamente)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
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
                              format(new Date(field.value), 'dd/MM/yyyy', { locale: pt })
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
                          selected={field.value ? parseDate(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'dd/MM/yyyy') : '')}
                          disabled={(date) => date < new Date('1900-01-01')}
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