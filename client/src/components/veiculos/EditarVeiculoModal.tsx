/**
 * Modal para edição de veículos existentes
 * Formulário preenchido com dados do veículo selecionado
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { registrarAtividade } from '@/utils/activityLogger';

import { Upload, FileText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
  valorLimiteKm: z.number().nullable().optional(),
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
  const [documentUploading, setDocumentUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Limpar estado do upload ao abrir modal
      setUploadedFileName(null);
      setDocumentUploading(false);
      
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

        valorSeguroMensal: Number(veiculo.valorSeguroMensal) || undefined,
        valorVeiculo: Number(veiculo.valorVeiculo) || undefined,
        ipva: Number(veiculo.ipva) || undefined,
        rastreador: veiculo.rastreador || '',
        valorRastreadorMensal: Number(veiculo.valorRastreadorMensal) || undefined,
        dataCompra: (veiculo as any).dataCompra || '',
        financiado: veiculo.financiado || false,
        valorFinanciamento: Number(veiculo.valorFinanciamento) || undefined,
        quantidadeParcelas: veiculo.quantidadeParcelas || undefined,
        // Status não será editável
        valorLimiteKm: veiculo.valorLimiteKm,
      });
    }
  }, [veiculo, open, form]);

  // Calcular IPVA automaticamente (4% do valor do veículo)
  const valorVeiculo = form.watch('valorVeiculo');
  useEffect(() => {
    if (valorVeiculo && valorVeiculo > 0) {
      const ipvaCalculado = valorVeiculo * 0.04; // 4% do valor do veículo
      form.setValue('ipva', ipvaCalculado);
    }
  }, [valorVeiculo, form]);

  // Função para obter categorias baseadas no tipo de veículo
  const getCategoriasDisponiveis = () => {
    if (!veiculo) return [];
    
    // Inferir tipo baseado na categoria atual do veículo
    const categoria = veiculo.categoria?.toLowerCase();
    
    if (['hatch', 'sedan', 'suv', 'pickup', 'van', 'conversivel'].includes(categoria)) {
      return [
        { value: 'hatch', label: 'Hatch' },
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'van', label: 'Van' },
        { value: 'conversivel', label: 'Conversível' }
      ];
    } else if (['moto', 'scooter', 'motocicleta'].includes(categoria)) {
      return [
        { value: 'moto', label: 'Motocicleta' },
        { value: 'scooter', label: 'Scooter' }
      ];
    } else if (categoria?.includes('caminhao') || categoria === 'caminhão') {
      return [
        { value: 'caminhao', label: 'Caminhão' },
        { value: 'caminhao-leve', label: 'Caminhão Leve' },
        { value: 'caminhao-medio', label: 'Caminhão Médio' },
        { value: 'caminhao-pesado', label: 'Caminhão Pesado' }
      ];
    } else if (['utilitario', 'utilitário'].includes(categoria)) {
      return [
        { value: 'utilitario', label: 'Utilitário' },
        { value: 'van', label: 'Van' },
        { value: 'pickup', label: 'Pickup' }
      ];
    }
    
    // Fallback: mostrar todas as categorias
    return [
      { value: 'hatch', label: 'Hatch' },
      { value: 'sedan', label: 'Sedan' },
      { value: 'suv', label: 'SUV' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'van', label: 'Van' },
      { value: 'conversivel', label: 'Conversível' },
      { value: 'moto', label: 'Motocicleta' },
      { value: 'utilitario', label: 'Utilitário' },
      { value: 'caminhao', label: 'Caminhão' }
    ];
  };

  const categoriasDisponiveis = getCategoriasDisponiveis();

  // Buscar documentos da nova tabela
  const { data: documentosVeiculo = [] } = useQuery({
    queryKey: ['veiculos', veiculo?.id, 'documentos'],
    queryFn: async () => {
      if (!veiculo?.id) return [];
      const response = await fetch(`/api/veiculos/${veiculo.id}/documentos`);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!veiculo?.id && open
  });

  // Função para lidar com upload de documentos
  const handleDocumentUpload = async (uploadURL: string, nomeOriginal?: string) => {
    if (!veiculo) return;
    
    console.log(`[FRONTEND] handleDocumentUpload chamado para veículo ${veiculo.id} com arquivo: ${nomeOriginal}`);
    
    try {
      const requestData = { 
        documentURL: uploadURL,
        nomeOriginal: nomeOriginal || 'documento.pdf'
      };
      
      console.log(`[FRONTEND] Fazendo PUT para /api/veiculos/${veiculo.id}/documentos com dados:`, requestData);
      
      const response = await fetch(`/api/veiculos/${veiculo.id}/documentos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log(`[FRONTEND] Response status: ${response.status}`);
      console.log(`[FRONTEND] Response ok: ${response.ok}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[FRONTEND] Response resultado:`, result);
        
        // Invalidar query dos documentos para recarregar
        await queryClient.invalidateQueries({ queryKey: ['veiculos', veiculo.id, 'documentos'] });
        
        // Invalidar cache de veículos para atualizar a lista (usando query key correta)
        await queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        await queryClient.invalidateQueries({ queryKey: ['veiculos', (veiculo as any).locadoraId] });
        
        toast({
          title: "Documento salvo",
          description: nomeOriginal || "documento.pdf",
          variant: "default",
        });
      } else {
        const errorText = await response.text();
        console.log(`[FRONTEND] Response erro:`, errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: VeiculoFormData) => {
    if (!veiculo) return;
    
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
        dataCompra: data.dataCompra && data.dataCompra.trim() !== '' ? data.dataCompra : null,
        financiado: data.financiado,
        valorFinanciamento: data.valorFinanciamento?.toString(),
        quantidadeParcelas: data.quantidadeParcelas,
        // Status não será enviado na edição
      };

      // Fazer chamada à API
      const response = await fetch(`/api/veiculos/${veiculo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar veículo');
      }

      const veiculoAtualizado = await response.json();

      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '',
        profile?.email || 'usuario@drivs.me',
        'atualizar',
        'veiculo',
        veiculo.id,
        `Veículo atualizado: ${veiculoAtualizado.marca} ${veiculoAtualizado.modelo} (${veiculoAtualizado.placa})`
      );

      onVeiculoEditado(veiculoAtualizado);
      
      toast({
        title: "Veículo atualizado com sucesso!",
        description: `${veiculoAtualizado.marca} ${veiculoAtualizado.modelo} foi atualizado.`,
      });
      
      onOpenChange(false);
      
    } catch (error) {
      alert('Erro ao atualizar veículo: ' + ((error as any)?.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
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
              
              {/* Primeira linha: Placa, Marca, Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa *</FormLabel>
                      <FormControl>
                        <Input 
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Segunda linha: Ano, Cor, Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="branco">Branco</SelectItem>
                            <SelectItem value="preto">Preto</SelectItem>
                            <SelectItem value="prata">Prata</SelectItem>
                            <SelectItem value="cinza">Cinza</SelectItem>
                            <SelectItem value="azul">Azul</SelectItem>
                            <SelectItem value="vermelho">Vermelho</SelectItem>
                            <SelectItem value="verde">Verde</SelectItem>
                            <SelectItem value="bege">Bege</SelectItem>
                            <SelectItem value="amarelo">Amarelo</SelectItem>
                            <SelectItem value="marrom">Marrom</SelectItem>
                          </SelectContent>
                        </Select>
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriasDisponiveis.map((categoria) => (
                              <SelectItem key={categoria.value} value={categoria.value}>
                                {categoria.label}
                              </SelectItem>
                            ))}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="combustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
 
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
                            <SelectValue />
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
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valorSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Semanal (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01" 
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
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01" 
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
                      <FormLabel>Taxa Administrativa (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01" 
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seguradora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <FormControl>
                        <Input 
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
                      <FormLabel>Valor do Seguro Mensal (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-gray-100" 
                          step="0.01"
                          {...field}
                          readOnly
                          disabled
                          placeholder="Não editável"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">Este campo não pode ser editado diretamente</p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* VALOR DO VEÍCULO E IPVA */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorVeiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Veículo (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || undefined;
                            field.onChange(valor);
                            // Calcular IPVA automaticamente (4% do valor)
                            if (valor && valor > 0) {
                              const ipva = valor * 0.04;
                              form.setValue('ipva', ipva);
                            } else {
                              form.setValue('ipva', undefined);
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
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          placeholder="Calculado automaticamente"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Valor calculado automaticamente como 4% do valor do veículo. Pode ser editado se necessário.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* RASTREADOR */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rastreador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa do Rastreador</FormLabel>
                      <FormControl>
                        <Input 
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
                      <FormLabel>Valor Mensal do Rastreador (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          step="0.01"
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
              
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('financiado') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="valorFinanciamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Financiamento (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            step="0.01"
  
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
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Valor Final (R$)</FormLabel>
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background">
                      {(() => {
                        const valor = form.watch('valorFinanciamento') || 0;
                        const parcelas = form.watch('quantidadeParcelas') || 0;
                        const valorFinal = valor * parcelas;
                        return valorFinal > 0 ? valorFinal.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }) : 'R$ 0,00';
                      })()}
                    </div>
                  </div>
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

            {/* DOCUMENTOS DO VEÍCULO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos do Veículo
              </h3>
              
              {/* Upload de documento único */}
              <div className="flex items-center justify-between p-2 border rounded bg-gray-50/50">
                <div className="flex items-center gap-2">
                  {documentUploading ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <div className="flex flex-col">
                        <span className="text-xs text-blue-600 font-medium">Carregando...</span>
                        <span className="text-xs text-gray-500">Fazendo upload do documento</span>
                      </div>
                    </>
                  ) : uploadedFileName ? (
                    <>
                      <FileText className="w-4 h-4 text-green-600" />
                      <div className="flex flex-col">
                        <span className="text-xs text-green-600 font-medium">Documento salvo</span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {uploadedFileName}
                        </span>
                      </div>
                    </>
                  ) : documentosVeiculo.length > 0 ? (
                    <>
                      <FileText className="w-4 h-4 text-green-600" />
                      <div className="flex flex-col">
                        <span className="text-xs text-green-600 font-medium">Documento salvo</span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {documentosVeiculo[documentosVeiculo.length - 1]?.nomeOriginal || 'documento.pdf'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Documento:</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão para visualizar documento existente */}
                  {documentosVeiculo.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const documentoAtual = documentosVeiculo[documentosVeiculo.length - 1];
                        if (documentoAtual?.url) {
                          window.open(documentoAtual.url, '_blank');
                        }
                      }}
                      className="text-xs h-7 px-3"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  )}
                  
                  <input
                    type="file"
                    id="documento-upload-edit"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setDocumentUploading(true);
                      setUploadedFileName(null);

                      try {
                        // Se já existem documentos, removê-los primeiro (substituição)
                        if (documentosVeiculo.length > 0) {
                          console.log(`[FRONTEND] Substituindo documentos existentes para veículo ${veiculo.id}`);
                          
                          // Remover todos os documentos existentes
                          for (const documento of documentosVeiculo) {
                            try {
                              const deleteResponse = await fetch(`/api/veiculos/${veiculo.id}/documentos/${documento.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                              });
                              
                              if (!deleteResponse.ok) {
                                console.warn(`Falha ao remover documento ${documento.id}`);
                              }
                            } catch (deleteError) {
                              console.warn('Erro ao remover documento:', deleteError);
                            }
                          }
                        }

                        // Obter URL de upload
                        const response = await fetch('/api/objects/upload', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        const data = await response.json();

                        // Upload do arquivo
                        const uploadResponse = await fetch(data.uploadURL, {
                          method: 'PUT',
                          body: file,
                          headers: {
                            'Content-Type': file.type,
                          },
                        });

                        if (uploadResponse.ok) {
                          await handleDocumentUpload(data.uploadURL, file.name);
                          setUploadedFileName(file.name);
                          
                          toast({
                            title: documentosVeiculo.length > 0 ? "Documento substituído" : "Documento adicionado",
                            description: file.name,
                            variant: "default",
                          });
                        }
                      } catch (error) {
                        console.error('Erro no upload:', error);
                        toast({
                          title: "Erro no upload",
                          description: `Falha ao carregar ${file.name}`,
                          variant: "destructive",
                        });
                      } finally {
                        setDocumentUploading(false);
                      }
                      
                      // Limpar input
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('documento-upload-edit')?.click()}
                    className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {documentosVeiculo.length > 0 ? 'Substituir' : 'Adicionar'}
                  </Button>
                </div>
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