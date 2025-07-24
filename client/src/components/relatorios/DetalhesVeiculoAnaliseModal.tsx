import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp, TrendingDown, DollarSign, Calendar, Wrench, Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
          <div className="grid grid-cols-4 gap-4">
            <Card className="h-32 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 flex items-center justify-between space-y-0.5">
                <div>
                  <div className="text-xs text-gray-600">Receita Mensal</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(receitaMensal)}
                  </div>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600 ml-auto" />
              </CardContent>
            </Card>

            <Card className="h-32 bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-4 flex items-center justify-between space-y-0.5">
                <div>
                  <div className="text-xs text-gray-600">Despesas Mensais</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(despesasMensais)}
                  </div>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600 ml-auto" />
              </CardContent>
            </Card>

            <Card className={`h-32 bg-gradient-to-br ${lucroLiquido >= 0 ? 'from-blue-50 to-blue-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-4 flex items-center justify-between space-y-0.5">
                <div>
                  <div className="text-xs text-gray-600">Lucro Líquido</div>
                  <div className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {lucroLiquido >= 0 ? '' : '-'}{formatCurrency(Math.abs(lucroLiquido))}
                  </div>
                </div>
                <DollarSign className={`w-10 h-10 ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'} ml-auto`} />
              </CardContent>
            </Card>

            <Card className={`h-32 bg-gradient-to-br ${margemLucro >= 0 ? 'from-purple-50 to-purple-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-4 flex items-center justify-between space-y-0.5">
                <div>
                  <div className="text-xs text-gray-600">Margem de Lucro</div>
                  <div className={`text-xl font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margemLucro.toFixed(1)}%
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full ${margemLucro >= 0 ? 'bg-green-600' : 'bg-red-600'} ml-auto flex items-center justify-center text-white font-bold`}>
                  %
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

          {/* Análise de Lucratividade */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Lucratividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Status do Veículo</div>
                    <Badge className={`${
                      margemLucro >= 30 ? 'bg-green-500 text-white' :
                      margemLucro >= 10 ? 'bg-yellow-500 text-white' :
                      margemLucro >= 0 ? 'bg-orange-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {margemLucro >= 30 ? 'EXCELENTE' :
                       margemLucro >= 10 ? 'SATISFATÓRIA' :
                       margemLucro >= 0 ? 'ATENÇÃO' :
                       'PREJUÍZO'}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Recomendação</div>
                    <div className={`font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margemLucro >= 0 ? 'MANTER EM OPERAÇÃO' : 'AVALIAR VIABILIDADE'}
                    </div>
                  </div>
                </div>
                
                {margemLucro >= 0 ? (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-800 font-medium mb-2">✅ Veículo Lucrativo</div>
                    <div className="text-sm text-green-700">
                      Este veículo está gerando lucro de {formatCurrency(lucroLiquido)} por mês 
                      com margem de {margemLucro.toFixed(1)}%. Recomendamos manter em operação.
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-red-800 font-medium mb-2">❌ Veículo em Prejuízo</div>
                    <div className="text-sm text-red-700">
                      Este veículo está gerando prejuízo de {formatCurrency(Math.abs(lucroLiquido))} por mês. 
                      Avalie reduzir custos ou considerar substituição.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Aluguéis Recentes */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Aluguéis Recentes (3 mais recentes)
                  </h4>
                  <div className="space-y-2">
                    {dadosVeiculo?.historico?.alugueis?.slice(0, 3).map((aluguel: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <span className="font-medium">{aluguel.motoristaNome}</span>
                          <span className="text-gray-500 ml-2">
                            {formatDate(aluguel.dataInicio)} - {aluguel.dataFim ? formatDate(aluguel.dataFim) : 'Em andamento'}
                          </span>
                        </div>
                        <Badge variant="outline" className={aluguel.status === 'ativo' ? 'text-green-600' : 'text-gray-600'}>
                          {aluguel.status}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        Nenhum aluguel encontrado
                      </div>
                    )}
                  </div>
                </div>

                {/* Manutenções Recentes */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Manutenções Recentes (3 mais recentes)
                  </h4>
                  <div className="space-y-2">
                    {dadosVeiculo?.historico?.manutencoes?.slice(0, 3).map((manutencao: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <span className="font-medium">{manutencao.descricao}</span>
                          <span className="text-gray-500 ml-2">
                            {manutencao.dataConclusao ? formatDate(manutencao.dataConclusao) : formatDate(manutencao.data)}
                          </span>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={manutencao.status === 'concluida' ? 'text-green-600' : 'text-yellow-600'}>
                            {manutencao.status}
                          </Badge>
                          {manutencao.valorFinal && (
                            <div className="text-xs text-gray-500 mt-1">
                              {formatCurrency(parseFloat(manutencao.valorFinal))}
                            </div>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        Nenhuma manutenção encontrada
                      </div>
                    )}
                  </div>
                </div>

                {/* Despesas Recentes */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Despesas Recentes (3 mais recentes)
                  </h4>
                  <div className="space-y-2">
                    {dadosVeiculo?.historico?.despesas?.slice(0, 3).map((despesa: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <span className="font-medium">{despesa.descricao}</span>
                          <span className="text-gray-500 ml-2">
                            {formatDate(despesa.data)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(parseFloat(despesa.valor))}</div>
                          <div className="text-xs text-gray-500">{despesa.categoria}</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        Nenhuma despesa encontrada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}