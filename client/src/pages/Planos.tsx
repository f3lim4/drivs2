import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Star, Building2, Zap, Crown, Plus, Edit, Trash2, Eye, Settings, Gift } from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  precoMensal: number;
  precoAnual: number;
  descricao: string;
  maxVeiculos: number;
  maxMotoristas: number;
  features: string[];
  ativo: boolean;
  cor: string;
  ordem: number;
}

interface LocadoraPlano {
  id: string;
  nome: string;
  planoAtual: string;
  dataInicio: string;
  dataVencimento: string;
  status: 'ativo' | 'vencido' | 'cancelado';
  valorPago: number;
}

export default function Planos() {
  const { toast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const [modalLocadoras, setModalLocadoras] = useState(false);
  
  // Estados para o formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    precoMensal: '',
    precoAnual: '',
    maxVeiculos: '',
    maxMotoristas: '',
    features: '',
    cor: '#3b82f6',
    ativo: true
  });

  // Dados de exemplo dos planos
  const [planos, setPlanos] = useState<Plano[]>([
    {
      id: 'free',
      nome: 'Free',
      precoMensal: 0,
      precoAnual: 0,
      descricao: 'Plano gratuito para testar o sistema',
      maxVeiculos: 2,
      maxMotoristas: 10,
      features: [
        'Até 2 veículos',
        'Até 10 motoristas',
        'Funcionalidades básicas',
        'Suporte por email'
      ],
      ativo: true,
      cor: '#10b981',
      ordem: 0
    },
    {
      id: 'basico',
      nome: 'Básico',
      precoMensal: 99,
      precoAnual: 990,
      descricao: 'Ideal para pequenas locadoras iniciantes',
      maxVeiculos: 20,
      maxMotoristas: 50,
      features: [
        'Gestão básica de aluguéis',
        'Contratos simples',
        'Relatórios básicos',
        'Suporte por email'
      ],
      ativo: true,
      cor: '#64748b',
      ordem: 1
    },
    {
      id: 'premium',
      nome: 'Premium',
      precoMensal: 199,
      precoAnual: 1990,
      descricao: 'Para locadoras em crescimento',
      maxVeiculos: 100,
      maxMotoristas: 200,
      features: [
        'Gestão completa de aluguéis',
        'Contratos personalizados',
        'Relatórios avançados',
        'Dashboard completo',
        'Notificações automáticas',
        'Suporte prioritário'
      ],
      ativo: true,
      cor: '#3b82f6',
      ordem: 2
    },
    {
      id: 'enterprise',
      nome: 'Enterprise',
      precoMensal: 399,
      precoAnual: 3990,
      descricao: 'Para grandes redes de locadoras',
      maxVeiculos: 9999,
      maxMotoristas: 9999,
      features: [
        'Veículos ilimitados',
        'Motoristas ilimitados',
        'Gestão multi-locadora',
        'Contratos avançados',
        'Relatórios personalizados',
        'Dashboard executivo',
        'API personalizada',
        'Suporte 24/7',
        'Consultoria especializada'
      ],
      ativo: true,
      cor: '#8b5cf6',
      ordem: 3
    }
  ]);

  // Dados de exemplo das locadoras e seus planos
  const [locadorasPlanos, setLocadorasPlanos] = useState<LocadoraPlano[]>([
    {
      id: '0',
      nome: 'Nova Locadora Teste',
      planoAtual: 'free',
      dataInicio: '2024-07-15',
      dataVencimento: '2024-08-15',
      status: 'ativo',
      valorPago: 0
    },
    {
      id: '1',
      nome: 'Crivelari Locadora',
      planoAtual: 'premium',
      dataInicio: '2024-01-15',
      dataVencimento: '2024-12-15',
      status: 'ativo',
      valorPago: 1990
    },
    {
      id: '2',
      nome: 'AutoRent Premium',
      planoAtual: 'enterprise',
      dataInicio: '2024-03-01',
      dataVencimento: '2024-03-01',
      status: 'ativo',
      valorPago: 3990
    },
    {
      id: '3',
      nome: 'Rápido Veículos',
      planoAtual: 'basico',
      dataInicio: '2024-06-10',
      dataVencimento: '2024-06-10',
      status: 'ativo',
      valorPago: 990
    }
  ]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getIcon = (planoId: string) => {
    switch (planoId) {
      case 'free':
        return <Gift className="w-8 h-8 text-white" />;
      case 'basico':
        return <Building2 className="w-8 h-8 text-white" />;
      case 'premium':
        return <Zap className="w-8 h-8 text-white" />;
      case 'enterprise':
        return <Crown className="w-8 h-8 text-white" />;
      default:
        return <Building2 className="w-8 h-8 text-white" />;
    }
  };

  const getGradientClass = (planoId: string) => {
    switch (planoId) {
      case 'free':
        return 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600';
      case 'basico':
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700';
      case 'premium':
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700';
      case 'enterprise':
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700';
      default:
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPlanoNome = (planoId: string) => {
    const plano = planos.find(p => p.id === planoId);
    return plano ? plano.nome : planoId;
  };

  const limparFormulario = () => {
    setFormData({
      nome: '',
      descricao: '',
      precoMensal: '',
      precoAnual: '',
      maxVeiculos: '',
      maxMotoristas: '',
      features: '',
      cor: '#3b82f6',
      ativo: true
    });
  };

  const preencherFormulario = (plano: Plano) => {
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao,
      precoMensal: plano.precoMensal.toString(),
      precoAnual: plano.precoAnual.toString(),
      maxVeiculos: plano.maxVeiculos.toString(),
      maxMotoristas: plano.maxMotoristas.toString(),
      features: plano.features.join('\n'),
      cor: plano.cor,
      ativo: plano.ativo
    });
  };

  const handleNovoPlano = () => {
    setPlanoEditando(null);
    limparFormulario();
    setModalAberto(true);
  };

  const handleEditarPlano = (plano: Plano) => {
    setPlanoEditando(plano);
    preencherFormulario(plano);
    setModalAberto(true);
  };

  const handleSalvarPlano = () => {
    toast({
      title: "Plano salvo com sucesso",
      description: "As alterações foram aplicadas.",
    });
    setModalAberto(false);
    setPlanoEditando(null);
    limparFormulario();
  };

  const handleExcluirPlano = (planoId: string) => {
    setPlanos(planos.filter(p => p.id !== planoId));
    toast({
      title: "Plano excluído",
      description: "O plano foi removido do sistema.",
    });
  };

  return (
    <div className="flex-1 space-y-8 p-6">
      {/* Header Futurista */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gerenciamento de Planos
          </h1>
          <p className="text-slate-600 text-lg">
            Gerencie os planos disponíveis para as locadoras
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setModalLocadoras(true)}
            className="flex items-center gap-2 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
          >
            <Eye className="w-4 h-4" />
            Ver Locadoras
          </Button>
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700" onClick={handleNovoPlano}>
                <Plus className="w-4 h-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {planoEditando ? 'Editar Plano' : 'Novo Plano'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Plano</Label>
                    <Input 
                      id="nome" 
                      placeholder="Ex: Premium" 
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cor">Cor</Label>
                    <Input 
                      id="cor" 
                      type="color" 
                      value={formData.cor}
                      onChange={(e) => setFormData({...formData, cor: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea 
                    id="descricao" 
                    placeholder="Descreva o plano..." 
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precoMensal">Preço Mensal (R$)</Label>
                    <Input 
                      id="precoMensal" 
                      type="number" 
                      placeholder="199" 
                      value={formData.precoMensal}
                      onChange={(e) => setFormData({...formData, precoMensal: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="precoAnual">Preço Anual (R$)</Label>
                    <Input 
                      id="precoAnual" 
                      type="number" 
                      placeholder="1990" 
                      value={formData.precoAnual}
                      onChange={(e) => setFormData({...formData, precoAnual: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxVeiculos">Máximo de Veículos</Label>
                    <Input 
                      id="maxVeiculos" 
                      type="number" 
                      placeholder="100" 
                      value={formData.maxVeiculos}
                      onChange={(e) => setFormData({...formData, maxVeiculos: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMotoristas">Máximo de Motoristas</Label>
                    <Input 
                      id="maxMotoristas" 
                      type="number" 
                      placeholder="200" 
                      value={formData.maxMotoristas}
                      onChange={(e) => setFormData({...formData, maxMotoristas: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
                  <Textarea 
                    id="features" 
                    placeholder="Gestão completa de aluguéis&#10;Relatórios avançados&#10;Suporte prioritário"
                    rows={5}
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setModalAberto(false);
                    setPlanoEditando(null);
                    limparFormulario();
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarPlano}>
                    Salvar Plano
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Total de Planos</p>
                <p className="text-3xl font-bold text-white">{planos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Planos Ativos</p>
                <p className="text-3xl font-bold text-white">{planos.filter(p => p.ativo).length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Check className="w-6 h-6 text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Locadoras Cadastradas</p>
                <p className="text-3xl font-bold text-white">{locadorasPlanos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Receita Mensal</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(locadorasPlanos.reduce((acc, loc) => acc + loc.valorPago / 12, 0))}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Star className="w-6 h-6 text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards dos Planos com Visual Futurista */}
      <div className="grid gap-8 md:grid-cols-3">
        {planos.map((plano) => {
          const gradientClass = getGradientClass(plano.id);
          return (
            <Card key={plano.id} className={`${gradientClass} border-2 shadow-xl hover:shadow-2xl transition-all duration-300`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {getIcon(plano.id)}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white mb-1">
                        {plano.nome}
                      </CardTitle>
                      <p className="text-sm text-white/80">{plano.descricao}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditarPlano(plano)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExcluirPlano(plano.id)}
                      className="text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/70 mb-1">Preço Mensal</p>
                    <p className="font-bold text-white text-lg">{formatCurrency(plano.precoMensal)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/70 mb-1">Preço Anual</p>
                    <p className="font-bold text-white text-lg">{formatCurrency(plano.precoAnual)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/70 mb-1">Máx. Veículos</p>
                    <p className="font-bold text-white text-lg">
                      {plano.maxVeiculos === 9999 ? '∞' : plano.maxVeiculos}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/70 mb-1">Máx. Motoristas</p>
                    <p className="font-bold text-white text-lg">
                      {plano.maxMotoristas === 9999 ? '∞' : plano.maxMotoristas}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm text-white/70 mb-3">Funcionalidades</p>
                  <div className="space-y-2">
                    {plano.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-white" />
                        <span className="text-sm text-white/90">{feature}</span>
                      </div>
                    ))}
                    {plano.features.length > 4 && (
                      <p className="text-xs text-white/60 mt-2">
                        +{plano.features.length - 4} funcionalidades adicionais
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge className={plano.ativo ? 'bg-green-500/20 text-green-100 border-green-400' : 'bg-gray-500/20 text-gray-100 border-gray-400'}>
                    {plano.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-sm text-white/70">Ordem: {plano.ordem}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal das Locadoras com Visual Clean */}
      <Dialog open={modalLocadoras} onOpenChange={setModalLocadoras}>
        <DialogContent className="max-w-6xl bg-white border-slate-200">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
              Locadoras e seus Planos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locadorasPlanos.map((locadora) => (
                <Card key={locadora.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-800">
                            {locadora.nome}
                          </CardTitle>
                          <p className="text-sm text-slate-600">{getPlanoNome(locadora.planoAtual)}</p>
                        </div>
                      </div>
                      {getStatusBadge(locadora.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Data Início</p>
                        <p className="font-semibold text-slate-800 text-sm">
                          {new Date(locadora.dataInicio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Vencimento</p>
                        <p className="font-semibold text-slate-800 text-sm">
                          {new Date(locadora.dataVencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Valor Pago</p>
                      <p className="font-bold text-slate-800 text-lg">{formatCurrency(locadora.valorPago)}</p>
                    </div>

                    <div className="flex justify-between gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Alterar Plano",
                            description: `Alterando plano da ${locadora.nome}`,
                          });
                        }}
                        className="flex-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Alterar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Renovar Assinatura",
                            description: `Renovando assinatura da ${locadora.nome}`,
                          });
                        }}
                        className="flex-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Renovar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Suspender Locadora",
                            description: `Suspendendo acesso da ${locadora.nome}`,
                          });
                        }}
                        className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}