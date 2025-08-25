/**
 * Modal para visualizar detalhes do motorista
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { User, Phone, Mail, Calendar, CreditCard, FileText, Image, Upload, X } from 'lucide-react';
import { Motorista } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VisualizarMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
}

export function VisualizarMotoristaModal({ open, onOpenChange, motorista }: VisualizarMotoristaModalProps) {
  const [imagens, setImagens] = useState<string[]>([]);
  const [loadingImagens, setLoadingImagens] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isLocadora = profile?.tipo === 'locadora';

  // Carregar imagens do motorista
  useEffect(() => {
    if (!motorista || !open) return;

    const carregarImagens = async () => {
      setLoadingImagens(true);
      try {
        const response = await fetch(`/api/motoristas/${motorista.id}/imagens`);
        if (response.ok) {
          const data = await response.json();
          console.log('[VISUALIZAR] Dados da API:', data);
          // Converter documentos em array de URLs válidas
          const imagensArray = Object.values(data.documentos || {})
            .filter(url => url !== null) as string[];
          console.log('[VISUALIZAR] Array de imagens:', imagensArray);
          setImagens(imagensArray);
        }
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
      } finally {
        setLoadingImagens(false);
      }
    };

    carregarImagens();
  }, [motorista, open]);

  if (!motorista) return null;

  // Função para upload de imagens
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !motorista) return;

    const newImages = Array.from(files);
    const totalImages = imagens.length + newImages.length;

    if (totalImages > 5) {
      toast({
        title: "Limite de imagens",
        description: "Você pode adicionar no máximo 5 imagens por motorista",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo e tamanho das imagens
    const validImages = newImages.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive",
        });
        return false;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} é maior que 5MB`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validImages.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('motoristaId', motorista.id);

      validImages.forEach((file, index) => {
        // Usar nomes de campo específicos baseados no mapeamento do backend
        const fieldNames = ['fotoPerfil', 'cnhImagem', 'fotoComCnh', 'comprovanteEndereco', 'fotoExtra', 'fotoExtra2'];
        const fieldName = fieldNames[index] || 'fotoExtra2';
        formData.append(fieldName, file);
      });

      const response = await fetch(`/api/motoristas/${motorista.id}/upload-imagens`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload das imagens');
      }

      toast({
        title: "Imagens enviadas com sucesso!",
        description: `${validImages.length} imagem(s) adicionada(s)`,
      });

      // Recarregar imagens
      const imagensResponse = await fetch(`/api/motoristas/${motorista.id}/imagens`);
      if (imagensResponse.ok) {
        const data = await imagensResponse.json();
        // Converter documentos em array de URLs válidas
        const imagensArray = Object.values(data.documentos || {})
          .filter(url => url !== null) as string[];
        setImagens(imagensArray);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as imagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Função para excluir imagem
  const handleDeleteImage = async (index: number) => {
    if (!motorista) return;

    try {
      const response = await fetch(`/api/motoristas/${motorista.id}/imagens/${index + 1}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir imagem');
      }

      toast({
        title: "Imagem excluída",
        description: "A imagem foi removida com sucesso",
      });

      // Recarregar imagens
      const imagensResponse = await fetch(`/api/motoristas/${motorista.id}/imagens`);
      if (imagensResponse.ok) {
        const data = await imagensResponse.json();
        // Converter documentos em array de URLs válidas
        const imagensArray = Object.values(data.documentos || {})
          .filter(url => url !== null) as string[];
        setImagens(imagensArray);
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'vencido':
        return <Badge variant="destructive">CNH Vencida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {motorista.nome}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do motorista
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(motorista.status)}
            </div>
          </div>

          {/* Dados Compactos */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="text-sm">{motorista.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="text-sm font-mono">{motorista.cpf}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                  <p className="text-sm">{motorista.dataNascimento || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {motorista.telefone || motorista.contato}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {motorista.email || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                  <p className="text-sm">
                    {motorista.rua}, {motorista.numero} - {motorista.bairro}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {motorista.cidade} - {motorista.estado} | CEP: {motorista.cep}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número da CNH</p>
                  <p className="text-sm font-mono">{motorista.cnh}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                  <p className="text-sm">{motorista.categoria}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencimento CNH</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {motorista.vencimentoCnh}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-4 h-4" />
                Imagens do Motorista
                {isLocadora && imagens.length < 5 && (
                  <span className="text-sm text-muted-foreground">({imagens.length}/5)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload de imagens (apenas para locadoras) */}
              {isLocadora && imagens.length < 5 && (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="flex-1"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => handleImageUpload((e.target as HTMLInputElement).files);
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {/* Exibição das imagens */}
              {loadingImagens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : imagens.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagens.map((imagemUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imagemUrl}
                        alt={`Imagem ${index + 1} do motorista`}
                        className="w-full h-32 object-cover rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => window.open(imagemUrl, '_blank')}
                        onError={(e) => {
                          console.log('[VISUALIZAR] Erro ao carregar imagem:', imagemUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('[VISUALIZAR] Imagem carregada com sucesso:', imagemUrl);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique para ampliar
                        </span>
                      </div>
                      {/* Botão de excluir (apenas para locadoras) */}
                      {isLocadora && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(index);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma imagem cadastrada</p>
                  {isLocadora && (
                    <p className="text-xs mt-2">Use o campo acima para adicionar imagens</p>
                  )}
                </div>
              )}
              
              {/* Indicador de upload */}
              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  <span className="text-sm text-muted-foreground">Enviando imagens...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}