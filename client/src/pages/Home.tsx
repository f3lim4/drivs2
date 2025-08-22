import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Users, Car, FileText, BarChart3, Shield, Clock, Building2, Zap, TrendingUp, Truck, Bike, Bus, Crown, Rocket, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import drivsLogo from "@/assets/drivs-logo.png";
import { useVehicleTypes, VehicleType } from "@/contexts/VehicleTypesContext";

// Mapeamento de tipos de veículos para ícones
const vehicleIconMap: Record<VehicleType, any> = {
  carro: Car,
  moto: Bike,
  caminhao: Truck,
  utilitario: Bus
};

// Componente de ícone animado para frota
function AnimatedFleetIcon({ size = "h-6 w-6" }) {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  
  // Para homepage pública, mostrar todos os tipos por padrão
  const defaultVehicleIcons = [Car, Bike, Truck, Bus];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % defaultVehicleIcons.length);
    }, 2000); // Troca a cada 2 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  const CurrentIcon = defaultVehicleIcons[currentIconIndex];
  
  return (
    <div className="transition-all duration-500 ease-in-out">
      <CurrentIcon className={size} />
    </div>
  );
}

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
      icon: AnimatedFleetIcon,
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
      {/* Header Ultra Transparente */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-lg shadow-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={drivsLogo} 
              alt="DRIVS Logo" 
              className="h-10"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-white/90 hover:text-white transition-colors font-medium">Recursos</a>
            <a href="#beneficios" className="text-white/90 hover:text-white transition-colors font-medium">Benefícios</a>
            <a href="#planos" className="text-white/90 hover:text-white transition-colors font-medium">Planos</a>
            <a href="#casos" className="text-white/90 hover:text-white transition-colors font-medium">Casos de Sucesso</a>
            <Button onClick={handleDemo} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6">
              1 Mês Grátis
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-lg blur-sm"></div>
              <Button 
                onClick={handleLogin} 
                className="relative border border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-medium bg-white/10 backdrop-blur-lg px-6 transition-all duration-500 hover:scale-105 shadow-2xl"
              >
                Login
              </Button>
            </div>
          </nav>
          
          <div className="flex gap-3 md:hidden">
            <Button onClick={handleDemo} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
              1 Mês Grátis
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-lg blur-sm"></div>
              <Button 
                onClick={handleLogin} 
                className="relative border border-white/30 text-white hover:bg-white/20 hover:border-white/50 bg-white/10 backdrop-blur-lg text-sm transition-all duration-500 hover:scale-105 shadow-xl"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Futurista */}
      <section className="relative pt-24 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Floating Orbs */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Animated Lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-700"></div>
          
          {/* Moving Light Trails */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Trail 1 - Moving left to right */}
            <div className="absolute top-1/3 left-0 opacity-40" style={{
              animation: 'moveRight 20s linear infinite'
            }}>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-400/80 via-cyan-400/60 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 2 - Moving right to left */}
            <div className="absolute top-2/3 right-0 opacity-35" style={{
              animation: 'moveLeft 25s linear infinite 3s'
            }}>
              <div className="w-32 h-1 bg-gradient-to-l from-purple-400/80 via-pink-400/60 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 3 - Moving left to right slower */}
            <div className="absolute top-1/2 left-0 opacity-30" style={{
              animation: 'moveRight 30s linear infinite 8s'
            }}>
              <div className="w-28 h-1 bg-gradient-to-r from-emerald-400/70 via-green-400/50 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 4 - Moving right to left */}
            <div className="absolute top-1/4 right-0 opacity-32" style={{
              animation: 'moveLeft 35s linear infinite 12s'
            }}>
              <div className="w-28 h-1 bg-gradient-to-l from-yellow-400/70 via-orange-400/50 to-transparent animate-pulse"></div>
            </div>
            
            {/* Fast Trail (Moto) - Moving left to right */}
            <div className="absolute top-1/5 left-0 opacity-45" style={{
              animation: 'moveRight 15s linear infinite 5s'
            }}>
              <div className="w-24 h-0.5 bg-gradient-to-r from-red-400/90 via-pink-400/70 to-transparent animate-pulse"></div>
            </div>
            
            {/* Heavy Trail (Caminhão) - Moving right to left */}
            <div className="absolute top-4/5 right-0 opacity-35" style={{
              animation: 'moveLeft 40s linear infinite 18s'
            }}>
              <div className="w-40 h-1.5 bg-gradient-to-l from-gray-400/70 via-slate-400/50 to-transparent animate-pulse"></div>
            </div>
            
            {/* Fast Trail 2 (Moto) - Moving right to left */}
            <div className="absolute top-3/5 right-0 opacity-38" style={{
              animation: 'moveLeft 18s linear infinite 25s'
            }}>
              <div className="w-22 h-0.5 bg-gradient-to-l from-indigo-400/85 via-blue-400/65 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 8 - Moving left to right diagonal */}
            <div className="absolute top-1/6 left-0 opacity-42" style={{
              animation: 'moveRight 22s linear infinite 15s'
            }}>
              <div className="w-30 h-1 bg-gradient-to-r from-teal-400/75 via-cyan-400/55 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 9 - Moving right to left fast */}
            <div className="absolute top-5/6 right-0 opacity-36" style={{
              animation: 'moveLeft 16s linear infinite 28s'
            }}>
              <div className="w-26 h-0.5 bg-gradient-to-l from-rose-400/80 via-pink-400/60 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 10 - Moving left to right slow */}
            <div className="absolute top-2/5 left-0 opacity-33" style={{
              animation: 'moveRight 38s linear infinite 20s'
            }}>
              <div className="w-35 h-1.5 bg-gradient-to-r from-amber-400/70 via-yellow-400/50 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 11 - Moving right to left medium */}
            <div className="absolute top-1/8 right-0 opacity-40" style={{
              animation: 'moveLeft 28s linear infinite 32s'
            }}>
              <div className="w-28 h-1 bg-gradient-to-l from-lime-400/75 via-green-400/55 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 12 - Moving left to right very fast */}
            <div className="absolute top-7/8 left-0 opacity-44" style={{
              animation: 'moveRight 12s linear infinite 35s'
            }}>
              <div className="w-20 h-0.5 bg-gradient-to-r from-violet-400/90 via-purple-400/70 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 13 - Moving right to left diagonal */}
            <div className="absolute top-3/8 right-0 opacity-37" style={{
              animation: 'moveLeft 32s linear infinite 40s'
            }}>
              <div className="w-34 h-1 bg-gradient-to-l from-sky-400/75 via-blue-400/55 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 14 - Moving left to right medium-fast */}
            <div className="absolute top-5/8 left-0 opacity-39" style={{
              animation: 'moveRight 24s linear infinite 44s'
            }}>
              <div className="w-29 h-1 bg-gradient-to-r from-orange-400/80 via-red-400/60 to-transparent animate-pulse"></div>
            </div>
            
            {/* Trail 15 - Moving right to left super slow */}
            <div className="absolute top-1/12 right-0 opacity-34" style={{
              animation: 'moveLeft 45s linear infinite 48s'
            }}>
              <div className="w-38 h-1.5 bg-gradient-to-l from-slate-400/70 via-gray-400/50 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-6 py-3 backdrop-blur-sm">
            Sistema de Gestão para Locadoras
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Plataforma Completa para<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Gestão de Locadoras
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Sistema integrado que centraliza operações, automatiza processos e fornece 
            insights estratégicos para locadoras de veículos de todos os portes. 
            Controle total da sua frota com tecnologia de ponta.
          </p>
          
          {/* Banner Futurista com Features */}
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 max-w-6xl mx-auto border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
            
            <div className="relative z-10 grid md:grid-cols-4 gap-6">
              <div className="text-center group cursor-pointer">
                <div className="relative p-6 rounded-2xl border border-blue-400/30 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-blue-400/50 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <div className="text-white">
                        <AnimatedFleetIcon size="h-8 w-8" />
                      </div>
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg">Gestão de Frota</h3>
                    <p className="text-blue-200 text-sm">Controle completo de veículos</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="relative p-6 rounded-2xl border border-emerald-400/30 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-emerald-400/50 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg">Relatórios</h3>
                    <p className="text-emerald-200 text-sm">Analytics em tempo real</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="relative p-6 rounded-2xl border border-purple-400/30 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-purple-400/50 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg">Contratos</h3>
                    <p className="text-purple-200 text-sm">Geração automática</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="relative p-6 rounded-2xl border border-orange-400/30 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-orange-400/50 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg">Segurança</h3>
                    <p className="text-orange-200 text-sm">Dados protegidos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={handleDemo}
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg shadow-2xl border border-blue-400/30 backdrop-blur-sm"
            >
              1 Mês Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent rounded-lg blur-sm"></div>
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="relative border border-white/40 text-white hover:bg-white/10 hover:border-white/60 bg-transparent backdrop-blur-lg px-8 py-3 text-lg transition-all duration-500 hover:scale-105 shadow-2xl"
              >
                Acessar Sistema
              </Button>
            </div>
          </div>


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

          {/* Banner Futurista com Estatísticas */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl p-8 mb-16 text-white overflow-hidden border border-blue-500/20">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            {/* Glowing Orbs */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
            
            {/* Animated Lines */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse"></div>
              <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-500"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="group cursor-pointer">
                  <div className="relative p-6 rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl"></div>
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2 group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-500">50+</div>
                      <div className="text-lg font-semibold mb-1 text-blue-100">Locadoras Ativas</div>
                      <div className="text-sm text-blue-300/80">Empresas que confiam no DRIVS</div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-400/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="relative p-6 rounded-2xl border border-emerald-400/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-emerald-400/40 transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl"></div>
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent mb-2 group-hover:from-emerald-200 group-hover:to-green-200 transition-all duration-500">1K+</div>
                      <div className="text-lg font-semibold mb-1 text-emerald-100">Veículos Gerenciados</div>
                      <div className="text-sm text-emerald-300/80">Frota total na plataforma</div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-400/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="relative p-6 rounded-2xl border border-purple-400/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/40 transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl"></div>
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-500">99.9%</div>
                      <div className="text-lg font-semibold mb-1 text-purple-100">Uptime</div>
                      <div className="text-sm text-purple-300/80">Disponibilidade garantida</div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-400/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
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

      {/* Seção de Planos */}
      <section id="planos" className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Escolha o <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Plano Ideal</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Transforme sua locadora com o sistema completo que dobra receita e elimina inadimplência
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-8xl mx-auto">
            {/* Plano Básico */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-2">Básico</h3>
                <p className="text-blue-200 text-center mb-6">Para locadoras iniciantes</p>
                
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold mb-2">R$ 49<span className="text-lg font-normal">/mês</span></div>
                  <div className="text-blue-300">Até 5 veículos</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Até 5 veículos na frota",
                    "Gestão completa de motoristas",
                    "Contratos automáticos profissionais",
                    "Controle de pagamentos",
                    "Controle de infrações e multas",
                    "Controle financeiro com lucros/perdas reais",
                    "Controle de manutenções",
                    "Upload de documentos"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                      <span className="text-blue-100">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleDemo}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-2xl"
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </div>

            {/* Plano Profissional - Mais Popular */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-cyan-400/50 hover:border-cyan-400/70 transition-all duration-500 hover:scale-105 group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 to-purple-500/10 rounded-3xl"></div>
              
              {/* Badge "Mais Popular" */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2 rounded-full border border-cyan-300">
                  <span className="text-black font-bold text-sm flex items-center">
                    <Crown className="h-4 w-4 mr-2" />
                    MAIS POPULAR
                  </span>
                </div>
              </div>
              
              <div className="relative z-10 mt-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-2">Profissional</h3>
                <p className="text-cyan-200 text-center mb-6">Para locadoras em crescimento</p>
                
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold mb-2">R$ 99<span className="text-lg font-normal">/mês</span></div>
                  <div className="text-cyan-300">Até 20 veículos</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Até 20 veículos na frota",
                    "Gestão completa de motoristas",
                    "Contratos automáticos profissionais",
                    "Controle de pagamentos",
                    "Controle de infrações e multas",
                    "Controle financeiro com lucros/perdas reais",
                    "Controle de manutenções",
                    "Upload de documentos"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 flex-shrink-0" />
                      <span className="text-cyan-100">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleDemo}
                  className="w-full bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-black font-bold py-3 rounded-xl transition-all duration-300 group-hover:shadow-2xl"
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </div>

            {/* Plano Avançado */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 transition-all duration-500 hover:scale-105 group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-2">Avançado</h3>
                <p className="text-green-200 text-center mb-6">Para frotas médias</p>
                
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold mb-2">R$ 200<span className="text-lg font-normal">/mês</span></div>
                  <div className="text-green-300">Até 50 veículos</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Até 50 veículos na frota",
                    "Gestão completa de motoristas",
                    "Contratos automáticos profissionais",
                    "Controle de pagamentos",
                    "Controle de infrações e multas",
                    "Controle financeiro com lucros/perdas reais",
                    "Controle de manutenções",
                    "Upload de documentos"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-green-100">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleDemo}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-2xl"
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </div>

            {/* Plano Master */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-2">Master</h3>
                <p className="text-purple-200 text-center mb-6">Para grandes frotas</p>
                
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold mb-2">R$ 500<span className="text-lg font-normal">/mês</span></div>
                  <div className="text-purple-300">Veículos ilimitados</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Veículos ilimitados",
                    "Gestão completa de motoristas",
                    "Contratos automáticos profissionais",
                    "Controle de pagamentos",
                    "Controle de infrações e multas",
                    "Controle financeiro com lucros/perdas reais",
                    "Controle de manutenções",
                    "Suporte 24/7 e treinamento personalizado"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                      <span className="text-purple-100">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleDemo}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-2xl"
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </div>
          </div>

          {/* Garantia */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-4 border border-white/20">
              <Shield className="h-6 w-6 text-green-400 mr-3" />
              <span className="text-lg font-medium">
                <span className="text-green-400 font-bold">Garantia de 30 dias</span> - Se não dobrar sua receita, devolvemos 100% do valor
              </span>
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

      {/* CTA Section Futurista */}
      <section className="relative py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Floating Orbs */}
          <div className="absolute top-10 right-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Animated Lines */}
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
          <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Pronto para <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">transformar</span> sua locadora?
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Comece hoje mesmo com 30 dias gratuitos e veja como o DRIVS pode 
            otimizar as operações da sua empresa.
          </p>
          
          {/* Banner Futurista com Botões */}
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 max-w-4xl mx-auto border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-sm"></div>
                  <Button 
                    onClick={handleDemo}
                    size="lg" 
                    className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-12 py-4 text-xl font-bold shadow-2xl border border-blue-400/30 backdrop-blur-sm transition-all duration-500 hover:scale-105"
                  >
                    Começar 1 Mês Grátis
                  </Button>
                </div>
              </div>
              

            </div>
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