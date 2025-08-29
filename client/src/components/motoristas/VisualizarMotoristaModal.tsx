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
import { User, Phone, Mail, Calendar, Image } from 'lucide-react';
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
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  const [imageLoading, setImageLoading] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();

  // Carregar imagens do motorista
  useEffect(() => {
    if (!motorista || !open) return;

    const carregarImagens = async () => {
      setLoadingImagens(true);
      try {
        console.log(`[DEBUG] Buscando imagens para motorista: ${motorista.id}`);
        const response = await fetch(`/api/motoristas/${motorista.id}/imagens`);
        console.log(`[DEBUG] Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DEBUG] Dados recebidos:', data);
          
          // Converter documentos em array de URLs válidas
          const imagensArray = Object.values(data.documentos || {})
            .filter(url => url !== null && url !== undefined) as string[];
          
          console.log('[DEBUG] Array de imagens filtrado:', imagensArray);
          setImagens(imagensArray);
          // Reset dos estados de erro e loading
          setImageErrors({});
          const initialLoading: {[key: number]: boolean} = {};
          imagensArray.forEach((_, index) => {
            initialLoading[index] = true;
          });
          setImageLoading(initialLoading);
        } else {
          console.error(`[DEBUG] Erro na resposta: ${response.status} - ${response.statusText}`);
          const errorData = await response.text();
          console.error('[DEBUG] Dados do erro:', errorData);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="destructive">Inativo</Badge>;
      case 'suspenso':
        return <Badge variant="secondary">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {motorista.nome}
          </DialogTitle>
          <DialogDescription>
            Dados completos do motorista cadastrado no sistema.
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

          {/* Dados Organizados */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              
              {/* Linha 1: Nome, CPF e RG */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="text-sm">{motorista.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="text-sm font-mono">{motorista.cpf}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RG</p>
                  <p className="text-sm font-mono">{motorista.rg || 'Não informado'}</p>
                </div>
              </div>

              {/* Linha 2: Data de Nascimento, Número CNH e Categoria */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                  <p className="text-sm">{motorista.dataNascimento || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número da CNH</p>
                  <p className="text-sm font-mono">{motorista.cnh}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                  <p className="text-sm">{motorista.categoria}</p>
                </div>
              </div>

              {/* Linha 3: Vencimento CNH, Telefone e Email */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencimento CNH</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {motorista.vencimentoCnh}
                  </p>
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
              </div>

              {/* Linha 4: CEP, Rua, Número e Complemento */}
              <div className="grid grid-cols-5 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CEP</p>
                  <p className="text-sm font-mono">{motorista.cep}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Rua</p>
                  <p className="text-sm">{motorista.rua}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p className="text-sm">{motorista.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Complemento</p>
                  <p className="text-sm">{motorista.complemento || 'Não informado'}</p>
                </div>
              </div>

              {/* Linha 5: Bairro, Cidade e Estado */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                  <p className="text-sm">{motorista.bairro}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                  <p className="text-sm">{motorista.cidade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <p className="text-sm">{motorista.estado}</p>
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
                <span className="text-sm text-muted-foreground">({imagens.length} imagens)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exibição das imagens */}
              {loadingImagens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Carregando imagens...</span>
                </div>
              ) : imagens.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagens.map((imagemUrl, index) => {
                    const hasError = imageErrors[index] || false;
                    const isLoading = imageLoading[index] || false;
                    
                    return (
                      <div key={index} className="relative group">
                      <div className="w-full h-32 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                        {!hasError ? (
                          <>
                            <img
                              src={imagemUrl}
                              alt={`Imagem ${index + 1} do motorista`}
                              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                              onClick={() => window.open(imagemUrl, '_blank')}
                              onLoad={() => {
                                console.log(`[DEBUG] ✅ Imagem carregada: ${imagemUrl}`);
                                setImageLoading(prev => ({ ...prev, [index]: false }));
                              }}
                              onError={(e) => {
                                console.error(`[DEBUG] ❌ Erro ao carregar imagem: ${imagemUrl}`);
                                setImageErrors(prev => ({ ...prev, [index]: true }));
                                setImageLoading(prev => ({ ...prev, [index]: false }));
                              }}
                              style={{ display: isLoading ? 'none' : 'block' }}
                            />
                            {isLoading && (
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-1"></div>
                                <span className="text-xs">Carregando...</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 cursor-pointer" 
                               onClick={() => window.open(imagemUrl, '_blank')}>
                            <Image className="w-8 h-8 mb-1" />
                            <span className="text-xs text-center">Erro ao carregar<br/>Clique para abrir</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(imagemUrl, '_blank');
                          }}
                        >
                          <Image className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await fetch(imagemUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.style.display = 'none';
                              a.href = url;
                              a.download = `motorista-${motorista.nome}-imagem-${index + 1}.jpg`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Erro ao baixar imagem:', error);
                              toast({
                                title: "Erro ao baixar",
                                description: "Não foi possível baixar a imagem",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          📥 Baixar
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mb-2" />
                  <p className="text-sm">Nenhuma imagem cadastrada</p>
                  <p className="text-xs text-center">Use o modal de edição para adicionar imagens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}