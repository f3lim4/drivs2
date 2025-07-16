import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  useAnuncios, 
  useCreateAnuncio, 
  useUpdateAnuncio, 
  useDeleteAnuncio 
} from '@/hooks/useAnuncios';
import { useAuth } from '@/hooks/useAuth';
import { 
  Megaphone, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Anuncio, InsertAnuncio } from '@shared/schema';

export default function AnunciosAdmin() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: anuncios, isLoading } = useAnuncios();
  const createAnuncio = useCreateAnuncio();
  const updateAnuncio = useUpdateAnuncio();
  const deleteAnuncio = useDeleteAnuncio();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null);
  const [formData, setFormData] = useState<InsertAnuncio>({
    titulo: '',
    conteudo: '',
    tipo: 'info',
    prioridade: 0,
    ativo: true,
    dataExpiracao: undefined,
    autorId: profile?.id || '',
  });

  // Verificar se o usuário é admin
  if (profile?.type !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-600">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnuncio) {
        await updateAnuncio.mutateAsync({ 
          id: editingAnuncio.id, 
          data: formData 
        });
        toast({
          title: "Anúncio atualizado",
          description: "O anúncio foi atualizado com sucesso.",
        });
      } else {
        await createAnuncio.mutateAsync(formData);
        toast({
          title: "Anúncio criado",
          description: "O anúncio foi criado com sucesso.",
        });
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (anuncio: Anuncio) => {
    setEditingAnuncio(anuncio);
    setFormData({
      titulo: anuncio.titulo,
      conteudo: anuncio.conteudo,
      tipo: anuncio.tipo,
      prioridade: anuncio.prioridade,
      ativo: anuncio.ativo,
      dataExpiracao: anuncio.dataExpiracao ? new Date(anuncio.dataExpiracao).toISOString().split('T')[0] : undefined,
      autorId: anuncio.autorId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      try {
        await deleteAnuncio.mutateAsync(id);
        toast({
          title: "Anúncio excluído",
          description: "O anúncio foi excluído com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir o anúncio.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setEditingAnuncio(null);
    setFormData({
      titulo: '',
      conteudo: '',
      tipo: 'info',
      prioridade: 0,
      ativo: true,
      dataExpiracao: undefined,
      autorId: profile?.id || '',
    });
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      info: { color: 'blue', label: 'Informação' },
      warning: { color: 'yellow', label: 'Atenção' },
      success: { color: 'green', label: 'Sucesso' },
      error: { color: 'red', label: 'Erro' },
    };
    
    const badge = badges[tipo as keyof typeof badges] || badges.info;
    
    return (
      <Badge variant={badge.color === 'blue' ? 'default' : 'secondary'}>
        {badge.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: number) => {
    const labels = {
      0: { label: 'Baixa', color: 'text-green-600' },
      1: { label: 'Média', color: 'text-yellow-600' },
      2: { label: 'Alta', color: 'text-red-600' },
    };
    
    const badge = labels[prioridade as keyof typeof labels] || labels[0];
    
    return (
      <span className={`font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anúncios do Sistema</h1>
          <p className="text-gray-600 mt-1">
            Gerencie comunicados e notificações para todas as locadoras
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnuncio ? 'Editar Anúncio' : 'Novo Anúncio'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informação</SelectItem>
                      <SelectItem value="warning">Atenção</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={formData.prioridade.toString()} onValueChange={(value) => setFormData({ ...formData, prioridade: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Baixa</SelectItem>
                      <SelectItem value="1">Média</SelectItem>
                      <SelectItem value="2">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                
                <div>
                  <Label htmlFor="dataExpiracao">Data de Expiração (opcional)</Label>
                  <Input
                    id="dataExpiracao"
                    type="date"
                    value={formData.dataExpiracao || ''}
                    onChange={(e) => setFormData({ ...formData, dataExpiracao: e.target.value || undefined })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAnuncio.isPending || updateAnuncio.isPending}>
                  {editingAnuncio ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de anúncios */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando anúncios...</p>
          </div>
        ) : anuncios?.length ? (
          anuncios.map((anuncio) => (
            <Card key={anuncio.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Megaphone className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{anuncio.titulo}</CardTitle>
                      {getTipoBadge(anuncio.tipo)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Prioridade: {getPrioridadeBadge(anuncio.prioridade)}</span>
                      <span>
                        Criado em: {format(new Date(anuncio.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      {anuncio.dataExpiracao && (
                        <span>
                          Expira em: {format(new Date(anuncio.dataExpiracao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={anuncio.ativo ? 'default' : 'secondary'}>
                      {anuncio.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(anuncio)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(anuncio.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{anuncio.conteudo}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum anúncio encontrado</h3>
              <p className="text-gray-600">
                Clique em "Novo Anúncio" para criar o primeiro comunicado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}