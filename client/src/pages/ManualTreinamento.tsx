import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Play, 
  Download, 
  Search, 
  HelpCircle, 
  FileText, 
  Video, 
  Users, 
  Car, 
  CreditCard,
  Settings,
  AlertTriangle,
  Wrench,
  FileBarChart,
  Clock,
  CheckCircle,
  ExternalLink,
  Monitor,
  Smartphone,
  Headphones
} from 'lucide-react';

const ManualTreinamento = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Dados dos vídeos de treinamento
  const videosData = [
    {
      id: 1,
      titulo: 'Introdução ao DRIVS',
      descricao: 'Visão geral completa do sistema DRIVS',
      duracao: '15:30',
      categoria: 'basico',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Iniciante',
      assistido: true
    },
    {
      id: 2,
      titulo: 'Cadastro de Motoristas',
      descricao: 'Como cadastrar e gerenciar motoristas no sistema',
      duracao: '12:45',
      categoria: 'motoristas',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Básico',
      assistido: false
    },
    {
      id: 3,
      titulo: 'Gestão de Veículos',
      descricao: 'Cadastro, edição e controle de frota de veículos',
      duracao: '18:20',
      categoria: 'veiculos',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Intermediário',
      assistido: false
    },
    {
      id: 4,
      titulo: 'Contratos e Aluguéis',
      descricao: 'Criando e gerenciando contratos de aluguel',
      duracao: '22:15',
      categoria: 'contratos',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Intermediário',
      assistido: true
    },
    {
      id: 5,
      titulo: 'Sistema de Pagamentos',
      descricao: 'Gestão completa de pagamentos e financeiro',
      duracao: '16:40',
      categoria: 'pagamentos',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Avançado',
      assistido: false
    },
    {
      id: 6,
      titulo: 'Relatórios Financeiros',
      descricao: 'Como gerar e interpretar relatórios financeiros',
      duracao: '14:55',
      categoria: 'relatorios',
      thumbnail: '/api/placeholder/400/225',
      nivel: 'Avançado',
      assistido: false
    }
  ];

  // Dados do manual do sistema
  const manuaisData = [
    {
      id: 1,
      titulo: 'Manual do Usuário Completo',
      descricao: 'Documentação completa do sistema DRIVS',
      tipo: 'PDF',
      tamanho: '5.2 MB',
      categoria: 'geral',
      versao: '2.1',
      dataAtualizacao: '15/01/2025'
    },
    {
      id: 2,
      titulo: 'Guia de Primeiros Passos',
      descricao: 'Tutorial para iniciar no sistema',
      tipo: 'PDF',
      tamanho: '1.8 MB',
      categoria: 'basico',
      versao: '1.5',
      dataAtualizacao: '10/01/2025'
    },
    {
      id: 3,
      titulo: 'Manual de Configurações',
      descricao: 'Como configurar o sistema para sua locadora',
      tipo: 'PDF',
      tamanho: '3.1 MB',
      categoria: 'configuracao',
      versao: '1.3',
      dataAtualizacao: '08/01/2025'
    },
    {
      id: 4,
      titulo: 'Guia de Troubleshooting',
      descricao: 'Soluções para problemas comuns',
      tipo: 'PDF',
      tamanho: '2.4 MB',
      categoria: 'suporte',
      versao: '1.2',
      dataAtualizacao: '05/01/2025'
    }
  ];

  // FAQ
  const faqData = [
    {
      categoria: 'Geral',
      perguntas: [
        {
          pergunta: 'Como faço para começar a usar o DRIVS?',
          resposta: 'Primeiro, assista ao vídeo "Introdução ao DRIVS" e baixe o "Guia de Primeiros Passos". Depois, configure seu perfil e comece cadastrando seus primeiros veículos e motoristas.'
        },
        {
          pergunta: 'O sistema funciona em dispositivos móveis?',
          resposta: 'Sim! O DRIVS é totalmente responsivo e funciona perfeitamente em smartphones e tablets através do navegador.'
        },
        {
          pergunta: 'Como posso alterar as configurações da minha locadora?',
          resposta: 'Acesse o menu "Configurações" no canto superior direito ou consulte o "Manual de Configurações" para instruções detalhadas.'
        }
      ]
    },
    {
      categoria: 'Motoristas',
      perguntas: [
        {
          pergunta: 'Quais documentos são obrigatórios para cadastrar um motorista?',
          resposta: 'CPF, CNH válida, comprovante de residência e foto. O sistema verifica automaticamente a validade da CNH.'
        },
        {
          pergunta: 'Como recebo notificações de CNH vencendo?',
          resposta: 'O sistema notifica automaticamente 30 dias antes do vencimento da CNH através do painel de notificações.'
        }
      ]
    },
    {
      categoria: 'Veículos',
      perguntas: [
        {
          pergunta: 'Como cadastro um novo veículo?',
          resposta: 'Acesse "Veículos" → "Adicionar Veículo" e preencha todos os dados obrigatórios. Consulte o vídeo "Gestão de Veículos" para uma demonstração completa.'
        },
        {
          pergunta: 'Posso acompanhar as manutenções dos veículos?',
          resposta: 'Sim! O sistema possui um módulo completo de manutenções com alertas automáticos por quilometragem e tempo.'
        }
      ]
    },
    {
      categoria: 'Financeiro',
      perguntas: [
        {
          pergunta: 'Como funciona o sistema de pagamentos automáticos?',
          resposta: 'O sistema gera automaticamente os pagamentos conforme a periodicidade do contrato (semanal, quinzenal ou mensal) e calcula multas por atraso.'
        },
        {
          pergunta: 'Posso gerar relatórios financeiros personalizados?',
          resposta: 'Sim! Acesse "Relatórios Financeiros" para gerar relatórios por período, veículo, motorista ou tipo de receita/despesa.'
        }
      ]
    }
  ];

  const categorias = [
    { id: 'todos', nome: 'Todos', icon: BookOpen },
    { id: 'basico', nome: 'Básico', icon: Users },
    { id: 'motoristas', nome: 'Motoristas', icon: Users },
    { id: 'veiculos', nome: 'Veículos', icon: Car },
    { id: 'contratos', nome: 'Contratos', icon: FileText },
    { id: 'pagamentos', nome: 'Pagamentos', icon: CreditCard },
    { id: 'relatorios', nome: 'Relatórios', icon: FileBarChart }
  ];

  const filtrarVideos = () => {
    return videosData.filter(video => {
      const matchesSearch = video.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || video.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filtrarManuais = () => {
    return manuaisData.filter(manual => {
      const matchesSearch = manual.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manual.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || manual.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Iniciante':
        return 'bg-green-100 text-green-800';
      case 'Básico':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediário':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avançado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Manual & Treinamento
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Central completa de aprendizado do sistema DRIVS. Vídeos, manuais, guias e suporte para você dominar todas as funcionalidades.
          </p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{videosData.length}</p>
                  <p className="text-sm text-gray-600">Vídeos Disponíveis</p>
                </div>
                <Video className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{manuaisData.length}</p>
                  <p className="text-sm text-gray-600">Manuais e Guias</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {videosData.filter(v => v.assistido).length}
                  </p>
                  <p className="text-sm text-gray-600">Vídeos Assistidos</p>
                </div>
                <CheckCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">24/7</p>
                  <p className="text-sm text-gray-600">Suporte Disponível</p>
                </div>
                <Headphones className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar vídeos, manuais ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categorias.map(categoria => (
                  <Button
                    key={categoria.id}
                    variant={selectedCategory === categoria.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(categoria.id)}
                    className="flex items-center gap-2"
                  >
                    <categoria.icon className="w-4 h-4" />
                    {categoria.nome}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="manuais" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manuais
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="suporte" className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              Suporte
            </TabsTrigger>
          </TabsList>

          {/* Tab de Vídeos */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrarVideos().map(video => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      {video.assistido ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Assistido
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Novo</Badge>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                        <Clock className="w-3 h-3 mr-1" />
                        {video.duracao}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{video.titulo}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{video.descricao}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getNivelColor(video.nivel)} variant="outline">
                          {video.nivel}
                        </Badge>
                        <Button size="sm" className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Assistir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab de Manuais */}
          <TabsContent value="manuais" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrarManuais().map(manual => (
                <Card key={manual.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <Badge variant="outline">v{manual.versao}</Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{manual.titulo}</h3>
                        <p className="text-gray-600 text-sm mb-3">{manual.descricao}</p>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>Tipo: {manual.tipo}</p>
                          <p>Tamanho: {manual.tamanho}</p>
                          <p>Atualizado: {manual.dataAtualizacao}</p>
                        </div>
                      </div>
                      <Button className="w-full flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Baixar Manual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab de FAQ */}
          <TabsContent value="faq" className="space-y-6">
            {faqData.map((categoria, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    {categoria.categoria}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {categoria.perguntas.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.pergunta}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {item.resposta}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab de Suporte */}
          <TabsContent value="suporte" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    Suporte Técnico
                  </CardTitle>
                  <CardDescription>
                    Nossa equipe está pronta para ajudar você
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Online - Disponível Agora</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Chat Online:</strong> Resposta em até 5 minutos
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Email:</strong> suporte@drivs.com.br
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>WhatsApp:</strong> (11) 99999-9999
                      </p>
                    </div>
                  </div>
                  <Button className="w-full">
                    Iniciar Chat de Suporte
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Sessão de Treinamento
                  </CardTitle>
                  <CardDescription>
                    Agende uma sessão personalizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Oferecemos sessões de treinamento individual para:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Configuração inicial do sistema</li>
                      <li>• Treinamento da equipe</li>
                      <li>• Funcionalidades avançadas</li>
                      <li>• Migração de dados</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Agendar Treinamento
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Central de Recursos</CardTitle>
                <CardDescription>
                  Links úteis e recursos adicionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                    <Smartphone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">App Mobile</div>
                      <div className="text-xs text-gray-500">Em breve</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                    <ExternalLink className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Portal de Atualizações</div>
                      <div className="text-xs text-gray-500">changelog.drivs.com.br</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Comunidade</div>
                      <div className="text-xs text-gray-500">Fórum de usuários</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManualTreinamento;