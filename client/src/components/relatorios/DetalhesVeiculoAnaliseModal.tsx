import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";

interface DetalhesVeiculoAnaliseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosVeiculo?: any;
  selectedMonth?: any;
  veiculo?: any;
  analise?: any;
  historico?: any;
}

export function DetalhesVeiculoAnaliseModal({
  isOpen,
  onClose,
  dadosVeiculo
}: DetalhesVeiculoAnaliseModalProps) {
  if (!dadosVeiculo) return null;
  
  const { veiculo: veiculoData, analiseFinanceira: analiseData } = dadosVeiculo;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Cálculos financeiros
  const receitaMensal = parseFloat(analiseData?.receitaMensal || '0');
  const despesasMensais = parseFloat(analiseData?.despesasMensais || '0');
  const lucroLiquido = receitaMensal - despesasMensais;
  const margemLucro = receitaMensal > 0 ? (lucroLiquido / receitaMensal) * 100 : 0;

  // Usar despesas reais do veículo
  const despesasDetalhadas = dadosVeiculo?.despesasDetalhadas || [];
  
  // Agrupar despesas por categoria e somar valores
  const despesasAgrupadas = despesasDetalhadas.reduce((acc: any, despesa: any) => {
    const categoria = despesa.categoria || despesa.tipo || 'Outras';
    if (!acc[categoria]) {
      acc[categoria] = { categoria, valor: 0, percentual: 0 };
    }
    acc[categoria].valor += parseFloat(despesa.valor || '0');
    return acc;
  }, {});

  // Calcular percentuais
  const despesasParaExibir = Object.values(despesasAgrupadas).map((despesa: any) => ({
    ...despesa,
    percentual: despesasMensais > 0 ? (despesa.valor / despesasMensais) * 100 : 0
  })).sort((a: any, b: any) => b.valor - a.valor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Análise do Veículo {veiculoData?.placa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">📈</div>
                <div className="text-xs text-gray-600 mb-1">Receita Mensal</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(receitaMensal)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">📉</div>
                <div className="text-xs text-gray-600 mb-1">Despesas Mensais</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(despesasMensais)}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${lucroLiquido >= 0 ? 'from-blue-50 to-blue-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">💰</div>
                <div className="text-xs text-gray-600 mb-1">Lucro Líquido</div>
                <div className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {lucroLiquido >= 0 ? '' : '-'}{formatCurrency(Math.abs(lucroLiquido))}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${margemLucro >= 0 ? 'from-purple-50 to-purple-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">%</div>
                <div className="text-xs text-gray-600 mb-1">Margem de Lucro</div>
                <div className={`text-xl font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margemLucro.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento de Despesas Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Despesas Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {despesasParaExibir.length > 0 ? despesasParaExibir.map((despesa: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        despesa.categoria === 'IPVA' || despesa.categoria === 'ipva' ? 'bg-orange-500' :
                        despesa.categoria === 'Seguro' || despesa.categoria === 'seguro' ? 'bg-blue-500' :
                        despesa.categoria === 'Rastreador' || despesa.categoria === 'rastreador' ? 'bg-green-500' :
                        despesa.categoria === 'Manutenção' || despesa.categoria === 'manutencao' ? 'bg-red-500' :
                        despesa.categoria === 'Financiamento' || despesa.categoria === 'financiamento' || despesa.categoria === 'emprestimo' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="font-medium text-sm">{despesa.categoria}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatCurrency(despesa.valor)}</div>
                      <div className="text-xs text-gray-500">({despesa.percentual.toFixed(1)}%)</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">
                    Nenhuma despesa encontrada para este veículo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}