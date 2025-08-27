import React, { useState, useEffect } from 'react';
import { X, Lightbulb, TrendingUp, AlertTriangle, Zap, Target, ArrowRight, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface RecommendationData {
  totalVeiculos: number;
  veiculosDisponivel: number;
  veiculosAlugado: number;
  totalMotoristas: number;
  motoristasAtivos: number;
  alugueisAtivos: number;
  receitaMensal: number;
  cnhVencendo: number;
  cnhVencida: number;
  pagamentosVencidos: number;
  manutencoesPendentes: number;
}

interface Recommendation {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization' | 'growth';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
}

interface RecommendationSettings {
  enabled: boolean;
  frequency: 'always' | 'daily' | 'weekly' | 'monthly';
}

interface PersonalizedRecommendationsProps {
  data: RecommendationData;
  settings?: RecommendationSettings;
  onClose: () => void;
  onAction: (route?: string) => void;
  onSettingsChange?: (settings: RecommendationSettings) => void;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  data,
  settings: initialSettings = { enabled: true, frequency: 'daily' },
  onClose,
  onAction,
  onSettingsChange
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<RecommendationSettings>(initialSettings);

  useEffect(() => {
    const generatedRecommendations = generateRecommendations(data);
    setRecommendations(generatedRecommendations);
  }, [data]);

  const generateRecommendations = (data: RecommendationData): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Recomendações urgentes
    if (data.cnhVencida > 0) {
      recommendations.push({
        id: 'cnh-vencida',
        type: 'urgent',
        title: 'CNHs Vencidas Detectadas',
        description: `${data.cnhVencida} motorista(s) com CNH vencida. Isso pode gerar multas e problemas legais.`,
        action: 'Resolver CNHs Vencidas',
        priority: 'high',
        icon: AlertTriangle,
        route: '/motoristas'
      });
    }

    if (data.cnhVencendo > 0) {
      recommendations.push({
        id: 'cnh-vencendo',
        type: 'urgent',
        title: 'CNHs Vencendo',
        description: `${data.cnhVencendo} motorista(s) com CNH vencendo nos próximos 30 dias.`,
        action: 'Verificar CNHs',
        priority: 'high',
        icon: AlertTriangle,
        route: '/motoristas'
      });
    }

    if (data.pagamentosVencidos > 0) {
      recommendations.push({
        id: 'pagamentos-vencidos',
        type: 'urgent',
        title: 'Pagamentos em Atraso',
        description: `${data.pagamentosVencidos} pagamento(s) vencido(s) precisam de atenção imediata.`,
        action: 'Verificar Pagamentos',
        priority: 'high',
        icon: AlertTriangle,
        route: '/pagamentos'
      });
    }

    // Oportunidades de crescimento
    const taxaOcupacao = data.totalVeiculos > 0 ? (data.veiculosAlugado / data.totalVeiculos) * 100 : 0;
    
    if (taxaOcupacao < 60 && data.veiculosDisponivel > 2) {
      recommendations.push({
        id: 'baixa-ocupacao',
        type: 'opportunity',
        title: 'Taxa de Ocupação Baixa',
        description: `Apenas ${Math.round(taxaOcupacao)}% da frota está alugada. ${data.veiculosDisponivel} veículos disponíveis.`,
        action: 'Estratégias de Marketing',
        priority: 'medium',
        icon: TrendingUp,
        route: '/veiculos'
      });
    }

    if (data.totalMotoristas < data.totalVeiculos && data.veiculosDisponivel > 0) {
      recommendations.push({
        id: 'mais-motoristas',
        type: 'growth',
        title: 'Oportunidade de Expansão',
        description: `Você tem ${data.veiculosDisponivel} veículos disponíveis e apenas ${data.totalMotoristas} motoristas cadastrados.`,
        action: 'Cadastrar Mais Motoristas',
        priority: 'medium',
        icon: Target,
        route: '/motoristas'
      });
    }

    // Otimizações de processo
    if (data.manutencoesPendentes > 0) {
      recommendations.push({
        id: 'manutencoes-pendentes',
        type: 'optimization',
        title: 'Manutenções Pendentes',
        description: `${data.manutencoesPendentes} veículo(s) com manutenção pendente. Agende para evitar problemas.`,
        action: 'Agendar Manutenções',
        priority: 'medium',
        icon: Zap,
        route: '/manutencoes'
      });
    }

    if (data.receitaMensal > 5000 && recommendations.length === 0) {
      recommendations.push({
        id: 'performance-excelente',
        type: 'growth',
        title: 'Performance Excelente!',
        description: `Receita mensal de R$ ${data.receitaMensal.toLocaleString('pt-BR')}. Continue expandindo!`,
        action: 'Ver Relatório Financeiro',
        priority: 'low',
        icon: TrendingUp,
        route: '/financeiro'
      });
    }

    // Se não há problemas urgentes, sugerir melhorias
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'otimização-geral',
        type: 'optimization',
        title: 'Sistema Funcionando Bem',
        description: 'Sua operação está estável. Que tal explorar novas funcionalidades?',
        action: 'Explorar Recursos Avançados',
        priority: 'low',
        icon: Lightbulb
      });
    }

    // Limitar a 3 recomendações mais importantes
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);
  };

  const getTypeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'opportunity': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'optimization': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'growth': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: Recommendation['type']) => {
    switch (type) {
      case 'urgent': return 'Urgente';
      case 'opportunity': return 'Oportunidade';
      case 'optimization': return 'Otimização';
      case 'growth': return 'Crescimento';
      default: return 'Sugestão';
    }
  };

  const handleSettingsChange = (key: keyof RecommendationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'always': return 'Sempre';
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return 'Diário';
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recomendações Personalizadas</h2>
              <p className="text-sm text-gray-600">Baseadas no perfil da sua locadora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-gray-100 p-2"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-gray-100 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Painel de Configurações */}
        {showSettings && (
          <div className="bg-gray-50 border-b px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Configurações das Recomendações</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Ativar recomendações</label>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Frequência de exibição</label>
                <Select
                  value={settings.frequency}
                  onValueChange={(value) => handleSettingsChange('frequency', value)}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Sempre</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {recommendations.map((recommendation) => (
            <Card 
              key={recommendation.id} 
              className={`border-l-4 ${getTypeColor(recommendation.type)} hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(recommendation.type)}`}>
                      <recommendation.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(recommendation.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {recommendation.description}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => onAction(recommendation.route)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {recommendation.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 rounded-b-xl">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Recomendações atualizadas com base nos dados do sistema
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;