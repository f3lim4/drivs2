import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSeoConfig, useUpdateSeoConfig } from "@/hooks/useSeo";
import { useAnalytics } from "@/hooks/useAnalytics";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { insertSeoConfigSchema } from "@shared/schema";
import type { InsertSeoConfig } from "@shared/schema";
import { Settings, Globe, TrendingUp, Search, BarChart3, Eye, Building2, Car, Users, FileText } from "lucide-react";

export default function Seo() {
  const { toast } = useToast();
  const { data: seoConfig, isLoading } = useSeoConfig();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const updateSeoMutation = useUpdateSeoConfig();

  const form = useForm<InsertSeoConfig>({
    resolver: zodResolver(insertSeoConfigSchema),
    defaultValues: seoConfig || {
      titulo: "DRIVS - Sistema de Locação de Veículos",
      descricao: "Sistema completo para gerenciamento de locadoras de veículos com controle financeiro, contratos e relatórios avançados.",
      palavrasChave: "locação de veículos, aluguel de carros, gestão de frota, sistema de locadora, controle financeiro",
      autor: "DRIVS Team",
      urlCanonica: "https://drivs.me",
      imagemSocial: "/assets/drivs-social.png",
      gaTrackingId: "",
      gaEnabled: false,
      themeColor: "#2563eb",
      manifestUrl: "/manifest.json",
    },
  });

  // Atualizar valores do formulário quando dados carregarem
  useState(() => {
    if (seoConfig) {
      form.reset(seoConfig);
    }
  });

  const handleSubmit = async (data: InsertSeoConfig) => {
    try {
      await updateSeoMutation.mutateAsync(data);
      toast({
        title: "Configurações salvas",
        description: "As configurações de SEO foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações de SEO.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações SEO</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie as configurações de SEO e analytics do sistema</p>
          </div>
        </div>
      </div>



      {/* Foco em Pequenas e Médias Locadoras */}
      <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center space-x-2">
            <TrendingUp className="h-7 w-7" />
            <span>Especialista em Pequenas e Médias Locadoras</span>
          </CardTitle>
          <CardDescription className="text-emerald-100 text-lg">
            O sistema que transforma locadoras familiares em empresas profissionais e lucrativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">❌ Problemas que Resolvemos:</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center space-x-2"><span>•</span><span>Inadimplência por falta de controle</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Planilhas bagunçadas e desatualizadas</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>CNH vencida descoberta só na blitz</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Contratos feitos à mão que não valem nada</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Sem saber quanto está ganhando ou perdendo</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Clientes atrasados e você sem controle</span></p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">✅ Resultados Garantidos:</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center space-x-2"><span>•</span><span>40-60% de aumento na receita em 90 dias</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Zero inadimplência com alertas automáticos</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Contratos profissionais que protegem você</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Relatórios que mostram exato lucro/prejuízo</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>90% menos tempo perdido com papelada</span></p>
                <p className="flex items-center space-x-2"><span>•</span><span>Gestão profissional mesmo com poucos carros</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action Urgente para Pequenas Locadoras */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900 dark:to-orange-800 border-red-200 dark:border-red-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-red-800 dark:text-red-200 mb-2">
            🔥 PARE DE PERDER DINHEIRO AGORA!
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400 text-xl font-semibold">
            Cada dia usando planilhas = R$ 200 perdidos em inadimplência e falta de controle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-4">
              💸 Quanto sua locadora perde por mês?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>• Inadimplência: <strong>R$ 2.000 - R$ 5.000</strong></p>
                <p>• CNH vencida descoberta tarde: <strong>R$ 1.500</strong></p>
                <p>• Tempo perdido com planilhas: <strong>R$ 1.200</strong></p>
              </div>
              <div className="space-y-2">
                <p>• Contratos inadequados: <strong>R$ 800 - R$ 2.000</strong></p>
                <p>• Falta de controle financeiro: <strong>R$ 1.000</strong></p>
                <p className="font-bold text-red-600">TOTAL PERDIDO: <strong>R$ 6.500 - R$ 10.700/mês</strong></p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-100 dark:bg-green-900 border-2 border-green-500 p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-3">
              🎯 OFERTA ESPECIAL PARA LOCADORAS PEQUENAS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">30 DIAS</div>
                <div className="text-sm text-green-700">Teste Grátis Total</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">24 HORAS</div>
                <div className="text-sm text-blue-700">Configuração Completa</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">R$ 0</div>
                <div className="text-sm text-purple-700">Taxa de Configuração</div>
              </div>
            </div>
            <p className="text-green-700 dark:text-green-300 mb-4 font-semibold">
              ✅ Migração completa dos seus dados ✅ Treinamento da equipe ✅ Suporte 24/7 ✅ Sem contrato de fidelidade
            </p>
            <div className="text-lg font-bold text-green-800 dark:text-green-200">
              Comece hoje e recupere o investimento em 30 dias ou menos!
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Configurações Básicas de SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Configurações Básicas</span>
            </CardTitle>
            <CardDescription>
              Configure as informações básicas de SEO que aparecem nos motores de busca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="titulo">Título do Site</Label>
                <Input
                  id="titulo"
                  {...form.register("titulo")}
                  placeholder="DRIVS - Sistema de Locação de Veículos"
                />
                <p className="text-sm text-gray-500 mt-1">Título que aparece na aba do navegador e resultados de busca</p>
              </div>

              <div>
                <Label htmlFor="descricao">Meta Descrição</Label>
                <Textarea
                  id="descricao"
                  {...form.register("descricao")}
                  placeholder="Sistema completo para gerenciamento de locadoras de veículos..."
                  className="min-h-[80px]"
                />
                <p className="text-sm text-gray-500 mt-1">Descrição que aparece nos resultados de busca (150-160 caracteres)</p>
              </div>

              <div>
                <Label htmlFor="palavrasChave">Palavras-Chave</Label>
                <Textarea
                  id="palavrasChave"
                  {...form.register("palavrasChave")}
                  placeholder="locação de veículos, aluguel de carros, gestão de frota..."
                  className="min-h-[60px]"
                />
                <p className="text-sm text-gray-500 mt-1">Palavras-chave relevantes separadas por vírgula</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    {...form.register("autor")}
                    placeholder="DRIVS Team"
                  />
                </div>

                <div>
                  <Label htmlFor="urlCanonica">URL Canônica</Label>
                  <Input
                    id="urlCanonica"
                    {...form.register("urlCanonica")}
                    placeholder="https://drivs.me"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Redes Sociais</span>
            </CardTitle>
            <CardDescription>
              Configure como o site aparece quando compartilhado em redes sociais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="imagemSocial">Imagem Social (Open Graph)</Label>
                <Input
                  id="imagemSocial"
                  {...form.register("imagemSocial")}
                  placeholder="/assets/drivs-social.png"
                />
                <p className="text-sm text-gray-500 mt-1">Imagem que aparece ao compartilhar nas redes sociais (1200x630px recomendado)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="themeColor">Cor do Tema</Label>
                  <Input
                    id="themeColor"
                    {...form.register("themeColor")}
                    placeholder="#2563eb"
                    type="color"
                  />
                </div>

                <div>
                  <Label htmlFor="manifestUrl">URL do Manifest</Label>
                  <Input
                    id="manifestUrl"
                    {...form.register("manifestUrl")}
                    placeholder="/manifest.json"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Google Analytics</span>
            </CardTitle>
            <CardDescription>
              Configure o rastreamento de analytics do site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gaEnabled">Habilitar Google Analytics</Label>
                <p className="text-sm text-gray-500">Ativa o rastreamento de visitantes e comportamento</p>
              </div>
              <Switch
                id="gaEnabled"
                checked={form.watch("gaEnabled")}
                onCheckedChange={(checked) => form.setValue("gaEnabled", checked)}
              />
            </div>

            {form.watch("gaEnabled") && (
              <div>
                <Label htmlFor="gaTrackingId">Google Analytics Tracking ID</Label>
                <Input
                  id="gaTrackingId"
                  {...form.register("gaTrackingId")}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-sm text-gray-500 mt-1">ID de rastreamento do Google Analytics 4</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics e Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Analytics do Sistema</span>
            </CardTitle>
            <CardDescription>
              Estatísticas reais de uso do sistema DRIVS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics?.visitantesEsseMes || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Visitantes este mês</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics?.paginasVisualizadas || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Páginas visualizadas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics?.tempoMedio || 0}m
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tempo médio (min)</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics?.taxaRetorno || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Taxa de retorno</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSeoMutation.isPending}
            className="px-6"
          >
            {updateSeoMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Salvando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}