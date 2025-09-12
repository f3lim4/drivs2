/**
 * Modal para upload de imagens de motoristas
 * Permite fazer upload de até 5 imagens por motorista
 */

import { useState } from 'react';
import { Upload, X, Image, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Motorista } from '@/types';

interface UploadImagensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
  onUploadSuccess: () => void;
}

export function UploadImagensModal({ 
  open, 
  onOpenChange, 
  motorista,
  onUploadSuccess 
}: UploadImagensModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // URLs das imagens do motorista
  const getImageUrl = (index: number) => {
    if (!motorista) return null;
    const imageField = `imagem${index}` as keyof Motorista;
    const imageName = motorista[imageField] as string;
    return imageName ? `/api/motoristas/${motorista.id}/imagem/${index}` : null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !motorista) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    await handleUpload(file, index);
  };

  const handleUpload = async (file: File, index: number) => {
    if (!motorista) return;
    
    setLoading(true);
    setUploadingIndex(index);
    
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Enviar para o backend
        const response = await fetch(`/api/motoristas/${motorista.id}/upload-imagem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64Data,
            imageIndex: index,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao fazer upload da imagem');
        }

        const result = await response.json();
        
        // Invalidar cache do React Query
        queryClient.invalidateQueries({ queryKey: ['/api/motoristas'] });
        
        toast({
          title: "Upload realizado",
          description: `Imagem ${index} enviada com sucesso!`,
        });
        
        onUploadSuccess();
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingIndex(null);
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!motorista) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/motoristas/${motorista.id}/imagem/${index}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar imagem');
      }

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['/api/motoristas'] });
      
      toast({
        title: "Imagem removida",
        description: `Imagem ${index} foi removida com sucesso!`,
      });
      
      onUploadSuccess();
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (index: number) => {
    if (!motorista) return;
    const imageUrl = getImageUrl(index);
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle>Gerenciar Imagens - {motorista?.nome}</DialogTitle>
          <DialogDescription>
            Faça upload de até 5 imagens para o motorista. Formatos aceitos: JPG, PNG (máximo 5MB cada).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {[1, 2, 3, 4, 5].map((index) => {
            const imageUrl = getImageUrl(index);
            const isUploading = uploadingIndex === index;
            
            return (
              <div key={index} className="relative">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imageUrl ? (
                    // Imagem existente
                    <div className="relative">
                      <img 
                        src={imageUrl} 
                        alt={`Imagem ${index}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewImage(index)}
                          disabled={loading}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(index)}
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, index)}
                            className="hidden"
                            disabled={loading}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            className="w-full"
                          >
                            {isUploading ? 'Enviando...' : 'Substituir'}
                          </Button>
                        </label>
                      </div>
                    </div>
                  ) : (
                    // Slot vazio
                    <div className="py-8">
                      <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-4">Imagem {index}</p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, index)}
                          className="hidden"
                          disabled={loading}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Upload className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar
                            </>
                          )}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}