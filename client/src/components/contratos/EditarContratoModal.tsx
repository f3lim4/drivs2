/**
 * Modal para edição do contrato gerado
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { registrarAtividade } from '@/utils/activityLogger';
import { useToast } from '@/hooks/use-toast';
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
import { Contrato } from '@/types';

// Schema de validação
const contratoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  template: z.string().min(1, 'Conteúdo do contrato é obrigatório'),
});

type ContratoFormData = z.infer<typeof contratoSchema>;

interface EditarContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onContratoEditado: (contrato: Contrato) => void;
}

export function EditarContratoModal({ 
  open, 
  onOpenChange, 
  contrato,
  onContratoEditado 
}: EditarContratoModalProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      titulo: '',
      cliente: '',
      template: '',
    },
  });

  // Preenche o formulário quando o contrato é selecionado
  useEffect(() => {
    if (contrato && open) {
      form.reset({
        titulo: contrato.titulo,
        cliente: contrato.cliente,
        template: contrato.template || '',
      });
    }
  }, [contrato, open, form]);

  const onSubmit = async (data: ContratoFormData) => {
    if (!contrato) return;

    setLoading(true);
    
    try {
      // Prepara dados para API
      const contratoData = {
        tipo: contrato.tipo,
        titulo: data.titulo,
        cliente: data.cliente,
        valor: contrato.valor, // Mantém valor existente
        dataInicio: typeof contrato.dataInicio === 'string' ? contrato.dataInicio : contrato.dataInicio.toISOString().split('T')[0],
        dataFim: typeof contrato.dataFim === 'string' ? contrato.dataFim : contrato.dataFim?.toISOString().split('T')[0],
        status: contrato.status,
        template: data.template,
        locadoraId: contrato.locadoraId
      };

      // Chama API para atualizar contrato
      const response = await fetch(`/api/contratos/${contrato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar contrato');
      }

      const contratoAtualizado = await response.json();
      
      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '',
        profile?.email || 'usuario@drivs.me',
        'editar',
        'contrato',
        contrato.id,
        `Contrato editado: ${data.cliente} - ${contrato.tipo}`
      );
      
      onContratoEditado(contratoAtualizado);
      onOpenChange(false);
      
      toast({
        title: "Contrato Editado",
        description: `Contrato de ${data.cliente} foi atualizado com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao editar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
          <DialogDescription>
            Atualize as informações do contrato.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contrato de Locação - Cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            {/* CONTEÚDO DO CONTRATO */}
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo do Contrato *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conteúdo completo do contrato..."
                      className="min-h-[300px] font-mono text-sm"
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
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}