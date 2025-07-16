import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Wrench, Calendar, Clock, DollarSign, MapPin, Phone } from 'lucide-react';
import type { Manutencao } from '@shared/schema';

interface VisualizarManutencaoModalProps {
  open: boolean;
  onClose: () => void;
  manutencao: Manutencao | null;
}

export function VisualizarManutencaoModal({ open, onClose, manutencao }: VisualizarManutencaoModalProps) {
  if (!manutencao) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-gray-100 text-gray-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'urgente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return 'Baixa';
      case 'normal':
        return 'Normal';
      case 'alta':
        return 'Alta';
      case 'urgente':
        return 'Urgente';
      default:
        return prioridade;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'preventiva':
        return 'Preventiva';
      case 'corretiva':
        return 'Corretiva';
      case 'revisao':
        return 'Revisão';
      case 'outros':
        return 'Outros';
      default:
        return tipo;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Detalhes da Manutenção
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cabeçalho com informações do veículo */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{manutencao.veiculoModelo}</CardTitle>
                  <p className="text-sm text-gray-500">{manutencao.veiculoPlaca}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(manutencao.status)}>
                    {getStatusLabel(manutencao.status)}
                  </Badge>
                  <Badge className={getPrioridadeColor(manutencao.prioridade)}>
                    {getPrioridadeLabel(manutencao.prioridade)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tipo de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{getTipoLabel(manutencao.tipo)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Oficina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{manutencao.oficina}</p>
                {manutencao.contato && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <p className="text-sm text-gray-600">{manutencao.contato}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Descrição */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Descrição do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{manutencao.descricao}</p>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data de Início:</span>
                <span className="text-sm font-medium">{formatDate(manutencao.dataInicio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Prevista:</span>
                <span className="text-sm font-medium">{formatDate(manutencao.dataPrevisao)}</span>
              </div>
              {manutencao.dataConclusao && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data de Conclusão:</span>
                  <span className="text-sm font-medium">{formatDate(manutencao.dataConclusao)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores */}
          {(manutencao.valorOrcamento || manutencao.valorFinal) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {manutencao.valorOrcamento && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Orçamento:</span>
                    <span className="text-sm font-medium">
                      R$ {parseFloat(manutencao.valorOrcamento).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                {manutencao.valorFinal && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor Final:</span>
                    <span className="text-sm font-bold text-green-600">
                      R$ {parseFloat(manutencao.valorFinal).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quilometragem */}
          {(manutencao.quilometragemInicio || manutencao.quilometragemFim) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quilometragem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {manutencao.quilometragemInicio && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Inicial:</span>
                    <span className="text-sm font-medium">{manutencao.quilometragemInicio.toLocaleString()} km</span>
                  </div>
                )}
                {manutencao.quilometragemFim && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Final:</span>
                    <span className="text-sm font-medium">{manutencao.quilometragemFim.toLocaleString()} km</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Peças Substituídas */}
          {manutencao.pecasSubstituidas && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Peças Substituídas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{manutencao.pecasSubstituidas}</p>
              </CardContent>
            </Card>
          )}

          {/* Próxima Manutenção */}
          {manutencao.proximaManutencao && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Próxima Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{formatDate(manutencao.proximaManutencao)}</p>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {manutencao.observacoes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{manutencao.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Botão de fechar */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}