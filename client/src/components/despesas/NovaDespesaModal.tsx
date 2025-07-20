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
import { CalendarIcon, Plus, Info, ChevronDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDespesas } from '@/hooks/useDespesas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertDespesaSchema } from '@shared/schema';
import { parse } from 'date-fns';

const despesaFormSchema = insertDespesaSchema.omit({ id: true }).extend({
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.union([
    z.string().min(1, 'Valor é obrigatório').refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Valor deve ser maior que zero'),
    z.number().min(0.01, 'Valor deve ser maior que zero')
  ]),
  data: z.string().min(1, 'Data é obrigatória'),
});

// Função para converter data brasileira (dd/MM/yyyy) para Date
const parseDate = (dateStr: string): Date | undefined => {
  try {
    if (!dateStr) return undefined;
    
    if (dateStr.includes('/')) {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
};

export function NovaDespesaModal() {
  const [open, setOpen] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [searchVehicle, setSearchVehicle] = useState('');
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

  // Limpar veículos selecionados quando categoria muda
  useEffect(() => {
    setSelectedVehicles([]);
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

  // Calcular valor por veículo quando múltiplos veículos selecionados
  const valorPorVeiculo = selectedVehicles.length > 1 && valorTotal
    ? (parseFloat(valorTotal.toString().replace(',', '.')) / selectedVehicles.length).toFixed(2)
    : '0.00';

  const onSubmit = async (data: z.infer<typeof despesaFormSchema>) => {
    try {
      // Converter valor para número
      const valorNumerico = parseFloat(data.valor.toString().replace(',', '.')) || 0;
      
      if (valorNumerico <= 0) {
        toast({
          title: 'Valor inválido',
          description: 'Por favor, insira um valor maior que zero.',
          variant: 'destructive',
        });
        return;
      }

      // Garantir que locadoraId está sempre presente
      const locadoraId = profile?.locadoraId || '';
      
      if (!locadoraId) {
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível identificar sua locadora. Faça login novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Se há múltiplos veículos selecionados, criar uma despesa para cada
      if (selectedVehicles.length > 1) {
        const valorPorVeiculo = (valorNumerico / selectedVehicles.length).toFixed(2);
        
        // Criar uma despesa para cada veículo selecionado
        const promises = selectedVehicles.map(veiculoId => 
          createDespesa({
            ...data,
            locadoraId,
            veiculoId,
            valor: parseFloat(valorPorVeiculo),
            descricao: `${data.descricao} (${selectedVehicles.length} veículos - R$ ${valorPorVeiculo} cada)`,
          })
        );
        
        await Promise.all(promises);
        
        toast({
          title: 'Despesas criadas com sucesso',
          description: `${selectedVehicles.length} despesas criadas - R$ ${valorPorVeiculo} cada veículo`,
        });
      } else if (selectedVehicles.length === 1) {
        // Se apenas um veículo selecionado
        await createDespesa({
          ...data,
          locadoraId,
          veiculoId: selectedVehicles[0],
          valor: valorNumerico,
        });
        toast({
          title: 'Despesa criada com sucesso',
          description: 'A despesa foi cadastrada no sistema.',
        });
      } else {
        // Se nenhum veículo selecionado, criar despesa sem veículo específico
        await createDespesa({
          ...data,
          locadoraId,
          veiculoId: 'sem-veiculo',
          valor: valorNumerico,
        });
        toast({
          title: 'Despesa criada com sucesso',
          description: 'A despesa foi cadastrada no sistema.',
        });
      }
      
      setOpen(false);
      form.reset({
        locadoraId: locadoraId,
        veiculoId: '',
        categoria: '',
        descricao: '',
        valor: '',
        data: format(new Date(), 'dd/MM/yyyy'),
        tipo: 'despesa',
        status: 'pendente',
        observacoes: '',
      });
      setSelectedVehicles([]);
      setSearchVehicle('');
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
                    <FormLabel>Categoria *</FormLabel>
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

              <FormItem>
                <FormLabel>Veículos (opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedVehicles.length === 0 
                          ? "Selecionar veículos" 
                          : selectedVehicles.length === 1 
                            ? `${veiculos.find(v => v.id === selectedVehicles[0])?.placa} - ${veiculos.find(v => v.id === selectedVehicles[0])?.modelo}`
                            : `${selectedVehicles.length} veículos selecionados`
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {/* Campo de busca */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar veículo por placa ou modelo..."
                          value={searchVehicle}
                          onChange={(e) => setSearchVehicle(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSelectAllVehicles(true)}
                          className="text-xs"
                        >
                          Selecionar Todos
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedVehicles([])}
                          className="text-xs"
                        >
                          Limpar Seleção
                        </Button>
                      </div>
                      
                      {/* Lista de veículos filtrada */}
                      {veiculos
                        .filter((veiculo) => {
                          if (!searchVehicle) return true;
                          const search = searchVehicle.toLowerCase();
                          return (
                            veiculo.placa?.toLowerCase().includes(search) ||
                            veiculo.modelo?.toLowerCase().includes(search) ||
                            veiculo.marca?.toLowerCase().includes(search)
                          );
                        })
                        .map((veiculo) => (
                        <div key={veiculo.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={veiculo.id}
                            checked={selectedVehicles.includes(veiculo.id)}
                            onCheckedChange={(checked) => handleVehicleSelection(veiculo.id, checked as boolean)}
                          />
                          <label htmlFor={veiculo.id} className="text-sm cursor-pointer flex-1">
                            {veiculo.placa} - {veiculo.modelo}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedVehicles.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Info className="h-4 w-4" />
                    <span>
                      {selectedVehicles.length} veículos selecionados
                      {selectedVehicles.length > 1 && valorTotal && ` - R$ ${valorPorVeiculo} por veículo`}
                    </span>
                  </div>
                )}
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
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
                      Valor *
                      {categoria === 'seguro' && veiculoId && veiculoId !== 'sem-veiculo' && (
                        <span className="text-xs text-green-600 ml-2">(preenchido automaticamente)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder=""
                        inputMode="decimal"
                        onChange={(e) => {
                          const value = e.target.value;
                          // Só permite números, vírgula e ponto
                          if (value === '' || /^[0-9]+([.,][0-9]*)?$/.test(value)) {
                            field.onChange(value);
                          }
                        }}
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
                    <FormLabel>Data *</FormLabel>
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
                              field.value
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
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, 'dd/MM/yyyy'));
                            } else {
                              field.onChange('');
                            }
                          }}
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