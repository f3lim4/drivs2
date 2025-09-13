import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp, TrendingDown, DollarSign, Calendar, Wrench, Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  
  // Forçar atualização dos dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      console.log('Modal aberto, forçando atualização dos dados...');
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.refetchQueries({ queryKey: ['manutencoes'] });
      queryClient.refetchQueries({ queryKey: ['despesas'] });
    }
  }, [isOpen, queryClient]);
  
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

          {/* Histórico Detalhado do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico Detalhado do Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  // Criar array unificado de eventos
                  const eventos: any[] = [];
                  
                  // Adicionar aluguéis como receitas
                  if (dadosVeiculo?.historico?.alugueis) {
                    dadosVeiculo.historico.alugueis.forEach((aluguel: any) => {
                      eventos.push({
                        tipo: 'receita',
                        data: aluguel.dataInicio,
                        descricao: `Aluguel - ${aluguel.motoristaNome}`,
                        categoria: 'Aluguel',
                        valor: aluguel.valorMensal || 0,
                        status: aluguel.status,
                        icone: <Calendar className="w-4 h-4 text-green-600" />,
                        cor: 'text-green-600'
                      });
                    });
                  }
                  
                  // Adicionar manutenções como despesas
                  if (dadosVeiculo?.historico?.manutencoes) {
                    dadosVeiculo.historico.manutencoes.forEach((manutencao: any) => {
                      eventos.push({
                        tipo: 'despesa',
                        data: manutencao.dataConclusao || manutencao.data,
                        descricao: manutencao.descricao,
                        categoria: 'Manutenção',
                        valor: parseFloat(manutencao.valorFinal || manutencao.valorEstimado || '0'),
                        status: manutencao.status,
                        icone: <Wrench className="w-4 h-4 text-red-600" />,
                        cor: 'text-red-600'
                      });
                    });
                  }
                  
                  // Adicionar despesas manuais
                  if (dadosVeiculo?.historico?.despesas) {
                    dadosVeiculo.historico.despesas.forEach((despesa: any) => {
                      eventos.push({
                        tipo: 'despesa',
                        data: despesa.data,
                        descricao: despesa.descricao,
                        categoria: despesa.categoria,
                        valor: parseFloat(despesa.valor || '0'),
                        status: 'concluida',
                        icone: <Receipt className="w-4 h-4 text-orange-600" />,
                        cor: 'text-orange-600'
                      });
                    });
                  }
                  
                  // Ordenar por data (mais recente primeiro)
                  const eventosOrdenados = eventos
                    .filter(evento => evento.data && evento.data !== 'Invalid Date')
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .slice(0, 10); // Mostrar últimos 10 eventos
                  
                  if (eventosOrdenados.length === 0) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        Nenhum histórico encontrado para este veículo
                      </div>
                    );
                  }
                  
                  return eventosOrdenados.map((evento, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {evento.icone}
                        <div>
                          <div className="font-medium text-sm">{evento.descricao}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(evento.data)} • {evento.categoria}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-sm ${evento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {evento.tipo === 'receita' ? '+' : '-'}{formatCurrency(evento.valor)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            evento.status === 'ativo' || evento.status === 'concluida' ? 'text-green-600' :
                            evento.status === 'pendente' || evento.status === 'agendada' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}
                        >
                          {evento.status}
                        </Badge>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}