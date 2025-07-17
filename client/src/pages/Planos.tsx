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
        return <Gift className="w-8 h-8 text-green-600" />;
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
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gerenciamento de Planos
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie os planos disponíveis para as locadoras
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setModalLocadoras(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Locadoras
          </Button>
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={handleNovoPlano}>
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

      {/* Cards dos Planos */}
      <div className="grid gap-6 md:grid-cols-3">
        {planos.map((plano) => (
          <Card key={plano.id} className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: plano.cor + '20' }}
                  >
                    {getIcon(plano.id)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      {plano.nome}
                    </CardTitle>
                    <p className="text-sm text-slate-600">{plano.descricao}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditarPlano(plano)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirPlano(plano.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Preço Mensal</p>
                  <p className="font-semibold text-slate-800">{formatCurrency(plano.precoMensal)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Preço Anual</p>
                  <p className="font-semibold text-slate-800">{formatCurrency(plano.precoAnual)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Máx. Veículos</p>
                  <p className="font-semibold text-slate-800">
                    {plano.maxVeiculos === 9999 ? 'Ilimitado' : plano.maxVeiculos}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Máx. Motoristas</p>
                  <p className="font-semibold text-slate-800">
                    {plano.maxMotoristas === 9999 ? 'Ilimitado' : plano.maxMotoristas}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Funcionalidades:</p>
                <div className="space-y-1">
                  {plano.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                  {plano.features.length > 3 && (
                    <p className="text-xs text-slate-500">
                      +{plano.features.length - 3} funcionalidades
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Badge className={plano.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {plano.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <span className="text-sm text-slate-600">Ordem: {plano.ordem}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal das Locadoras */}
      <Dialog open={modalLocadoras} onOpenChange={setModalLocadoras}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Locadoras e seus Planos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locadora</TableHead>
                  <TableHead>Plano Atual</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locadorasPlanos.map((locadora) => (
                  <TableRow key={locadora.id}>
                    <TableCell className="font-medium">{locadora.nome}</TableCell>
                    <TableCell>{getPlanoNome(locadora.planoAtual)}</TableCell>
                    <TableCell>{new Date(locadora.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(locadora.dataVencimento).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{getStatusBadge(locadora.status)}</TableCell>
                    <TableCell>{formatCurrency(locadora.valorPago)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Alterar Plano",
                              description: `Alterando plano da ${locadora.nome}`,
                            });
                          }}
                          title="Alterar plano"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Renovar Assinatura",
                              description: `Renovando assinatura da ${locadora.nome}`,
                            });
                          }}
                          title="Renovar assinatura"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Suspender Locadora",
                              description: `Suspendendo acesso da ${locadora.nome}`,
                            });
                          }}
                          title="Suspender locadora"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}