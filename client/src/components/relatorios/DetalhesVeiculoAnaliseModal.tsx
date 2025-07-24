import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
  dadosVeiculo,
  selectedMonth,
  veiculo,
  analise,
  historico
}: DetalhesVeiculoAnaliseModalProps) {
  // Debug: verificar dados recebidos
  console.log('DEBUG Modal - dadosVeiculo:', dadosVeiculo);
  console.log('DEBUG Modal - veiculo prop:', veiculo);
  console.log('DEBUG Modal - analise prop:', analise);
  console.log('DEBUG Modal - historico prop:', historico);
  
  // Suportar ambos os formatos (novo e antigo)
  const veiculoData = veiculo || dadosVeiculo?.veiculo;
  const analiseData = analise || dadosVeiculo?.analiseFinanceira;
  const historicoData = historico || dadosVeiculo?.historico;
  
  console.log('DEBUG Modal - veiculoData final:', veiculoData);
  console.log('DEBUG Modal - analiseData final:', analiseData);
  console.log('DEBUG Modal - historicoData final:', historicoData);
  
  if (!veiculoData || !analiseData) {
    console.log('DEBUG Modal - Retornando null, dados insuficientes');
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Análise de lucratividade
  const receitaMensal = parseFloat(analiseData?.receitaMensal || analiseData?.receita_mensal || '0');
  const despesaMensal = parseFloat(analiseData?.despesasMensais || analiseData?.despesas_mensais || '0');
  const lucroMensal = receitaMensal - despesaMensal;
  const margemLucro = receitaMensal > 0 ? (lucroMensal / receitaMensal) * 100 : 0;
  
  const isLucrativo = lucroMensal > 0;
  const deveManterOperacao = margemLucro > 10; // Margem mínima de 10%

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
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Car className="h-6 w-6 text-blue-600" />
            Análise de Lucratividade - {veiculoData.placa}
            <span className="text-sm font-normal text-gray-600">
              {veiculoData.marca} {veiculoData.modelo}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status de Lucratividade */}
          <Card className={`${recomendacao.bgColor} border-l-4 border-l-${recomendacao.color.replace('text-', '')}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 ${recomendacao.color}`}>
                <IconeRecomendacao className="h-5 w-5" />
                {recomendacao.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">{recomendacao.descricao}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(receitaMensal)}</p>
                  <p className="text-sm text-gray-600">Receita Mensal</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(despesaMensal)}</p>
                  <p className="text-sm text-gray-600">Despesas Mensais</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${lucroMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(lucroMensal)}
                  </p>
                  <p className="text-sm text-gray-600">Lucro Mensal</p>
                  <Badge className={`mt-1 ${margemLucro >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {margemLucro.toFixed(1)}% margem
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Simplificado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico do Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Aluguéis */}
                {historicoData?.alugueis && historicoData.alugueis.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Aluguéis ({historicoData.alugueis.length})</h4>
                    <div className="space-y-2">
                      {historicoData.alugueis.slice(0, 3).map((aluguel: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{aluguel.motoristaNome || 'N/A'}</span>
                          <span>
                            {aluguel.dataInicio && !isNaN(new Date(aluguel.dataInicio).getTime()) 
                              ? format(new Date(aluguel.dataInicio), 'dd/MM/yyyy', { locale: pt }) 
                              : 'Data inválida'} - {formatCurrency(parseFloat(aluguel.valorMensal || '0'))}
                          </span>
                          <Badge className={aluguel.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {aluguel.status}
                          </Badge>
                        </div>
                      ))}
                      {historicoData.alugueis.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          Mostrando 3 de {historicoData.alugueis.length} aluguéis
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Manutenções */}
                {historicoData?.manutencoes && historicoData.manutencoes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Manutenções ({historicoData.manutencoes.length})</h4>
                    <div className="space-y-2">
                      {historicoData.manutencoes.slice(0, 3).map((manutencao: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{manutencao.tipo} - {manutencao.descricao}</span>
                          <span>
                            {manutencao.dataAgendamento && !isNaN(new Date(manutencao.dataAgendamento).getTime())
                              ? format(new Date(manutencao.dataAgendamento), 'dd/MM/yyyy', { locale: pt })
                              : 'Data inválida'} - {formatCurrency(parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0'))}
                          </span>
                          <Badge className={manutencao.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {manutencao.status}
                          </Badge>
                        </div>
                      ))}
                      {historicoData.manutencoes.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          Mostrando 3 de {historicoData.manutencoes.length} manutenções
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Despesas */}
                {historicoData?.despesas && historicoData.despesas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Despesas ({historicoData.despesas.length})</h4>
                    <div className="space-y-2">
                      {historicoData.despesas.slice(0, 3).map((despesa: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{despesa.categoria} - {despesa.descricao}</span>
                          <span>
                            {despesa.data && !isNaN(new Date(despesa.data).getTime())
                              ? format(new Date(despesa.data), 'dd/MM/yyyy', { locale: pt })
                              : 'Data inválida'} - {formatCurrency(parseFloat(despesa.valor || '0'))}
                          </span>
                          <span className="text-xs text-gray-500">{despesa.formaPagamento}</span>
                        </div>
                      ))}
                      {historicoData.despesas.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          Mostrando 3 de {historicoData.despesas.length} despesas
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Se não houver histórico */}
                {(!historicoData?.alugueis?.length && !historicoData?.manutencoes?.length && !historicoData?.despesas?.length) && (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum histórico encontrado para este veículo</p>
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