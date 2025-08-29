/**
 * Modal para edição de motoristas existentes
 * Formulário preenchido com dados do motorista selecionado
 */

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Motorista } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { registrarAtividade } from '@/utils/activityLogger';
import { useQueryClient } from '@tanstack/react-query';
import { Image, Upload, X, FileText, Eye, Download } from 'lucide-react';

// Funções de validação
function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

function validarCNH(cnh: string): boolean {
  // Remove caracteres não numéricos
  cnh = cnh.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cnh.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 11111111111)
  if (/^(\d)\1{10}$/.test(cnh)) return false;
  
  // CNH válida deve ter 11 dígitos únicos
  return true;
}

function validarIdade(dataNascimento: string): boolean {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  
  // Verificar se a data é válida
  if (isNaN(nascimento.getTime())) {
    return false;
  }
  
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade >= 18 && idade <= 90;
}

function validarCNHVencimento(dataVencimento: string): boolean {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  
  // Verificar se a data é válida
  if (isNaN(vencimento.getTime())) {
    return false;
  }
  
  // CNH não pode estar vencida (data deve ser futura)
  // Considera apenas a data, não o horário
  const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const vencimentoData = new Date(vencimento.getFullYear(), vencimento.getMonth(), vencimento.getDate());
  
  return vencimentoData >= hojeData;
}

