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
import { Image, Upload, X, FileText, Eye } from 'lucide-react';

// Schema de validação (mesmo do NovoMotoristaModal)
const motoristaSchema = z.object({
  // Informações Pessoais
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  rg: z.string().min(1, 'RG é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  
  // Contato
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Carteira de Motorista
  cnh: z.string().min(9, 'CNH deve ter pelo menos 9 dígitos'),
  categoria: z.string().min(1, 'Categoria da CNH é obrigatória'),
  vencimentoCnh: z.string().min(1, 'Vencimento da CNH é obrigatório'),
  
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
        cidade: motorista.cidade,
        estado: motorista.estado,
        cep: motorista.cep,
        status: motorista.status,
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
    }
  }, [motorista, open, form]);

  const onSubmit = async (data: MotoristaFormData) => {
    if (!motorista || !profile) return;

    try {
      setLoading(true);
      
      // Preparar dados para API
      const motoristaData = {
        ...data,
        locadoraId: profile.id,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-3 gap-4">
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
                            <SelectValue placeholder="Cat. B" />
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
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
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
              </div>

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
                            const value = e.target.value.replace(/\D/g, '');
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Foto de Perfil */}
                <div className="space-y-2">
                  <Label htmlFor="foto-perfil">Foto de Perfil</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
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
                          <img 
                            src={imagePreviews.fotoPerfil} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-perfil"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* CNH */}
                <div className="space-y-2">
                  <Label htmlFor="cnh-imagem">CNH</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
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
                          <img 
                            src={imagePreviews.cnhImagem} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded">
                            <FileText className="h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-600 ml-1">PDF</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="cnh-imagem"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto com CNH */}
                <div className="space-y-2">
                  <Label htmlFor="foto-com-cnh">Foto com CNH</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
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
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-com-cnh"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Comprovante de Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="comprovante-endereco">Comprovante de Endereço</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
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
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded">
                            <FileText className="h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-600 ml-1">PDF</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="comprovante-endereco"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto Extra */}
                <div className="space-y-2">
                  <Label htmlFor="foto-extra">Foto Extra</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
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
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-extra"
                        className="cursor-pointer flex flex-col items-center justify-center py-1"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Foto Extra 2 */}
                <div className="space-y-2">
                  <Label htmlFor="foto-extra-2">Foto Extra 2</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                          <span className="text-sm text-gray-600">{imagens.fotoExtra2.name}</span>
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
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="foto-extra-2"
                        className="cursor-pointer flex flex-col items-center justify-center py-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Clique para selecionar</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Motorista *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-48">
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