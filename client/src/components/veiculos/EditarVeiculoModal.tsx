/**
 * Modal para edição de veículos existentes
 * Formulário preenchido com dados do veículo selecionado
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// Schema de validação (mesmo do NovoVeiculoModal)
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
  taxaAdministrativa: z.number().optional(),
  limiteQuilometragem: z.string().min(1, 'Limite de quilometragem é obrigatório'),
  
  // Manutenção
  ultimaRevisao: z.string().optional(),
  proximaRevisao: z.string().optional(),
  
  // Seguro
  seguradora: z.string().optional(),
  numeroApolice: z.string().optional(),
  vigenciaSeguro: z.string().optional(),
  valorSeguroMensal: z.number().optional(),
  
  // Status
  status: z.enum(['disponivel', 'alugado', 'manutencao', 'indisponivel']),
  
  // Campo condicional para limite específico
  valorLimiteKm: z.number().optional(),
});

type VeiculoFormData = z.infer<typeof veiculoSchema>;

interface EditarVeiculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo: Veiculo | null;
  onVeiculoEditado: (veiculo: Veiculo) => void;
}

export function EditarVeiculoModal({ 
  open, 
  onOpenChange, 
  veiculo,
  onVeiculoEditado 
}: EditarVeiculoModalProps) {
  const [loading, setLoading] = useState(false);

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
      taxaAdministrativa: undefined,
      limiteQuilometragem: '',
      ultimaRevisao: '',
      proximaRevisao: '',
      seguradora: '',
      numeroApolice: '',
      vigenciaSeguro: '',
      valorSeguroMensal: undefined,
      status: 'disponivel',
      valorLimiteKm: undefined,
    },
  });

  // Preenche o formulário quando o veículo é selecionado
  useEffect(() => {
    if (veiculo && open) {
      form.reset({
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        cor: veiculo.cor,
        categoria: veiculo.categoria,
        renavam: veiculo.renavam,
        chassi: veiculo.chassi,
        combustivel: veiculo.combustivel,
        quilometragem: veiculo.quilometragem,
        valorSemanal: Number(veiculo.valorSemanal) || 0,
        caucao: Number(veiculo.caucao) || 0,
        taxaAdministrativa: Number(veiculo.taxaAdministrativa) || undefined,
        limiteQuilometragem: veiculo.limiteQuilometragem,
        ultimaRevisao: veiculo.ultimaRevisao || '',
        proximaRevisao: veiculo.proximaRevisao || '',
        seguradora: veiculo.seguradora || '',
        numeroApolice: veiculo.numeroApolice || '',
        vigenciaSeguro: veiculo.vigenciaSeguro || '',
        valorSeguroMensal: Number(veiculo.valorSeguroMensal) || undefined,
        status: veiculo.status,
        valorLimiteKm: veiculo.valorLimiteKm,
      });
    }
  }, [veiculo, open, form]);

  const onSubmit = async (data: VeiculoFormData) => {
    if (!veiculo) return;

    console.log('Iniciando edição do veículo:', veiculo.id);
    console.log('Dados do formulário:', data);
    
    setLoading(true);
    
    try {
      // Preparar dados para envio à API
      const veiculoData = {
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

      console.log('Dados preparados para API:', veiculoData);

      // Fazer chamada à API
      const response = await fetch(`/api/veiculos/${veiculo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculoData),
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro da API:', error);
        throw new Error(error.message || 'Erro ao atualizar veículo');
      }

      const veiculoAtualizado = await response.json();
      console.log('Veículo atualizado:', veiculoAtualizado);
      onVeiculoEditado(veiculoAtualizado);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao editar veículo:', error);
      alert('Erro ao atualizar veículo: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Veículo</DialogTitle>
          <DialogDescription>
            Atualize as informações do veículo {veiculo.marca} {veiculo.modelo}.
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>Status do Veículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
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
                onClick={() => {
                  console.log('Botão salvar clicado');
                  console.log('Erros do formulário:', form.formState.errors);
                  console.log('Dados do formulário antes do submit:', form.getValues());
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}