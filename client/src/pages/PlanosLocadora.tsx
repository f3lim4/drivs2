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
    vip: { nome: "VIP", preco: 0.00, valor: 0.00, icone: Crown, cor: "bg-gradient-to-r from-purple-600 to-pink-600", descricao: "Acesso ilimitado premium - Sem mensalidade", popular: false, vip: true },
    infinity: { nome: "Infinity", preco: 0.00, valor: 0.00, icone: Star, cor: "bg-gradient-to-r from-purple-600 to-pink-600", descricao: "Veículos ilimitados - Preço a consultar", popular: false, consultar: true }
  };

  // Buscar dados da locadora se usuário é uma locadora
  const { data: locadora, isLoading: isLoadingLocadora } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId],
    enabled: !!profile?.locadoraId && isLocadora,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const { data: planoDetalhes, isLoading } = useQuery({
    queryKey: ['/api/planos', profile?.locadoraId],
    queryFn: () => fetch(`/api/planos${profile?.locadoraId ? `?locadoraId=${profile.locadoraId}` : ''}`).then(res => res.json()),
    enabled: !!profile?.locadoraId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

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
          duration: 5000,
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

  if (isLoading || isLoadingLocadora) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  // Sempre mostrar a página de planos, mesmo sem locadora específica
  // O sistema deve permitir visualizar os planos disponíveis

  // Determinar o plano atual baseado nos dados da locadora
  // Fix: locadora vem como array, pegamos o primeiro item
  const locadoraData = Array.isArray(locadora) ? locadora[0] : locadora;
  const planoAtual = locadoraData?.plano || 'pro';
  
  // Verificar se o plano está expirado
  const isPlanExpired = subscriptionStatus?.isExpired && !subscriptionStatus?.canAccess;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6">

      {/* Status do teste gratuito - ocultar para locadoras VIP */}
      {planoDetalhes?.testeGratuito && planoAtual !== 'vip' && (
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
              <Badge variant="default" className="px-3 py-1">
                {planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.nome || 'Pro'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${isPlanExpired ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200' : 'bg-muted'}`}>
            {/* Layout Desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className={`p-3 rounded-full ${planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.cor || 'bg-blue-500'}`}>
                {(() => {
                  const planoData = planosEstaticos[planoAtual as keyof typeof planosEstaticos];
                  if (!planoData) return <Rocket className="h-6 w-6 text-white" />;
                  const IconComponent = planoData.icone;
                  return <IconComponent className="h-6 w-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Plano {planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.nome || 'Pro'}
                  {planoAtual === 'vip' && <span className="text-purple-600 ml-2">(Premium)</span>}
                  {isPlanExpired && planoAtual !== 'vip' && <span className="text-orange-600 ml-2">(Expirado)</span>}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {planoAtual === 'vip'
                    ? 'Plano VIP com acesso total e ilimitado a todos os recursos do sistema'
                    : isPlanExpired 
                      ? 'Renove seu plano para continuar aproveitando todos os recursos' 
                      : (planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.descricao || 'Para locadoras em crescimento')
                  }
                </p>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-2xl font-bold">
                    {planoAtual === 'vip'
                      ? 'VIP'
                      : `R$ ${(planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.preco || 99).toFixed(2)}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {planoAtual === 'vip' ? 'Plano VIP' : 'por mês'}
                  </p>
                </div>
                {isPlanExpired && planoAtual !== 'vip' && (
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
                <div className={`p-2.5 rounded-full ${planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.cor || 'bg-blue-500'}`}>
                  {(() => {
                    const planoData = planosEstaticos[planoAtual as keyof typeof planosEstaticos];
                    if (!planoData) return <Rocket className="h-5 w-5 text-white" />;
                    const IconComponent = planoData.icone;
                    return <IconComponent className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    Plano {planosEstaticos[planoAtual as keyof typeof planosEstaticos]?.nome || 'Pro'}
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

      {/* Planos Disponíveis */}
      <div className="space-y-4" data-section="planos-disponiveis">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Planos Disponíveis</h2>
          <p className="text-muted-foreground">
            Escolha o plano ideal para sua locadora
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {Object.entries(planosEstaticos)
            .filter(([key]) => key !== 'vip') // Remover VIP da lista de planos disponíveis
            .map(([key, plano]) => {
            const Icone = plano.icone;
            return (
              <Card key={key} className={`h-full ${plano.popular ? 'ring-2 ring-cyan-500 relative' : ''}`}>
                {plano.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white z-10">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center ${plano.cor}`}>
                    <Icone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{plano.nome}</CardTitle>
                  <CardDescription className="text-base sm:text-lg font-semibold">
                    {plano.consultar ? "Preço a consultar" : `R$ ${plano.preco.toFixed(2)}/mês`}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground leading-tight">{plano.descricao}</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Features do plano */}
                  <div className="space-y-2">
                    {planosFeatures.slice(0, 6).map((feature, index) => {
                      const valor = feature[key as keyof PlanoFeature];
                      return (
                        <div key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                          {typeof valor === 'boolean' ? (
                            valor ? (
                              <>
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="leading-tight">{feature.nome}</span>
                              </>
                            ) : (
                              <>
                                <span className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5">—</span>
                                <span className="text-muted-foreground leading-tight">{feature.nome}</span>
                              </>
                            )
                          ) : (
                            <>
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <div className="leading-tight">
                                <span className="font-medium">{feature.nome}:</span>
                                <br />
                                <span className="text-muted-foreground">{valor}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Botão de ação */}
                  <div className="pt-3">
                    {planoAtual === key ? (
                      <Button disabled className="w-full text-sm sm:text-base">
                        Plano Atual
                      </Button>
                    ) : plano.consultar ? (
                      <Button
                        onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                        className="w-full text-sm sm:text-base"
                        variant="outline"
                      >
                        Solicitar Orçamento
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSolicitarMudanca(key)}
                        disabled={solicitando}
                        className="w-full text-sm sm:text-base"
                        variant={plano.popular ? "default" : "outline"}
                      >
                        {solicitando ? "Processando..." : "Mudar Plano"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Suporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5" />
            Precisa de Ajuda?
          </CardTitle>
          <CardDescription>
            Nossa equipe está pronta para ajudar com a escolha do melhor plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4">
              <h4 className="font-semibold text-base">Todos os planos incluem:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Sistema completo de gerenciamento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Controle financeiro com lucros/perdas reais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Contratos automáticos profissionais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Suporte por email</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h4 className="font-semibold text-base">Diferenciais dos Planos Premium:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>Prime: Suporte por telefone + 100 veículos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <span>Infinity: Veículos ilimitados + Suporte VIP 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <span>Infinity: Treinamento personalizado exclusivo</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              Dúvidas sobre qual plano escolher? Entre em contato conosco pelo WhatsApp ou email
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Checkout do Stripe */}
      {checkoutData && (
        <StripeCheckout
          clientSecret={checkoutData.clientSecret}
          subscriptionId={checkoutData.subscriptionId}
          planoNome={checkoutData.planoNome}
          valor={checkoutData.valor}
          onSuccess={() => {
            setCheckoutData(null);
            toast({
              title: "Pagamento realizado!",
              description: `Plano ${checkoutData.planoNome} ativado com sucesso.`,
            });
            // Invalidar cache para atualizar dados
            queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
            queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
          }}
          onCancel={() => {
            setCheckoutData(null);
          }}
        />
      )}
    </div>
  );
}

// Componente de Carrossel para Mobile/Tablet
interface PlanoInfo {
  nome: string;
  preco: number;
  valor: number;
  icone: any;
  cor: string;
  descricao: string;
  popular: boolean;
  consultar?: boolean;
}

function PlanoCarousel({ 
  planosInfo, 
  planosFeatures, 
  planoAtual, 
  handleSolicitarMudanca, 
  solicitando 
}: {
  planosInfo: Record<string, PlanoInfo>;
  planosFeatures: PlanoFeature[];
  planoAtual: string | undefined;
  handleSolicitarMudanca: (plano: string) => void;
  solicitando: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="lg:hidden">
      {/* Controles do Carrossel */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Planos Disponíveis</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollPrev}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {Object.entries(planosInfo).map(([key, plano]) => {
            const Icone = plano.icone;
            return (
              <div key={key} className="flex-[0_0_85%] sm:flex-[0_0_60%] md:flex-[0_0_45%] mr-4">
                <Card className={`h-full ${plano.popular ? 'ring-2 ring-cyan-500' : ''}`}>
                  <CardHeader className="text-center relative">
                    {plano.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white">
                        Mais Popular
                      </Badge>
                    )}
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${plano.cor}`}>
                      <Icone className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plano.nome}</CardTitle>
                    <CardDescription className="text-sm">
                      {plano.consultar ? "Preço a consultar" : `R$ ${plano.preco.toFixed(2)}/mês`}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">{plano.descricao}</p>
                  </CardHeader>
                  <CardContent>
                    {/* Features do Plano */}
                    <div className="space-y-2 mb-6">
                      {planosFeatures.slice(0, 6).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {typeof feature[key as keyof PlanoFeature] === 'boolean' ? (
                            feature[key as keyof PlanoFeature] ? (
                              <>
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{feature.nome}</span>
                              </>
                            ) : (
                              <>
                                <span className="h-4 w-4 text-muted-foreground flex-shrink-0">—</span>
                                <span className="text-muted-foreground">{feature.nome}</span>
                              </>
                            )
                          ) : (
                            <>
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature.nome}: <strong>{feature[key as keyof PlanoFeature]}</strong></span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botão de Ação */}
                    <div className="mt-auto">
                      {planoAtual === key ? (
                        <Button disabled className="w-full">
                          Plano Atual
                        </Button>
                      ) : plano.consultar ? (
                        <Button
                          onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                          className="w-full"
                          variant="outline"
                        >
                          Solicitar Orçamento
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSolicitarMudanca(key)}
                          disabled={solicitando}
                          className="w-full"
                          variant={plano.popular ? "default" : "outline"}
                        >
                          {solicitando ? "Processando..." : "Mudar Plano"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mt-4">
        {Object.keys(planosInfo).map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-muted-foreground/30"
          />
        ))}
      </div>
    </div>
  );
}