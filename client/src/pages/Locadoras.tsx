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
import { DesativarLocadoraDialog } from '@/components/locadoras/DesativarLocadoraDialog';
import { VisualizarLocadoraModal } from '@/components/locadoras/VisualizarLocadoraModal';

export default function Locadoras() {
  const { locadoras, deleteLocadora, updateLocadora, fetchLocadoras } = useLocadoras();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [showDesativarDialog, setShowDesativarDialog] = useState(false);
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

  const handleToggleStatus = (locadora: Locadora) => {
    setLocadoraSelecionada(locadora);
    setShowDesativarDialog(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (locadoraSelecionada) {
      const newStatus = locadoraSelecionada.status === 'ativa' ? 'inativa' : 'ativa';
      await updateLocadora(locadoraSelecionada.id, { status: newStatus });
      setShowDesativarDialog(false);
      setLocadoraSelecionada(null);
      fetchLocadoras();
    }
  };

  const handleConfirmDelete = async () => {
    if (locadoraSelecionada) {
      console.log('Iniciando exclusão da locadora:', locadoraSelecionada.id);
      await deleteLocadora(locadoraSelecionada.id);
      setShowExcluirDialog(false);
      setLocadoraSelecionada(null);
      await fetchLocadoras(); // Atualizar lista após exclusão
      console.log('Exclusão concluída e lista atualizada');
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
      {/* Cards de estatísticas com visual futurista */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">Total de Locadoras</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-xs text-blue-600">Empresas</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">Ativas</p>
                <p className="text-2xl font-bold text-green-800">{stats.ativas}</p>
                <p className="text-xs text-green-600">Operando</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-700">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.pendentes}</p>
                <p className="text-xs text-yellow-600">Aprovação</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700">Inativas</p>
                <p className="text-2xl font-bold text-red-800">{stats.inativas}</p>
                <p className="text-xs text-red-600">Suspensas</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            onToggleStatus={handleToggleStatus}
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

          <DesativarLocadoraDialog
            open={showDesativarDialog}
            onOpenChange={setShowDesativarDialog}
            locadora={locadoraSelecionada}
            onConfirm={handleConfirmToggleStatus}
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