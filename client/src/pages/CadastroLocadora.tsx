/**
 * Página de Cadastro de Locadoras
 * Permite que locadoras se cadastrem no sistema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CadastroLocadora() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    responsavel: ''
  });

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
          id: formData.cnpj,
          nome: formData.nome,
          razaoSocial: formData.razaoSocial,
          cnpj: formData.cnpj,
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          responsavel: formData.responsavel,
          plano: 'basico',
          status: 'ativa'
        }),
      });

      if (!locadoraResponse.ok) {
        const error = await locadoraResponse.json();
        throw new Error(error.message || 'Erro ao criar locadora');
      }

      // 3. Atualizar o perfil do usuário com o ID da locadora
      const profileResponse = await fetch(`/api/profiles/${authData.user.id}`, {
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/login')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">DRIVS</h1>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cadastro de Locadora</CardTitle>
            <CardDescription>
              Preencha seus dados para se cadastrar no sistema DRIVS
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Fantasia *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => updateFormData('nome', e.target.value)}
                    placeholder="AutoRent Premium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável *</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => updateFormData('responsavel', e.target.value)}
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => updateFormData('razaoSocial', e.target.value)}
                    placeholder="AutoRent Premium Locadora Ltda"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => updateFormData('cnpj', e.target.value)}
                    placeholder="12.345.678/0001-90"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="contato@autorent.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => updateFormData('telefone', e.target.value)}
                    placeholder="(11) 98765-4321"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => updateFormData('confirmarSenha', e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => updateFormData('endereco', e.target.value)}
                    placeholder="Av. Paulista, 1000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => updateFormData('cidade', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => updateFormData('estado', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => updateFormData('cep', e.target.value)}
                    placeholder="01310-100"
                    required
                  />
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
            © 2024 DRIVS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}