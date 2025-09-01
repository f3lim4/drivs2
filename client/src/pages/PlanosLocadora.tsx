/**
 * Página de Planos da Locadora
 * Permite visualizar o plano atual e solicitar mudança de plano
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import StripeCheckout from "@/components/stripe/StripeCheckout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, Crown, Star, Zap, Car, TrendingUp, HeadphonesIcon, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';

interface PlanoFeature {
  nome: string;
  start: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
  prime: boolean | string;
  infinity: boolean | string;
}

const planosFeatures: PlanoFeature[] = [
  {
    nome: "Veículos na frota",
    start: "Até 5",
    pro: "Até 20", 
    elite: "Até 50",
    prime: "Até 100",
    infinity: "Ilimitados"
  },
  {
    nome: "Gestão completa de motoristas",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Contratos automáticos profissionais",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Controle de pagamentos",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Controle de infrações e multas",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Controle financeiro com lucros/perdas reais",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Controle de manutenções",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Upload de documentos",
    start: true,
    pro: true,
    elite: true,
    prime: true,
    infinity: true
  },
  {
    nome: "Suporte técnico",
    start: "Email",
    pro: "Email",
    elite: "Email",
    prime: "Email + Telefone",
    infinity: "24/7 + Telefone"
  },
  {
    nome: "Treinamento",
    start: "Documentação",
    pro: "Documentação",
    elite: "Documentação",
    prime: "Personalizado",
    infinity: "Personalizado VIP"
  }
];



// Mapeamento de ícones para compatibilidade entre API e estático
const iconeMap = {
  Car: Car,
  Rocket: Rocket,
  Zap: Zap,
  Crown: Crown,
  Star: Star,
  TrendingUp: TrendingUp,
  Infinity: Star // Fallback para Infinity
};

export default function PlanosLocadora() {
  const { profile, isLocadora } = useAuth();
  const { toast } = useToast();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const queryClient = useQueryClient();
  const [solicitando, setSolicitando] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    clientSecret: string;
    subscriptionId: string;
    planoNome: string;
    valor: number;
  } | null>(null);

  // Cache dos planos estáticos (carregamento instantâneo)
  const planosEstaticos = {
    start: { nome: "Start", preco: 50.00, valor: 50.00, icone: Car, cor: "bg-blue-500", descricao: "Para locadoras iniciantes com até 5 veículos", popular: false },
    pro: { nome: "Pro", preco: 99.00, valor: 99.00, icone: Rocket, cor: "bg-cyan-500", descricao: "Para locadoras em crescimento com até 20 veículos", popular: true },
    elite: { nome: "Elite", preco: 250.00, valor: 250.00, icone: Zap, cor: "bg-green-500", descricao: "Para frotas médias com até 50 veículos", popular: false },
    prime: { nome: "Prime", preco: 500.00, valor: 500.00, icone: Crown, cor: "bg-purple-500", descricao: "Para grandes frotas com até 100 veículos", popular: false },
    infinity: { nome: "Infinity", preco: 0.00, valor: 0.00, icone: Star, cor: "bg-gradient-to-r from-purple-600 to-pink-600", descricao: "Veículos ilimitados - Preço a consultar", popular: false, consultar: true }
  };

  // Buscar dados da locadora se usuário é uma locadora
  const { data: locadora, isLoading: isLoadingLocadora, refetch: refetchLocadora } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId, Date.now()], // Força cache único
    enabled: !!profile?.locadoraId,
    staleTime: 0, // Sempre dados frescos para corrigir bug do plano
    gcTime: 0, // Não manter cache
    refetchOnMount: 'always', // Sempre refetch quando montar
    refetchOnWindowFocus: true, // Refetch quando focar janela
  });

  const { data: planoDetalhes, isLoading, error: planosError } = useQuery({
    queryKey: ['/api/planos', profile?.locadoraId],
    queryFn: () => fetch(`/api/planos${profile?.locadoraId ? `?locadoraId=${profile.locadoraId}` : ''}`).then(res => res.json()),
    enabled: !!profile?.locadoraId,
  });


  // Dados carregados com sucesso - continuar com renderização normal

  const handleSolicitarMudanca = async (novoPlano: string) => {
    try {
      setSolicitando(true);
      
      if (!profile?.locadoraId) {
        toast({
          title: "Erro",
          description: "Locadora não identificada.",
          variant: "destructive",
        });
        return;
      }

      // Criar assinatura no Stripe
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locadoraId: profile.locadoraId,
          plano: novoPlano,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar assinatura');
      }

      const data = await response.json();
      
      toast({
        title: "Processando mudança...",
        description: `Aguarde enquanto processamos sua mudança para o plano ${planosEstaticos[novoPlano as keyof typeof planosEstaticos].nome}.`,
      });

      // Processar resposta do Stripe
      if (data.simulation) {
        // Simulação - apenas mostrar sucesso
        toast({
          title: "✅ Plano atualizado com sucesso!",
          description: `Você mudou para o plano ${planosEstaticos[novoPlano as keyof typeof planosEstaticos].nome}. Simulação ativada.`,
        });
        
        // Invalidar cache para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
        queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
      } else if (data.clientSecret) {
        // Pagamento real - abrir checkout do Stripe
        setCheckoutData({
          clientSecret: data.clientSecret,
          subscriptionId: data.subscriptionId,
          planoNome: planosEstaticos[novoPlano as keyof typeof planosEstaticos].nome,
          valor: planosEstaticos[novoPlano as keyof typeof planosEstaticos].valor
        });
      }
      
    } catch (error) {
      console.error("Erro ao processar mudança de plano:", error);
      toast({
        title: "Erro ao processar mudança",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSolicitando(false);
    }
  };

  // Removido loading restritivo para funcionar em produção
  // Página deve carregar mesmo com dados pendentes

  // Sempre mostrar a página de planos, mesmo sem locadora específica
  // O sistema deve permitir visualizar os planos disponíveis

  // Determinar o plano atual baseado nos dados da locadora
  // Fix: locadora vem como array, pegamos o primeiro item
  // Valores padrão para garantir funcionamento em produção
  console.log('🔍 DEBUG LOCADORA RAW:', locadora);
  const locadoraData = Array.isArray(locadora) ? locadora[0] : locadora;
  console.log('🔍 DEBUG LOCADORA PROCESSED:', locadoraData);
  
  
  // Validação extra para garantir que VIP seja reconhecido
  const isVipPlan = locadoraData?.vitalia === true;
  
  // Se for VIP ou Infinity, mostrar plano especial; caso contrário priorizar dados da locadora
  // FORÇAR uso dos dados frescos da locadora
  console.log('🔍 DEBUG ANTES DE DEFINIR PLANO:', { 
    isVipPlan, 
    'locadoraData?.plano': locadoraData?.plano,
    'locadoraData?.vitalia': locadoraData?.vitalia 
  });
  const planoAtual = isVipPlan ? 'vip' : (locadoraData?.plano || 'pro');
  console.log('🔍 DEBUG PLANO DEFINIDO:', planoAtual);
  
  // Debug temporário para produção - LOGS DETALHADOS
  console.log('🔧 PLANO DEBUG PRODUÇÃO DETALHADO:', { 
    locadoraDataCompleta: locadoraData, 
    planoDoBank: locadoraData?.plano,
    planoAtual, 
    isVipPlan,
    locadoraStatus: locadoraData?.status,
    tipoObjeto: typeof locadoraData?.plano,
    timestamp: new Date().toLocaleTimeString()
  });
  
  // Alert temporário para forçar visibilidade em produção
  if (locadoraData && locadoraData.plano === 'elite' && planoAtual !== 'elite') {
    console.error('🚨 BUG DETECTADO: Plano no banco é elite mas planoAtual é:', planoAtual);
  }
  
  
  // VIP e Infinity sempre têm acesso - não podem estar expirados
  const isPlanExpired = (isVipPlan || planoAtual === 'infinity') ? false : ((subscriptionStatus?.isExpired && !subscriptionStatus?.canAccess) || false);

  // Dados fallback para garantir renderização em produção
  const planosSegurosProdução = {
    start: { 
      id: "start", nome: "Start", preco: 50, valor: 50, 
      descricao: "Para locadoras iniciantes", 
      icone: "Car", cor: "bg-blue-500", 
      recursos: ["Até 5 veículos na frota", "Gestão completa de motoristas", "Contratos automáticos", "Controle de pagamentos"],
      limiteVeiculos: 5
    },
    pro: { 
      id: "pro", nome: "Pro", preco: 99, valor: 99, 
      descricao: "Para locadoras em crescimento", 
      icone: "Rocket", cor: "bg-cyan-500", popular: true,
      recursos: ["Até 20 veículos na frota", "Gestão completa de motoristas", "Contratos automáticos", "Controle de pagamentos"],
      limiteVeiculos: 20
    },
    elite: { 
      id: "elite", nome: "Elite", preco: 250, valor: 250, 
      descricao: "Para frotas médias", 
      icone: "Zap", cor: "bg-green-500",
      recursos: ["Até 50 veículos na frota", "Gestão completa de motoristas", "Contratos automáticos", "Controle de pagamentos"],
      limiteVeiculos: 50
    },
    prime: {
      id: "prime", nome: "Prime", preco: 500, valor: 500,
      descricao: "Para grandes frotas",
      icone: "Crown", cor: "bg-purple-500",
      recursos: ["Até 100 veículos na frota", "Gestão completa de motoristas", "Contratos automáticos", "Controle de pagamentos"],
      limiteVeiculos: 100
    },
    infinity: {
      id: "infinity", nome: "Infinity", consultar: true,
      descricao: "Solução personalizada para mega frotas", 
      icone: "Star", cor: "bg-gradient-to-r from-purple-500 to-pink-500",
      recursos: ["Veículos ilimitados", "Gestão completa de motoristas", "Contratos automáticos", "Controle de pagamentos"]
    }
  };


  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6">

      {/* Status do teste gratuito - ocultar para locadoras VIP, Infinity e planos ativos */}
      {planoDetalhes?.testeGratuito && !isVipPlan && planoAtual !== 'infinity' && !subscriptionStatus?.isActive && (
        <div className={`p-4 rounded-lg ${
          planoDetalhes.testeGratuito.ativo 
            ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              planoDetalhes.testeGratuito.ativo ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                planoDetalhes.testeGratuito.ativo ? 'text-green-800' : 'text-red-800'
              }`}>
                {planoDetalhes.testeGratuito.ativo ? 
                  `Teste Gratuito Ativo - ${planoDetalhes.testeGratuito.diasRestantes} dias restantes` : 
                  'Teste Gratuito Expirado'
                }
              </h3>
              <p className={`text-sm ${
                planoDetalhes.testeGratuito.ativo ? 'text-green-700' : 'text-red-700'
              }`}>
                {planoDetalhes.testeGratuito.ativo ? 
                  `Você está aproveitando seu teste gratuito do Plano Pro (20 veículos). Vence em ${new Date(planoDetalhes.testeGratuito.dataVencimento).toLocaleDateString('pt-BR')}.` :
                  `Seu teste gratuito expirou em ${new Date(planoDetalhes.testeGratuito.dataVencimento).toLocaleDateString('pt-BR')}. Escolha um plano para continuar.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Plano Atual
              </CardTitle>
              <CardDescription>
                Informações sobre seu plano ativo
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {planoAtual === 'vip' && (
                <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
              {planoAtual === 'infinity' && (
                <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  <Star className="h-3 w-3 mr-1" />
                  INFINITY
                </Badge>
              )}
              <Badge variant="default" className="px-3 py-1">
                {planoAtual === 'vip' ? 'VIP' : (planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução]?.nome || 'Pro')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${isPlanExpired ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200' : 'bg-muted'}`}>
            {/* Layout Desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className={`p-3 rounded-full ${planoAtual === 'vip' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : planoAtual === 'infinity' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : (planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução]?.cor || 'bg-blue-500')}`}>
                {(() => {
                  if (planoAtual === 'vip') return <Crown className="h-6 w-6 text-white" />;
                  if (planoAtual === 'infinity') return <Star className="h-6 w-6 text-white" />;
                  const planoData = planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução];
                  if (!planoData) return <Rocket className="h-6 w-6 text-white" />;
                  // Os ícones estão como string, precisamos mapear para componentes
                  const iconMap = { Car, Rocket, Zap, Crown, Star };
                  const IconComponent = iconMap[planoData.icone as keyof typeof iconMap] || Rocket;
                  return <IconComponent className="h-6 w-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Plano {planoAtual === 'vip' ? 'VIP' : planoAtual === 'infinity' ? 'Infinity' : (planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução]?.nome || 'Pro')}
                  {planoAtual === 'vip' && <span className="text-purple-600 ml-2">(Premium)</span>}
                  {planoAtual === 'infinity' && <span className="text-purple-600 ml-2">(Ilimitado)</span>}
                  {isPlanExpired && planoAtual !== 'vip' && planoAtual !== 'infinity' && <span className="text-orange-600 ml-2">(Expirado)</span>}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {planoAtual === 'vip'
                    ? 'Plano VIP com acesso total e ilimitado a todos os recursos do sistema'
                    : planoAtual === 'infinity'
                      ? 'Plano Infinity com veículos ilimitados e acesso total ao sistema'
                      : isPlanExpired 
                        ? 'Renove seu plano para continuar aproveitando todos os recursos' 
                        : (planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução]?.descricao || 'Para locadoras em crescimento')
                  }
                </p>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-2xl font-bold">
                    {isVipPlan
                      ? 'VIP'
                      : planoAtual === 'infinity'
                        ? 'INFINITY'
                        : `R$ ${(planosSegurosProdução[planoAtual as keyof typeof planosSegurosProdução]?.preco || 99).toFixed(2)}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isVipPlan ? 'Plano VIP' : planoAtual === 'infinity' ? 'Plano Infinity' : 'por mês'}
                  </p>
                </div>
                {isPlanExpired && !isVipPlan && (
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={solicitando}
                    onClick={() => handleSolicitarMudanca(planoAtual)}
                  >
                    {solicitando ? "Processando..." : "Renovar Plano"}
                  </Button>
                )}
              </div>
            </div>

            {/* Layout Mobile */}
            <div className="block sm:hidden space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full ${planoAtual === 'vip' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : planoAtual === 'infinity' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : (planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.cor || 'bg-blue-500')}`}>
                  {(() => {
                    if (planoAtual === 'vip') return <Crown className="h-5 w-5 text-white" />;
                    if (planoAtual === 'infinity') return <Star className="h-5 w-5 text-white" />;
                    const planoData = planosEstaticos[planoAtual as keyof typeof planosEstaticos];
                    if (!planoData) return <Rocket className="h-5 w-5 text-white" />;
                    const IconComponent = planoData.icone;
                    return <IconComponent className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    Plano {planoAtual === 'vip' ? 'VIP' : (planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.nome || 'Pro')}
                    {planoAtual === 'vip' && <span className="text-purple-600 ml-1 text-sm">(Premium)</span>}
                    {isPlanExpired && planoAtual !== 'vip' && <span className="text-orange-600 ml-1 text-sm">(Expirado)</span>}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-bold">
                      {planoAtual === 'vip'
                        ? 'Gratuito'
                        : `R$ ${(planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.preco || 99).toFixed(2)}`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {planoAtual === 'vip' ? 'Plano VIP' : 'por mês'}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {planoAtual === 'vip'
                  ? 'Plano VIP com acesso total e ilimitado a todos os recursos do sistema'
                  : isPlanExpired 
                    ? 'Renove seu plano para continuar aproveitando todos os recursos' 
                    : (planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.descricao || 'Para locadoras em crescimento')
                }
              </p>
              
              {isPlanExpired && planoAtual !== 'vip' && (
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={solicitando}
                  onClick={() => handleSolicitarMudanca(planoAtual)}
                >
                  {solicitando ? "Processando..." : "Renovar Plano"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos Disponíveis - ocultar para locadoras VIP */}
      {!isVipPlan && (
        <div className="space-y-4" data-section="planos-disponiveis">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Planos Disponíveis</h2>
            <p className="text-muted-foreground">
              Escolha o plano ideal para sua locadora
            </p>
            
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Plano Start */}
          {planoAtual !== 'start' && (
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Start</CardTitle>
              <div className="text-3xl font-bold text-blue-600">R$ 50,00</div>
              <CardDescription className="text-base">por mês</CardDescription>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium mt-1 space-y-1">
                <div>💰 Anual: R$ 500 (10 meses + 2 grátis)</div>
                <div className="text-blue-700 font-medium">+ Todas as atualizações do sistema</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Para locadoras iniciantes</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Até 5 veículos na frota</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Gestão completa de motoristas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Contratos automáticos profissionais</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Controle de pagamentos</span>
                </div>
              </div>
              
              <div className="pt-4">
                {planoAtual === 'start' ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSolicitarMudanca('start')}
                    disabled={solicitando}
                    className="w-full"
                    variant="outline"
                  >
                    {solicitando ? "Processando..." : "Escolher Start"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Plano Pro */}
          {planoAtual !== 'pro' && (
          <Card className="relative border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-cyan-500 text-white px-3 py-1">
                Mais Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-3xl font-bold text-cyan-600">R$ 99,00</div>
              <CardDescription className="text-base">por mês</CardDescription>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium mt-1 space-y-1">
                <div>💰 Anual: R$ 990 (10 meses + 2 grátis)</div>
                <div className="text-blue-700 font-medium">+ Todas as atualizações do sistema</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Para locadoras em crescimento com até 20 veículos</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Até 20 veículos na frota</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Gestão completa de motoristas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Contratos automáticos profissionais</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Controle de pagamentos</span>
                </div>
              </div>
              
              <div className="pt-4">
                {planoAtual === 'pro' ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSolicitarMudanca('pro')}
                    disabled={solicitando}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {solicitando ? "Processando..." : "Escolher Pro"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Plano Elite */}
          {planoAtual !== 'elite' && (
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Elite</CardTitle>
              <div className="text-3xl font-bold text-green-600">R$ 250,00</div>
              <CardDescription className="text-base">por mês</CardDescription>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium mt-1 space-y-1">
                <div>💰 Anual: R$ 2.500 (10 meses + 2 grátis)</div>
                <div className="text-blue-700 font-medium">+ Todas as atualizações do sistema</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Para frotas médias</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Até 50 veículos na frota</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Gestão completa de motoristas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Contratos automáticos profissionais</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Controle de pagamentos</span>
                </div>
              </div>
              
              <div className="pt-4">
                {planoAtual === 'elite' ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSolicitarMudanca('elite')}
                    disabled={solicitando}
                    className="w-full"
                    variant="outline"
                  >
                    {solicitando ? "Processando..." : "Escolher Elite"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Plano Prime */}
          {planoAtual !== 'prime' && (
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Prime</CardTitle>
              <div className="text-3xl font-bold text-purple-600">R$ 500,00</div>
              <CardDescription className="text-base">por mês</CardDescription>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium mt-1 space-y-1">
                <div>💰 Anual: R$ 5.000 (10 meses + 2 grátis)</div>
                <div className="text-blue-700 font-medium">+ Todas as atualizações do sistema</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Para grandes frotas</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Até 100 veículos na frota</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Gestão completa de motoristas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Contratos automáticos profissionais</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Suporte telefônico</span>
                </div>
              </div>
              
              <div className="pt-4">
                {planoAtual === 'prime' ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSolicitarMudanca('prime')}
                    disabled={solicitando}
                    className="w-full"
                    variant="outline"
                  >
                    {solicitando ? "Processando..." : "Escolher Prime"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Plano Infinity */}
          {planoAtual !== 'infinity' && (
          <Card className="relative border-2 border-gradient-to-r from-pink-300 to-purple-300">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Infinity</CardTitle>
              <div className="text-2xl font-bold text-muted-foreground">Consultar</div>
              <CardDescription className="text-base">preço personalizado</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">Para empresas premium</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Veículos ilimitados</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Gestão completa premium</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Suporte VIP 24/7</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Treinamento exclusivo</span>
                </div>
              </div>
              
              <div className="pt-4">
                {planoAtual === 'infinity' ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    Solicitar Orçamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
        </div>
      )}

      {/* Modal de Checkout do Stripe */}
      {checkoutData && (
        <StripeCheckout
          clientSecret={checkoutData.clientSecret}
          subscriptionId={checkoutData.subscriptionId}
          planoNome={checkoutData.planoNome}
          valor={checkoutData.valor}
          onCancel={() => {
            setCheckoutData(null);
            toast({
              title: "Pagamento cancelado",
              description: "Você pode tentar novamente quando desejar.",
            });
          }}
          onSuccess={() => {
            setCheckoutData(null);
            // Invalidar cache para recarregar dados
            queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
            queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
          }}
        />
      )}
    </div>
  );
}