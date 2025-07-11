/**
 * Página de Gerenciamento de Locadoras
 * Permite ao admin cadastrar e gerenciar locadoras
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocadoras } from '@/hooks/useLocadoras';
import { Locadora } from '@/types/locadora';
import { convertToModalFormat, filterLocadoras } from '@/utils/locadoraHelpers';
import { LocadorasStats } from '@/components/locadoras/LocadorasStats';
import { LocadorasSearch } from '@/components/locadoras/LocadorasSearch';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Locadoras</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie as locadoras do sistema
          </p>
        </div>
        <Button onClick={() => setShowNovaModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Locadora
        </Button>
      </div>

      {/* Stats Cards */}
      <LocadorasStats locadoras={locadoras} />

      {/* Search and Filters */}
      <LocadorasSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Table */}
      <LocadorasTable
        locadoras={filteredLocadoras}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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