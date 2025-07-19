import { useState } from 'react';
import { FileText, Upload, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTemplateContratos } from '@/hooks/useTemplateContratos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadTemplateModal } from './UploadTemplateModal';
import { VariaveisTemplate } from './VariaveisTemplate';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const { toast } = useToast();
  const { templates, isLoading, deleteTemplate } = useTemplateContratos();
  const [showUploadTemplateModal, setShowUploadTemplateModal] = useState(false);

  const handleExcluirTemplate = async (templateId: string) => {
    try {
      await deleteTemplate.mutateAsync(templateId);
      toast({
        title: "Template Excluído",
        description: "Template foi removido com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir template. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meus Templates
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Botão para upload de novo template */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowUploadTemplateModal(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Enviar Template
              </Button>
            </div>

            {/* Templates Enviados */}
            {templates && templates.length > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Meus Templates Enviados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.nome}</TableCell>
                          <TableCell>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleExcluirTemplate(template.id)}
                              disabled={isExcluindoTemplate}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Mensagem quando não há templates */}
            {(!templates || templates.length === 0) && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-center text-yellow-700">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                    <p className="font-medium">Nenhum template enviado ainda</p>
                    <p className="text-sm">Use o botão "Enviar Template" acima para adicionar seu primeiro template personalizado.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passo a passo */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Como Criar um Template Personalizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-green-700">
                  <div className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-semibold">Crie seu documento</p>
                      <p>Use Word, Google Docs ou qualquer editor de texto para criar seu contrato personalizado.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-semibold">Adicione as variáveis</p>
                      <p>Copie as variáveis abaixo e cole no seu documento onde os dados devem aparecer.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-semibold">Salve como PDF</p>
                      <p>Exporte ou salve seu documento como PDF mantendo as variáveis no formato correto.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-semibold">Faça o upload</p>
                      <p>Clique em "Enviar Template" acima e selecione seu arquivo PDF personalizado.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variáveis Disponíveis */}
            <VariaveisTemplate />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de upload de template */}
      <UploadTemplateModal
        isOpen={showUploadTemplateModal}
        onClose={() => setShowUploadTemplateModal(false)}
      />
    </>
  );
}