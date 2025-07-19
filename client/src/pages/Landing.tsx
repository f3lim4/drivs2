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
      descricao: "Automação completa elimina 90% da papelada e trabalho manual repetitivo.",
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
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-green-500 text-white text-sm px-4 py-2">
            🔥 OFERTA LIMITADA - 30 DIAS GRÁTIS
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Sistema que <span className="text-yellow-300">DOBRA</span><br />
            a Receita da sua Locadora
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Pare de perder R$ 200/dia com planilhas bagunçadas. 
            Sistema COMPLETO que organiza, automatiza e MULTIPLICA seus lucros.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8 max-w-md mx-auto">
            <Input 
              type="email"
              placeholder="Digite seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white text-black text-lg px-4 py-6"
            />
            <Button 
              onClick={handleCadastro}
              size="lg" 
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-bold w-full md:w-auto"
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
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-red-600 mb-8">
            🚨 SUA LOCADORA ESTÁ PERDENDO DINHEIRO AGORA!
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              "📋 Planilhas bagunçadas = Prejuízo diário",
              "💸 Inadimplência descontrolada", 
              "📄 Contratos inválidos = Risco jurídico",
              "⏰ Horas perdidas com papelada"
            ].map((problema, index) => (
              <Card key={index} className="border-red-200 bg-white">
                <CardContent className="p-6 text-center">
                  <p className="text-red-700 font-medium">{problema}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-red-600 text-white p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">CADA DIA PERDIDO = R$ 200 A MENOS</h3>
            <p className="text-lg">Locadoras desorganizadas perdem em média R$ 6.000/mês por falta de controle.</p>
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-16 bg-white">
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
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-all">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${beneficio.cor} flex items-center justify-center mx-auto mb-4`}>
                    <beneficio.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-lg">{beneficio.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{beneficio.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Video Demo */}
          <div className="text-center">
            <Button variant="outline" size="lg" className="mb-4">
              <PlayCircle className="mr-2 h-5 w-5" />
              Ver Demonstração (2 min)
            </Button>
            <p className="text-sm text-gray-500">Veja como funciona na prática</p>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              Sistema completo para locadoras de todos os tamanhos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <ul className="space-y-4">
                {funcionalidades.map((funcionalidade, index) => (
                  <li key={index} className="flex items-center text-lg">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                    {funcionalidade.replace('✅ ', '')}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-center">Comece Hoje Mesmo!</h3>
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-green-600">30 DIAS</p>
                <p className="text-xl">Completamente GRÁTIS</p>
              </div>
              <Button onClick={handleCadastro} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-bold">
                COMEÇAR TESTE GRÁTIS
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mais de 500 Locadoras já Multiplicaram seus Lucros
            </h2>
            <p className="text-xl text-gray-600">
              Veja os resultados reais de quem usa o DRIVS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {depoimentos.map((depoimento, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(depoimento.estrelas)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{depoimento.texto}"</p>
                  <div>
                    <p className="font-bold">{depoimento.nome}</p>
                    <p className="text-sm text-gray-500">{depoimento.empresa}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pare de Perder Dinheiro HOJE!
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Cada dia que passa é dinheiro que você deixa de ganhar.
          </p>
          
          <div className="bg-white bg-opacity-10 p-8 rounded-lg max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-4">🎁 OFERTA EXCLUSIVA</h3>
            <ul className="text-lg space-y-2">
              <li>✅ 30 dias GRÁTIS (sem cartão)</li>
              <li>✅ Configuração completa em 24h</li>
              <li>✅ Migração dos seus dados GRATUITA</li>
              <li>✅ Suporte brasileiro especializado</li>
              <li>✅ Garantia de satisfação ou dinheiro de volta</li>
            </ul>
          </div>

          <Button 
            onClick={handleCadastro}
            size="lg" 
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-12 py-6 text-xl font-bold"
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