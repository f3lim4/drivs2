/**
 * Modal para edição de aluguéis existentes
 * Formulário preenchido com dados do aluguel selecionado
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Aluguel, Motorista, Veiculo } from '@/types';

// Schema de validação
const aluguelSchema = z.object({
  motoristaId: z.string().min(1, 'Motorista é obrigatório'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  dataInicio: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  tempoContrato: z.number().min(1, 'Tempo de contrato deve ser maior que 0'),
  taxaAdministrativa: z.number().optional(),
  status: z.enum(['ativo', 'finalizado', 'cancelado', 'pendente']),
});

type AluguelFormData = z.infer<typeof aluguelSchema>;

interface EditarAluguelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluguel: Aluguel | null;
  onAluguelEditado: (aluguel: Aluguel) => void;
}

export function EditarAluguelModal({ 
  open, 
  onOpenChange, 
  aluguel,
  onAluguelEditado 
}: EditarAluguelModalProps) {
  const [loading, setLoading] = useState(false);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<AluguelFormData>({
    resolver: zodResolver(aluguelSchema),
    defaultValues: {
      motoristaId: '',
      veiculoId: '',
      dataInicio: undefined,
      tempoContrato: 1,
      taxaAdministrativa: undefined,
      status: 'ativo',
    },
  });

  // Carrega dados dos motoristas e veículos
  useEffect(() => {
    if (open) {
      const carregarDados = async () => {
        try {
          setLoadingData(true);
          
          // Carrega motoristas
          const motoristaResponse = await fetch('/api/motoristas');
          if (motoristaResponse.ok) {
            const motoristasData = await motoristaResponse.json();
            setMotoristas(motoristasData);
          }
          
          // Carrega veículos
          const veiculoResponse = await fetch('/api/veiculos');
          if (veiculoResponse.ok) {
            const veiculosData = await veiculoResponse.json();
            setVeiculos(veiculosData);
          }
          
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setLoadingData(false);
        }
      };
      
      carregarDados();
    }
  }, [open]);

  // Preenche o formulário quando o aluguel é selecionado
  useEffect(() => {
    if (aluguel && open) {
      try {
        const dataInicio = parse(aluguel.periodo.inicio, 'dd/MM/yyyy', new Date());
        
        form.reset({
          motoristaId: aluguel.motoristaId,
          veiculoId: aluguel.veiculoId,
          dataInicio: dataInicio,
          tempoContrato: aluguel.periodo.dias,
          taxaAdministrativa: aluguel.valores.taxaAdmin,
          status: aluguel.status,
        });
      } catch (error) {
        console.error('Erro ao processar dados do aluguel:', error);
      }
    }
  }, [aluguel, open, form]);

  const onSubmit = async (data: AluguelFormData) => {
    if (!aluguel) return;

    setLoading(true);
    
    try {
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Busca dados do motorista e veículo selecionados
      const motorista = motoristas.find(m => m.id === data.motoristaId);
      const veiculo = veiculos.find(v => v.id === data.veiculoId);

      if (!motorista || !veiculo) {
        throw new Error('Motorista ou veículo não encontrado');
      }

      // Calcula período
      const dataInicio = data.dataInicio;
      const dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + data.tempoContrato);

      // Calcula valores
      const valorMensal = parseFloat(veiculo.valorSemanal) * 4; // 4 semanas por mês
      const valorTotal = valorMensal * data.tempoContrato;

      // Cria aluguel atualizado
      const aluguelAtualizado: Aluguel = {
        ...aluguel,
        motoristaId: data.motoristaId,
        motoristaNome: motorista.nome,
        motoristaContato: motorista.telefone,
        veiculoId: data.veiculoId,
        veiculoModelo: `${veiculo.marca} ${veiculo.modelo}`,
        veiculoPlaca: veiculo.placa,
        periodo: {
          inicio: format(dataInicio, 'dd/MM/yyyy'),
          fim: format(dataFim, 'dd/MM/yyyy'),
          dias: data.tempoContrato,
        },
        valores: {
          diario: valorMensal,
          total: valorTotal,
          caucao: parseFloat(veiculo.caucao),
          taxaAdmin: data.taxaAdministrativa,
        },
        status: data.status,
      };

      onAluguelEditado(aluguelAtualizado);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao editar aluguel:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!aluguel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluguel</DialogTitle>
          <DialogDescription>
            Atualize as informações do contrato de locação.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* MOTORISTA */}
              <FormField
                control={form.control}
                name="motoristaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{motorista.nome}</span>
                              <span className="text-sm text-muted-foreground">
                                {motorista.telefone} • CNH: {motorista.categoria}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VEÍCULO */}
              <FormField
                control={form.control}
                name="veiculoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                R$ {parseFloat(veiculo.valorSemanal).toFixed(2)}/semana • {veiculo.cor} • {veiculo.ano}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DATA DE INÍCIO */}
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>dd/mm/aaaa</span>
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
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TEMPO DE CONTRATO, TAXA ADMINISTRATIVA E STATUS */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tempoContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de Contrato (meses) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxaAdministrativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Administrativa (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* STATUS */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Aluguel *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}