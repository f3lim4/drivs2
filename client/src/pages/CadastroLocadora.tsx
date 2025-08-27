/**
 * Página de Cadastro de Locadoras
 * Permite que locadoras se cadastrem no sistema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Upload, Image, Lock, AlertTriangle } from 'lucide-react';
import drivsLogo from "@/assets/drivs-logo.png";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  formatarDocumento, 
  validarDocumento, 
  getLabelDocumento, 
  getPlaceholderDocumento,
  limparDocumento 
} from '@/utils/documentValidation';

export default function CadastroLocadora() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '', // Este campo agora aceita CPF ou CNPJ
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    responsavel: '',
    logo: ''
  });

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
          
          toast({
            title: "Endereço encontrado!",
            description: `${data.logradouro}, ${data.localidade} - ${data.uf}`,
          });
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado e tente novamente.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao buscar CEP",
          description: "Não foi possível consultar o endereço. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Função para upload de logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos JPG, PNG e SVG são aceitos.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const base64String = await fileToBase64(file);
      
      setLogoFile(file);
      setLogoPreview(base64String);
      setFormData({ ...formData, logo: base64String });
      
      toast({
        title: "Logo carregado",
        description: "Logo da empresa foi carregado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      toast({
        title: "Erro ao carregar logo",
        description: "Não foi possível carregar o logo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Função para remover logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logo: '' });
  };

  // Função para verificar se email já existe
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      const response = await fetch(`/api/profiles/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists);
    } catch (error) {
      // Se der erro, não bloqueia o usuário
      setEmailExists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validar se as senhas coincidem
    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem. Verifique e tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validar tamanho mínimo da senha
    if (formData.senha.length < 6) {
      toast({
        title: "Erro na validação",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validar documento (CPF ou CNPJ)
    if (!validarDocumento(formData.cnpj)) {
      toast({
        title: "Erro na validação",
        description: "Digite um CPF ou CNPJ válido.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // 1. Criar usuário de autenticação
      const authResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.senha,
          name: formData.responsavel,
          type: 'locadora'
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        if (error.message === 'User already exists') {
          throw new Error('Este email já está cadastrado. Use outro email ou faça login se já tem uma conta.');
        }
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      const authData = await authResponse.json();

      // 2. Criar a locadora
      const locadoraResponse = await fetch('/api/locadoras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: limparDocumento(formData.cnpj), // Usar documento limpo como ID
          nome: formData.nome,
          razaoSocial: formData.nome, // Usar nome como razão social também
          cnpj: limparDocumento(formData.cnpj), // Salvar documento limpo
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
          numero: formData.numero,
          complemento: formData.complemento || '',
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          responsavel: formData.responsavel,
          logo: formData.logo,
          plano: 'basico',
          status: 'ativa'
        }),
      });

      if (!locadoraResponse.ok) {
        const error = await locadoraResponse.json();
        // Tratar erros específicos de duplicação
        if (error.message && error.message.includes('telefone')) {
          throw new Error('Este telefone já está cadastrado. Use outro número de telefone.');
        }
        if (error.message && error.message.includes('cnpj')) {
          throw new Error('Este CNPJ já está cadastrado. Verifique o CNPJ informado.');
        }
        if (error.message && error.message.includes('email')) {
          throw new Error('Este email já está cadastrado. Use outro email.');
        }
        throw new Error(error.message || 'Erro ao criar locadora');
      }

      // 3. Atualizar o perfil do usuário com o ID da locadora
      const profileResponse = await fetch(`/api/profiles/${authData.user.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locadoraId: formData.cnpj
        }),
      });

      if (!profileResponse.ok) {
        console.warn('Erro ao atualizar perfil, mas locadora foi criada');
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: `${formData.nome} foi cadastrada. Verifique seu email para confirmar a conta e depois faça login.`,
      });

      // Redirecionar para login
      navigate('/login');
    } catch (error) {
      console.error('Erro ao cadastrar locadora:', error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível cadastrar a locadora. Tente novamente.";
      toast({
        title: "Erro ao realizar cadastro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Se o erro for de usuário existente, limpar apenas o campo email
      if (error instanceof Error && error.message.includes('já está cadastrado')) {
        setFormData(prev => ({ ...prev, email: '' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4 overflow-hidden">
      {/* Animated Background Elements - mesmo do login */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Animated Lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-700"></div>
      </div>
      
      <div className="relative z-10 container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/login')}
              className="h-10 w-10 text-white hover:text-cyan-400 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={drivsLogo} 
              alt="DRIVS" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Formulário */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Cadastro de Locadora</CardTitle>
            <CardDescription className="text-gray-600">
              Preencha seus dados para se cadastrar no sistema DRIVS
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome da Empresa e CPF/CNPJ na mesma linha */}
                <div className="space-y-2">
                  <Label htmlFor="nome" >Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => updateFormData('nome', e.target.value)}
                    placeholder="Digite o nome da sua empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">{getLabelDocumento(formData.cnpj)} *</Label>
                  <Input
                    id="cnpj"
                    value={formatarDocumento(formData.cnpj)}
                    onChange={(e) => updateFormData('cnpj', e.target.value)}
                    placeholder={getPlaceholderDocumento(formData.cnpj)}
                    required
                  />
                </div>

                {/* Email, Telefone e Responsável na mesma linha */}
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email" >Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="seuemail@empresa.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone" >Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => updateFormData('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsavel" >Responsável *</Label>
                    <Input
                      id="responsavel"
                      value={formData.responsavel}
                      onChange={(e) => updateFormData('responsavel', e.target.value)}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>
                </div>

                {/* CEP, Endereço, Número e Complemento na mesma linha */}
                <div className="col-span-2 grid gap-2" style={{gridTemplateColumns: '1fr 2fr 0.8fr 1fr'}}>
                  <div className="space-y-2">
                    <Label htmlFor="cep" >CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => {
                        updateFormData('cep', e.target.value);
                        buscarEnderecoPorCEP(e.target.value);
                      }}
                      placeholder="00000-000"
                      required
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco" >Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => updateFormData('endereco', e.target.value)}
                      placeholder="Automático"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero" >Número *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => updateFormData('numero', e.target.value)}
                      placeholder="123"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento" >Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => updateFormData('complemento', e.target.value)}
                      placeholder="Apto..."
                    />
                  </div>
                </div>

                {/* Bairro, Cidade e Estado na mesma linha */}
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="bairro" >Bairro *</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => updateFormData('bairro', e.target.value)}
                      placeholder="Automático"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade" >Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => updateFormData('cidade', e.target.value)}
                      placeholder="Automático"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado" >Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => updateFormData('estado', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Automático" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>


              </div>

              {/* Logo, Senha e Confirmar Senha na mesma linha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                {/* Logo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <Image className="h-5 w-5 mr-2" />
                    Logo (Opcional)
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Preview do logo e controles lado a lado */}
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo da empresa" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <Image className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Controles de upload */}
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg border border-blue-200 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {uploadingLogo ? 'Carregando...' : 'Selecionar'}
                            </span>
                          </div>
                        </Label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <Lock className="h-5 w-5 mr-2" />
                    Senha *
                  </h3>
                  
                  <div className="space-y-2">
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => updateFormData('senha', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <Lock className="h-5 w-5 mr-2" />
                    Confirmar Senha *
                  </h3>
                  
                  <div className="space-y-2">
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => updateFormData('confirmarSenha', e.target.value)}
                      placeholder="Repita a senha"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Termos de Uso */}
              <div className="pt-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="aceitarTermos"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="aceitarTermos" className="text-sm text-gray-700">
                    Li e aceito os{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:text-blue-800 underline"
                      onClick={() => window.open('/termos-uso', '_blank')}
                    >
                      Termos de Uso
                    </Button>
                    {' '}da plataforma DRIVS *
                  </label>
                </div>
              </div>



              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/login')}
                >
                  Voltar ao Login
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Locadora'}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Button 
                  variant="link" 
                  className="px-0 text-primary hover:text-primary/80"
                  onClick={() => navigate('/login')}
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2025 DRIVS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}