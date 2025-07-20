import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Users, Car, FileText, BarChart3, Shield, Clock, Building2, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import drivsLogo from "@/assets/drivs-logo.png";

export default function Home() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDemo = () => {
    navigate('/cadastro-locadora');
  };

  const recursos = [
    {
      icon: Car,
      titulo: "Gestão de Frota Completa",
      descricao: "Controle total de veículos, status de disponibilidade, manutenções programadas, histórico detalhado e documentação digital de cada veículo da frota."
    },
    {
      icon: Users,
      titulo: "Gestão de Clientes e Motoristas",
      descricao: "Cadastro completo com documentos digitais, histórico de locações, CNH automática, scoring de clientes e relatórios de comportamento."
    },
    {
      icon: FileText,
      titulo: "Contratos Inteligentes",
      descricao: "Geração automática de contratos personalizados, templates editáveis, assinatura digital, validade jurídica garantida e controle de vencimentos."
    },
    {
      icon: BarChart3,
      titulo: "Business Intelligence",
      descricao: "Dashboards interativos, relatórios financeiros avançados, análise de lucratividade por veículo, previsões e insights estratégicos em tempo real."
    },
    {
      icon: Shield,
      titulo: "Segurança Enterprise",
      descricao: "Backup automático na nuvem, criptografia de ponta, controle de acesso por usuário, logs de auditoria e conformidade com LGPD."
    },
    {
      icon: Clock,
      titulo: "Automação Inteligente",
      descricao: "Notificações automáticas, cobrança recorrente, lembretes de vencimento, integração com bancos e redução de 80% no trabalho manual."
    }
  ];

  const beneficios = [
    "Redução de 80% no tempo de processos administrativos",
    "Controle financeiro em tempo real com dashboards interativos",
    "Geração automática de contratos juridicamente válidos",
    "Sistema de notificações para vencimentos e pendências",
    "Relatórios gerenciais para tomada de decisão estratégica",
    "Suporte técnico especializado em locadoras de veículos"
  ];

  const casos = [
    {
      empresa: "AutoLoc São Paulo",
      setor: "Locação Executiva",
      frota: "120 veículos",
      resultado: "45% aumento na eficiência operacional"
    },
    {
      empresa: "RentCar Sul",
      setor: "Locação Regional",
      frota: "85 veículos", 
      resultado: "60% redução em inadimplência"
    },
    {
      empresa: "Mobility Pro",
      setor: "Frotas Corporativas",
      frota: "200 veículos",
      resultado: "35% economia em custos administrativos"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={drivsLogo} 
              alt="DRIVS Logo" 
              className="h-10"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-gray-600 hover:text-blue-600 transition-colors">Recursos</a>
            <a href="#beneficios" className="text-gray-600 hover:text-blue-600 transition-colors">Benefícios</a>
            <a href="#casos" className="text-gray-600 hover:text-blue-600 transition-colors">Casos de Sucesso</a>
            <Button variant="ghost" onClick={handleLogin} className="text-blue-600 hover:text-blue-700">
              Login
            </Button>
          </nav>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDemo} className="hidden md:flex">
              30 Dias Grátis
            </Button>
            <Button onClick={handleLogin} className="md:hidden">
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 px-4 py-2">
            Sistema de Gestão para Locadoras
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            Plataforma Completa para<br />
            <span className="text-blue-600">Gestão de Locadoras</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-4xl mx-auto">
            Sistema integrado que centraliza operações, automatiza processos e fornece 
            insights estratégicos para locadoras de veículos de todos os portes. 
            Controle total da sua frota com tecnologia de ponta.
          </p>
          
          {/* Banner Interativo com Features */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 max-w-6xl mx-auto border border-blue-100">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center group cursor-pointer hover:bg-white hover:shadow-lg rounded-xl p-4 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Gestão de Frota</h3>
                <p className="text-sm text-gray-600">Controle completo de veículos</p>
              </div>
              
              <div className="text-center group cursor-pointer hover:bg-white hover:shadow-lg rounded-xl p-4 transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Relatórios</h3>
                <p className="text-sm text-gray-600">Analytics em tempo real</p>
              </div>
              
              <div className="text-center group cursor-pointer hover:bg-white hover:shadow-lg rounded-xl p-4 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Contratos</h3>
                <p className="text-sm text-gray-600">Geração automática</p>
              </div>
              
              <div className="text-center group cursor-pointer hover:bg-white hover:shadow-lg rounded-xl p-4 transition-all duration-300">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Segurança</h3>
                <p className="text-sm text-gray-600">Dados protegidos</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={handleDemo}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              30 Dias Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              onClick={handleLogin}
              size="lg" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
            >
              Acessar Sistema
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            30 dias grátis • Sem compromisso • Configuração inclusa
          </p>
        </div>
      </section>

      {/* Sistema Completo Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 px-4 py-2">
              Sistema Completo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Tudo que sua locadora precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O DRIVS é mais que um software - é uma plataforma completa que revoluciona 
              a gestão de locadoras com tecnologia avançada e interface intuitiva.
            </p>
          </div>

          {/* Banner Interativo com Estatísticas */}
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-8 mb-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-blue-300 mb-2">500+</div>
                  <div className="text-lg font-medium mb-1">Locadoras Ativas</div>
                  <div className="text-sm text-gray-300">Empresas que confiam no DRIVS</div>
                </div>
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-green-300 mb-2">25K+</div>
                  <div className="text-lg font-medium mb-1">Veículos Gerenciados</div>
                  <div className="text-sm text-gray-300">Frota total na plataforma</div>
                </div>
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-purple-300 mb-2">99.9%</div>
                  <div className="text-lg font-medium mb-1">Uptime</div>
                  <div className="text-sm text-gray-300">Disponibilidade garantida</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section id="recursos" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Recursos Principais
            </h2>
            <p className="text-xl text-gray-600">
              Tudo que sua locadora precisa em uma única plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recursos.map((recurso, index) => (
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <recurso.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{recurso.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{recurso.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section id="beneficios" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Por que escolher o DRIVS?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Nossa plataforma foi desenvolvida especificamente para as necessidades 
                do setor de locação de veículos, oferecendo soluções práticas e eficientes.
              </p>
              
              <ul className="space-y-4">
                {beneficios.map((beneficio, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
                Principais Benefícios
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                    <span className="font-medium">Eficiência Operacional</span>
                  </div>
                  <span className="text-2xl font-bold text-green-500">+80%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-blue-500 mr-3" />
                    <span className="font-medium">Redução de Tempo</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-500">-75%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-purple-500 mr-3" />
                    <span className="font-medium">Controle Financeiro</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-500">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de Uso */}
      <section id="casos" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Casos de Sucesso
            </h2>
            <p className="text-xl text-gray-600">
              Empresas que transformaram suas operações com o DRIVS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {casos.map((caso, index) => (
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                    <Badge variant="secondary">{caso.setor}</Badge>
                  </div>
                  <CardTitle className="text-lg">{caso.empresa}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Frota:</strong> {caso.frota}
                  </p>
                  <p className="font-medium text-green-600">
                    {caso.resultado}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para transformar sua locadora?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Comece hoje mesmo com 30 dias gratuitos e veja como o DRIVS pode 
            otimizar as operações da sua empresa sem compromisso.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              onClick={handleDemo}
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Começar 30 Dias Grátis
            </Button>
            <Button 
              onClick={handleLogin}
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={drivsLogo} 
                alt="DRIVS Logo" 
                className="h-8"
              />
            </div>
            
            <div className="text-sm text-gray-400">
              © 2025 DRIVS. Sistema de gestão para locadoras de veículos.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}