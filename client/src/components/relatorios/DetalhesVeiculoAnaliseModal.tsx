import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface DetalhesVeiculoAnaliseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosVeiculo: any;
  selectedMonth: Date;
}

export function DetalhesVeiculoAnaliseModal({
  isOpen,
  onClose,
  dadosVeiculo,
  selectedMonth
}: DetalhesVeiculoAnaliseModalProps) {
  if (!dadosVeiculo) return null;

  const { veiculo, analiseFinanceira, motorista, despesasDetalhadas, evolucaoMensal } = dadosVeiculo;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'lucrativo':
        return 'bg-green-100 text-green-800';
      case 'parado':
        return 'bg-gray-100 text-gray-800';
      case 'prejuízo':
      case 'prejuizo':
        return 'bg-red-100 text-red-800';
      case 'equilibrado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'ipva':
        return 'bg-orange-500';
      case 'seguro':
        return 'bg-blue-500';
      case 'rastreador':
        return 'bg-green-500';
      case 'financiamento':
        return 'bg-purple-500';
      case 'manutenção':
        return 'bg-red-500';
      case 'multas':
        return 'bg-pink-500';
      case 'lavagem':
        return 'bg-cyan-500';
      case 'licenciamento':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Análise Financeira Detalhada - {veiculo.placa}
            <span className="text-sm text-gray-500 ml-2">
              ({format(selectedMonth, 'MMMM/yyyy', { locale: pt })})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações do Veículo</span>
                <Badge className={getStatusColor(analiseFinanceira.status)}>
                  {analiseFinanceira.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Modelo</p>
                  <p className="font-semibold">{veiculo.marca} {veiculo.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Motorista</p>
                  <p className="font-semibold">{motorista?.nome || 'Sem motorista'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Placa</p>
                  <p className="font-semibold">{veiculo.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ano</p>
                  <p className="font-semibold">{veiculo.ano}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Receita Mensal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analiseFinanceira.receitaMensal)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-600">Despesas Mensais</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(analiseFinanceira.despesasMensais)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${analiseFinanceira.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(analiseFinanceira.lucro)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-lg">%</span>
                  </div>
                  <p className="text-sm text-gray-600">Margem de Lucro</p>
                  <p className={`text-2xl font-bold ${analiseFinanceira.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analiseFinanceira.margem.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento de Despesas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhamento de Despesas Mensais</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {despesasDetalhadas && despesasDetalhadas.length > 0 ? (
                  despesasDetalhadas.map((despesa: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getCategoriaColor(despesa.categoria)}`} />
                        <span className="text-sm font-medium">{despesa.categoria}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatCurrency(despesa.valor)}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({despesa.percentual.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhuma despesa registrada para este veículo no período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evolução Mensal */}
          {evolucaoMensal && evolucaoMensal.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução dos Últimos Meses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evolucaoMensal.map((mes: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{mes.mes}</span>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-600">Receita</p>
                          <p className="font-bold text-green-600">{formatCurrency(mes.receita)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Despesas</p>
                          <p className="font-bold text-red-600">{formatCurrency(mes.despesas)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Lucro</p>
                          <p className={`font-bold ${mes.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(mes.lucro)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}