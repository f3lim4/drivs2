import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Suporte() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    // Simular envio
    setTimeout(() => {
      toast({
        title: "Mensagem enviada!",
        description: "Responderemos em até 24 horas."
      });
      setFormData({
        nome: '',
        email: '',
        assunto: '',
        mensagem: ''
      });
      setEnviando(false);
    }, 1500);
  };

  const abrirWhatsApp = () => {
    const numero = '5511977263156';
    const mensagem = 'Olá! Preciso de ajuda com o sistema DRIVS.';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Central de Ajuda</h1>
            <p className="text-white/70">Estamos aqui para ajudar você</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contato Rápido */}
          <div className="lg:col-span-1 space-y-6">
            {/* WhatsApp */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80 text-sm">
                  Fale conosco diretamente pelo WhatsApp para suporte imediato
                </p>
                <Button 
                  onClick={abrirWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversar Agora
                </Button>
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Disponível 24/7
                </div>
              </CardContent>
            </Card>

            {/* Telefone */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-400" />
                  Telefone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-white/80">
                  <p className="font-medium text-lg">11977263156</p>
                  <p className="text-sm text-white/60">Segunda a sexta, 8h às 18h</p>
                </div>
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full border-white/30 text-white hover:bg-white/10"
                >
                  <a href="tel:11977263156">
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar Agora
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-white/80">
                  <p className="font-medium">suporte@drivs.com.br</p>
                  <p className="text-sm text-white/60">Resposta em até 24h</p>
                </div>
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full border-white/30 text-white hover:bg-white/10"
                >
                  <a href="mailto:suporte@drivs.com.br">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Contato */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">
                  Envie sua Mensagem
                </CardTitle>
                <p className="text-white/70">
                  Descreva sua dúvida ou problema e nossa equipe entrará em contato
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Nome *
                      </label>
                      <Input
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="seu.email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Assunto *
                    </label>
                    <Input
                      required
                      value={formData.assunto}
                      onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Resumo do problema ou dúvida"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Mensagem *
                    </label>
                    <Textarea
                      required
                      rows={6}
                      value={formData.mensagem}
                      onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
                      placeholder="Descreva detalhadamente sua dúvida ou problema..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={enviando}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {enviando ? (
                      "Enviando..."
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Rápido */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle className="text-white">Perguntas Frequentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <details className="group">
                    <summary className="cursor-pointer text-white font-medium group-open:text-blue-300">
                      Como faço para adicionar um novo motorista?
                    </summary>
                    <p className="text-white/70 text-sm mt-2 pl-4">
                      Acesse o menu "Motoristas" e clique em "Novo Motorista". Preencha todos os campos obrigatórios e faça o upload dos documentos necessários.
                    </p>
                  </details>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-white font-medium group-open:text-blue-300">
                      Como gerar relatórios financeiros?
                    </summary>
                    <p className="text-white/70 text-sm mt-2 pl-4">
                      No menu "Financeiro", você encontra relatórios detalhados de receitas, despesas e lucros. Use os filtros de data para personalizar o período.
                    </p>
                  </details>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-white font-medium group-open:text-blue-300">
                      Como funciona o sistema de pagamentos?
                    </summary>
                    <p className="text-white/70 text-sm mt-2 pl-4">
                      O sistema gera pagamentos automaticamente conforme a frequência definida no contrato. Você pode marcar como pago ou configurar notificações de vencimento.
                    </p>
                  </details>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}