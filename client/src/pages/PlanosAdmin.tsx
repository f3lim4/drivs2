import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Remove DrivsHeader import - será usado layout simples
import { 
  Car, 
  Rocket, 
  Zap, 
  Crown, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  Building2,
  Star
} from 'lucide-react';
// Função helper para requisições API
const apiRequest = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

interface Plano {
  id: string;
  nome: string;
  preco: number;
  limiteVeiculos: number | null; // null = ilimitados
  descricao: string;
  recursos: string[];
  icone: string;
  cor: string;
  popular?: boolean;
}

const defaultPlanos: Plano[] = [
  {
    id: 'start',
    nome: 'Start',
    preco: 50,
    limiteVeiculos: 5,
    descricao: 'Para locadoras iniciantes',
    recursos: [
      'Até 5 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos',
      'Controle de pagamentos',
      'Controle financeiro real'
    ],
    icone: 'Car',
    cor: 'blue'
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 99,
    limiteVeiculos: 20,
    descricao: 'Para locadoras em crescimento',
    recursos: [
      'Até 20 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos',
      'Controle de pagamentos',
      'Controle financeiro real'
    ],
    icone: 'Rocket',
    cor: 'cyan',
    popular: true
  },
  {
    id: 'elite',
    nome: 'Elite',
    preco: 250,
    limiteVeiculos: 50,
    descricao: 'Para frotas médias',
    recursos: [
      'Até 50 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos',
      'Controle de pagamentos',
      'Controle financeiro real'
    ],
    icone: 'Zap',
    cor: 'green'
  },
  {
    id: 'prime',
    nome: 'Prime',
    preco: 500,
    limiteVeiculos: 100,
    descricao: 'Para grandes frotas',
    recursos: [
      'Até 100 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos',
      'Controle de pagamentos',
      'Suporte telefônico'
    ],
    icone: 'Crown',
    cor: 'purple'
  },
  {
    id: 'infinity',
    nome: 'Infinity',
    preco: 0,
    limiteVeiculos: null,
    descricao: 'Para empresas premium - Preço a consultar',
    recursos: [
      'Veículos ilimitados',
      'Gestão completa premium',
      'Contratos automáticos',
      'Suporte VIP 24/7',
      'Treinamento exclusivo'
    ],
    icone: 'Star',
    cor: 'pink'
  }
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Car': return Car;
    case 'Rocket': return Rocket;
    case 'Zap': return Zap;
    case 'Crown': return Crown;
    case 'Star': return Star;
    default: return Building2;
  }
};

const getColorClasses = (cor: string) => {
  switch (cor) {
    case 'blue':
      return {
        border: 'border-blue-400/30 hover:border-blue-400/50',
        bg: 'from-blue-500/10',
        iconBg: 'from-blue-500 to-blue-600',
        text: 'text-blue-600',
        check: 'text-blue-500'
      };
    case 'cyan':
      return {
        border: 'border-2 border-cyan-400/50 hover:border-cyan-400/70',
        bg: 'from-cyan-500/15 to-purple-500/10',
        iconBg: 'from-cyan-500 to-purple-600',
        text: 'text-cyan-600',
        check: 'text-cyan-500'
      };
    case 'green':
      return {
        border: 'border-green-400/30 hover:border-green-400/50',
        bg: 'from-green-500/10',
        iconBg: 'from-green-500 to-green-600',
        text: 'text-green-600',
        check: 'text-green-500'
      };
    case 'purple':
      return {
        border: 'border-purple-400/30 hover:border-purple-400/50',
        bg: 'from-purple-500/10',
        iconBg: 'from-purple-500 to-purple-600',
        text: 'text-purple-600',
        check: 'text-purple-500'
      };
    case 'pink':
      return {
        border: 'border-pink-400/30 hover:border-pink-400/50',
        bg: 'from-pink-500/10 to-purple-500/10',
        iconBg: 'from-pink-500 to-purple-600',
        text: 'text-pink-600',
        check: 'text-pink-500'
      };
    default:
      return {
        border: 'border-gray-400/30 hover:border-gray-400/50',
        bg: 'from-gray-500/10',
        iconBg: 'from-gray-500 to-gray-600',
        text: 'text-gray-600',
        check: 'text-gray-500'
      };
  }
};

