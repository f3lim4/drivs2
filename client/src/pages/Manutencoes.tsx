import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Wrench, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useManutencoes } from '@/hooks/useManutencoes';
import { NovaManutencaoModal } from '@/components/manutencoes/NovaManutencaoModal';
import { EditarManutencaoModal } from '@/components/manutencoes/EditarManutencaoModal';
import { VisualizarManutencaoModal } from '@/components/manutencoes/VisualizarManutencaoModal';
import { NovoLocalModal } from '@/components/locais/NovoLocalModal';
import { formatDate } from '@/lib/utils';
import type { Manutencao } from '@shared/schema';

export default function Manutencoes() {
  const { manutencoes, isLoading, deleteManutencao, isDeleting } = useManutencoes();
  const [novaManutencaoModalOpen, setNovaManutencaoModalOpen] = useState(false);
  const [novoLocalModalOpen, setNovoLocalModalOpen] = useState(false);
  const [editarManutencaoModal, setEditarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });
  const [visualizarManutencaoModal, setVisualizarManutencaoModal] = useState<{ open: boolean; manutencao: Manutencao | null }>({ open: false, manutencao: null });

  const handleDeleteManutencao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta manutenção?')) {
      deleteManutencao(id);
    }
  };

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manutenções</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          Manutenções
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setNovoLocalModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cadastrar Locais
          </Button>
          <Button onClick={() => setNovaManutencaoModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>
      </div>

      {manutencoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma manutenção encontrada</h3>
            <p className="text-gray-500">Clique no botão acima para agendar uma nova manutenção</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {manutencoes.map((manutencao) => (
            <Card key={manutencao.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{manutencao.veiculoModelo}</CardTitle>
                    <p className="text-sm text-gray-500">{manutencao.veiculoPlaca}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={getStatusColor(manutencao.status)}>
                      {getStatusLabel(manutencao.status)}
                    </Badge>
                    <Badge className={getPrioridadeColor(manutencao.prioridade)}>
                      {getPrioridadeLabel(manutencao.prioridade)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{getTipoLabel(manutencao.tipo)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{formatDate(manutencao.dataInicio)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Previsão: {formatDate(manutencao.dataPrevisao)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{manutencao.descricao}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Oficina:</span>
                    <span className="text-sm">{manutencao.oficina}</span>
                  </div>
                  
                  {manutencao.valorFinal && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valor:</span>
                      <span className="text-sm font-bold text-green-600">
                        R$ {parseFloat(manutencao.valorFinal).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisualizarManutencaoModal({ open: true, manutencao })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditarManutencaoModal({ open: true, manutencao })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteManutencao(manutencao.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NovaManutencaoModal
        open={novaManutencaoModalOpen}
        onClose={() => setNovaManutencaoModalOpen(false)}
      />

      <EditarManutencaoModal
        open={editarManutencaoModal.open}
        onClose={() => setEditarManutencaoModal({ open: false, manutencao: null })}
        manutencao={editarManutencaoModal.manutencao}
      />

      <VisualizarManutencaoModal
        open={visualizarManutencaoModal.open}
        onClose={() => setVisualizarManutencaoModal({ open: false, manutencao: null })}
        manutencao={visualizarManutencaoModal.manutencao}
      />

      <NovoLocalModal
        open={novoLocalModalOpen}
        onClose={() => setNovoLocalModalOpen(false)}
      />
    </div>
  );
}