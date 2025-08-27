/**
 * Página de Planos da Locadora
 * Permite visualizar o plano atual e solicitar mudança de plano
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCanPerformActions } from '@/hooks/useCanPerformActions';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, Crown, Star, Zap, Users, Car, FileText, TrendingUp, Shield, HeadphonesIcon, Rocket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PlanoFeature {
  nome: string;
  basico: boolean | string;
  premium: boolean | string;
  enterprise: boolean | string;
}

const planosFeatures: PlanoFeature[] = [
  {
    nome: "Veículos na frota",
    basico: "Até 10",
    premium: "Até 50",
    enterprise: "Ilimitado"
  },
  {
    nome: "Motoristas cadastrados",
    basico: "Até 20",
    premium: "Até 100",
    enterprise: "Ilimitado"
  },
  {
    nome: "Contratos simultâneos",
    basico: "Até 10",
    premium: "Até 50",
    enterprise: "Ilimitado"
  },
  {
    nome: "Relatórios financeiros",
    basico: true,
    premium: true,
    enterprise: true
  },
  {
    nome: "Sistema de notificações",
    basico: true,
    premium: true,
    enterprise: true
  },
  {
    nome: "Controle de manutenções",
    basico: false,
    premium: true,
    enterprise: true
  },
  {
    nome: "Gestão de multas",
    basico: false,
    premium: true,
    enterprise: true
  },
  {
    nome: "Templates de contrato",
    basico: "1 template",
    premium: "5 templates",
    enterprise: "Ilimitado"
  },
  {
    nome: "Suporte técnico",
    basico: "Email",
    premium: "Email + Chat",
    enterprise: "24/7 Prioritário"
  },
  {
    nome: "Backup automático",
    basico: false,
    premium: true,
    enterprise: true
  },
  {
    nome: "API para integração",
    basico: false,
    premium: false,
    enterprise: true
  },
  {
    nome: "Relatórios avançados",
    basico: false,
    premium: false,
    enterprise: true
  }
];

const planosInfo = {
  basico: {
    nome: "Básico",
    preco: 49.00,
    icone: Car,
    cor: "bg-blue-500",
    descricao: "Para locadoras iniciantes com até 5 veículos"
  },
  profissional: {
    nome: "Profissional",
    preco: 99.00,
    icone: Star,
    cor: "bg-cyan-500",
    descricao: "Para locadoras em crescimento com até 20 veículos",
    popular: true
  },
  avancado: {
    nome: "Avançado",
    preco: 200.00,
    icone: Zap,
    cor: "bg-green-500",
    descricao: "Para frotas médias com até 50 veículos"
  },
  master: {
    nome: "Master",
    preco: 500.00,
    icone: Crown,
    cor: "bg-purple-500",
    descricao: "Para grandes frotas com veículos ilimitados e suporte 24/7"
  }
};

export default function Planos() {
  const { profile, isLocadora } = useAuth();
  const { toast } = useToast();
  const { canPerformActions, isExpired } = useCanPerformActions();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const [solicitando, setSolicitando] = useState(false);
  
  // Verificar se o plano está realmente expirado/suspenso
  const isPlanExpired = subscriptionStatus?.isExpired && !subscriptionStatus?.canAccess;

  // Buscar dados da locadora
  const { data: locadora, isLoading } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId],
    enabled: !!profile?.locadoraId && isLocadora,
  });

  const handleSolicitarMudanca = async (novoPlano: string) => {
    setSolicitando(true);
    try {
      // Simular solicitação de mudança de plano
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Solicitação enviada",
        description: `Sua solicitação para mudar para o plano ${planosInfo[novoPlano as keyof typeof planosInfo].nome} foi enviada. Nossa equipe entrará em contato em breve.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao solicitar mudança",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSolicitando(false);
    }
  };

  const handleRenovarPlano = async (plano: string) => {
    setSolicitando(true);
    try {
      // Simular processo de renovação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Renovação solicitada",
        description: `Sua solicitação de renovação do plano ${planosInfo[plano as keyof typeof planosInfo].nome} foi enviada. Nossa equipe entrará em contato para finalizar o pagamento.`,
      });
    } catch (error) {
      toast({
        title: "Erro na renovação",
        description: "Ocorreu um erro ao solicitar a renovação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSolicitando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isLocadora) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Esta página é apenas para locadoras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planoAtual = locadora?.plano || 'basico';

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
        <p className="text-muted-foreground">
          Gerencie o plano da sua locadora e descubra recursos adicionais
        </p>
      </div>

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
            <Badge variant="default" className="px-3 py-1">
              {planosInfo[planoAtual as keyof typeof planosInfo].nome}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 p-4 rounded-lg ${
            isExpired ? "bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800" : "bg-muted"
          }`}>
            <div className={`p-3 rounded-full ${planosInfo[planoAtual as keyof typeof planosInfo].cor}`}>
              {(() => {
                const IconComponent = planosInfo[planoAtual as keyof typeof planosInfo].icone;
                return <IconComponent className="h-6 w-6 text-white" />;
              })()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                Plano {planosInfo[planoAtual as keyof typeof planosInfo].nome}
                {isExpired && <span className="text-orange-600 ml-2">(Expirado)</span>}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isExpired 
                  ? "Renove seu plano para continuar usando todas as funcionalidades do sistema."
                  : planosInfo[planoAtual as keyof typeof planosInfo].descricao
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                R$ {planosInfo[planoAtual as keyof typeof planosInfo].preco.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">por mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparação de Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparação de Planos
          </CardTitle>
          <CardDescription>
            Compare todos os planos disponíveis e suas funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {/* Coluna de Features */}
            <div className="space-y-4">
              <div className="h-16 flex items-center">
                <h3 className="font-semibold">Funcionalidades</h3>
              </div>
              <Separator />
              {planosFeatures.map((feature, index) => (
                <div key={index} className="py-3 border-b last:border-b-0">
                  <p className="text-sm font-medium">{feature.nome}</p>
                </div>
              ))}
            </div>

            {/* Colunas dos Planos */}
            {Object.entries(planosInfo).map(([key, plano]) => (
              <div key={key} className="space-y-4">
                <div className="h-16 p-4 bg-muted rounded-lg flex flex-col items-center justify-center relative">
                  {plano.popular && (
                    <Badge className="absolute -top-2 bg-purple-500 text-white">
                      Mais Popular
                    </Badge>
                  )}
                  <h3 className="font-semibold">{plano.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    R$ {plano.preco.toFixed(2)}/mês
                  </p>
                </div>
                <Separator />
                {planosFeatures.map((feature, index) => (
                  <div key={index} className="py-3 border-b last:border-b-0 text-center">
                    {typeof feature[key as keyof PlanoFeature] === 'boolean' ? (
                      feature[key as keyof PlanoFeature] ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      <span className="text-sm">
                        {feature[key as keyof PlanoFeature]}
                      </span>
                    )}
                  </div>
                ))}
                <div className="pt-4">
                  {planoAtual === key ? (
                    <Button 
                      className="w-full"
                      onClick={() => handleRenovarPlano(key)}
                      disabled={solicitando}
                      variant="default"
                    >
                      Renovar Plano
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSolicitarMudanca(key)}
                      disabled={solicitando || !canPerformActions}
                      className="w-full"
                      variant={plano.popular ? "default" : "outline"}
                    >
                      {solicitando ? "Solicitando..." : isPlanExpired ? "Renovar" : "Solicitar Mudança"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="p-3 rounded-full bg-blue-500">
              <HeadphonesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Suporte Especializado</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco para esclarecer dúvidas sobre planos
              </p>
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                📞 11977263156
              </Button>
              <Button variant="outline" size="sm">
                ✉️ suporte@drivs.com.br
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}