export default function PlanosAdmin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingPlano, setEditingPlano] = useState<string | null>(null);
  const [planosData, setPlanosData] = useState<Plano[]>(defaultPlanos);
  const [editingValues, setEditingValues] = useState<{[key: string]: {preco: number, limiteVeiculos: number}}>({});

  // Buscar planos do servidor (se existir API)
  const { data: planosFromServer, isLoading } = useQuery({
    queryKey: ['/api/planos'],
    enabled: isAdmin,
    retry: false,
    meta: {
      onError: () => {
        // Se não houver API de planos, usar dados padrão
        console.log('Usando planos padrão');
      }
    }
  });

  // Buscar estatísticas dos planos
  const { data: planosStats } = useQuery({
    queryKey: ['/api/planos/stats'],
    enabled: !!isAdmin
  });

  // Converter dados do servidor para array se necessário
  const planos = React.useMemo(() => {
    if (!planosFromServer) return planosData;
    
    // Se planosFromServer é um objeto com propriedades de planos, converter para array
    if (typeof planosFromServer === 'object' && !Array.isArray(planosFromServer)) {
      const serverPlanos = Object.values(planosFromServer).filter(plano => plano && typeof plano === 'object');
      
      // Mapear com dados padrão para propriedades faltantes
      return serverPlanos.map((plano: any) => {
        const defaultPlano = planosData.find(p => p.id === plano.id);
        return {
          ...defaultPlano,
          ...plano,
          recursos: plano.recursos || defaultPlano?.recursos || [],
          icone: plano.icone || defaultPlano?.icone || 'Car',
          cor: plano.cor || defaultPlano?.cor || 'blue'
        };
      });
    }
    
    // Se já é um array, usar diretamente
    if (Array.isArray(planosFromServer)) {
      return planosFromServer;
    }
    
    // Fallback para dados padrão
    return planosData;
  }, [planosFromServer, planosData]);

  const updatePlanoMutation = useMutation({
    mutationFn: async (plano: Plano) => {
      try {
        // Tentar salvar no servidor
        return await apiRequest(`/api/planos/${plano.id}`, {
          method: 'PUT',
          body: plano
        });
      } catch (error) {
        // Se não houver API, salvar localmente
        setPlanosData(prev => prev.map(p => p.id === plano.id ? plano : p));
        return plano;
      }
    },
    onSuccess: (data, variables) => {
      // Atualizar dados locais imediatamente
      setPlanosData(prev => prev.map(p => 
        p.id === variables.id ? variables : p
      ));
      
      toast({
        title: "Plano atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      
      // Limpar estado de edição
      setEditingPlano(null);
      setEditingValues(prev => {
        const newState = { ...prev };
        delete newState[variables.id];
        return newState;
      });
      
      // Invalidar cache do servidor
      queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSave = (plano: Plano) => {
    updatePlanoMutation.mutate(plano);
  };

  const handleEdit = (planoId: string) => {
    const plano = planos.find((p: any) => p.id === planoId);
    if (plano) {
      setEditingValues({
        ...editingValues,
        [planoId]: {
          preco: plano.preco || 0,
          limiteVeiculos: plano.limiteVeiculos || 0
        }
      });
    }
    setEditingPlano(planoId);
  };

  const handleCancel = () => {
    setEditingPlano(null);
    setEditingValues({});
  };

  const handleInputChange = (planoId: string, field: 'preco' | 'limiteVeiculos', value: number) => {
    setEditingValues(prev => ({
      ...prev,
      [planoId]: {
        ...prev[planoId],
        [field]: value
      }
    }));
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Planos</h1>
          <p className="text-gray-600">Configure os planos disponíveis na plataforma e seus limites de veículos.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(planos as Plano[]).map((plano: Plano) => {
              const IconComponent = getIconComponent(plano.icone);
              const colors = getColorClasses(plano.cor);
              const isEditing = editingPlano === plano.id;

              return (
                <Card key={plano.id} className={`relative transition-all duration-300 hover:shadow-lg ${colors.border}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} to-transparent rounded-lg`}></div>
                  
                  {plano.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="relative z-10 text-center pb-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-gray-900">{plano.nome}</CardTitle>
                    <p className="text-gray-600 text-sm">{plano.descricao}</p>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <div className="text-center mb-6">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`preco-${plano.id}`} className="text-sm font-medium">Preço (R$)</Label>
                            <Input
                              id={`preco-${plano.id}`}
                              type="number"
                              value={editingValues[plano.id]?.preco ?? plano.preco ?? 0}
                              className="mt-1"
                              onChange={(e) => handleInputChange(plano.id, 'preco', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`limite-${plano.id}`} className="text-sm font-medium">Limite de Veículos</Label>
                            <Input
                              id={`limite-${plano.id}`}
                              type="number"
                              placeholder="0 para ilimitados"
                              value={editingValues[plano.id]?.limiteVeiculos ?? plano.limiteVeiculos ?? 0}
                              className="mt-1"
                              onChange={(e) => handleInputChange(plano.id, 'limiteVeiculos', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            R$ {plano.preco}<span className="text-lg font-normal">/mês</span>
                          </div>
                          <div className={`${colors.text} font-medium`}>
                            {plano.limiteVeiculos ? `Até ${plano.limiteVeiculos} veículos` : 'Veículos ilimitados'}
                          </div>
                        </>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {(plano.recursos || []).slice(0, 4).map((recurso: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <CheckCircle className={`h-4 w-4 ${colors.check} mr-2 mt-0.5 flex-shrink-0`} />
                          <span>{recurso}</span>
                        </li>
                      ))}
                      {(plano.recursos || []).length > 4 && (
                        <li className="text-xs text-gray-500 text-center">
                          +{(plano.recursos || []).length - 4} recursos adicionais
                        </li>
                      )}
                    </ul>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            onClick={() => {
                              const editingData = editingValues[plano.id];
                              if (editingData) {
                                handleSave({
                                  ...plano,
                                  preco: editingData.preco,
                                  limiteVeiculos: editingData.limiteVeiculos === 0 ? null : editingData.limiteVeiculos
                                });
                              }
                            }}
                            disabled={updatePlanoMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                          <Button 
                            onClick={handleCancel}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleEdit(plano.id)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações dos Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900">Recursos Incluídos em Todos os Planos:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Gestão completa de motoristas
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Contratos automáticos profissionais
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Controle de pagamentos
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Controle de infrações e multas
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Controle financeiro com lucros/perdas reais
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Controle de manutenções
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Upload de documentos
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900">Diferencial do Plano Master:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Crown className="h-4 w-4 text-purple-500 mr-2" />
                      Suporte 24/7 dedicado
                    </li>
                    <li className="flex items-center">
                      <Crown className="h-4 w-4 text-purple-500 mr-2" />
                      Treinamento personalizado
                    </li>
                    <li className="flex items-center">
                      <Crown className="h-4 w-4 text-purple-500 mr-2" />
                      Quantidade ilimitada de veículos
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas dos Planos */}
        {planosStats && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>📊 Estatísticas dos Planos</CardTitle>
                <p className="text-gray-600">Dados de uso e receita conectados ao Stripe</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{planosStats.resumo?.totalLocadoras || 0}</div>
                    <div className="text-sm text-gray-600">Total de Locadoras</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{planosStats.resumo?.locadorasAtivas || 0}</div>
                    <div className="text-sm text-gray-600">Locadoras Ativas</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">R$ {planosStats.resumo?.receitaTotal || 0}</div>
                    <div className="text-sm text-gray-600">Receita Mensal</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Distribuição por Plano:</h4>
                  {Object.entries(planosStats.estatisticas || {}).map(([planoId, stats]: [string, any]) => (
                    <div key={planoId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{planoId.charAt(0).toUpperCase() + planoId.slice(1)}</div>
                        <div className="text-sm text-gray-600">
                          {stats.ativas} ativas de {stats.total} total ({stats.total > 0 ? Math.round((stats.ativas / stats.total) * 100) : 0}% conversão)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-lg">R$ {stats.receita}</div>
                        <div className="text-sm text-gray-600">receita mensal</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Taxa de Conversão Geral:</span>
                    <span className="font-bold text-blue-600 text-lg">{planosStats.resumo?.conversao || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
}