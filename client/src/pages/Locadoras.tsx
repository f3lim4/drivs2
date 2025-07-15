/**
 * Página de Gerenciamento de Locadoras
 * Permite ao admin cadastrar e gerenciar locadoras
 */

import { useState } from 'react';
import { Plus, Search, Filter, Building, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrivsHeader } from '@/components/layout/DrivsHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { useLocadoras } from '@/hooks/useLocadoras';
import { Locadora } from '@/types/locadora';
import { convertToModalFormat, filterLocadoras } from '@/utils/locadoraHelpers';
import { LocadorasTable } from '@/components/locadoras/LocadorasTable';
import { NovaLocadoraModal } from '@/components/locadoras/NovaLocadoraModal';
import { EditarLocadoraModal } from '@/components/locadoras/EditarLocadoraModal';
import { ExcluirLocadoraDialog } from '@/components/locadoras/ExcluirLocadoraDialog';
import { VisualizarLocadoraModal } from '@/components/locadoras/VisualizarLocadoraModal';

export default function Locadoras() {
  const { locadoras, deleteLocadora, fetchLocadoras } = useLocadoras();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [locadoraSelecionada, setLocadoraSelecionada] = useState<Locadora | null>(null);

  const filteredLocadoras = filterLocadoras(locadoras, searchTerm);

  const handleView = (locadora: Locadora) => {
    setLocadoraSelecionada(locadora);
    setShowVisualizarModal(true);
  };

  const handleEdit = (locadora: Locadora) => {
    setLocadoraSelecionada(locadora);
    setShowEditarModal(true);
  };

  const handleDelete = (locadora: Locadora) => {
    setLocadoraSelecionada(locadora);
    setShowExcluirDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (locadoraSelecionada) {
      await deleteLocadora(locadoraSelecionada.id);
      setShowExcluirDialog(false);
      setLocadoraSelecionada(null);
    }
  };

  // Calcula estatísticas
  const stats = {
    total: locadoras.length,
    ativas: locadoras.filter(l => l.status === 'ativa').length,
    pendentes: locadoras.filter(l => l.status === 'pendente').length,
    inativas: locadoras.filter(l => l.status === 'inativa').length,
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Locadoras"
          value={stats.total}
          icon={<BarChart3 />}
          variant="blue"
        />
        <StatCard
          title="Ativas"
          value={stats.ativas}
          icon={<CheckCircle />}
          variant="green"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={<AlertTriangle />}
          variant="yellow"
        />
        <StatCard
          title="Inativas"
          value={stats.inativas}
          icon={<Building />}
          variant="red"
        />
      </div>

      {/* Controles de busca e filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar locadora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Botão Nova Locadora */}
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowNovaModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Locadora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de locadoras */}
      <Card>
        <CardHeader>
          <CardTitle>Locadoras Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LocadorasTable
            locadoras={filteredLocadoras}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <NovaLocadoraModal
        open={showNovaModal}
        onOpenChange={setShowNovaModal}
        onSuccess={fetchLocadoras}
      />

      {locadoraSelecionada && (
        <>
          <EditarLocadoraModal
            open={showEditarModal}
            onOpenChange={setShowEditarModal}
            locadora={convertToModalFormat(locadoraSelecionada)}
          />

          <ExcluirLocadoraDialog
            open={showExcluirDialog}
            onOpenChange={setShowExcluirDialog}
            locadora={convertToModalFormat(locadoraSelecionada)}
            onConfirm={handleConfirmDelete}
          />

          <VisualizarLocadoraModal
            open={showVisualizarModal}
            onOpenChange={setShowVisualizarModal}
            locadora={convertToModalFormat(locadoraSelecionada)}
          />
        </>
      )}
    </div>
  );
}