// Schema de validação (mesmo do NovoMotoristaModal)
const motoristaSchema = z.object({
  // Informações Pessoais
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido')
    .refine(validarCPF, 'CPF inválido'),
  rg: z.string().min(7, 'RG deve ter pelo menos 7 dígitos'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória')
    .refine(validarIdade, 'Idade deve estar entre 18 e 90 anos'),
  
  // Contato
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Carteira de Motorista
  cnh: z.string().min(11, 'CNH deve ter 11 dígitos')
    .refine(validarCNH, 'CNH inválida'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  vencimentoCnh: z.string().min(1, 'Data de vencimento é obrigatória')
    .refine(validarCNHVencimento, 'CNH não pode estar vencida'),
  
  // Endereço
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  complemento: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  

});

type MotoristaFormData = z.infer<typeof motoristaSchema>;

interface EditarMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
  onMotoristaEditado: (motorista: Motorista) => void;
}

export function EditarMotoristaModal({ 
  open, 
  onOpenChange, 
  motorista,
  onMotoristaEditado 
}: EditarMotoristaModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [mostrarNegativacao, setMostrarNegativacao] = useState(false);
  const [motivoNegativacao, setMotivoNegativacao] = useState('');
  const [imagens, setImagens] = useState<{
    fotoPerfil: File | null;
    cnhImagem: File | null;
    fotoComCnh: File | null;
    comprovanteEndereco: File | null;
    fotoExtra: File | null;
    fotoExtra2: File | null;
  }>({
    fotoPerfil: null,
    cnhImagem: null,
    fotoComCnh: null,
    comprovanteEndereco: null,
    fotoExtra: null,
    fotoExtra2: null,
  });
  const [imagePreviews, setImagePreviews] = useState<{
    fotoPerfil: string | null;
    cnhImagem: string | null;
    fotoComCnh: string | null;
    comprovanteEndereco: string | null;
    fotoExtra: string | null;
    fotoExtra2: string | null;
  }>({
    fotoPerfil: null,
    cnhImagem: null,
    fotoComCnh: null,
    comprovanteEndereco: null,
    fotoExtra: null,
    fotoExtra2: null,
  });

  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      cnh: '',
      categoria: '',
      vencimentoCnh: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  // Funções para gerenciar imagens específicas
  const handleImageUpload = (files: FileList | null, tipo: keyof typeof imagens) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validar arquivo
    const isValidImage = file.type.startsWith('image/');
    const isValidPdf = file.type === 'application/pdf';
    const isValidFile = tipo === 'cnhImagem' || tipo === 'comprovanteEndereco' ? 
      (isValidImage || isValidPdf) : isValidImage;
    
    if (!isValidFile) {
      toast({
        title: "Arquivo inválido",
        description: tipo === 'cnhImagem' || tipo === 'comprovanteEndereco' ? 
          "Apenas imagens (JPG, PNG) ou PDF são aceitos" : 
          "Apenas imagens (JPG, PNG) são aceitas",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Atualizar arquivo
    setImagens(prev => ({ ...prev, [tipo]: file }));
    
    // Criar preview (apenas para imagens)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => ({ ...prev, [tipo]: result }));
      };
      reader.readAsDataURL(file);
    } else {
      // Para PDFs, apenas limpar preview
      setImagePreviews(prev => ({ ...prev, [tipo]: null }));
    }
  };

  const handleRemoveImage = (tipo: keyof typeof imagens) => {
    setImagens(prev => ({ ...prev, [tipo]: null }));
    setImagePreviews(prev => ({ ...prev, [tipo]: null }));
  };

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    // Limpar CEP (remover caracteres não numéricos)
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Validar CEP
    if (cepLimpo.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado",
          variant: "destructive",
        });
        return;
      }

      // Preencher campos automaticamente
      form.setValue('rua', data.logradouro || '');
      form.setValue('bairro', data.bairro || '');
      form.setValue('cidade', data.localidade || '');
      form.setValue('estado', data.uf || '');
      
      toast({
        title: "Endereço encontrado!",
        description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  // Preenche o formulário quando o motorista é selecionado
  useEffect(() => {
    if (motorista && open) {
      form.reset({
        nome: motorista.nome,
        cpf: motorista.cpf,
        rg: motorista.rg,
        dataNascimento: motorista.dataNascimento,
        telefone: motorista.telefone,
        email: motorista.email || '',
        cnh: motorista.cnh,
        categoria: motorista.categoria,
        vencimentoCnh: motorista.vencimentoCnh,
        rua: motorista.rua,
        numero: motorista.numero,
        bairro: motorista.bairro,
        complemento: motorista.complemento || '',
        cidade: motorista.cidade,
        estado: motorista.estado,
        cep: motorista.cep,
      });
      
      // Limpar imagens quando mudar motorista
      setImagens({
        fotoPerfil: null,
        cnhImagem: null,
        fotoComCnh: null,
        comprovanteEndereco: null,
        fotoExtra: null,
        fotoExtra2: null,
      });
      setImagePreviews({
        fotoPerfil: null,
        cnhImagem: null,
        fotoComCnh: null,
        comprovanteEndereco: null,
        fotoExtra: null,
        fotoExtra2: null,
      });
      
      // Carregar imagens existentes do motorista
      if (motorista?.id) {
        carregarImagensExistentes(motorista.id);
      }
    }
  }, [motorista, open, form]);

  // Função para carregar imagens existentes do motorista
  const carregarImagensExistentes = async (motoristaId: string) => {
    try {
      const response = await fetch(`/api/motoristas/${motoristaId}/imagens`);
      if (response.ok) {
        const data = await response.json();
        const documentos = data.documentos || {};
        
        // Mapear documentos para previews
        const novosPreviews: typeof imagePreviews = {
          fotoPerfil: documentos.fotoPerfil || null,
          cnhImagem: documentos.cnhImagem || null,
          fotoComCnh: documentos.fotoComCnh || null,
          comprovanteEndereco: documentos.comprovanteEndereco || null,
          fotoExtra: documentos.fotoExtra || null,
          fotoExtra2: documentos.fotoExtra2 || null,
        };
        
        setImagePreviews(novosPreviews);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens existentes:', error);
    }
  };

  const negativarMotorista = async () => {
    if (!motorista || !profile || !motivoNegativacao.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o motivo da negativação",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const negativacaoData = {
        negativado: true,
        motivoNegativacao: motivoNegativacao,
        dataNegativacao: new Date(),
        status: 'inativo' // Garantir que o motorista fique inativo
      };
      
      const response = await fetch(`/api/motoristas/${motorista.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(negativacaoData),
      });

      if (!response.ok) {
        throw new Error('Erro ao negativar motorista');
      }

      const motoristaAtualizado = await response.json();

      // Log da atividade
      await registrarAtividade(
        profile.locadoraId || profile.id,
        profile.email || 'usuario@drivs.me',
        'negativar',
        'motorista',
        motorista.id,
        `Motorista negativado: ${motoristaAtualizado.nome} (CPF: ${motoristaAtualizado.cpf}) - Motivo: ${motivoNegativacao}`
      );

      toast({
        title: "Motorista negativado!",
        description: `${motoristaAtualizado.nome} foi negativado com sucesso.`,
      });

      // Invalidar cache do React Query para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['/api/motoristas'] });
      
      onMotoristaEditado(motoristaAtualizado);
      setMostrarNegativacao(false);
      setMotivoNegativacao('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error negativing motorista:', error);
      toast({
        title: "Erro ao negativar motorista",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MotoristaFormData) => {
    if (!motorista || !profile) return;

    try {
      setLoading(true);
      
      // Preparar dados para API
      const motoristaData = {
        ...data,
        locadoraId: profile.locadoraId || profile.id,
        status: motorista.status, // Manter status original
        email: data.email || undefined,
      };
      
      // Atualizar dados do motorista
      const response = await fetch(`/api/motoristas/${motorista.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motoristaData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar motorista');
      }

      const motoristaAtualizado = await response.json();

      // Log da atividade
      await registrarAtividade(
        profile.locadoraId || profile.id,
        profile.email || 'usuario@drivs.me',
        'atualizar',
        'motorista',
        motorista.id,
        `Motorista atualizado: ${motoristaAtualizado.nome} (CPF: ${motoristaAtualizado.cpf})`
      );
      
      // Upload das imagens se existirem
      const imagensParaUpload = Object.entries(imagens).filter(([_, file]) => file !== null);
      
      if (imagensParaUpload.length > 0) {
        const formData = new FormData();
        
        imagensParaUpload.forEach(([tipo, file]) => {
          if (file) {
            formData.append(tipo, file);
          }
        });
        
        const uploadResponse = await fetch(`/api/motoristas/${motorista.id}/upload-imagens`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          console.error('Erro ao fazer upload das imagens');
          toast({
            title: "Dados atualizados",
            description: "Motorista atualizado, mas houve erro no upload das imagens",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso!",
            description: "Motorista e documentos atualizados com sucesso",
          });
        }
      } else {
        toast({
          title: "Sucesso!",
          description: "Motorista atualizado com sucesso",
        });
      }

      onMotoristaEditado(motoristaAtualizado);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao editar motorista:', error);
      toast({
        title: "Erro!",
        description: "Erro ao atualizar motorista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!motorista) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Motorista</DialogTitle>
          <DialogDescription>
            Atualize as informações do motorista {motorista.nome}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES PESSOAIS */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
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
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CONTATO */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="11977263156" 
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CNH */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da CNH *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000000000" 
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
                          <SelectItem value="Cat. A">Cat. A</SelectItem>
                          <SelectItem value="Cat. B">Cat. B</SelectItem>
                          <SelectItem value="Cat. AB">Cat. AB</SelectItem>
                          <SelectItem value="Cat. C">Cat. C</SelectItem>
                          <SelectItem value="Cat. D">Cat. D</SelectItem>
                          <SelectItem value="Cat. E">Cat. E</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vencimentoCnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento da CNH *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ENDEREÇO */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) {
                            value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                          }
                          field.onChange(value);
                          
                          // Buscar endereço automaticamente quando CEP tiver 8 dígitos
                          if (value.replace(/\D/g, '').length === 8) {
                            buscarEnderecoPorCep(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua/Avenida *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua das Flores" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, casa, bloco..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="AL">AL</SelectItem>
                          <SelectItem value="AP">AP</SelectItem>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="BA">BA</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                          <SelectItem value="DF">DF</SelectItem>
                          <SelectItem value="ES">ES</SelectItem>
                          <SelectItem value="GO">GO</SelectItem>
                          <SelectItem value="MA">MA</SelectItem>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="MS">MS</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                          <SelectItem value="PA">PA</SelectItem>
                          <SelectItem value="PB">PB</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="PE">PE</SelectItem>
                          <SelectItem value="PI">PI</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="RN">RN</SelectItem>
                          <SelectItem value="RS">RS</SelectItem>
                          <SelectItem value="RO">RO</SelectItem>
                          <SelectItem value="RR">RR</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="SE">SE</SelectItem>
                          <SelectItem value="TO">TO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* DOCUMENTOS */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {/* Foto de Perfil */}
                <div className="space-y-1">
                  <Label htmlFor="foto-perfil" className="text-xs font-medium">Foto de Perfil</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="foto-perfil"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoPerfil')}
                      className="hidden"
                    />
                    {imagens.fotoPerfil ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.fotoPerfil.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('fotoPerfil')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.fotoPerfil && (
                          <div className="relative group">
                            <img 
                              src={imagePreviews.fotoPerfil} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(imagePreviews.fotoPerfil!, '_blank');
                                }}
                              >
                                <Eye className="w-2 h-2 mr-1" />
                                Ver
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(imagePreviews.fotoPerfil!);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `motorista-${motorista.nome}-foto-perfil.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Erro ao baixar imagem:', error);
                                    toast({
                                      title: "Erro ao baixar",
                                      description: "Não foi possível baixar a imagem",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Download className="w-2 h-2 mr-1" />
                                Baixar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : imagePreviews.fotoPerfil ? (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 mb-1">Imagem atual:</div>
                        <div className="relative group">
                          <img 
                            src={imagePreviews.fotoPerfil} 
                            alt="Imagem atual" 
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(imagePreviews.fotoPerfil!, '_blank');
                              }}
                            >
                              <Eye className="w-2 h-2 mr-1" />
                              Ver
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const response = await fetch(imagePreviews.fotoPerfil!);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `motorista-${motorista.nome}-foto-perfil.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Erro ao baixar imagem:', error);
                                  toast({
                                    title: "Erro ao baixar",
                                    description: "Não foi possível baixar a imagem",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Download className="w-2 h-2 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                        <label
                          htmlFor="foto-perfil"
                          className="cursor-pointer flex flex-col items-center justify-center py-1"
                        >
                          <Upload className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-blue-600">Substituir</span>
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-perfil"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* CNH */}
                <div className="space-y-1">
                  <Label htmlFor="cnh-imagem" className="text-xs font-medium">CNH</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="cnh-imagem"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleImageUpload(e.target.files, 'cnhImagem')}
                      className="hidden"
                    />
                    {imagens.cnhImagem ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.cnhImagem.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('cnhImagem')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.cnhImagem ? (
                          <div className="relative group">
                            <img 
                              src={imagePreviews.cnhImagem} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(imagePreviews.cnhImagem!, '_blank');
                                }}
                              >
                                <Eye className="w-2 h-2 mr-1" />
                                Ver
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(imagePreviews.cnhImagem!);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `motorista-${motorista.nome}-cnh.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Erro ao baixar imagem:', error);
                                    toast({
                                      title: "Erro ao baixar",
                                      description: "Não foi possível baixar a imagem",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Download className="w-2 h-2 mr-1" />
                                Baixar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600 ml-1">PDF</span>
                          </div>
                        )}
                      </div>
                    ) : imagePreviews.cnhImagem ? (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 mb-1">Imagem atual:</div>
                        <div className="relative group">
                          <img 
                            src={imagePreviews.cnhImagem} 
                            alt="CNH atual" 
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(imagePreviews.cnhImagem!, '_blank');
                              }}
                            >
                              <Eye className="w-2 h-2 mr-1" />
                              Ver
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const response = await fetch(imagePreviews.cnhImagem!);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `motorista-${motorista.nome}-cnh.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Erro ao baixar imagem:', error);
                                  toast({
                                    title: "Erro ao baixar",
                                    description: "Não foi possível baixar a imagem",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Download className="w-2 h-2 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                        <label
                          htmlFor="cnh-imagem"
                          className="cursor-pointer flex flex-col items-center justify-center py-1"
                        >
                          <Upload className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-blue-600">Substituir</span>
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor="cnh-imagem"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto com CNH */}
                <div className="space-y-1">
                  <Label htmlFor="foto-com-cnh" className="text-xs font-medium">Foto com CNH</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="foto-com-cnh"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoComCnh')}
                      className="hidden"
                    />
                    {imagens.fotoComCnh ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.fotoComCnh.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('fotoComCnh')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.fotoComCnh && (
                          <img 
                            src={imagePreviews.fotoComCnh} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-com-cnh"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Comprovante de Endereço */}
                <div className="space-y-1">
                  <Label htmlFor="comprovante-endereco" className="text-xs font-medium">Comprovante</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="comprovante-endereco"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleImageUpload(e.target.files, 'comprovanteEndereco')}
                      className="hidden"
                    />
                    {imagens.comprovanteEndereco ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.comprovanteEndereco.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('comprovanteEndereco')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.comprovanteEndereco ? (
                          <img 
                            src={imagePreviews.comprovanteEndereco} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600 ml-1">PDF</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="comprovante-endereco"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto Extra */}
                <div className="space-y-1">
                  <Label htmlFor="foto-extra" className="text-xs font-medium">Foto Extra</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="foto-extra"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoExtra')}
                      className="hidden"
                    />
                    {imagens.fotoExtra ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.fotoExtra.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('fotoExtra')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.fotoExtra && (
                          <img 
                            src={imagePreviews.fotoExtra} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-extra"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto Extra 2 */}
                <div className="space-y-1">
                  <Label htmlFor="foto-extra-2" className="text-xs font-medium">Foto Extra 2</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
                    <input
                      id="foto-extra-2"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoExtra2')}
                      className="hidden"
                    />
                    {imagens.fotoExtra2 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{imagens.fotoExtra2.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveImage('fotoExtra2')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {imagePreviews.fotoExtra2 && (
                          <img 
                            src={imagePreviews.fotoExtra2} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-extra-2"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">Selecionar</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              {/* BOTÃO NEGATIVAR */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarNegativacao(!mostrarNegativacao)}
                  className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                >
                  Negativar Motorista
                </Button>
              </div>

              {/* SEÇÃO NEGATIVAR MOTORISTA */}
              {mostrarNegativacao && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-red-700">Negativar Motorista</h3>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="motivo-negativacao" className="text-sm">
                              Descreva o motivo da negativação *
                            </Label>
                            <textarea
                              id="motivo-negativacao"
                              value={motivoNegativacao}
                              onChange={(e) => setMotivoNegativacao(e.target.value)}
                              placeholder="Ex: Inadimplência, problemas com documentação, histórico de infrações..."
                              className="w-full p-2 border border-red-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              rows={3}
                            />
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setMostrarNegativacao(false);
                                  setMotivoNegativacao('');
                                }}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={negativarMotorista}
                                disabled={loading || !motivoNegativacao.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                {loading ? "Processando..." : "Confirmar"}
                              </Button>
                            </div>
                            
                            <p className="text-xs text-red-600">
                              ⚠️ Ação irreversível: O motorista será marcado como negativado no sistema
                            </p>
                          </div>
                        </div>
                      )}
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
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}