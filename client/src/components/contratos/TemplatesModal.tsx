import { useState } from 'react';
import { FileText, Upload, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTemplateContratos } from '@/hooks/useTemplateContratos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadTemplateModal } from './UploadTemplateModal';

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
            {/* Variáveis Disponíveis */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Variáveis Disponíveis para Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Dados da Locadora</h4>
                    <div className="space-y-1 text-blue-700">
                      <p><code>{{nomeLocadora}}</code> - Nome da empresa</p>
                      <p><code>{{cnpjLocadora}}</code> - CNPJ da locadora</p>
                      <p><code>{{telefoneLocadora}}</code> - Telefone</p>
                      <p><code>{{emailLocadora}}</code> - E-mail</p>
                      <p><code>{{enderecoLocadora}}</code> - Endereço completo</p>
                      <p><code>{{responsavelLocadora}}</code> - Responsável</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Dados do Motorista</h4>
                    <div className="space-y-1 text-blue-700">
                      <p><code>{{nomeMotorista}}</code> - Nome completo</p>
                      <p><code>{{cpfMotorista}}</code> - CPF</p>
                      <p><code>{{rgMotorista}}</code> - RG</p>
                      <p><code>{{telefoneMotorista}}</code> - Telefone</p>
                      <p><code>{{emailMotorista}}</code> - E-mail</p>
                      <p><code>{{enderecoMotorista}}</code> - Endereço</p>
                      <p><code>{{cnhMotorista}}</code> - Número da CNH</p>
                      <p><code>{{vencimentoCnh}}</code> - Data vencimento</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Dados do Contrato</h4>
                    <div className="space-y-1 text-blue-700">
                      <p><code>{{placaVeiculo}}</code> - Placa do veículo</p>
                      <p><code>{{marcaVeiculo}}</code> - Marca</p>
                      <p><code>{{modeloVeiculo}}</code> - Modelo</p>
                      <p><code>{{anoVeiculo}}</code> - Ano</p>
                      <p><code>{{corVeiculo}}</code> - Cor</p>
                      <p><code>{{valorSemanal}}</code> - Valor semanal</p>
                      <p><code>{{valorMensal}}</code> - Valor mensal</p>
                      <p><code>{{caucao}}</code> - Valor da caução</p>
                      <p><code>{{dataInicio}}</code> - Data de início</p>
                      <p><code>{{dataFim}}</code> - Data de fim</p>
                      <p><code>{{limiteKm}}</code> - Limite quilometragem</p>
                      <p><code>{{dataAtual}}</code> - Data atual</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Como usar:</strong> Copie as variáveis acima e cole no seu template. 
                    Elas serão automaticamente substituídas pelos dados reais do contrato.
                  </p>
                </div>
              </CardContent>
            </Card>

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

            {/* Lista de templates */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Carregando templates...</div>
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum template personalizado encontrado</p>
                    <p className="text-sm">Clique em "Enviar Template" para adicionar um novo</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Templates Personalizados ({templates.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NOME</TableHead>
                        <TableHead>TIPO</TableHead>
                        <TableHead>CRIADO EM</TableHead>
                        <TableHead>AÇÕES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <p className="font-medium">{template.nome}</p>
                          </TableCell>
                          <TableCell>
                            <p className="capitalize">{template.tipo}</p>
                          </TableCell>
                          <TableCell>
                            <p>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</p>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleExcluirTemplate(template.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
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