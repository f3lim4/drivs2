import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Building2, Zap, Crown } from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  preco: number;
  periodo: 'mensal' | 'anual';
  descricao: string;
  features: string[];
  limitedFeatures: string[];
  notIncluded: string[];
  popular?: boolean;
  recommended?: boolean;
}

export default function Planos() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'mensal' | 'anual'>('mensal');

  const planos: Plano[] = [
    {
      id: 'basico',
      nome: 'Básico',
      preco: periodoSelecionado === 'mensal' ? 99 : 990,
      periodo: periodoSelecionado,
      descricao: 'Ideal para pequenas locadoras iniciantes',
      features: [
        'Até 20 veículos',
        'Até 50 motoristas',
        'Gestão básica de aluguéis',
        'Contratos simples',
        'Relatórios básicos',
        'Suporte por email'
      ],
      limitedFeatures: [
        'Dashboard limitado',
        'Relatórios mensais apenas'
      ],
      notIncluded: [
        'Relatórios avançados',
        'API personalizada',
        'Integração com terceiros',
        'Suporte prioritário'
      ]
    },
    {
      id: 'premium',
      nome: 'Premium',
      preco: periodoSelecionado === 'mensal' ? 199 : 1990,
      periodo: periodoSelecionado,
      descricao: 'Para locadoras em crescimento',
      features: [
        'Até 100 veículos',
        'Até 200 motoristas',
        'Gestão completa de aluguéis',
        'Contratos personalizados',
        'Relatórios avançados',
        'Dashboard completo',
        'Notificações automáticas',
        'Suporte prioritário'
      ],
      limitedFeatures: [
        'Integração básica com terceiros'
      ],
      notIncluded: [
        'API completamente personalizada',
        'Suporte 24/7',
        'Consultoria especializada'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      nome: 'Enterprise',
      preco: periodoSelecionado === 'mensal' ? 399 : 3990,
      periodo: periodoSelecionado,
      descricao: 'Para grandes redes de locadoras',
      features: [
        'Veículos ilimitados',
        'Motoristas ilimitados',
        'Gestão multi-locadora',
        'Contratos avançados',
        'Relatórios personalizados',
        'Dashboard executivo',
        'Notificações avançadas',
        'API completamente personalizada',
        'Integração completa com terceiros',
        'Suporte 24/7',
        'Consultoria especializada',
        'Treinamento da equipe'
      ],
      limitedFeatures: [],
      notIncluded: [],
      recommended: true
    }
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getIcon = (planoId: string) => {
    switch (planoId) {
      case 'basico':
        return <Building2 className="w-8 h-8 text-slate-600" />;
      case 'premium':
        return <Zap className="w-8 h-8 text-blue-600" />;
      case 'enterprise':
        return <Crown className="w-8 h-8 text-purple-600" />;
      default:
        return <Building2 className="w-8 h-8 text-slate-600" />;
    }
  };

  const getCardStyle = (plano: Plano) => {
    if (plano.recommended) {
      return "border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg";
    }
    if (plano.popular) {
      return "border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg";
    }
    return "border border-slate-200 bg-white shadow-sm";
  };

  const getButtonStyle = (plano: Plano) => {
    if (plano.recommended) {
      return "bg-purple-600 hover:bg-purple-700 text-white";
    }
    if (plano.popular) {
      return "bg-blue-600 hover:bg-blue-700 text-white";
    }
    return "bg-slate-800 hover:bg-slate-900 text-white";
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">
          Escolha o Plano Ideal para sua Locadora
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Planos flexíveis para todos os tamanhos de negócio. Comece gratuitamente e escale conforme sua demanda.
        </p>
      </div>

      {/* Toggle Período */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setPeriodoSelecionado('mensal')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              periodoSelecionado === 'mensal'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriodoSelecionado('anual')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              periodoSelecionado === 'anual'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Anual
            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
              2 meses grátis
            </Badge>
          </button>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
        {planos.map((plano) => (
          <Card key={plano.id} className={`${getCardStyle(plano)} relative overflow-hidden`}>
            {plano.popular && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-medium">
                <Star className="w-4 h-4 inline mr-1" />
                Mais Popular
              </div>
            )}
            
            {plano.recommended && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-sm font-medium">
                <Crown className="w-4 h-4 inline mr-1" />
                Recomendado
              </div>
            )}

            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                {getIcon(plano.id)}
              </div>
              
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  {plano.nome}
                </CardTitle>
                <p className="text-slate-600 mt-2">{plano.descricao}</p>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-bold text-slate-800">
                  {formatCurrency(plano.preco)}
                </div>
                <div className="text-slate-600">
                  por {plano.periodo}
                  {plano.periodo === 'anual' && (
                    <div className="text-sm text-green-600 font-medium">
                      Economize {formatCurrency(plano.preco * 0.2)} por ano
                    </div>
                  )}
                </div>
              </div>

              <Button className={`w-full ${getButtonStyle(plano)}`}>
                Escolher {plano.nome}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features Incluídas */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">Incluído:</h4>
                <div className="space-y-2">
                  {plano.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Limitadas */}
              {plano.limitedFeatures.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800">Com limitações:</h4>
                  <div className="space-y-2">
                    {plano.limitedFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features Não Incluídas */}
              {plano.notIncluded.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800">Não incluído:</h4>
                  <div className="space-y-2">
                    {plano.notIncluded.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <X className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
          Perguntas Frequentes
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-slate-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                As mudanças são aplicadas imediatamente e você paga apenas a diferença proporcional.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Existe período de teste gratuito?
              </h3>
              <p className="text-slate-600">
                Sim! Todos os planos incluem 14 dias de teste gratuito. 
                Você pode testar todas as funcionalidades antes de decidir.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Os dados ficam seguros?
              </h3>
              <p className="text-slate-600">
                Absolutamente! Utilizamos criptografia de ponta e backups diários. 
                Seus dados estão protegidos em servidores seguros com certificação ISO.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Preciso de treinamento?
              </h3>
              <p className="text-slate-600">
                O sistema é intuitivo, mas oferecemos treinamento completo da equipe 
                no plano Enterprise e documentação detalhada em todos os planos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}