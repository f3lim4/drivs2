/**
 * Modal para upload de templates de contratos personalizados
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTemplateContratos } from '@/hooks/useTemplateContratos';

const templateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface UploadTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateUploaded: () => void;
}

export function UploadTemplateModal({ 
  open, 
  onOpenChange, 
  onTemplateUploaded 
}: UploadTemplateModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { createTemplate } = useTemplateContratos();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: '',
      conteudo: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setValue('conteudo', content);
      
      // Se não há nome, usa o nome do arquivo
      if (!form.getValues('nome')) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extensão
        form.setValue('nome', fileName);
      }
    };
    reader.readAsText(file);
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!profile?.locadoraId) {
      toast({
        title: "Erro",
        description: "Locadora não identificada",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🔥 Iniciando onSubmit');
    
    try {
      console.log('🔥 Entrando no try block');
      console.log('🔥 Enviando template:', {
        ...data,
        locadoraId: profile.locadoraId,
        ativo: true,
      });
      
      console.log('🔥 Chamando mutateAsync...');
      const result = await createTemplate.mutateAsync({
        ...data,
        locadoraId: profile.locadoraId,
        ativo: true,
      });

      console.log('🔥 Template criado com sucesso:', result);
      console.log('🔥 Mostrando toast de sucesso');

      toast({
        title: "Template Salvo",
        description: "Seu template foi salvo com sucesso!",
      });

      console.log('🔥 Executando callbacks finais');
      
      try {
        console.log('🔥 Executando onTemplateUploaded...');
        onTemplateUploaded();
        console.log('✅ onTemplateUploaded executado');
      } catch (e) {
        console.error('❌ Erro em onTemplateUploaded:', e);
      }
      
      try {
        console.log('🔥 Executando onOpenChange(false)...');
        onOpenChange(false);
        console.log('✅ onOpenChange executado');
      } catch (e) {
        console.error('❌ Erro em onOpenChange:', e);
      }
      
      try {
        console.log('🔥 Executando form.reset()...');
        form.reset();
        console.log('✅ form.reset executado');
      } catch (e) {
        console.error('❌ Erro em form.reset:', e);
      }
      
      console.log('🔥 onSubmit concluído com sucesso');
      
    } catch (error) {
      console.log('🔥 Entrando no catch block');
      console.error('Erro ao salvar template:', error);
      console.error('Tipo do erro:', typeof error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      toast({
        title: "Erro",
        description: "Falha ao salvar template. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle>Subir Template de Contrato</DialogTitle>
          <DialogDescription>
            Faça upload de um template personalizado ou cole o conteúdo diretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FORMULÁRIO */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* NOME DO TEMPLATE */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Template *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Contrato Padrão da Empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UPLOAD DE ARQUIVO */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload de Arquivo</label>
                  <Input
                    type="file"
                    accept=".txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: .txt, .doc, .docx
                  </p>
                </div>

                {/* CONTEÚDO DO TEMPLATE */}
                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo do Template *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cole aqui o conteúdo do seu template de contrato..."
                          className="min-h-[300px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={createTemplate.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? 'Salvando...' : 'Salvar Template'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>

          {/* CAMPOS DISPONÍVEIS */}
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">📋 Campos Disponíveis</h3>
              
              <div className="space-y-4 text-xs">
                {/* Dados da Locadora */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-blue-600">📋 Dados da Locadora</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{NOME_LOCADORA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{CNPJ}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{ENDERECO_LOCADORA}}'}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Motorista */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-green-600">👤 Dados do Motorista</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{NOME_MOTORISTA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{DATA_NASCIMENTO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{CPF_MOTORISTA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{RG_MOTORISTA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{CNH_MOTORISTA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{TELEFONE_MOTORISTA}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{ENDERECO_MOTORISTA}}'}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Veículo */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-orange-600">🚗 Dados do Veículo</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{MODELO_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{MARCA_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{ANO_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{COR_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{PLACA_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{CHASSI_VEICULO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{RENAVAM_VEICULO}}'}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Contrato */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-purple-600">📄 Dados do Contrato</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{DATA_INICIO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{MESES_CONTRATO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{VALOR_SEMANAL}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{CAUCAO}}'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono bg-white p-1 rounded">
                      <span>{'{{LIMITE_KM}}'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t mt-4">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Como usar:</strong> Copie as chaves acima (incluindo as chaves duplas) e cole no seu template personalizado. 
                  O sistema irá substituir automaticamente pelos dados reais do motorista e veículo selecionados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}