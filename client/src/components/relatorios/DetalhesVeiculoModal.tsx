import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Car, User, FileText, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface DetalhesVeiculoModalProps {
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
    marca: string;
    cor: string;
    ano: number;
  };
  analiseFinanceira: {
    receitaMensal: number;
    despesasMensais: number;
    lucro: number;
    margem: number;
    status: string;
  };
  motorista?: {
    nome: string;
    cpf: string;
  };
  despesasDetalhadas: Array<{
    categoria: string;
    valor: number;
    percentual: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    receita: number;
    despesas: number;
    lucro: number;
  }>;
  historico?: {
    receitas: Array<{
      id: string;
      tipo: string;
      descricao: string;
      valor: number;
      data: string;
    }>;
    despesas: Array<{
      id: string;
      tipo: string;
      categoria: string;
      descricao: string;
      valor: number;
      data: string;
    }>;
  };
}

export function DetalhesVeiculoModal({
  veiculo,
  analiseFinanceira,
  motorista,
  despesasDetalhadas,
  evolucaoMensal,
  historico
}: DetalhesVeiculoModalProps) {
  const [open, setOpen] = useState(false);

  const categoriasLabels = {
    combustivel: 'Combustível',
    manutencao: 'Manutenção',
    seguro: 'Seguro',
    ipva: 'IPVA',
    multa: 'Multa',
    financiamento: 'Financiamento',
    licenciamento: 'Licenciamento',
    lavagem: 'Lavagem',
    pneus: 'Pneus',
    revisao: 'Revisão',
    reparo: 'Reparo',
    outros: 'Outros'
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'lucrativo':
        return 'bg-green-100 text-green-800';
      case 'parado':
        return 'bg-gray-100 text-gray-800';
      case 'prejuizo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getEficiencia = (margem: number) => {
    if (margem >= 30) return { label: 'Alta', color: 'text-green-600' };
    if (margem >= 15) return { label: 'Média', color: 'text-yellow-600' };
    return { label: 'Baixa', color: 'text-red-600' };
  };

  const getRisco = (margem: number) => {
    if (margem >= 25) return { label: 'Baixo', color: 'text-green-600' };
    if (margem >= 10) return { label: 'Médio', color: 'text-yellow-600' };
    return { label: 'Alto', color: 'text-red-600' };
  };

  const getRecomendacao = (margem: number, status: string) => {
    if (status === 'Parado') return 'Colocar veículo em operação para gerar receita';
    if (margem >= 25) return 'Manter operação atual - Performance excelente';
    if (margem >= 15) return 'Revisar despesas e otimizar custos operacionais';
    if (margem >= 5) return 'Análise detalhada de viabilidade necessária';
    return 'Considerar retirada do veículo de operação';
  };

  const eficiencia = getEficiencia(analiseFinanceira.margem);
  const risco = getRisco(analiseFinanceira.margem);
  const recomendacao = getRecomendacao(analiseFinanceira.margem, analiseFinanceira.status);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Análise Financeira Detalhada - {veiculo.placa}
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
                {despesasDetalhadas.length > 0 ? (
                  despesasDetalhadas.map((despesa) => (
                    <div key={despesa.categoria} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${despesa.categoria === 'IPVA' ? 'bg-orange-500' : 
                          despesa.categoria === 'Seguro' ? 'bg-blue-500' : 
                          despesa.categoria === 'Rastreador' ? 'bg-green-500' : 
                          despesa.categoria === 'Financiamento' ? 'bg-purple-500' : 
                          'bg-gray-500'}`}
                        />
                        <span className="text-sm font-medium">{despesa.categoria}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatCurrency(despesa.valor)}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({despesa.percentual.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    Nenhuma despesa registrada para este veículo no período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico Financeiro Detalhado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Histórico Financeiro Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="receitas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="receitas">Receitas</TabsTrigger>
                  <TabsTrigger value="despesas">Despesas</TabsTrigger>
                </TabsList>

                <TabsContent value="receitas" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">Histórico de Receitas</span>
                    </div>
                    
                    {historico?.receitas && historico.receitas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historico.receitas.map((receita) => (
                              <TableRow key={receita.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {receita.data && !isNaN(new Date(receita.data).getTime()) 
                                      ? format(new Date(receita.data), 'dd/MM/yyyy', { locale: pt })
                                      : 'Data inválida'
                                    }
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    {receita.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>{receita.descricao}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                  {formatCurrency(receita.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma receita registrada para este veículo.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="despesas" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">Histórico de Despesas</span>
                    </div>
                    
                    {historico?.despesas && historico.despesas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historico.despesas.map((despesa) => (
                              <TableRow key={despesa.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {despesa.data && !isNaN(new Date(despesa.data).getTime()) 
                                      ? format(new Date(despesa.data), 'dd/MM/yyyy', { locale: pt })
                                      : 'Data inválida'
                                    }
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-red-600 border-red-600">
                                    {despesa.categoria}
                                  </Badge>
                                </TableCell>
                                <TableCell>{despesa.descricao}</TableCell>
                                <TableCell className="text-right font-bold text-red-600">
                                  {formatCurrency(despesa.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma despesa registrada para este veículo.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Análise de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Eficiência</p>
                  <p className={`text-xl font-bold ${eficiencia.color}`}>
                    {eficiencia.label}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Nível de Risco</p>
                  <p className={`text-xl font-bold ${risco.color}`}>
                    {risco.label}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-1 p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Recomendação</p>
                  <p className="text-sm font-medium mt-1">
                    {recomendacao}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Fechar */}
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}