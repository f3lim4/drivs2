/**
 * Modal para cadastro de novos aluguéis
 * Formulário completo com validação
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
import { generateId } from '@/utils/formatters';

// Schema de validação
const aluguelSchema = z.object({
  motoristaId: z.string().min(1, 'Motorista é obrigatório'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  dataInicio: z.date({
    required_error: 'Data de início é obrigatória',
  }).refine((date) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return date >= hoje;
  }, {
    message: 'Data de início deve ser hoje ou uma data futura',
  }),
  tempoContrato: z.number().min(1, 'Tempo de contrato deve ser maior que 0'),
  taxaAdministrativa: z.number().optional(),
});

type AluguelFormData = z.infer<typeof aluguelSchema>;

interface NovoAluguelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAluguelAdicionado: (aluguel: Aluguel) => void;
}

export function NovoAluguelModal({ 
  open, 
  onOpenChange, 
  onAluguelAdicionado 
}: NovoAluguelModalProps) {
  const [loading, setLoading] = useState(false);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { isLocadora, profile } = useAuth();

  // Função para obter a data de amanhã
  const getAmanha = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return amanha;
  };

  const form = useForm<AluguelFormData>({
    resolver: zodResolver(aluguelSchema),
    defaultValues: {
      motoristaId: '',
      veiculoId: '',
      dataInicio: getAmanha(),
      tempoContrato: 1,
      taxaAdministrativa: undefined,
    },
  });

  // Carrega dados dos motoristas e veículos com isolamento de segurança
  useEffect(() => {
    if (open && profile) {
      const carregarDados = async () => {
        try {
          setLoadingData(true);
          
          // CRITICAL SECURITY: Sempre usar filtro se for locadora
          let motoristaUrl = '/api/motoristas';
          let veiculoUrl = '/api/veiculos';
          
          if (isLocadora && profile?.locadoraId) {
            motoristaUrl += `?locadoraId=${profile.locadoraId}`;
            veiculoUrl += `?locadoraId=${profile.locadoraId}`;
          }
          
          // Carrega motoristas
          const motoristaResponse = await fetch(motoristaUrl, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          if (motoristaResponse.ok) {
            const motoristasData = await motoristaResponse.json();
            
            // FILTRO DE SEGURANÇA: Verificar se todos os motoristas pertencem à locadora
            if (isLocadora && profile?.locadoraId) {
              const todosMotoristasCorretos = motoristasData.every(m => m.locadoraId === profile.locadoraId);
              if (!todosMotoristasCorretos) {
                console.error('SECURITY ALERT: Motoristas de outras locadoras detectados');
                setMotoristas([]);
              } else {
                setMotoristas(motoristasData);
              }
            } else {
              setMotoristas(motoristasData);
            }
          }
          
          // Carrega veículos
          const veiculoResponse = await fetch(veiculoUrl, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          if (veiculoResponse.ok) {
            const veiculosData = await veiculoResponse.json();
            
            // FILTRO DE SEGURANÇA: Verificar se todos os veículos pertencem à locadora
            if (isLocadora && profile?.locadoraId) {
              const todosVeiculosCorretos = veiculosData.every(v => v.locadoraId === profile.locadoraId);
              if (!todosVeiculosCorretos) {
                console.error('SECURITY ALERT: Veículos de outras locadoras detectados');
                setVeiculos([]);
              } else {
                setVeiculos(veiculosData);
              }
            } else {
              setVeiculos(veiculosData);
            }
          }
          
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setLoadingData(false);
        }
      };
      
      carregarDados();
    }
  }, [open, profile?.locadoraId, isLocadora]);

  // Filtra apenas veículos disponíveis
  const veiculosDisponiveis = veiculos.filter(veiculo => 
    veiculo.status === 'disponivel' || veiculo.status === 'ativo'
  );

  // Filtra apenas motoristas ativos
  const motoristasAtivos = motoristas.filter(motorista => motorista.status === 'ativo');

  const onSubmit = async (data: AluguelFormData) => {
    setLoading(true);
    
    try {
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

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

      // Calcula valores (converte string para número)
      const valorSemanalNum = typeof veiculo.valorSemanal === 'string' ? 
        parseFloat(veiculo.valorSemanal.replace(',', '.')) : 
        veiculo.valorSemanal;
      const valorMensal = valorSemanalNum * 4; // 4 semanas por mês
      const valorTotal = valorMensal * data.tempoContrato;

      // Cria novo aluguel na API
      const aluguelData = {
        id: generateId(),
        locadoraId: profile?.locadoraId || '', // Usar o ID da locadora autenticada
        motoristaId: data.motoristaId,
        veiculoId: data.veiculoId,
        dataInicio: format(dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFim, 'yyyy-MM-dd'),
        tempoContrato: data.tempoContrato,
        valorMensal: valorMensal.toString(),
        valorTotal: valorTotal.toString(),
        caucao: (typeof veiculo.caucao === 'string' ? 
          parseFloat(veiculo.caucao.replace(',', '.')) : 
          veiculo.caucao).toString(),
        taxaAdministrativa: data.taxaAdministrativa ? data.taxaAdministrativa.toString() : '0',
        status: 'pendente',
      };

      const response = await fetch('/api/alugueis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aluguelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao criar aluguel:', errorData);
        throw new Error(errorData.message || 'Erro ao criar aluguel');
      }

      const aluguelCriado = await response.json();
      
      // Cria objeto compatível com a interface atual
      const novoAluguel: Aluguel = {
        id: aluguelCriado.id,
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
          caucao: typeof veiculo.caucao === 'string' ? 
            parseFloat(veiculo.caucao.replace(',', '.')) : 
            veiculo.caucao,
          taxaAdmin: data.taxaAdministrativa,
        },
        status: 'pendente',
      };

      onAluguelAdicionado(novoAluguel);
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Erro ao criar aluguel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Aluguel</DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo contrato de locação.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : motoristasAtivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground mb-4">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-lg font-medium">Nenhum motorista cadastrado</p>
              <p className="text-sm mt-1">
                Você precisa cadastrar pelo menos um motorista ativo antes de criar um aluguel.
              </p>
            </div>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
            >
              Fechar
            </Button>
          </div>
        ) : veiculosDisponiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground mb-4">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p className="text-lg font-medium">Nenhum veículo disponível</p>
              <p className="text-sm mt-1">
                Todos os veículos estão alugados ou em manutenção.
              </p>
            </div>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
            >
              Fechar
            </Button>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristasAtivos.length > 0 ? (
                          motoristasAtivos.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{motorista.nome}</span>
                                <span className="text-sm text-muted-foreground">
                                  {motorista.telefone} • CNH: {motorista.categoria}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum motorista ativo disponível
                          </SelectItem>
                        )}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculosDisponiveis.length > 0 ? (
                          veiculosDisponiveis.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={veiculo.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  R$ {typeof veiculo.valorSemanal === 'string' ? 
                                    parseFloat(veiculo.valorSemanal.replace(',', '.')).toFixed(2) : 
                                    parseFloat(veiculo.valorSemanal).toFixed(2)}/semana • {veiculo.cor} • {veiculo.ano}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum veículo disponível
                          </SelectItem>
                        )}
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
                          disabled={(date) => {
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            return date < hoje;
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TEMPO DE CONTRATO E TAXA ADMINISTRATIVA */}
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
                  {loading ? 'Criando...' : 'Criar Aluguel'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}