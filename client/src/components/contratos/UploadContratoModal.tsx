/**
 * Modal para upload de contratos assinados
 */

import { useState } from 'react';
import { Upload, FileText, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contrato } from '@/types';

interface UploadContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onUploadSuccess: (contratoId: string, arquivoAssinado: string) => void;
}

export function UploadContratoModal({ 
  open, 
  onOpenChange, 
  contrato,
  onUploadSuccess 
}: UploadContratoModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é um arquivo PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !contrato) return;

    setLoading(true);
    
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Gerar nome único para o arquivo
        const fileName = `contrato_${contrato.id}_${Date.now()}.pdf`;
        
        // Enviar para o backend
        const response = await fetch(`/api/contratos/${contrato.id}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName,
            fileData: base64Data,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao fazer upload do arquivo');
        }

        const result = await response.json();
        
        // Invalidar cache para recarregar os dados
        queryClient.invalidateQueries({ queryKey: ['/api/contratos'] });
        
        onUploadSuccess(contrato.id, fileName);
        onOpenChange(false);
        setSelectedFile(null);
        
        toast({
          title: "Upload realizado",
          description: "Contrato assinado enviado com sucesso!",
        });
      };
      
      reader.readAsDataURL(selectedFile);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onOpenChange(false);
  };

  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Contrato Assinado
          </DialogTitle>
          <DialogDescription>
            Envie o contrato assinado para o cliente: <strong>{contrato.cliente}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do contrato */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-slate-700 mb-2">Detalhes do Contrato</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600">Título:</span>
                <p className="font-medium">{contrato.titulo}</p>
              </div>
              <div>
                <span className="text-slate-600">Cliente:</span>
                <p className="font-medium">{contrato.cliente}</p>
              </div>
              <div>
                <span className="text-slate-600">Valor:</span>
                <p className="font-medium">R$ {parseFloat(String(contrato.valor) || '0').toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-600">Status:</span>
                <p className="font-medium">{contrato.status}</p>
              </div>
            </div>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-3">
            <Label htmlFor="arquivo">Selecionar Arquivo PDF</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={loading}
            />
            <p className="text-sm text-slate-600">
              Apenas arquivos PDF são aceitos. Tamanho máximo: 10MB
            </p>
          </div>

          {/* Arquivo selecionado */}
          {selectedFile && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-blue-600">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}

          {/* Status do contrato atual */}
          {contrato.arquivoAssinado && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Contrato já possui arquivo assinado
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Arquivo atual: {contrato.arquivoAssinado}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Arquivo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}