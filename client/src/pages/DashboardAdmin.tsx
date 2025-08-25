import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings, Video, Link, Eye, EyeOff, ExternalLink, Play, Phone, Mail, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardConfig, InsertDashboardConfig, insertDashboardConfigSchema } from '@shared/schema';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';

// Função helper para requisições API
const apiRequest = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return response.json();
};

// Hook para buscar configurações
const useDashboardConfig = () => {
  return useQuery({
    queryKey: ['dashboard-config'],
    queryFn: () => apiRequest('/api/admin/dashboard-config'),
  });
};

// Hook para buscar links úteis
const useLinksUteis = () => {
  return useQuery({
    queryKey: ['links-uteis'],
    queryFn: () => apiRequest('/api/links-uteis'),
  });
};

// Hook para criar link útil
const useCreateLinkUtil = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('/api/links-uteis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links-uteis'] });
      toast({ title: 'Link criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar link', variant: 'destructive' });
    },
  });
};

// Hook para atualizar link útil
const useUpdateLinkUtil = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/links-uteis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links-uteis'] });
      toast({ title: 'Link atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar link', variant: 'destructive' });
    },
  });
};

// Hook para deletar link útil
const useDeleteLinkUtil = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/links-uteis/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links-uteis'] });
      toast({ title: 'Link removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover link', variant: 'destructive' });
    },
  });
};

// Hook para atualizar configurações
const useUpdateDashboardConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertDashboardConfig) => 
      apiRequest('/api/admin/dashboard-config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do dashboard foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });
};

