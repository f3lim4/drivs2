import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, DollarSign, TrendingUp, TrendingDown, Calendar, Wrench, Receipt, AlertTriangle, User, Fuel } from 'lucide-react';
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

  const { veiculo, analiseFinanceira, motorista, despesasDetalhadas, evolucaoMensal, historico } = dadosVeiculo;

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

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="alugueis">Aluguéis</TabsTrigger>
            <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="infracoes">Infrações</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
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
          </TabsContent>

          {/* Aba Histórico de Aluguéis */}
          <TabsContent value="alugueis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Histórico de Aluguéis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico?.alugueis && historico.alugueis.length > 0 ? (
                  <div className="space-y-3">
                    {historico.alugueis.map((aluguel: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={aluguel.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {aluguel.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Período</p>
                            <p className="font-medium text-sm">
                              {aluguel.dataInicio && !isNaN(new Date(aluguel.dataInicio).getTime()) 
                                ? format(new Date(aluguel.dataInicio), 'dd/MM/yyyy', { locale: pt }) 
                                : 'Data inválida'} - {aluguel.dataFim && !isNaN(new Date(aluguel.dataFim).getTime()) 
                                ? format(new Date(aluguel.dataFim), 'dd/MM/yyyy', { locale: pt }) 
                                : 'Data inválida'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor Mensal</p>
                            <p className="font-bold text-green-600">{formatCurrency(parseFloat(aluguel.valorMensal || '0'))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Motorista</p>
                            <p className="font-medium text-sm">{aluguel.motoristaNome || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum aluguel registrado para este veículo.
                  </div>
                )}
              </CardContent>  
            </Card>
          </TabsContent>

          {/* Aba Histórico de Manutenções */}
          <TabsContent value="manutencoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Histórico de Manutenções
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico?.manutencoes && historico.manutencoes.length > 0 ? (
                  <div className="space-y-3">
                    {historico.manutencoes.map((manutencao: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={manutencao.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {manutencao.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tipo</p>
                            <p className="font-medium text-sm">{manutencao.tipo}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Descrição</p>
                            <p className="font-medium text-sm">{manutencao.descricao}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor</p>
                            <p className="font-bold text-red-600">
                              {formatCurrency(parseFloat(manutencao.valorFinal || manutencao.valorOrcamento || '0'))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data Agendamento</p>
                            <p className="font-medium text-sm">
                              {manutencao.dataAgendamento && !isNaN(new Date(manutencao.dataAgendamento).getTime())
                                ? format(new Date(manutencao.dataAgendamento), 'dd/MM/yyyy', { locale: pt })
                                : 'Data inválida'}
                            </p>
                          </div>
                          {manutencao.dataConclusao && !isNaN(new Date(manutencao.dataConclusao).getTime()) && (
                            <div>
                              <p className="text-sm text-gray-600">Data Conclusão</p>
                              <p className="font-medium text-sm">
                                {format(new Date(manutencao.dataConclusao), 'dd/MM/yyyy', { locale: pt })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma manutenção registrada para este veículo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Histórico de Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico?.pagamentos && historico.pagamentos.length > 0 ? (
                  <div className="space-y-3">
                    {historico.pagamentos.slice(0, 10).map((pagamento: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={pagamento.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {pagamento.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data Vencimento</p>
                            <p className="font-medium text-sm">
                              {pagamento.data && !isNaN(new Date(pagamento.data).getTime())
                                ? format(new Date(pagamento.data), 'dd/MM/yyyy', { locale: pt })
                                : 'Data inválida'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor</p>
                            <p className="font-bold text-blue-600">{formatCurrency(parseFloat(pagamento.valor || '0'))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tipo</p>
                            <p className="font-medium text-sm capitalize">{pagamento.tipo}</p>
                          </div>
                        </div>
                        {pagamento.observacoes && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-600">Observações</p>
                            <p className="text-sm">{pagamento.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {historico.pagamentos.length > 10 && (
                      <div className="text-center py-2 text-sm text-gray-500">
                        Mostrando os 10 pagamentos mais recentes de {historico.pagamentos.length} no total.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pagamento registrado para este veículo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Histórico de Despesas */}
          <TabsContent value="despesas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5" />
                  Histórico de Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico?.despesas && historico.despesas.length > 0 ? (
                  <div className="space-y-3">
                    {historico.despesas.map((despesa: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Categoria</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getCategoriaColor(despesa.categoria)}`} />
                              <p className="font-medium text-sm capitalize">{despesa.categoria}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data</p>
                            <p className="font-medium text-sm">
                              {despesa.data && !isNaN(new Date(despesa.data).getTime())
                                ? format(new Date(despesa.data), 'dd/MM/yyyy', { locale: pt })
                                : 'Data inválida'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor</p>
                            <p className="font-bold text-red-600">{formatCurrency(parseFloat(despesa.valor || '0'))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Forma de Pagamento</p>
                            <p className="font-medium text-sm">{despesa.formaPagamento}</p>
                          </div>
                        </div>
                        {despesa.descricao && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-600">Descrição</p>
                            <p className="text-sm">{despesa.descricao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma despesa registrada para este veículo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Histórico de Infrações */}
          <TabsContent value="infracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Histórico de Infrações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico?.infracoes && historico.infracoes.length > 0 ? (
                  <div className="space-y-3">
                    {historico.infracoes.map((infracao: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={infracao.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {infracao.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data da Infração</p>
                            <p className="font-medium text-sm">
                              {infracao.dataInfracao && !isNaN(new Date(infracao.dataInfracao).getTime())
                                ? format(new Date(infracao.dataInfracao), 'dd/MM/yyyy', { locale: pt })
                                : 'Data inválida'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor</p>
                            <p className="font-bold text-red-600">{formatCurrency(parseFloat(infracao.valor || '0'))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Responsável</p>
                            <p className="font-medium text-sm">{infracao.responsavel}</p>
                          </div>
                        </div>
                        {infracao.descricao && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-600">Descrição</p>
                            <p className="text-sm">{infracao.descricao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma infração registrada para este veículo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}