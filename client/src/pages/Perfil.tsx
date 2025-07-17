/**
 * Página de perfil do usuário
 * Permite visualizar e editar informações do usuário (admin ou locadora)
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { User, Building, Phone, Mail, MapPin, Calendar, CreditCard, Lock } from 'lucide-react';

// Schema de validação para perfil da locadora (sem plano)
const perfilSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
});

// Schema de validação para troca de senha
const senhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type PerfilFormData = z.infer<typeof perfilSchema>;
type SenhaFormData = z.infer<typeof senhaSchema>;

interface LocadoraData {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: string;
  plano: string;
  createdAt: string;
  updatedAt: string;
}

export default function Perfil() {
  const { profile, isLocadora, isAdmin } = useAuth();
  const { toast } = useToast();
  const [locadora, setLocadora] = useState<LocadoraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Função para recarregar o perfil do servidor
  const reloadProfile = async () => {
    if (!profile?.email) return null;
    
    try {
      const response = await fetch(`/api/auth/profile?email=${encodeURIComponent(profile.email)}`);
      if (response.ok) {
        const updatedProfile = await response.json();
        return updatedProfile;
      }
    } catch (error) {
      console.error('Error reloading profile:', error);
    }
    return null;
  };

  const form = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: '',
      razaoSocial: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      responsavel: '',
    },
  });

  const senhaForm = useForm<SenhaFormData>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  // Carregar dados do usuário
  useEffect(() => {
    const carregarDados = async () => {
      // Se é admin, não precisa carregar dados de locadora
      if (isAdmin) {
        setLoading(false);
        return;
      }

      // Se é locadora, carregar dados da locadora
      if (isLocadora) {
        let currentProfile = profile;
        
        // Se não tem locadoraId, tentar recarregar o perfil do servidor
        if (!profile?.locadoraId) {
          const reloadedProfile = await reloadProfile();
          if (reloadedProfile?.locadoraId) {
            currentProfile = reloadedProfile;
          } else {
            setLoading(false);
            return;
          }
        }

        try {
          setLoading(true);
          const response = await fetch(`/api/locadoras/${currentProfile.locadoraId}`);
          
          if (!response.ok) {
            throw new Error(`Erro ao carregar dados da locadora: ${response.status}`);
          }

          const data = await response.json();
          setLocadora(data);
          
          // Atualizar form com os dados
          form.reset({
            nome: data.nome,
            razaoSocial: data.razaoSocial,
            cnpj: data.cnpj,
            email: data.email,
            telefone: data.telefone,
            endereco: data.endereco,
            cidade: data.cidade,
            estado: data.estado,
            cep: data.cep,
            responsavel: data.responsavel,
          });
        } catch (error) {
          console.error('Erro ao carregar locadora:', error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar os dados da locadora.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    carregarDados();
  }, [profile?.locadoraId, profile?.email, form, toast, isAdmin, isLocadora]);

  const onSubmit = async (data: PerfilFormData) => {
    if (!profile?.locadoraId) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/locadoras/${profile.locadoraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar dados');
      }

      const updatedData = await response.json();
      setLocadora(updatedData);
      setEditMode(false);

      toast({
        title: "Perfil atualizado",
        description: "Os dados da locadora foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para trocar senha
  const onTrocarSenha = async (data: SenhaFormData) => {
    if (!profile?.email) return;

    try {
      setChangingPassword(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          senhaAtual: data.senhaAtual,
          novaSenha: data.novaSenha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao trocar senha');
      }

      toast({
        title: "Senha alterada",
        description: "A senha foi alterada com sucesso.",
      });
      
      setShowPasswordForm(false);
      senhaForm.reset();
    } catch (error) {
      console.error('Erro ao trocar senha:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha. Verifique se a senha atual está correta.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Se é locadora mas não tem locadoraId, mostrar opção para recarregar
  if (isLocadora && !profile?.locadoraId && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Dados Incompletos</CardTitle>
            <CardDescription>
              Seus dados de locadora não foram encontrados. 
              Tente fazer logout e login novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                localStorage.removeItem('drivs_profile');
                window.location.href = '/login';
              }}
              className="w-full"
            >
              Fazer Login Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se é admin, mostrar perfil do admin
  if (isAdmin) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6">
          {/* Card de Informações do Admin */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  <User className="w-full h-full" />
                </div>
                <CardTitle>Informações do Administrador</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={profile?.name || 'Administrador'} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Usuário</Label>
                    <Input value="Administrador" disabled />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Troca de Senha */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  <Lock className="w-full h-full" />
                </div>
                <CardTitle>Alterar Senha</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                variant="outline"
                className="w-full"
              >
                {showPasswordForm ? 'Cancelar' : 'Trocar Senha'}
              </Button>
              
              {showPasswordForm && (
                <div className="mt-4">
                  <Form {...senhaForm}>
                    <form onSubmit={senhaForm.handleSubmit(onTrocarSenha)} className="space-y-4">
                      <FormField
                        control={senhaForm.control}
                        name="senhaAtual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={senhaForm.control}
                        name="novaSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={senhaForm.control}
                        name="confirmarSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={changingPassword} className="w-full">
                        {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="grid gap-6">
        {/* Card de Informações Principais */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  <Building className="w-full h-full" />
                </div>
                <CardTitle>Informações da Empresa</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={locadora?.status === 'ativa' ? 'default' : 'destructive'}>
                  {locadora?.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </Badge>
                <Badge variant="outline">
                  Plano {locadora?.plano}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!editMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="razaoSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!editMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={true} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!editMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Contato
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Endereço
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!editMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
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
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={!editMode}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
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
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>



                {/* Botões */}
                <div className="flex justify-end space-x-2">
                  {editMode ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          form.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordForm(true)}
                      >
                        <div className="h-4 w-4 mr-2 flex items-center justify-center">
                          <Lock className="w-full h-full" />
                        </div>
                        Trocar Senha
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setEditMode(true)}
                      >
                        Editar Perfil
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Card de Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="h-5 w-5 mr-2 flex items-center justify-center">
                <Calendar className="w-full h-full" />
              </div>
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Data de Cadastro
                </Label>
                <p className="text-sm">
                  {locadora?.createdAt ? new Date(locadora.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Última Atualização
                </Label>
                <p className="text-sm">
                  {locadora?.updatedAt ? new Date(locadora.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Troca de Senha */}
        {showPasswordForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <Lock className="w-full h-full" />
                </div>
                Trocar Senha
              </CardTitle>
              <CardDescription>
                Digite sua senha atual e defina uma nova senha para sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...senhaForm}>
                <form onSubmit={senhaForm.handleSubmit(onTrocarSenha)} className="space-y-4">
                  <FormField
                    control={senhaForm.control}
                    name="senhaAtual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual *</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={senhaForm.control}
                    name="novaSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha *</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={senhaForm.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha *</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        senhaForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}