export default function DashboardAdmin() {
  const { isAdmin } = useAuth();
  const { data: dashboardConfig, isLoading } = useDashboardConfig();
  const updateDashboardConfig = useUpdateDashboardConfig();

  const form = useForm<InsertDashboardConfig>({
    resolver: zodResolver(insertDashboardConfigSchema),
    defaultValues: dashboardConfig || {
      videoTutorialUrl: "",
      videoTutorialTitulo: "Tutorial do Sistema",
      videoTutorialDescricao: "Aprenda a usar o sistema",
      videoDemoUrl: "",
      videoDemoTitulo: "Demonstração",
      videoDemoDescricao: "Veja o sistema em ação",
      linkSuporteUrl: "https://wa.me/5511977263156",
      linkSuporteTitulo: "Suporte WhatsApp",
      linkSuporteDescricao: "Atendimento especializado",
      linkTreinamentoUrl: "",
      linkTreinamentoTitulo: "Treinamentos",
      linkTreinamentoDescricao: "Capacitação completa",
      linkManualUrl: "",
      linkManualTitulo: "Manual do Sistema",
      linkManualDescricao: "Guia completo de uso",
      linkDetranUrl: "https://www.detran.sp.gov.br",
      linkDetranTitulo: "Portal DETRAN SP",
      linkDetranDescricao: "Consultas de veículos e habilitação",
      linkReceitaUrl: "https://www.receita.fazenda.gov.br",
      linkReceitaTitulo: "Receita Federal",
      linkReceitaDescricao: "Consultas de CPF e CNPJ",
      linkSpcUrl: "https://www.spc.org.br",
      linkSpcTitulo: "Consulta SPC/Serasa",
      linkSpcDescricao: "Verificação de score e restrições",
      linkViaCepUrl: "https://viacep.com.br",
      linkViaCepTitulo: "Busca CEP",
      linkViaCepDescricao: "Consulta de endereços",
      mostrarVideoTutorial: true,
      mostrarVideoDemo: true,
      mostrarLinksSuporte: true,
      mostrarLinksUteis: true,
      telefoneSuporte: "11977263156",
      emailSuporte: "suporte@drivs.com.br",
    },
  });

  // Atualizar valores do formulário quando dados carregarem
  useState(() => {
    if (dashboardConfig) {
      form.reset(dashboardConfig);
    }
  });

  const handleSubmit = async (data: InsertDashboardConfig) => {
    await updateDashboardConfig.mutateAsync(data);
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure o que aparece no dashboard das locadoras</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="videos">Vídeos</TabsTrigger>
              <TabsTrigger value="suporte">Suporte</TabsTrigger>
              <TabsTrigger value="links-uteis">Links Úteis</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
            </TabsList>

            {/* Tab de Vídeos */}
            <TabsContent value="videos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Vídeos Tutorial e Demonstração
                  </CardTitle>
                  <CardDescription>
                    Configure vídeos que aparecerão no dashboard das locadoras para ajudar e treinar os usuários
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Tutorial */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Vídeo Tutorial</h3>
                      <FormField
                        control={form.control}
                        name="mostrarVideoTutorial"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">
                              {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </span>
                          </div>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="videoTutorialUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Vídeo Tutorial</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://youtube.com/watch?v=..." 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="videoTutorialTitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="videoTutorialDescricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Video Demo */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Vídeo Demonstração</h3>
                      <FormField
                        control={form.control}
                        name="mostrarVideoDemo"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">
                              {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </span>
                          </div>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="videoDemoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Vídeo Demonstração</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://youtube.com/watch?v=..." 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="videoDemoTitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="videoDemoDescricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Suporte */}
            <TabsContent value="suporte" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Links de Suporte
                  </CardTitle>
                  <CardDescription>
                    Configure links de suporte, treinamento e manual que aparecerão para as locadoras
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Mostrar Seção de Links de Suporte</h3>
                    <FormField
                      control={form.control}
                      name="mostrarLinksSuporte"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm">
                            {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Link Suporte */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Suporte Principal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="linkSuporteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Suporte</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkSuporteTitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="linkSuporteDescricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Link Treinamento */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Treinamentos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="linkTreinamentoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Treinamento</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://..." 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkTreinamentoTitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="linkTreinamentoDescricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Link Manual */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Manual do Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="linkManualUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Manual</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://..." 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkManualTitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="linkManualDescricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Links Úteis - Sistema Dinâmico */}
            <TabsContent value="links-uteis" className="space-y-6">
              <LinksUteisManager mostrarLinksUteis={form.watch('mostrarLinksUteis')} onToggleVisibility={(value) => form.setValue('mostrarLinksUteis', value)} />
            </TabsContent>

            {/* Tab de Contato */}
            <TabsContent value="contato" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>
                    Configure as informações de contato que aparecerão no dashboard das locadoras
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefoneSuporte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone de Suporte</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="11977263156" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emailSuporte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Suporte</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="suporte@drivs.com.br" 
                              type="email"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateDashboardConfig.isPending}
              className="min-w-32"
            >
              {updateDashboardConfig.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Componente para gerenciar Links Úteis dinamicamente
interface LinkUtilData {
  id?: number;
  titulo: string;
  url: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

const LinksUteisManager = ({ 
  mostrarLinksUteis, 
  onToggleVisibility 
}: { 
  mostrarLinksUteis: boolean; 
  onToggleVisibility: (value: boolean) => void;
}) => {
  const [editingLink, setEditingLink] = useState<LinkUtilData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Hooks para gerenciar links úteis
  const { data: links = [], isLoading } = useLinksUteis();
  const createLinkMutation = useCreateLinkUtil();
  const updateLinkMutation = useUpdateLinkUtil();
  const deleteLinkMutation = useDeleteLinkUtil();

  // Form para novo/editar link
  const linkForm = useForm<LinkUtilData>({
    defaultValues: {
      titulo: '',
      url: '',
      descricao: '',
      ativo: true,
      ordem: 0
    }
  });

  const handleSaveLink = async (data: LinkUtilData) => {
    try {
      if (editingLink?.id) {
        // Atualizar link existente
        await updateLinkMutation.mutateAsync({
          id: editingLink.id,
          data: {
            titulo: data.titulo,
            url: data.url,
            descricao: data.descricao,
            ativo: data.ativo,
            ordem: data.ordem
          }
        });
      } else {
        // Criar novo link
        await createLinkMutation.mutateAsync({
          titulo: data.titulo,
          url: data.url,
          descricao: data.descricao,
          ativo: data.ativo,
          ordem: data.ordem || (links.length + 1)
        });
      }
      
      setIsDialogOpen(false);
      setEditingLink(null);
      linkForm.reset();
    } catch (error) {
      console.error('Erro ao salvar link:', error);
    }
  };

  const handleEditLink = (link: any) => {
    setEditingLink(link);
    linkForm.reset({
      titulo: link.titulo,
      url: link.url,
      descricao: link.descricao,
      ativo: link.ativo,
      ordem: link.ordem
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLink = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este link?')) {
      await deleteLinkMutation.mutateAsync(id);
    }
  };

  const handleNewLink = () => {
    setEditingLink(null);
    linkForm.reset({
      titulo: '',
      url: '',
      descricao: '',
      ativo: true,
      ordem: links.length + 1
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Links Úteis Dinâmicos
        </CardTitle>
        <CardDescription>
          Gerencie links úteis que aparecerão para as locadoras. Adicione, edite ou remova links livremente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle de visibilidade */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Mostrar Seção de Links Úteis</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={mostrarLinksUteis}
              onCheckedChange={onToggleVisibility}
            />
            <span className="text-sm">
              {mostrarLinksUteis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </span>
          </div>
        </div>

        {/* Botão para adicionar novo link */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {links.length} link(s) configurado(s)
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewLink} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? 'Editar Link' : 'Novo Link Útil'}
                </DialogTitle>
              </DialogHeader>
              <Form {...linkForm}>
                <form onSubmit={linkForm.handleSubmit(handleSaveLink)} className="space-y-4">
                  <FormField
                    control={linkForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Portal DETRAN SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={linkForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={linkForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Breve descrição do link" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={linkForm.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Link ativo</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createLinkMutation.isPending || updateLinkMutation.isPending}>
                      {(createLinkMutation.isPending || updateLinkMutation.isPending) && 
                        <Save className="w-4 h-4 mr-2 animate-spin" />
                      }
                      {editingLink ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingLink(null);
                        linkForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de links */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Save className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando links...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {links.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link configurado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Link" para começar.</p>
              </div>
            ) : (
              links.map((link: any) => (
                <div key={link.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{link.titulo}</h4>
                        {!link.ativo && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{link.descricao}</p>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLink(link)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteLinkMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};