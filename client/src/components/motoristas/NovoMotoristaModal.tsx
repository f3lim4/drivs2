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
import { Image, Upload, X } from 'lucide-react';

// Schema de validação baseado no schema do banco
const motoristaSchema = z.object({
  // Informações Pessoais
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  rg: z.string().min(7, 'RG deve ter pelo menos 7 dígitos'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  
  // Contato
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Carteira de Motorista
  cnh: z.string().min(11, 'CNH deve ter 11 dígitos'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  vencimentoCnh: z.string().min(1, 'Data de vencimento é obrigatória'),
  
  // Endereço
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  
  // Status
  status: z.enum(['ativo', 'inativo', 'vencido']),
});

type MotoristaFormData = z.infer<typeof motoristaSchema>;

interface NovoMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMotoristaAdicionado: (motorista: Motorista) => void;
}

export function NovoMotoristaModal({ 
  open, 
  onOpenChange, 
  onMotoristaAdicionado 
}: NovoMotoristaModalProps) {
  const [loading, setLoading] = useState(false);
  const [imagens, setImagens] = useState<{
    fotoPerfil: File | null;
    cnhImagem: File | null;
    fotoComCnh: File | null;
    comprovanteEndereco: File | null;
    fotoExtra: File | null;
  }>({
    fotoPerfil: null,
    cnhImagem: null,
    fotoComCnh: null,
    comprovanteEndereco: null,
    fotoExtra: null,
  });
  const [imagePreviews, setImagePreviews] = useState<{
    fotoPerfil: string | null;
    cnhImagem: string | null;
    fotoComCnh: string | null;
    comprovanteEndereco: string | null;
    fotoExtra: string | null;
  }>({
    fotoPerfil: null,
    cnhImagem: null,
    fotoComCnh: null,
    comprovanteEndereco: null,
    fotoExtra: null,
  });
  const { profile } = useAuth();
  const { toast } = useToast();

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
      status: 'ativo',
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
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        status: data.status,
      };

      // Enviar dados do motorista
      const response = await fetch('/api/motoristas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motoristaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar motorista');
      }

      const novoMotorista = await response.json();
      
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
          
          const uploadResponse = await fetch('/api/motoristas/upload-imagens', {
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
      
      onMotoristaAdicionado(novoMotorista);
      onOpenChange(false);
      form.reset();
      setImagens({
        fotoPerfil: null,
        cnhImagem: null,
        fotoComCnh: null,
        comprovanteEndereco: null,
        fotoExtra: null,
      });
      setImagePreviews({
        fotoPerfil: null,
        cnhImagem: null,
        fotoComCnh: null,
        comprovanteEndereco: null,
        fotoExtra: null,
      });
      
    } catch (error) {
      console.error('Erro ao cadastrar motorista:', error);
      alert('Erro ao cadastrar motorista: ' + (error.message || 'Erro desconhecido'));
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
              <div className="grid grid-cols-3 gap-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                            <SelectValue placeholder="B" />
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
              </div>

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

            {/* ENDEREÇO */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
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

              <div className="grid grid-cols-3 gap-4">
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
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          }}
                        />
                      </FormControl>
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

                {/* Foto Extra */}
                <div className="space-y-2 md:col-span-2">
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
              </div>
              
              <p className="text-xs text-muted-foreground">
                Máximo 5MB por arquivo. Formatos aceitos: JPG, PNG (todos os campos) e PDF (CNH e Comprovante)
              </p>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              
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
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="vencido">CNH Vencida</SelectItem>
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
                {loading ? 'Cadastrando...' : 'Cadastrar Motorista'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}