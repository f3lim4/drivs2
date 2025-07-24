import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Car, User, DollarSign, Calendar, Wrench, FileText, Clock } from "lucide-react";

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
  
  const { veiculo: veiculoData, analiseFinanceira: analiseData, historico: historicoData, motorista } = dadosVeiculo;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    try {
      const validDate = new Date(date);
      if (isNaN(validDate.getTime())) return 'N/A';
      return validDate.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // Análise de lucratividade usando dados originais
  const receitaMensal = parseFloat(analiseData?.receitaMensal || '0');
  const despesaMensal = parseFloat(analiseData?.despesasMensais || '0');
  const lucroMensal = parseFloat(analiseData?.lucro || '0');
  const margemLucro = parseFloat(analiseData?.margem || '0');
  
  const isLucrativo = lucroMensal > 0;
  const deveManterOperacao = margemLucro > 10;

  // Recomendação
  const getRecomendacao = () => {
    if (margemLucro >= 20) {
      return {
        status: 'excelente',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        titulo: 'Excelente Performance',
        descricao: 'Veículo altamente lucrativo. Manter em operação.'
      };
    } else if (margemLucro >= 10) {
      return {
        status: 'bom',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        titulo: 'Performance Satisfatória',
        descricao: 'Veículo lucrativo. Recomendado manter em operação.'
      };
    } else if (margemLucro >= 0) {
      return {
        status: 'atencao',
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        titulo: 'Atenção Necessária',
        descricao: 'Lucro baixo. Considerar otimização de custos.'
      };
    } else {
      return {
        status: 'prejuizo',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        titulo: 'Veículo em Prejuízo',
        descricao: 'Avaliar viabilidade ou considerar retirada de operação.'
      };
    }
  };

  const recomendacao = getRecomendacao();
  const IconeRecomendacao = recomendacao.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Análise do Veículo {veiculoData?.placa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Card de Recomendação Principal */}
          <Card className={`${recomendacao.bgColor} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <IconeRecomendacao className={`h-8 w-8 ${recomendacao.color}`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${recomendacao.color}`}>
                    {recomendacao.titulo}
                  </h3>
                  <p className="text-gray-600 mt-1">{recomendacao.descricao}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isLucrativo ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(lucroMensal)}
                  </div>
                  <div className="text-sm text-gray-500">Lucro Mensal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Veículo e Análise Financeira */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informações do Veículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Placa:</span>
                    <div className="font-medium">{veiculoData?.placa}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Modelo:</span>
                    <div className="font-medium">{veiculoData?.marca} {veiculoData?.modelo}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Ano:</span>
                    <div className="font-medium">{veiculoData?.ano}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={analiseData?.status === 'Lucrativo' ? 'default' : 'secondary'}>
                      {analiseData?.status}
                    </Badge>
                  </div>
                </div>
                {motorista && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Motorista:</span>
                    </div>
                    <div className="font-medium">{motorista.nome}</div>
                    <div className="text-sm text-gray-500">{motorista.contato}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Análise Financeira */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Análise Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Receita Mensal:</span>
                    <div className="font-medium text-green-600">{formatCurrency(receitaMensal)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Despesas Mensais:</span>
                    <div className="font-medium text-red-600">{formatCurrency(despesaMensal)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Lucro Mensal:</span>
                    <div className={`font-bold ${isLucrativo ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lucroMensal)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Margem de Lucro:</span>
                    <div className={`font-bold ${isLucrativo ? 'text-green-600' : 'text-red-600'}`}>
                      {margemLucro.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Aluguéis */}
                {historicoData?.alugueis && historicoData.alugueis.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Aluguéis ({historicoData.alugueis.length})
                    </h4>
                    <div className="space-y-2">
                      {historicoData.alugueis.slice(0, 3).map((aluguel: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">{aluguel.motoristaNome}</div>
                            <div className="text-gray-500">
                              {formatDate(aluguel.dataInicio)} - {formatDate(aluguel.dataFim)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              {formatCurrency(parseFloat(aluguel.valorMensal || '0'))}
                            </div>
                            <div className="text-xs text-gray-500">mensal</div>
                          </div>
                        </div>
                      ))}
                      {historicoData.alugueis.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{historicoData.alugueis.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manutenções */}
                {historicoData?.manutencoes && historicoData.manutencoes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Manutenções ({historicoData.manutencoes.length})
                    </h4>
                    <div className="space-y-2">
                      {historicoData.manutencoes.slice(0, 3).map((manutencao: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">{manutencao.tipo || 'Manutenção'}</div>
                            <div className="text-gray-500">
                              {formatDate(manutencao.dataAgendamento)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">
                              {formatCurrency(parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0'))}
                            </div>
                            <Badge variant={manutencao.status === 'concluida' ? 'default' : 'secondary'} className="text-xs">
                              {manutencao.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {historicoData.manutencoes.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{historicoData.manutencoes.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Despesas */}
                {dadosVeiculo?.despesasDetalhadas && dadosVeiculo.despesasDetalhadas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Despesas ({dadosVeiculo.despesasDetalhadas.length})
                    </h4>
                    <div className="space-y-2">
                      {dadosVeiculo.despesasDetalhadas.slice(0, 3).map((despesa: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">{despesa.categoria || despesa.tipo || 'Despesa'}</div>
                            <div className="text-gray-500">
                              {despesa.descricao || formatDate(despesa.data)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">
                              {formatCurrency(parseFloat(despesa.valor || '0'))}
                            </div>
                            <div className="text-xs text-gray-500">{despesa.fonte || 'manual'}</div>
                          </div>
                        </div>
                      ))}
                      {dadosVeiculo.despesasDetalhadas.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dadosVeiculo.despesasDetalhadas.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pagamentos */}
                {historicoData?.pagamentos && historicoData.pagamentos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pagamentos Recentes ({historicoData.pagamentos.length})
                    </h4>
                    <div className="space-y-2">
                      {historicoData.pagamentos.slice(0, 3).map((pagamento: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">{pagamento.descricao || 'Pagamento'}</div>
                            <div className="text-gray-500">
                              {formatDate(pagamento.dataPagamento || pagamento.dataVencimento)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              {formatCurrency(parseFloat(pagamento.valorTotal || '0'))}
                            </div>
                            <Badge variant={pagamento.status === 'pago' ? 'default' : 'secondary'} className="text-xs">
                              {pagamento.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {historicoData.pagamentos.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{historicoData.pagamentos.length - 3} mais
                        </div>
                      )}
                    </div>
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