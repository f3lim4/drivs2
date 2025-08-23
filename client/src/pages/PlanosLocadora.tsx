/**
 * Página de Planos da Locadora
 * Permite visualizar o plano atual e solicitar mudança de plano
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, Crown, Star, Zap, Car, TrendingUp, HeadphonesIcon, Rocket } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PlanoFeature {
  nome: string;
  basico: boolean | string;
  profissional: boolean | string;
  avancado: boolean | string;
  master: boolean | string;
}

const planosFeatures: PlanoFeature[] = [
  {
    nome: "Veículos na frota",
    basico: "Até 5",
    profissional: "Até 20", 
    avancado: "Até 50",
    master: "Ilimitados"
  },
  {
    nome: "Gestão completa de motoristas",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Contratos automáticos profissionais",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Controle de pagamentos",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Controle de infrações e multas",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Controle financeiro com lucros/perdas reais",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Controle de manutenções",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Upload de documentos",
    basico: true,
    profissional: true,
    avancado: true,
    master: true
  },
  {
    nome: "Suporte técnico",
    basico: "Email",
    profissional: "Email",
    avancado: "Email",
    master: "24/7 + Telefone"
  },
  {
    nome: "Treinamento",
    basico: "Documentação",
    profissional: "Documentação",
    avancado: "Documentação",
    master: "Personalizado"
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
    icone: Rocket,
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

export default function PlanosLocadora() {
  const { profile, isLocadora } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [solicitando, setSolicitando] = useState(false);

  // Buscar dados da locadora se usuário é uma locadora
  const { data: locadora, isLoading: isLoadingLocadora } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId],
    enabled: !!profile?.locadoraId && isLocadora,
  });

  const { data: planoDetalhes, isLoading } = useQuery({
    queryKey: ['/api/planos', profile?.locadoraId],
    enabled: !!profile?.locadoraId,
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
        description: `Aguarde enquanto processamos sua mudança para o plano ${planosInfo[novoPlano as keyof typeof planosInfo].nome}.`,
      });

      // Processar resposta do Stripe
      if (data.simulation) {
        // Simulação - apenas mostrar sucesso
        toast({
          title: "✅ Plano atualizado com sucesso!",
          description: `Você mudou para o plano ${planosInfo[novoPlano as keyof typeof planosInfo].nome}. Simulação ativada.`,
          duration: 5000,
        });
        
        // Invalidar cache para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
        queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
      } else if (data.sessionUrl) {
        // Pagamento real - redirecionar para checkout do Stripe
        toast({
          title: "Redirecionando para o pagamento...",
          description: "Aguarde enquanto abrimos o checkout seguro do Stripe.",
        });
        
        // Redirecionar diretamente para a URL do checkout
        setTimeout(() => {
          window.location.href = data.sessionUrl;
        }, 1000);
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
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Sempre mostrar a página de planos, mesmo sem locadora específica
  // O sistema deve permitir visualizar os planos disponíveis

  const planoAtual = locadora?.plano || 'profissional'; // Padrão profissional se não definido

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
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className={`p-3 rounded-full ${planosInfo[planoAtual as keyof typeof planosInfo].cor}`}>
              {(() => {
                const IconComponent = planosInfo[planoAtual as keyof typeof planosInfo].icone;
                return <IconComponent className="h-6 w-6 text-white" />;
              })()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                Plano {planosInfo[planoAtual as keyof typeof planosInfo].nome}
              </h3>
              <p className="text-sm text-muted-foreground">
                {planosInfo[planoAtual as keyof typeof planosInfo].descricao}
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
          <div className="grid md:grid-cols-5 gap-6">
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
                    <Badge className="absolute -top-2 bg-cyan-500 text-white">
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
                    <Button disabled className="w-full">
                      Plano Atual
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
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Todos os planos incluem:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Sistema completo de gerenciamento
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Controle financeiro com lucros/perdas reais
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Contratos automáticos profissionais
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Suporte por email
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Diferenciais do Plano Master:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  Suporte técnico 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  Treinamento personalizado
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  Veículos ilimitados
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              Dúvidas sobre qual plano escolher? Entre em contato conosco pelo WhatsApp ou email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}