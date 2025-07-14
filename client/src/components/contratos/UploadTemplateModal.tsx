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
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

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

    setLoading(true);
    
    try {
      const response = await fetch('/api/template-contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          locadoraId: profile.locadoraId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar template');
      }

      toast({
        title: "Template Salvo",
        description: "Seu template foi salvo com sucesso!",
      });

      onTemplateUploaded();
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar template. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Template de Contrato</DialogTitle>
          <DialogDescription>
            Faça upload de um template personalizado ou cole o conteúdo diretamente.
          </DialogDescription>
        </DialogHeader>

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
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Você pode usar variáveis como {'{cliente}'}, {'{veiculo}'}, {'{valor}'} que serão substituídas automaticamente
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}