/**
 * Página de Documentação do Sistema DRIVS
 * Explica como o sistema funciona com guias visuais
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Users, 
  FileText, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  Bell,
  BarChart3,
  Settings,
  Shield,
  CheckCircle,
  ArrowRight,
  Play,
  Book,
  Lightbulb,
  Target,
  Zap,
  Crown,
  Star,
  Building2
} from 'lucide-react';

export default function Documentacao() {
  const [activeSection, setActiveSection] = useState('overview');

  const funcionalidades = [
    {
      icone: Users,
      titulo: "Gestão de Motoristas",
      descricao: "Cadastro completo com validação de CPF, CNH e documentos",
      cor: "bg-blue-500",
      detalhes: [
        "Validação automática de CPF e CNH",
        "Upload de documentos (CNH, RG, Comprovante)",
        "Controle de validade da CNH",
        "Histórico completo de aluguéis",
        "Status automático (ativo/inativo)"
      ]
    },
    {
      icone: Car,
      titulo: "Gestão de Veículos",
      descricao: "Controle total da frota com documentação digital",
      cor: "bg-green-500",
      detalhes: [
        "Cadastro completo (placa, modelo, ano, cor)",
        "Cálculo automático de custos fixos",
        "Upload de documentos do veículo",
        "Status automático (disponível/alugado)",
        "Histórico de manutenções"
      ]
    },
    {
      icone: FileText,
      titulo: "Contratos Inteligentes",
      descricao: "Geração automática de contratos profissionais",
      cor: "bg-purple-500",
      detalhes: [
        "Geração automática de PDF profissional",
        "Pagamentos recorrentes automáticos",
        "Renovação automática de contratos",
        "Upload de contratos assinados",
        "Status em tempo real"
      ]
    },
    {
      icone: DollarSign,
      titulo: "Controle Financeiro",
      descricao: "Relatórios detalhados com lucros e perdas reais",
      cor: "bg-yellow-500",
      detalhes: [
        "Dashboard com métricas em tempo real",
        "Relatórios por período e veículo",
        "Controle de receitas e despesas",
        "Análise de rentabilidade por veículo",
        "Gráficos de evolução mensal"
      ]
    },
    {
      icone: Wrench,
      titulo: "Manutenções",
      descricao: "Controle completo de manutenções preventivas e corretivas",
      cor: "bg-orange-500",
      detalhes: [
        "Agendamento de manutenções",
        "Alertas por quilometragem",
        "Controle de custos de peças",
        "Histórico completo por veículo",
        "Relatórios de gastos"
      ]
    },
    {
      icone: AlertTriangle,
      titulo: "Infrações",
      descricao: "Gestão inteligente de multas e infrações",
      cor: "bg-red-500",
      detalhes: [
        "Registro automático de infrações",
        "Cálculo de taxas administrativas",
        "Alertas de vencimento",
        "Controle por motorista/veículo",
        "Relatórios detalhados"
      ]
    }
  ];

  const planos = [
    {
      nome: "Start",
      preco: "R$ 29,00",
      icone: Car,
      cor: "bg-blue-500",
      veiculos: "Até 5 veículos",
      recursos: [
        "Gestão completa de motoristas",
        "Contratos automáticos",
        "Controle financeiro",
        "Upload de documentos",
        "Suporte por email"
      ]
    },
    {
      nome: "Pro",
      preco: "R$ 99,00",
      icone: Zap,
      cor: "bg-cyan-500",
      veiculos: "Até 20 veículos",
      popular: true,
      recursos: [
        "Todas as funcionalidades Start",
        "Relatórios avançados",
        "Notificações automáticas",
        "Backup diário",
        "Suporte prioritário"
      ]
    },
    {
      nome: "Elite",
      preco: "R$ 250,00",
      icone: Crown,
      cor: "bg-green-500",
      veiculos: "Até 50 veículos",
      recursos: [
        "Todas as funcionalidades Pro",
        "Integração com APIs externas",
        "Relatórios personalizados",
        "Múltiplos usuários",
        "Suporte telefônico"
      ]
    },
    {
      nome: "Infinity",
      preco: "Consultar",
      icone: Star,
      cor: "bg-gradient-to-r from-purple-500 to-pink-500",
      veiculos: "Veículos ilimitados",
      recursos: [
        "Todas as funcionalidades Elite",
        "Customizações específicas",
        "Suporte 24/7",
        "Treinamento personalizado",
        "Gerente de conta dedicado"
      ]
    }
  ];

  const passosInicio = [
    {
      numero: "01",
      titulo: "Cadastro da Locadora",
      descricao: "Registre sua locadora com dados básicos",
      icone: Building2
    },
    {
      numero: "02", 
      titulo: "Adicione Motoristas",
      descricao: "Cadastre motoristas com documentação completa",
      icone: Users
    },
    {
      numero: "03",
      titulo: "Registre Veículos",
      descricao: "Adicione sua frota com todos os detalhes",
      icone: Car
    },
    {
      numero: "04",
      titulo: "Crie Contratos",
      descricao: "Gere contratos automáticos e profissionais",
      icone: FileText
    },
    {
      numero: "05",
      titulo: "Acompanhe Resultados",
      descricao: "Monitore lucros e performance em tempo real",
      icone: BarChart3
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
          <Book className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Documentação DRIVS</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Como Funciona o Sistema
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Descubra como o DRIVS revoluciona a gestão de locadoras de veículos com automação inteligente e controle total
        </p>
      </div>

      {/* Navegação por Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="funcionalidades" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Funcionalidades</span>
          </TabsTrigger>
          <TabsTrigger value="como-usar" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Como Usar</span>
          </TabsTrigger>
          <TabsTrigger value="planos" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">O que é o DRIVS?</CardTitle>
              <CardDescription className="text-lg">
                Sistema completo de gestão para locadoras de veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Elimina Inadimplência</h3>
                  <p className="text-muted-foreground">
                    Sistema automatizado de contratos e pagamentos reduz drasticamente os calotes
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Aumenta Receita</h3>
                  <p className="text-muted-foreground">
                    Otimização da frota e controle financeiro preciso maximizam os lucros
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Automatiza Processos</h3>
                  <p className="text-muted-foreground">
                    Substitui planilhas manuais por automação inteligente e confiável
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Principais Benefícios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Controle total da frota em tempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Redução de 90% na inadimplência</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Aumento de 40% na eficiência operacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Economia de 20 horas/semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Relatórios financeiros precisos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Para Quem é Indicado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50">Micro</Badge>
                  <span>Locadoras iniciantes (1-5 veículos)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50">Pequenas</Badge>
                  <span>Locadoras em crescimento (6-20 veículos)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-purple-50">Médias</Badge>
                  <span>Locadoras estabelecidas (21-100 veículos)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-orange-50">Grandes</Badge>
                  <span>Mega frotas (100+ veículos)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funcionalidades */}
        <TabsContent value="funcionalidades" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionalidades.map((func, index) => {
              const IconComponent = func.icone;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${func.cor}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{func.titulo}</CardTitle>
                        <CardDescription>{func.descricao}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {func.detalhes.map((detalhe, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detalhe}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Como Usar */}
        <TabsContent value="como-usar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Primeiros Passos</CardTitle>
              <CardDescription className="text-center text-lg">
                Siga este guia para começar a usar o DRIVS em minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {passosInicio.map((passo, index) => {
                  const IconComponent = passo.icone;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {passo.numero}
                        </div>
                        {index < passosInicio.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 mt-4"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                          <h3 className="text-xl font-semibold">{passo.titulo}</h3>
                        </div>
                        <p className="text-muted-foreground">{passo.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planos */}
        <TabsContent value="planos" className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Escolha Seu Plano</h2>
            <p className="text-muted-foreground text-lg">
              Planos flexíveis para locadoras de todos os tamanhos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map((plano, index) => {
              const IconComponent = plano.icone;
              return (
                <Card key={index} className={`relative ${plano.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plano.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 hover:bg-blue-500">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${plano.cor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plano.nome}</CardTitle>
                    <div className="text-3xl font-bold">{plano.preco}</div>
                    <CardDescription>{plano.veiculos}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plano.recursos.map((recurso, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Perguntas Frequentes</CardTitle>
              <CardDescription className="text-center">
                Respostas para as principais dúvidas sobre o DRIVS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold mb-2">Como funciona o período de teste gratuito?</h4>
                  <p className="text-muted-foreground">
                    Todas as novas locadoras recebem 30 dias gratuitos do Plano Pro com até 20 veículos. 
                    Sem compromisso ou necessidade de cartão de crédito.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2">Posso mudar de plano a qualquer momento?</h4>
                  <p className="text-muted-foreground">
                    Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                    As mudanças são aplicadas no próximo ciclo de cobrança.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold mb-2">Os dados ficam seguros?</h4>
                  <p className="text-muted-foreground">
                    Absolutamente! Utilizamos criptografia de dados, backups automáticos e 
                    servidores seguros. Seus dados nunca são compartilhados.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold mb-2">Funciona em dispositivos móveis?</h4>
                  <p className="text-muted-foreground">
                    Sim! O sistema é totalmente responsivo e funciona perfeitamente em 
                    smartphones, tablets e computadores.
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold mb-2">Preciso de treinamento?</h4>
                  <p className="text-muted-foreground">
                    O sistema é intuitivo e fácil de usar. Oferecemos documentação completa, 
                    tutoriais em vídeo e suporte técnico para ajudar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Pronto para Revolucionar sua Locadora?</h3>
            <p className="text-blue-100 text-lg">
              Comece seu teste gratuito hoje e descubra como o DRIVS pode transformar seu negócio
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Play className="w-5 h-5 mr-2" />
                Começar Teste Gratuito
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Bell className="w-5 h-5 mr-2" />
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}