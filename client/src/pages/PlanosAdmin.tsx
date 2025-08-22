import { useState } from 'react';
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
  Building2
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
    id: 'basico',
    nome: 'Básico',
    preco: 49,
    limiteVeiculos: 5,
    descricao: 'Para locadoras iniciantes',
    recursos: [
      'Até 5 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos profissionais',
      'Controle de pagamentos',
      'Controle de infrações e multas',
      'Controle financeiro com lucros/perdas reais',
      'Controle de manutenções',
      'Upload de documentos'
    ],
    icone: 'Car',
    cor: 'blue'
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    preco: 99,
    limiteVeiculos: 20,
    descricao: 'Para locadoras em crescimento',
    recursos: [
      'Até 20 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos profissionais',
      'Controle de pagamentos',
      'Controle de infrações e multas',
      'Controle financeiro com lucros/perdas reais',
      'Controle de manutenções',
      'Upload de documentos'
    ],
    icone: 'Rocket',
    cor: 'cyan',
    popular: true
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    preco: 200,
    limiteVeiculos: 50,
    descricao: 'Para frotas médias',
    recursos: [
      'Até 50 veículos na frota',
      'Gestão completa de motoristas',
      'Contratos automáticos profissionais',
      'Controle de pagamentos',
      'Controle de infrações e multas',
      'Controle financeiro com lucros/perdas reais',
      'Controle de manutenções',
      'Upload de documentos'
    ],
    icone: 'Zap',
    cor: 'green'
  },
  {
    id: 'master',
    nome: 'Master',
    preco: 500,
    limiteVeiculos: null,
    descricao: 'Para grandes frotas',
    recursos: [
      'Veículos ilimitados',
      'Gestão completa de motoristas',
      'Contratos automáticos profissionais',
      'Controle de pagamentos',
      'Controle de infrações e multas',
      'Controle financeiro com lucros/perdas reais',
      'Controle de manutenções',
      'Suporte 24/7 e treinamento personalizado'
    ],
    icone: 'Crown',
    cor: 'purple'
  }
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Car': return Car;
    case 'Rocket': return Rocket;
    case 'Zap': return Zap;
    case 'Crown': return Crown;
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

  // Usar dados do servidor se disponíveis, senão usar padrão
  const planos = planosFromServer || planosData;

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
    onSuccess: () => {
      toast({
        title: "Plano atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/planos'] });
      setEditingPlano(null);
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
    setEditingPlano(planoId);
  };

  const handleCancel = () => {
    setEditingPlano(null);
  };

  const handleInputChange = (planoId: string, field: keyof Plano, value: any) => {
    const updatedPlanos = planos.map(p => 
      p.id === planoId ? { ...p, [field]: value } : p
    );
    if (!planosFromServer) {
      setPlanosData(updatedPlanos);
    }
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
            {planos.map((plano) => {
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
                              defaultValue={plano.preco}
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
                              defaultValue={plano.limiteVeiculos || 0}
                              className="mt-1"
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                const limite = value === 0 ? null : value;
                                handleInputChange(plano.id, 'limiteVeiculos', limite);
                              }}
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
                      {plano.recursos.slice(0, 4).map((recurso, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <CheckCircle className={`h-4 w-4 ${colors.check} mr-2 mt-0.5 flex-shrink-0`} />
                          <span>{recurso}</span>
                        </li>
                      ))}
                      {plano.recursos.length > 4 && (
                        <li className="text-xs text-gray-500 text-center">
                          +{plano.recursos.length - 4} recursos adicionais
                        </li>
                      )}
                    </ul>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            onClick={() => handleSave(planos.find(p => p.id === plano.id)!)}
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
      </div>
  );
}