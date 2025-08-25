/**
 * Modal para cadastro de novos motoristas
 * Formulário completo com validação
 */

import { useState } from 'react';
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
import { Motorista } from '@/types';
import { generateId } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMotoristas } from '@/hooks/useMotoristas';
import { registrarAtividade } from '@/utils/activityLogger';
import { Image, Upload, X } from 'lucide-react';

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

// Schema de validação baseado no schema do banco
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

interface NovoMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoMotoristaModal({ 
  open, 
  onOpenChange 
}: NovoMotoristaModalProps) {
  const [loading, setLoading] = useState(false);
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
  const { profile } = useAuth();
  const { toast } = useToast();
  const { createMotorista } = useMotoristas();

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
      complemento: '',
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

  const onSubmit = async (data: MotoristaFormData) => {
    setLoading(true);
    
    try {
      // Preparar dados para envio à API
      const motoristaData = {
        id: data.cpf.replace(/\D/g, ''), // Usar CPF limpo como ID
        locadoraId: profile?.locadoraId || '123456789',
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        dataNascimento: data.dataNascimento,
        telefone: data.telefone,
        email: data.email || '',
        cnh: data.cnh,
        categoria: data.categoria,
        vencimentoCnh: data.vencimentoCnh,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        complemento: data.complemento || '',
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        status: 'ativo' as const, // Sempre definir como ativo
      };

      // Usar hook do React Query para criar motorista
      const novoMotorista = await createMotorista.mutateAsync(motoristaData);

      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '123456789',
        profile?.email || 'usuario@drivs.me',
        'cadastrar',
        'motorista',
        novoMotorista.id,
        `Novo motorista cadastrado: ${novoMotorista.nome} (CPF: ${novoMotorista.cpf})`
      );
      
      // Upload das imagens se houver
      const imagensParaUpload = Object.values(imagens).filter(img => img !== null);
      if (imagensParaUpload.length > 0) {
        try {
          const formData = new FormData();
          formData.append('motoristaId', novoMotorista.id);
          
          // Adicionar imagens específicas
          if (imagens.fotoPerfil) formData.append('fotoPerfil', imagens.fotoPerfil);
          if (imagens.cnhImagem) formData.append('cnhImagem', imagens.cnhImagem);
          if (imagens.fotoComCnh) formData.append('fotoComCnh', imagens.fotoComCnh);
          if (imagens.comprovanteEndereco) formData.append('comprovanteEndereco', imagens.comprovanteEndereco);
          if (imagens.fotoExtra) formData.append('fotoExtra', imagens.fotoExtra);
          if (imagens.fotoExtra2) formData.append('fotoExtra2', imagens.fotoExtra2);
          
          const uploadResponse = await fetch(`/api/motoristas/${novoMotorista.id}/upload-imagens`, {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Erro ao fazer upload das imagens');
          }
          
          toast({
            title: "Motorista cadastrado com sucesso!",
            description: `${imagensParaUpload.length} documento(s) enviado(s)`,
          });
        } catch (uploadError) {
          console.error('Erro no upload das imagens:', uploadError);
          toast({
            title: "Motorista cadastrado",
            description: "Mas houve erro no upload dos documentos. Você pode tentar novamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Motorista cadastrado com sucesso!",
          description: "Motorista adicionado ao sistema",
        });
      }
      
      onOpenChange(false);
      form.reset();
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
      
    } catch (error) {
      console.error('Erro ao cadastrar motorista:', error);
      alert('Erro ao cadastrar motorista: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Motorista</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo motorista para cadastrá-lo no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES PESSOAIS */}
            <div className="space-y-4">
              
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF, RG e Data de Nascimento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                            }
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
                          placeholder="(11) 99999-9999" 
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                            }
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@exemplo.com (opcional)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CARTEIRA DE MOTORISTA */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da rua" {...field} />
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
                        <Input placeholder="Nome do bairro" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
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
                          <SelectItem value="SE">SE</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto de Perfil */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoPerfil')}
                      className="flex-1"
                    />
                    {imagens.fotoPerfil && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('fotoPerfil')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.fotoPerfil && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.fotoPerfil}
                        alt="Foto de Perfil"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* CNH Imagem */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    CNH (Imagem ou PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleImageUpload(e.target.files, 'cnhImagem')}
                      className="flex-1"
                    />
                    {imagens.cnhImagem && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('cnhImagem')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.cnhImagem && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.cnhImagem}
                        alt="CNH"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  {imagens.cnhImagem && imagens.cnhImagem.type === 'application/pdf' && (
                    <div className="mt-2">
                      <div className="w-20 h-20 bg-red-100 rounded-lg border flex items-center justify-center">
                        <span className="text-xs text-red-600">PDF</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto com CNH */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Foto Segurando CNH
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoComCnh')}
                      className="flex-1"
                    />
                    {imagens.fotoComCnh && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('fotoComCnh')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.fotoComCnh && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.fotoComCnh}
                        alt="Foto com CNH"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* Comprovante de Endereço */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Comprovante de Endereço
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleImageUpload(e.target.files, 'comprovanteEndereco')}
                      className="flex-1"
                    />
                    {imagens.comprovanteEndereco && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('comprovanteEndereco')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.comprovanteEndereco && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.comprovanteEndereco}
                        alt="Comprovante de Endereço"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  {imagens.comprovanteEndereco && imagens.comprovanteEndereco.type === 'application/pdf' && (
                    <div className="mt-2">
                      <div className="w-20 h-20 bg-red-100 rounded-lg border flex items-center justify-center">
                        <span className="text-xs text-red-600">PDF</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto Extra 1 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Foto Extra (Opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoExtra')}
                      className="flex-1"
                    />
                    {imagens.fotoExtra && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('fotoExtra')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.fotoExtra && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.fotoExtra}
                        alt="Foto Extra"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* Foto Extra 2 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Foto Extra 2 (Opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files, 'fotoExtra2')}
                      className="flex-1"
                    />
                    {imagens.fotoExtra2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImage('fotoExtra2')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreviews.fotoExtra2 && (
                    <div className="mt-2">
                      <img
                        src={imagePreviews.fotoExtra2}
                        alt="Foto Extra 2"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Máximo 5MB por arquivo. Formatos aceitos: JPG, PNG (todos os campos) e PDF (CNH e Comprovante)
              </p>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              {/* Status será sempre "ativo" por padrão */}
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
                {loading ? 'Cadastrando...' : 'Cadastrar Motorista'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}