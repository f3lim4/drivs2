import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings, Video, Link, Eye, EyeOff, ExternalLink, Play, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

            {/* Tab de Links Úteis */}
            <TabsContent value="links-uteis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Links Úteis Externos
                  </CardTitle>
                  <CardDescription>
                    Configure links externos úteis que aparecerão para as locadoras (DETRAN, Receita Federal, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Mostrar Seção de Links Úteis</h3>
                    <FormField
                      control={form.control}
                      name="mostrarLinksUteis"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DETRAN */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">DETRAN</h4>
                      <FormField
                        control={form.control}
                        name="linkDetranUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkDetranTitulo"
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
                      <FormField
                        control={form.control}
                        name="linkDetranDescricao"
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

                    {/* Receita Federal */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Receita Federal</h4>
                      <FormField
                        control={form.control}
                        name="linkReceitaUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkReceitaTitulo"
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
                      <FormField
                        control={form.control}
                        name="linkReceitaDescricao"
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

                    {/* SPC/Serasa */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">SPC/Serasa</h4>
                      <FormField
                        control={form.control}
                        name="linkSpcUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkSpcTitulo"
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
                      <FormField
                        control={form.control}
                        name="linkSpcDescricao"
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

                    {/* ViaCEP */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Busca CEP</h4>
                      <FormField
                        control={form.control}
                        name="linkViaCepUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkViaCepTitulo"
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
                      <FormField
                        control={form.control}
                        name="linkViaCepDescricao"
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
                  </div>
                </CardContent>
              </Card>
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