import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtividades } from "@/hooks/useAtividades";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Activity, Car, User, FileText, Wrench, Receipt, DollarSign, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const getActivityIcon = (entidade: string) => {
  switch (entidade.toLowerCase()) {
    case 'veiculo':
    case 'veiculos':
      return Car;
    case 'motorista':
    case 'motoristas':
      return User;
    case 'contrato':
    case 'contratos':
      return FileText;
    case 'manutencao':
    case 'manutencoes':
      return Wrench;
    case 'pagamento':
    case 'pagamentos':
      return DollarSign;
    case 'despesa':
    case 'despesas':
      return Receipt;
    case 'infracao':
    case 'infracoes':
      return AlertTriangle;
    default:
      return Activity;
  }
};

const getActivityColor = (acao: string) => {
  if (acao.toLowerCase().includes('criar') || acao.toLowerCase().includes('cadastrar')) {
    return 'bg-green-500/10 text-green-700 border-green-200';
  }
  if (acao.toLowerCase().includes('editar') || acao.toLowerCase().includes('atualizar')) {
    return 'bg-blue-500/10 text-blue-700 border-blue-200';
  }
  if (acao.toLowerCase().includes('excluir') || acao.toLowerCase().includes('deletar')) {
    return 'bg-red-500/10 text-red-700 border-red-200';
  }
  return 'bg-gray-500/10 text-gray-700 border-gray-200';
};

const formatActionText = (acao: string, entidade: string, detalhes?: string) => {
  const acaoText = acao.charAt(0).toUpperCase() + acao.slice(1).toLowerCase();
  let entidadeText = '';
  
  switch (entidade.toLowerCase()) {
    case 'veiculo':
    case 'veiculos':
      entidadeText = 'veículo';
      break;
    case 'motorista':
    case 'motoristas':
      entidadeText = 'motorista';
      break;
    case 'contrato':
    case 'contratos':
      entidadeText = 'contrato';
      break;
    case 'manutencao':
    case 'manutencoes':
      entidadeText = 'manutenção';
      break;
    case 'pagamento':
    case 'pagamentos':
      entidadeText = 'pagamento';
      break;
    case 'despesa':
    case 'despesas':
      entidadeText = 'despesa';
      break;
    case 'infracao':
    case 'infracoes':
      entidadeText = 'infração';
      break;
    default:
      entidadeText = entidade.toLowerCase();
  }
  
  let text = `${acaoText} ${entidadeText}`;
  
  if (detalhes) {
    text += ` - ${detalhes}`;
  }
  
  return text;
};

export function AtividadesRecentes() {
  const { data: atividades, isLoading, error } = useAtividades();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <LoadingSpinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !atividades) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 p-6">
            Erro ao carregar atividades
          </div>
        </CardContent>
      </Card>
    );
  }

  if (atividades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 p-6">
            Nenhuma atividade registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {atividades.map((atividade) => {
              const IconComponent = getActivityIcon(atividade.entidade);
              const colorClass = getActivityColor(atividade.acao);
              const actionText = formatActionText(atividade.acao, atividade.entidade, atividade.detalhes);
              
              return (
                <div
                  key={atividade.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {actionText}
                      </p>
                      <Badge variant="outline" className={`text-xs ${colorClass}`}>
                        {atividade.acao}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Por {atividade.usuario}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(atividade.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}