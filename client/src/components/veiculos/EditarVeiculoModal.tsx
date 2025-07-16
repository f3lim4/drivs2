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
  

  
  // Seguro
  seguradora: z.string().optional(),
  numeroApolice: z.string().optional(),
  vigenciaSeguro: z.string().optional(),
  valorSeguroMensal: z.number().optional(),
  
  // Valor do Veículo e IPVA
  valorVeiculo: z.number().optional(),
  ipva: z.number().optional(),
  
  // Rastreador
  rastreador: z.string().optional(),
  valorRastreadorMensal: z.number().optional(),
  
  // Data de Compra
  dataCompra: z.string().optional(),
  
  // Financiamento
  financiado: z.boolean().default(false),
  valorFinanciamento: z.number().min(0).optional(),
  quantidadeParcelas: z.number().min(1).optional(),
  
  // Status será controlado automaticamente
  
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
      seguradora: '',
      numeroApolice: '',
      vigenciaSeguro: '',
      valorSeguroMensal: undefined,
      valorVeiculo: undefined,
      ipva: undefined,
      rastreador: '',
      valorRastreadorMensal: undefined,
      dataCompra: '',
      financiado: false,
      valorFinanciamento: undefined,
      quantidadeParcelas: undefined,
      // Status será controlado automaticamente
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
        seguradora: veiculo.seguradora || '',
        numeroApolice: veiculo.numeroApolice || '',
        vigenciaSeguro: veiculo.vigenciaSeguro || '',
        valorSeguroMensal: Number(veiculo.valorSeguroMensal) || undefined,
        valorVeiculo: Number(veiculo.valorVeiculo) || undefined,
        ipva: Number(veiculo.ipva) || undefined,
        rastreador: veiculo.rastreador || '',
        valorRastreadorMensal: Number(veiculo.valorRastreadorMensal) || undefined,
        dataCompra: veiculo.dataCompra || '',
        financiado: veiculo.financiado || false,
        valorFinanciamento: Number(veiculo.valorFinanciamento) || undefined,
        quantidadeParcelas: veiculo.quantidadeParcelas || undefined,
        // Status não será editável
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
        seguradora: data.seguradora,
        numeroApolice: data.numeroApolice,
        vigenciaSeguro: data.vigenciaSeguro || null,
        valorSeguroMensal: data.valorSeguroMensal?.toString(),
        valorVeiculo: data.valorVeiculo?.toString(),
        ipva: data.ipva?.toString(),
        rastreador: data.rastreador,
        valorRastreadorMensal: data.valorRastreadorMensal?.toString(),
        dataCompra: data.dataCompra || null,
        financiado: data.financiado,
        valorFinanciamento: data.valorFinanciamento?.toString(),
        quantidadeParcelas: data.quantidadeParcelas,
        // Status não será enviado na edição
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
              
              <div className="grid grid-cols-3 gap-4">
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

              </div>

              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2">
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
                </div>

                <div className="col-span-2">
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

                <div className="col-span-2">
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
              </div>
            </div>

            {/* CARACTERÍSTICAS TÉCNICAS */}
            <div className="space-y-4">
              
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

            {/* SEGURO */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seguradora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Allianz, Porto Seguro, etc."
                          {...field}
                        />
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
                        <Input 
                          placeholder="Número da apólice"
                          {...field}
                        />
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
                      <FormLabel>Vigência do Seguro</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
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
                      <FormLabel>Valor do Seguro Mensal (R$)</FormLabel>
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

            {/* VALOR DO VEÍCULO E IPVA */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorVeiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Veículo (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0;
                            field.onChange(valor);
                            // Calcular IPVA automaticamente (4% do valor)
                            if (valor > 0) {
                              const ipva = valor * 0.04;
                              form.setValue('ipva', ipva);
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
                  name="ipva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IPVA (R$) <span className="text-xs text-green-600">(4% do valor)</span></FormLabel>
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
              </div>
            </div>

            {/* RASTREADOR */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rastreador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa do Rastreador</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Positron, Pósitron, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorRastreadorMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal do Rastreador (R$)</FormLabel>
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
              </div>
            </div>

            {/* DATA DE COMPRA */}
            <div className="space-y-4">
              
              <FormField
                control={form.control}
                name="dataCompra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Compra (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* FINANCIAMENTO */}
            <div className="space-y-4">
              
              <FormField
                control={form.control}
                name="financiado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Veículo Financiado</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        O veículo está sendo financiado?
                      </p>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('financiado') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valorFinanciamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Financiamento (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidadeParcelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Parcelas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="48"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* STATUS - Controlado automaticamente pelo sistema */}
            <div className="space-y-4">
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  O status do veículo é controlado automaticamente:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• <strong>Disponível:</strong> quando não há aluguel ativo</li>
                  <li>• <strong>Alugado:</strong> quando há aluguel ativo</li>
                </ul>
              </div>
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