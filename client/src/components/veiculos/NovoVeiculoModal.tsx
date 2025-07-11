/**
 * Modal para cadastro de novos veículos
 * Formulário completo com validação
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
import { Veiculo } from '@/types';
import { generateId } from '@/utils/formatters';

// Schema de validação
const veiculoSchema = z.object({
  // Informações Básicas
  placa: z.string().min(7, 'Placa deve ter pelo menos 7 caracteres'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  ano: z.number().min(1900, 'Ano inválido').max(2030, 'Ano inválido'),
  cor: z.string().min(1, 'Cor é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  
  // Documentação
  renavam: z.string().min(9, 'RENAVAM deve ter pelo menos 9 dígitos'),
  chassi: z.string().min(17, 'Chassi deve ter 17 caracteres'),
  
  // Características Técnicas
  combustivel: z.string().min(1, 'Tipo de combustível é obrigatório'),
  quilometragem: z.number().min(0, 'Quilometragem deve ser positiva'),
  valorSemanal: z.number().min(0, 'Valor deve ser positivo'),
  caucao: z.number().min(0, 'Caução deve ser positiva'),
  taxaAdministrativa: z.number().min(0).optional(),
  limiteQuilometragem: z.string().min(1, 'Limite de quilometragem é obrigatório'),
  
  // Manutenção
  ultimaRevisao: z.string().optional(),
  proximaRevisao: z.string().optional(),
  
  // Seguro
  seguradora: z.string().optional(),
  numeroApolice: z.string().optional(),
  vigenciaSeguro: z.string().optional(),
  valorSeguroMensal: z.number().min(0).optional(),
  
  // Status
  status: z.enum(['disponivel', 'alugado', 'manutencao', 'indisponivel']),
  
  // Campo condicional para limite específico
  valorLimiteKm: z.number().optional(),
});

type VeiculoFormData = z.infer<typeof veiculoSchema>;

interface NovoVeiculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVeiculoAdicionado: (veiculo: Veiculo) => void;
}

export function NovoVeiculoModal({ 
  open, 
  onOpenChange, 
  onVeiculoAdicionado 
}: NovoVeiculoModalProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      marca: '',
      modelo: '',
      ano: 2025,
      cor: '',
      categoria: '',
      renavam: '',
      chassi: '',
      combustivel: '',
      quilometragem: 0,
      valorSemanal: 0,
      caucao: 0,
      taxaAdministrativa: 0,
      limiteQuilometragem: '',
      ultimaRevisao: '',
      proximaRevisao: '',
      seguradora: '',
      numeroApolice: '',
      vigenciaSeguro: '',
      valorSeguroMensal: 0,
      status: 'disponivel',
      valorLimiteKm: 0,
    },
  });

  const onSubmit = async (data: VeiculoFormData) => {
    setLoading(true);
    
    try {
      if (!profile?.locadoraId) {
        throw new Error('Erro: Locadora não identificada');
      }

      // Criar veículo usando a nova API
      const veiculoData = {
        id: data.renavam, // RENAVAM como ID
        locadoraId: profile.locadoraId,
        placa: data.placa.toUpperCase(),
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        cor: data.cor,
        categoria: data.categoria,
        renavam: data.renavam,
        chassi: data.chassi.toUpperCase(),
        combustivel: data.combustivel,
        quilometragem: data.quilometragem,
        valorSemanal: data.valorSemanal.toString(),
        caucao: data.caucao.toString(),
        taxaAdministrativa: data.taxaAdministrativa?.toString(),
        limiteQuilometragem: data.limiteQuilometragem,
        valorLimiteKm: data.valorLimiteKm,
        ultimaRevisao: data.ultimaRevisao || null,
        proximaRevisao: data.proximaRevisao || null,
        seguradora: data.seguradora,
        numeroApolice: data.numeroApolice,
        vigenciaSeguro: data.vigenciaSeguro || null,
        valorSeguroMensal: data.valorSeguroMensal?.toString(),
        status: data.status,
      };

      const response = await fetch('/api/veiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar veículo');
      }

      const novoVeiculo = await response.json();

      onVeiculoAdicionado(novoVeiculo);
      
      toast({
        title: "Veículo cadastrado com sucesso!",
        description: `${novoVeiculo.marca} ${novoVeiculo.modelo} foi adicionado à frota.`,
      });

      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      toast({
        title: "Erro ao cadastrar veículo",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Veículo</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo veículo para adicioná-lo à frota.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC-1234" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota, Honda, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Corolla, Civic, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2025" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor *</FormLabel>
                      <FormControl>
                        <Input placeholder="Branco, Preto, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hatch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hatch">Hatch</SelectItem>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="conversivel">Conversível</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DOCUMENTAÇÃO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Documentação
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="renavam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RENAVAM *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000000000" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chassi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chassi *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="9BWZZZ377VT004251" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CARACTERÍSTICAS TÉCNICAS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Características Técnicas
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="combustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Flex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flex">Flex</SelectItem>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="alcool">Álcool</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="eletrico">Elétrico</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quilometragem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilometragem *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limiteQuilometragem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Quilometragem *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Quilometragem Ilimitada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ilimitada">Quilometragem Ilimitada</SelectItem>
                          <SelectItem value="limitada">Quilometragem Limitada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campo condicional para valor limite km semanal */}
              {form.watch('limiteQuilometragem') === 'limitada' && (
                <FormField
                  control={form.control}
                  name="valorLimiteKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Semanal (km) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valorSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Semanal (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caucao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caução (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      <FormLabel>Taxa Administrativa (R$)</FormLabel>
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
            </div>

            {/* MANUTENÇÃO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Manutenção
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ultimaRevisao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Última Revisão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proximaRevisao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Revisão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SEGURO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Seguro
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seguradora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da seguradora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroApolice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Apólice</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da apólice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vigenciaSeguro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vigência</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorSeguroMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal (R$)</FormLabel>
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
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Status
              </h3>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                        <SelectItem value="manutencao">Em Manutenção</SelectItem>
                        <SelectItem value="indisponivel">Indisponível</SelectItem>
                      </SelectContent>
                    </Select>
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
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}