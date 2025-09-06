/**
 * Manual de Uso do Sistema DRIVS
 * Tutorial passo a passo com explicações práticas
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Car, 
  FileText, 
  DollarSign, 
  Wrench, 
  AlertTriangle,
  Book,
  MousePointer,
  Eye,
  Edit,
  Plus,
  CheckCircle,
  ArrowRight,
  Info,
  Settings,
  Upload,
  Download,
  Calendar,
  CreditCard,
  Search,
  Filter
} from 'lucide-react';

export default function Documentacao() {
  const [activeSection, setActiveSection] = useState('inicio');

  const tutorialSections = [
    {
      id: 'motoristas',
      titulo: 'Gestão de Motoristas',
      icon: Users,
      cor: 'bg-blue-500',
      resumo: 'Como cadastrar e gerenciar motoristas no sistema',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar a seção Motoristas',
          descricao: 'No menu lateral esquerdo, clique em "Motoristas" (ícone de pessoas)',
          dica: 'Você verá uma tabela com todos os motoristas cadastrados'
        },
        {
          numero: 2,
          titulo: 'Adicionar novo motorista',
          descricao: 'Clique no botão azul "Adicionar Motorista" no canto superior direito',
          dica: 'Um modal com formulário completo será aberto'
        },
        {
          numero: 3,
          titulo: 'Preencher dados pessoais',
          descricao: 'Complete os campos obrigatórios: Nome completo, CPF, Data de nascimento, Telefone e Email',
          dica: 'O CPF é validado automaticamente - só aceita números válidos'
        },
        {
          numero: 4,
          titulo: 'Informar dados da CNH',
          descricao: 'Preencha: Número da CNH, Categoria (A, B, C, D, E) e Data de vencimento',
          dica: 'O sistema alertará quando a CNH estiver próxima do vencimento'
        },
        {
          numero: 5,
          titulo: 'Completar endereço',
          descricao: 'Digite o CEP - o endereço será preenchido automaticamente via ViaCEP',
          dica: 'Complete apenas o número da casa/apartamento e complemento'
        },
        {
          numero: 6,
          titulo: 'Upload de documentos',
          descricao: 'Faça upload das fotos: CNH (frente e verso), RG e Comprovante de residência',
          dica: 'Aceita JPG, PNG, PDF até 5MB. Use fotos nítidas'
        },
        {
          numero: 7,
          titulo: 'Finalizar cadastro',
          descricao: 'Revise todos os dados e clique em "Salvar Motorista"',
          dica: 'O motorista aparecerá na lista com status "Disponível"'
        }
      ]
    },
    {
      id: 'veiculos',
      titulo: 'Gestão de Veículos',
      icon: Car,
      cor: 'bg-green-500',
      resumo: 'Como cadastrar e controlar sua frota de veículos',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar seção Veículos',
          descricao: 'No menu lateral, clique em "Veículos" (ícone de carro)',
          dica: 'Visualize todos os veículos com status (Disponível/Alugado)'
        },
        {
          numero: 2,
          titulo: 'Adicionar novo veículo',
          descricao: 'Clique em "Adicionar Veículo" no topo da página',
          dica: 'Modal com formulário detalhado será aberto'
        },
        {
          numero: 3,
          titulo: 'Dados básicos do veículo',
          descricao: 'Complete: Placa, Marca, Modelo, Ano de fabricação, Cor',
          dica: 'A placa é validada no formato brasileiro (ABC-1234 ou ABC1234)'
        },
        {
          numero: 4,
          titulo: 'Informações técnicas',
          descricao: 'Preencha: RENAVAM, Categoria (Carro, Moto, Caminhão), Quilometragem atual',
          dica: 'A categoria define o tipo de CNH necessária para dirigir'
        },
        {
          numero: 5,
          titulo: 'Custos fixos mensais',
          descricao: 'Informe valores: IPVA, Seguro, Rastreador, Financiamento (se houver)',
          dica: 'Estes custos são usados nos cálculos de rentabilidade'
        },
        {
          numero: 6,
          titulo: 'Upload de documentos',
          descricao: 'Anexe: CRLV, Seguro obrigatório, Vistoria, outros documentos',
          dica: 'Mantenha documentação sempre atualizada'
        },
        {
          numero: 7,
          titulo: 'Confirmar cadastro',
          descricao: 'Revise informações e clique em "Salvar Veículo"',
          dica: 'Veículo ficará disponível para contratos imediatamente'
        }
      ]
    },
    {
      id: 'contratos',
      titulo: 'Criação de Contratos',
      icon: FileText,
      cor: 'bg-purple-500',
      resumo: 'Como criar contratos automáticos e profissionais',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar seção Contratos',
          descricao: 'No menu lateral, clique em "Contratos"',
          dica: 'Veja todos os contratos: Abertos, Ativos, Cancelados, Fechados'
        },
        {
          numero: 2,
          titulo: 'Criar novo contrato',
          descricao: 'Clique em "Novo Contrato" no canto superior direito',
          dica: 'Só aparecem motoristas e veículos disponíveis'
        },
        {
          numero: 3,
          titulo: 'Selecionar motorista',
          descricao: 'Escolha o motorista na lista suspensa',
          dica: 'Sistema valida se CNH está válida e compatível'
        },
        {
          numero: 4,
          titulo: 'Escolher veículo',
          descricao: 'Selecione o veículo disponível para locação',
          dica: 'Categoria da CNH deve ser compatível com o veículo'
        },
        {
          numero: 5,
          titulo: 'Definir valores',
          descricao: 'Configure: Valor do aluguel, Periodicidade (semanal/mensal), Caução',
          dica: 'Valores podem ser alterados durante renovações'
        },
        {
          numero: 6,
          titulo: 'Configurar datas',
          descricao: 'Defina: Data de início, Duração mínima do contrato',
          dica: 'Data de início não pode ser anterior ao dia atual'
        },
        {
          numero: 7,
          titulo: 'Gerar contrato PDF',
          descricao: 'Clique em "Gerar Contrato" - PDF profissional será criado',
          dica: 'Contrato inclui todos os dados da locadora e cliente'
        },
        {
          numero: 8,
          titulo: 'Upload contrato assinado',
          descricao: 'Após assinatura física, faça upload do PDF assinado',
          dica: 'Contrato fica "Ativo" e pagamentos iniciam automaticamente'
        }
      ]
    },
    {
      id: 'financeiro',
      titulo: 'Relatórios Financeiros',
      icon: DollarSign,
      cor: 'bg-yellow-500',
      resumo: 'Como acompanhar lucros, perdas e performance financeira',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar relatórios',
          descricao: 'No menu lateral, clique em "Financeiro"',
          dica: 'Dashboard com métricas principais será exibido'
        },
        {
          numero: 2,
          titulo: 'Visão geral do dashboard',
          descricao: 'Observe os cards: Receita Total, Despesas Totais, Lucro Líquido, Margem',
          dica: 'Valores são calculados em tempo real'
        },
        {
          numero: 3,
          titulo: 'Filtrar por período',
          descricao: 'Use o seletor de datas para analisar períodos específicos',
          dica: 'Relatórios mostram apenas dados do período selecionado'
        },
        {
          numero: 4,
          titulo: 'Análise por veículo',
          descricao: 'Clique na aba "Análise por Veículo" para ver rentabilidade individual',
          dica: 'Identifique quais veículos são mais/menos lucrativos'
        },
        {
          numero: 5,
          titulo: 'Acompanhar receitas',
          descricao: 'Veja pagamentos recebidos organizados por mês',
          dica: 'Gráfico mostra evolução mensal da receita'
        },
        {
          numero: 6,
          titulo: 'Controlar despesas',
          descricao: 'Monitore gastos: Fixos (IPVA, seguro) e Variáveis (manutenção, multas)',
          dica: 'Categorização automática facilita análise'
        },
        {
          numero: 7,
          titulo: 'Exportar relatórios',
          descricao: 'Use botão "Exportar" para gerar PDF dos relatórios',
          dica: 'Útil para apresentações e análises detalhadas'
        }
      ]
    },
    {
      id: 'manutencoes',
      titulo: 'Controle de Manutenções',
      icon: Wrench,
      cor: 'bg-orange-500',
      resumo: 'Como gerenciar manutenções preventivas e corretivas',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar manutenções',
          descricao: 'No menu lateral, clique em "Manutenções"',
          dica: 'Lista todas as manutenções realizadas e agendadas'
        },
        {
          numero: 2,
          titulo: 'Registrar nova manutenção',
          descricao: 'Clique em "Nova Manutenção" no topo',
          dica: 'Formulário específico para cada tipo de manutenção'
        },
        {
          numero: 3,
          titulo: 'Selecionar veículo',
          descricao: 'Escolha o veículo que receberá manutenção',
          dica: 'Sistema mostra quilometragem atual do veículo'
        },
        {
          numero: 4,
          titulo: 'Definir tipo de manutenção',
          descricao: 'Escolha: Preventiva, Corretiva ou Revisão programada',
          dica: 'Cada tipo tem campos específicos'
        },
        {
          numero: 5,
          titulo: 'Informar detalhes',
          descricao: 'Complete: Oficina, Descrição do serviço, Data, Quilometragem',
          dica: 'Seja específico na descrição para histórico'
        },
        {
          numero: 6,
          titulo: 'Registrar custos',
          descricao: 'Informe: Valor da mão de obra, Valor das peças, Total geral',
          dica: 'Custos são incluídos automaticamente nos relatórios'
        },
        {
          numero: 7,
          titulo: 'Agendar próxima',
          descricao: 'Configure alertas para próxima manutenção (por km ou data)',
          dica: 'Sistema enviará notificações automáticas'
        }
      ]
    },
    {
      id: 'infracoes',
      titulo: 'Gestão de Infrações',
      icon: AlertTriangle,
      cor: 'bg-red-500',
      resumo: 'Como controlar multas e infrações de trânsito',
      passos: [
        {
          numero: 1,
          titulo: 'Acessar infrações',
          descricao: 'No menu lateral, clique em "Infrações"',
          dica: 'Lista todas as multas pendentes e pagas'
        },
        {
          numero: 2,
          titulo: 'Registrar nova infração',
          descricao: 'Clique em "Nova Infração" no canto superior',
          dica: 'Sistema sugere motorista/veículo baseado no período'
        },
        {
          numero: 3,
          titulo: 'Dados da infração',
          descricao: 'Preencha: Número do auto, Data da infração, Valor da multa',
          dica: 'Use dados exatos do auto de infração'
        },
        {
          numero: 4,
          titulo: 'Identificar responsável',
          descricao: 'Sistema sugere quem estava com o veículo na data',
          dica: 'Baseado nos contratos ativos no período'
        },
        {
          numero: 5,
          titulo: 'Calcular taxa administrativa',
          descricao: 'Sistema calcula automaticamente a taxa de administração',
          dica: 'Taxa é configurável nas configurações da locadora'
        },
        {
          numero: 6,
          titulo: 'Definir vencimento',
          descricao: 'Configure data limite para pagamento pelo motorista',
          dica: 'Sistema enviará lembretes automáticos'
        },
        {
          numero: 7,
          titulo: 'Acompanhar status',
          descricao: 'Monitore: Pendente, Pago pelo motorista, Pago pela locadora',
          dica: 'Relatórios incluem custos com infrações'
        }
      ]
    }
  ];

  const dicas = [
    {
      titulo: 'Navegação rápida',
      descricao: 'Use as teclas de atalho ou clique nos ícones do menu para navegar rapidamente',
      icone: MousePointer
    },
    {
      titulo: 'Filtros inteligentes',
      descricao: 'Todas as listas têm filtros e busca para encontrar informações rapidamente',
      icone: Search
    },
    {
      titulo: 'Backup automático',
      descricao: 'Seus dados são salvos automaticamente e têm backup diário na nuvem',
      icone: Upload
    },
    {
      titulo: 'Notificações importantes',
      descricao: 'Sistema alerta sobre CNH vencidas, multas pendentes e manutenções',
      icone: AlertTriangle
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
          <Book className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Manual do Usuário</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Como Usar o Sistema DRIVS
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Tutorial completo passo a passo para dominar todas as funcionalidades do sistema
        </p>
      </div>

      {/* Navegação por Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="inicio">📋 Início</TabsTrigger>
          <TabsTrigger value="tutorial">📖 Tutoriais</TabsTrigger>
          <TabsTrigger value="dicas">💡 Dicas</TabsTrigger>
          <TabsTrigger value="suporte">🆘 Suporte</TabsTrigger>
        </TabsList>

        {/* Seção de Início */}
        <TabsContent value="inicio" className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Bem-vindo ao Manual do DRIVS!</CardTitle>
              <CardDescription className="text-lg">
                Este guia vai te ensinar a usar cada funcionalidade do sistema passo a passo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Primeira vez no sistema?</strong> Comece pelos tutoriais de Motoristas e Veículos.
                  Depois, aprenda a criar Contratos e acompanhe tudo no Financeiro.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutorialSections.map((section, index) => {
                  const IconComponent = section.icon;
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setActiveSection('tutorial')}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${section.cor}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold">{section.titulo}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{section.resumo}</p>
                        <div className="flex items-center gap-2 mt-3 text-blue-600">
                          <span className="text-sm">Ver tutorial</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seção de Tutoriais */}
        <TabsContent value="tutorial" className="space-y-6">
          {tutorialSections.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            return (
              <Card key={sectionIndex}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.cor}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.titulo}</CardTitle>
                      <CardDescription>{section.resumo}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {section.passos.map((passo, passoIndex) => (
                      <div key={passoIndex} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {passo.numero}
                          </div>
                          {passoIndex < section.passos.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200 mt-4"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h4 className="font-semibold text-lg mb-2">{passo.titulo}</h4>
                          <p className="text-muted-foreground mb-3">{passo.descricao}</p>
                          {passo.dica && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-blue-800 text-sm">
                                  <strong>Dica:</strong> {passo.dica}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Seção de Dicas */}
        <TabsContent value="dicas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Dicas para Usar Melhor o Sistema</CardTitle>
              <CardDescription>
                Truques e funcionalidades que vão acelerar seu trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {dicas.map((dica, index) => {
                  const IconComponent = dica.icone;
                  return (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">{dica.titulo}</h4>
                        <p className="text-muted-foreground text-sm">{dica.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Atalhos de Teclado</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Dashboard</span>
                      <Badge variant="outline">Ctrl + D</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Motoristas</span>
                      <Badge variant="outline">Ctrl + M</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Veículos</span>
                      <Badge variant="outline">Ctrl + V</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Contratos</span>
                      <Badge variant="outline">Ctrl + C</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Financeiro</span>
                      <Badge variant="outline">Ctrl + F</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Buscar</span>
                      <Badge variant="outline">Ctrl + /</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seção de Suporte */}
        <TabsContent value="suporte" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Precisa de Ajuda?</CardTitle>
              <CardDescription>
                Canais de suporte e recursos adicionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Suporte Técnico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-2">
                      <p><strong>Email:</strong> suporte@drivs.com.br</p>
                      <p><strong>Telefone:</strong> (11) 99999-9999</p>
                      <p><strong>Horário:</strong> Segunda a Sexta, 8h às 18h</p>
                      <p><strong>Tempo médio:</strong> Resposta em até 4 horas</p>
                    </div>
                    <Button className="w-full">
                      Abrir Chamado de Suporte
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="w-5 h-5" />
                      Recursos Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Manual Completo (PDF)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Eye className="w-4 h-4 mr-2" />
                        Assistir Vídeos Tutoriais
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar Treinamento Online
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Lembrete:</strong> Este manual é atualizado automaticamente. 
                  Sempre que o sistema receber melhorias, você encontrará as instruções aqui.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}