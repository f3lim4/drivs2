/**
 * Modal para cadastro de novos veículos
 * Formulário completo com validação
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { tiposVeiculos, getTiposVeiculos, getMarcasPorTipo, getModelosPorMarca, ModeloVeiculo, MarcaVeiculo } from '@shared/veiculos-data';
import { Button } from '@/components/ui/button';
// Imports de ícones removidos (não mais necessários)
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
import { registrarAtividade } from '@/utils/activityLogger';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Upload, FileText } from 'lucide-react';

// Schema de validação
const veiculoSchema = z.object({
  // Informações Básicas
  tipoVeiculo: z.string().min(1, 'Tipo de veículo é obrigatório'),
  placa: z.string().min(7, 'Placa deve ter pelo menos 7 caracteres'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  ano: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseInt(val);
    return val;
  }, z.number().min(1900, 'Ano inválido').max(2030, 'Ano inválido')),
  cor: z.string().min(1, 'Cor é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  
  // Documentação
  renavam: z.string().min(9, 'RENAVAM deve ter pelo menos 9 dígitos'),
  chassi: z.string().min(17, 'Chassi deve ter 17 caracteres'),
  
  // Características Técnicas
  combustivel: z.string().min(1, 'Tipo de combustível é obrigatório'),
  quilometragem: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0, 'Quilometragem deve ser positiva').optional()),
  valorSemanal: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0, 'Valor deve ser positivo').optional()),
  caucao: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0, 'Caução deve ser positiva').optional()),
  taxaAdministrativa: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  limiteQuilometragem: z.string().min(1, 'Limite de quilometragem é obrigatório'),
  

  
  // Seguro
  seguradora: z.string().optional(),
  numeroApolice: z.string().optional(),
  vigenciaSeguro: z.string().optional(),
  valorSeguroMensal: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  
  // Valor do Veículo e IPVA
  valorVeiculo: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  ipva: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  
  // Rastreador
  rastreador: z.string().optional(),
  valorRastreadorMensal: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  
  // Data de Compra
  dataCompra: z.string().optional(),
  
  // Financiamento
  financiado: z.boolean().default(false),
  valorFinanciamento: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().min(0).optional()),
  quantidadeParcelas: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseInt(val);
    return val;
  }, z.number().min(1).optional()),
  
  // Status será sempre "disponível" no cadastro
  
  // Campo condicional para limite específico
  valorLimiteKm: z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number().optional()),
  
  // Campo para melhor visualização do veículo
  visualizar: z.string().optional(),
  
  // Documentos do veículo (URLs temporárias antes de salvar)
  documentos: z.array(z.string()).optional(),
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
  const [marcasDisponiveis, setMarcasDisponiveis] = useState<MarcaVeiculo[]>([]);
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloVeiculo[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      tipoVeiculo: '',
      placa: '',
      marca: '',
      modelo: '',
      ano: undefined,
      cor: '',
      categoria: '',
      renavam: '',
      chassi: '',
      combustivel: '',
      quilometragem: undefined,
      valorSemanal: undefined,
      caucao: undefined,
      taxaAdministrativa: '',
      limiteQuilometragem: '',
      seguradora: '',
      numeroApolice: '',
      vigenciaSeguro: '',
      valorSeguroMensal: '',
      valorVeiculo: undefined,
      ipva: undefined,
      rastreador: '',
      valorRastreadorMensal: '',
      dataCompra: '',
      financiado: false,
      valorFinanciamento: '',
      quantidadeParcelas: '',
      // Status será definido automaticamente como "disponível"
      valorLimiteKm: undefined,
      visualizar: '',
      documentos: [],
    },
  });

  // Atualizar marcas quando o tipo mudar
  const tipoSelecionado = form.watch('tipoVeiculo');
  useEffect(() => {
    if (tipoSelecionado) {
      const marcas = getMarcasPorTipo(tipoSelecionado);
      setMarcasDisponiveis(marcas);
      // Limpar marca e modelo quando trocar de tipo
      form.setValue('marca', '');
      form.setValue('modelo', '');
      setModelosDisponiveis([]);
    } else {
      setMarcasDisponiveis([]);
      setModelosDisponiveis([]);
    }
  }, [tipoSelecionado, form]);

  // Atualizar modelos quando a marca mudar
  const marcaSelecionada = form.watch('marca');
  useEffect(() => {
    if (marcaSelecionada && tipoSelecionado) {
      const modelos = getModelosPorMarca(marcaSelecionada, tipoSelecionado);
      setModelosDisponiveis(modelos);
      // Limpar o modelo selecionado quando trocar de marca
      form.setValue('modelo', '');
    } else {
      setModelosDisponiveis([]);
    }
  }, [marcaSelecionada, tipoSelecionado, form]);

  const onSubmit = async (data: VeiculoFormData) => {
    setLoading(true);
    
    try {
      console.log('Profile debug:', profile);
      
      if (!profile?.locadoraId) {
        // Tentar recarregar o perfil do servidor
        try {
          const response = await fetch(`/api/auth/profile?email=${encodeURIComponent(profile?.email || '')}`);
          if (response.ok) {
            const updatedProfile = await response.json();
            console.log('Updated profile:', updatedProfile);
            if (updatedProfile.locadoraId) {
              // Atualizar o perfil localmente
              localStorage.setItem('drivs_profile', JSON.stringify(updatedProfile));
              // Usar o perfil atualizado
              if (profile) {
                profile.locadoraId = updatedProfile.locadoraId;
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
        
        // Se ainda não tem locadoraId, verificar se ainda precisa forçar logout
        if (!profile?.locadoraId) {
          throw new Error('Erro: Locadora não identificada - Faça logout e login novamente para atualizar seus dados');
        }
      }

      // Criar veículo usando a nova API
      const veiculoData = {
        id: data.renavam, // RENAVAM como ID
        locadoraId: profile.locadoraId,
        tipoVeiculo: data.tipoVeiculo,
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
        valorSemanal: data.valorSemanal?.toString() || '0',
        caucao: data.caucao?.toString() || '0',
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
        visualizar: data.visualizar || null,
        // Processar documentos carregados
        documentos: data.documentos || [],
        status: 'disponivel', // Sempre "disponível" no cadastro
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

      // Processar documentos após criação do veículo
      if (data.documentos && data.documentos.length > 0) {
        for (const docURL of data.documentos) {
          try {
            const docResponse = await fetch(`/api/veiculos/${novoVeiculo.id}/documentos`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ documentURL: docURL }),
            });
            
            if (!docResponse.ok) {
              console.error('Erro ao salvar documento:', docURL);
            }
          } catch (error) {
            console.error('Erro ao processar documento:', error);
          }
        }
      }

      // Log da atividade
      await registrarAtividade(
        profile.locadoraId,
        profile.email || 'usuario@drivs.me',
        'cadastrar',
        'veiculo',
        novoVeiculo.id,
        `Novo veículo cadastrado: ${novoVeiculo.marca} ${novoVeiculo.modelo} (${novoVeiculo.placa})`
      );

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
              
              {/* Primeira linha: Tipo, Marca, Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoVeiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Veículo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getTiposVeiculos().map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
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
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!tipoSelecionado}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!tipoSelecionado ? "Selecione o tipo primeiro" : "Selecione a marca"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {marcasDisponiveis.map((marca) => (
                            <SelectItem key={marca.nome} value={marca.nome}>
                              {marca.nome}
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
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!marcaSelecionada}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!marcaSelecionada ? "Selecione uma marca primeiro" : "Selecione o modelo"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modelosDisponiveis.map((modelo) => (
                            <SelectItem key={modelo.nome} value={modelo.nome}>
                              {modelo.nome} 
                              <span className="text-xs text-gray-500 ml-2">({modelo.categoria})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Segunda linha: Placa, RENAVAM, Chassi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  name="renavam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RENAVAM *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="12345678901" 
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

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                            placeholder="" 
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

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar" />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hatch">Hatch</SelectItem>
                            <SelectItem value="sedan">Sedan</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="conversivel">Conversível</SelectItem>
                            <SelectItem value="moto">Moto</SelectItem>
                            <SelectItem value="utilitario">Utilitário</SelectItem>
                            <SelectItem value="caminhao">Caminhão</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Campo Visualizar Veículo */}
              <FormField
                control={form.control}
                name="visualizar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visualizar Veículo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Observações visuais do veículo (ex: arranhões, detalhes, etc.)" 
                        {...field}
                        data-testid="input-visualizar-veiculo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
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
                          placeholder="" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                            <SelectValue placeholder="Selecionar" />
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
                          placeholder=""
                          {...field}
                          value={field.value || ''}
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
                          step="0.01"
                          placeholder="" 
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
                  name="caucao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caução (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="" 
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
                  name="taxaAdministrativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Administrativa (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === null) {
                              field.onChange(undefined);
                            } else {
                              const numValue = parseFloat(value);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }
                          }}
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
                        <Input placeholder="Nome da seguradora" {...field} />
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
                      <FormLabel>Valor Mensal (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === null) {
                              field.onChange(undefined);
                            } else {
                              const numValue = parseFloat(value);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }
                          }}
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
                          step="0.01"
                          placeholder=""
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
                          step="0.01"
                          placeholder=""
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Valor Mensal do Rastreador (R$) - Opcional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder=""
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === null) {
                              field.onChange(undefined);
                            } else {
                              const numValue = parseFloat(value);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }
                          }}
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
                            step="0.01"
                            placeholder=""
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
                            placeholder=""
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

            {/* Upload de documentos - linha discreta */}
            <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
              <span className="text-sm text-muted-foreground">Documentos (opcional):</span>
              <div className="flex items-center gap-2">
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  onGetUploadParameters={async () => {
                    const response = await fetch('/api/objects/upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    const data = await response.json();
                    return {
                      method: 'PUT' as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      const documentos = form.getValues('documentos') || [];
                      form.setValue('documentos', [...documentos, uploadURL]);
                      toast({
                        title: "Documento adicionado",
                        description: "Documento carregado com sucesso.",
                      });
                    }
                  }}
                  buttonClassName="text-xs"
                >
                  <Upload className="w-3 h-3" />
                  Adicionar
                </ObjectUploader>
                {form.watch('documentos') && form.watch('documentos').length > 0 && (
                  <span className="text-xs text-green-600">
                    {form.watch('documentos').length} arquivo(s)
                  </span>
                )}
              </div>
            </div>

            {/* STATUS: Veículos são cadastrados automaticamente como "disponível" */}

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