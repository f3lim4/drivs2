import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle, 
  Star,
  Users,
  BarChart3,
  FileText,
  Smartphone,
  HeadphonesIcon,
  ArrowRight,
  PlayCircle
} from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleCadastro = () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Digite seu email para começar o teste grátis.",
        variant: "destructive"
      });
      return;
    }
    
    // Redirecionar para cadastro com email preenchido
    window.location.href = `/cadastro?email=${encodeURIComponent(email)}`;
  };

  const beneficios = [
    {
      icon: TrendingUp,
      titulo: "Dobra sua Receita em 90 Dias",
      descricao: "Sistema comprovado que aumenta receita em 40-60% eliminando perdas por desorganização.",
      cor: "bg-green-100 text-green-600"
    },
    {
      icon: Shield,
      titulo: "Zero Inadimplência",
      descricao: "Controle total de pagamentos, alertas automáticos e cobrança inteligente.",
      cor: "bg-blue-100 text-blue-600"
    },
    {
      icon: Clock,
      titulo: "Economiza 4 Horas/Dia",
      descricao: "Seu tempo vale muito - automação elimina 90% da papelada e trabalho repetitivo.",
      cor: "bg-purple-100 text-purple-600"
    },
    {
      icon: FileText,
      titulo: "Contratos Profissionais",
      descricao: "Geração automática de contratos válidos juridicamente em segundos.",
      cor: "bg-orange-100 text-orange-600"
    }
  ];

  const funcionalidades = [
    "✅ Gestão Completa de Veículos e Frota",
    "✅ Cadastro e Controle de Motoristas", 
    "✅ Contratos Automáticos com Validade Jurídica",
    "✅ Controle Financeiro e Relatórios Avançados",
    "✅ Alertas de CNH Vencida e Manutenção",
    "✅ Sistema Anti-Inadimplência",
    "✅ Backup Automático na Nuvem",
    "✅ Suporte Técnico Especializado"
  ];

  const depoimentos = [
    {
      nome: "Carlos Silva",
      empresa: "Locadora Silva & Cia",
      texto: "Minha receita aumentou 45% em 2 meses. O DRIVS organizou tudo e eliminou as perdas.",
      estrelas: 5
    },
    {
      nome: "Ana Ferreira", 
      empresa: "AutoRent Premium",
      texto: "Acabou a dor de cabeça com planilhas. Sistema muito fácil de usar e completo.",
      estrelas: 5
    },
    {
      nome: "João Santos",
      empresa: "JetCar Locações",
      texto: "Valeu cada centavo. Em 3 meses já havia pago o investimento com o aumento da receita.",
      estrelas: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400 rounded-full filter blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Futuristic Car Image */}
          <div className="mb-8">
            <img 
              src="/futuristic-car.svg" 
              alt="Carro Futurista DRIVS" 
              className="w-80 h-40 mx-auto opacity-80 hover:opacity-100 transition-opacity duration-500"
            />
          </div>
          
          <Badge className="mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-sm px-6 py-3 rounded-full font-bold border border-cyan-300 shadow-lg shadow-cyan-500/50">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
              OFERTA LIMITADA - 7 DIAS GRÁTIS
            </span>
          </Badge>
          
          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
            Sistema que <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">DOBRA</span><br />
            a Receita da sua Locadora
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Pare de perder tempo com planilhas bagunçadas - afinal, tempo É dinheiro e seu tempo vale muito. 
            Sistema COMPLETO que organiza, automatiza e MULTIPLICA seus lucros.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8 max-w-md mx-auto">
            <Input 
              type="email"
              placeholder="Digite seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 backdrop-blur-md border-cyan-400/50 text-white placeholder:text-gray-300 text-lg px-4 py-6 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            <Button 
              onClick={handleCadastro}
              size="lg" 
              className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-8 py-6 text-lg font-bold w-full md:w-auto rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              COMEÇAR GRÁTIS <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm opacity-75">
            ✅ Sem cartão de crédito • ✅ Setup em 24h • ✅ Suporte brasileiro
          </p>
        </div>
      </section>

      {/* Problemas Section */}
      <section className="py-16 bg-gradient-to-br from-red-900 via-red-800 to-orange-900 relative overflow-hidden">
        {/* Animated danger elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-5 left-5 w-32 h-32 bg-red-500 rounded-full filter blur-2xl animate-ping"></div>
          <div className="absolute bottom-5 right-5 w-40 h-40 bg-orange-500 rounded-full filter blur-2xl animate-ping delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center justify-center gap-4">
            <span className="w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
            SUA LOCADORA ESTÁ PERDENDO DINHEIRO AGORA!
            <span className="w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              "📋 Planilhas bagunçadas = Tempo desperdiçado",
              "💸 Inadimplência descontrolada", 
              "📄 Contratos inválidos = Risco jurídico",
              "⏰ Seu tempo vale muito - não perca com papelada"
            ].map((problema, index) => (
              <Card key={index} className="border-red-400/30 bg-red-900/30 backdrop-blur-md hover:bg-red-800/40 transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <p className="text-red-100 font-medium">{problema}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-2xl max-w-2xl mx-auto shadow-2xl border border-red-400/50 backdrop-blur-md">
            <h3 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
              TEMPO PERDIDO = DINHEIRO PERDIDO
            </h3>
            <p className="text-xl">Seu tempo vale muito - pare de desperdiçá-lo com planilhas desorganizadas.</p>
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como o DRIVS Transforma sua Locadora
            </h2>
            <p className="text-xl text-gray-600">
              Sistema completo que elimina todos os problemas e multiplica seus resultados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="border-gray-200/50 bg-white/70 backdrop-blur-md hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <CardHeader className="text-center">
                  <div className={`w-20 h-20 rounded-2xl ${beneficio.cor} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-6`}>
                    <beneficio.icon className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-xl font-bold">{beneficio.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-center leading-relaxed">{beneficio.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Video Demo */}
          <div className="text-center">
            <Button variant="outline" size="lg" className="mb-4 border-2 border-blue-400 text-blue-600 hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-2xl">
              <PlayCircle className="mr-2 h-6 w-6" />
              Ver Demonstração (2 min)
            </Button>
            <p className="text-sm text-gray-600 font-medium">Veja como funciona na prática</p>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-blue-900 text-white relative overflow-hidden">
        {/* Futuristic background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-64 h-64 bg-blue-500 rounded-full filter blur-3xl animate-pulse absolute top-20 left-10"></div>
            <div className="w-80 h-80 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000 absolute bottom-20 right-10"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-300">
              Sistema completo para locadoras de todos os tamanhos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative">
              {/* Dashboard Image */}
              <div className="mb-8 flex justify-center">
                <img 
                  src="/futuristic-dashboard.svg" 
                  alt="Dashboard Futurista DRIVS" 
                  className="w-96 h-72 opacity-70 hover:opacity-90 transition-opacity duration-500"
                />
              </div>
              
              <ul className="space-y-4">
                {funcionalidades.map((funcionalidade, index) => (
                  <li key={index} className="flex items-center text-lg group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="group-hover:text-blue-200 transition-colors duration-300">
                      {funcionalidade.replace('✅ ', '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
              <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Comece Hoje Mesmo!
              </h3>
              <div className="text-center mb-8">
                <p className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-pulse">
                  7 DIAS
                </p>
                <p className="text-2xl text-white">Completamente GRÁTIS</p>
              </div>
              <Button 
                onClick={handleCadastro} 
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                COMEÇAR TESTE GRÁTIS
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Tech Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <img 
            src="/tech-pattern.svg" 
            alt="Tech Pattern" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mais de 500 Locadoras já Multiplicaram seus Lucros
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Veja os resultados reais de quem usa o DRIVS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {depoimentos.map((depoimento, index) => (
              <Card key={index} className="border-gray-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <CardContent className="p-8">
                  <div className="flex mb-6 justify-center">
                    {[...Array(depoimento.estrelas)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-500 fill-current group-hover:text-yellow-400 transition-colors duration-300" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{depoimento.texto}"</p>
                  <div className="text-center">
                    <p className="font-bold text-lg text-gray-800">{depoimento.nome}</p>
                    <p className="text-sm text-blue-600 font-medium">{depoimento.empresa}</p>
                  </div>
                  
                  {/* Floating avatar indicator */}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mt-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white relative overflow-hidden">
        {/* Final CTA animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400 rounded-full filter blur-3xl animate-ping"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl animate-ping delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-400 rounded-full filter blur-3xl animate-ping delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-200 to-cyan-200 bg-clip-text text-transparent">
            Pare de Perder Dinheiro HOJE!
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Cada dia que passa é tempo valioso desperdiçado - e tempo é dinheiro.
          </p>
          
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md p-10 rounded-2xl max-w-2xl mx-auto mb-8 border border-white/30 shadow-2xl">
            <h3 className="text-3xl font-bold mb-6 flex items-center justify-center gap-3">
              <span className="text-4xl">🎁</span>
              OFERTA EXCLUSIVA
            </h3>
            <ul className="text-xl space-y-4">
              {[
                "7 dias GRÁTIS (sem cartão)",
                "Configuração completa em 24h", 
                "Migração dos seus dados GRATUITA",
                "Suporte brasileiro especializado",
                "Garantia de satisfação ou dinheiro de volta"
              ].map((item, index) => (
                <li key={index} className="flex items-center group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="group-hover:text-cyan-200 transition-colors duration-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button 
            onClick={handleCadastro}
            size="lg" 
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 text-black px-16 py-8 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-500 border-2 border-yellow-300"
          >
            COMEÇAR AGORA - É GRÁTIS!
          </Button>
          
          <p className="mt-4 text-sm opacity-75">
            🔒 Seus dados estão seguros • 📞 Suporte 24/7 • 💰 Sem taxa de setup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">DRIVS</h3>
              <p className="text-gray-400">
                O sistema completo para transformar sua locadora em uma máquina de fazer dinheiro.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login">Login</Link></li>
                <li><Link href="/cadastro">Cadastro Grátis</Link></li>
                <li>Demonstração</li>
                <li>Preços</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Contato</li>
                <li>Treinamentos</li>
                <li>Status do Sistema</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 contato@drivs.com.br</li>
                <li>📱 (11) 9999-9999</li>
                <li>🏢 São Paulo, SP</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DRIVS. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}