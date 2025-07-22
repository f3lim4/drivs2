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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Schema de validação
const contratoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  template: z.string().min(1, 'Conteúdo do contrato é obrigatório'),
  status: z.enum(['em_aberto', 'ativo', 'cancelado', 'encerrado']).optional(),
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
  const [desativando, setDesativando] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      titulo: '',
      cliente: '',
      template: '',
      status: 'em_aberto',
    },
  });

  // Preenche o formulário quando o contrato é selecionado
  useEffect(() => {
    if (contrato && open) {
      form.reset({
        titulo: contrato.titulo,
        cliente: contrato.cliente,
        template: contrato.template || '',
        status: contrato.status,
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
        dataInicio: typeof contrato.dataInicio === 'string' ? contrato.dataInicio : contrato.dataInicio,
        dataFim: typeof contrato.dataFim === 'string' ? contrato.dataFim : contrato.dataFim,
        status: data.status || contrato.status,
        template: data.template,
        locadoraId: (contrato as any).locadoraId
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

  const handleCancelarContrato = async () => {
    if (!contrato || contrato.status !== 'ativo' || !motivoCancelamento.trim()) return;

    setDesativando(true);
    
    try {
      // Prepara dados para cancelar contrato
      const contratoData = {
        tipo: contrato.tipo,
        titulo: contrato.titulo,
        cliente: contrato.cliente,
        valor: contrato.valor,
        dataInicio: typeof contrato.dataInicio === 'string' ? contrato.dataInicio : contrato.dataInicio,
        dataFim: typeof contrato.dataFim === 'string' ? contrato.dataFim : contrato.dataFim,
        status: 'cancelado', // Mudança principal: cancelar contrato
        motivoCancelamento: motivoCancelamento.trim(), // Motivo obrigatório
        template: contrato.template,
        locadoraId: (contrato as any).locadoraId
      };

      // Chama API para desativar contrato
      const response = await fetch(`/api/contratos/${contrato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar contrato');
      }

      const contratoCancelado = await response.json();
      
      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '',
        profile?.email || 'usuario@drivs.me',
        'cancelar',
        'contrato',
        contrato.id,
        `Contrato cancelado: ${contrato.cliente} - Motivo: ${motivoCancelamento}`
      );
      
      onContratoEditado(contratoCancelado);
      setMotivoCancelamento(''); // Limpar motivo
      onOpenChange(false);
      
      toast({
        title: "Contrato Cancelado",
        description: `Contrato de ${contrato.cliente} foi cancelado com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDesativando(false);
    }
  };

  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Editar Contrato</DialogTitle>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-muted-foreground mb-1">Status atual:</span>
              {contrato?.status === 'em_aberto' && <Badge variant="secondary" className="bg-gray-100 text-gray-800">Em Aberto</Badge>}
              {contrato?.status === 'ativo' && <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>}
              {contrato?.status === 'cancelado' && <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelado</Badge>}
              {contrato?.status === 'encerrado' && <Badge variant="secondary" className="bg-gray-100 text-gray-600">Encerrado</Badge>}
            </div>
          </div>
          <DialogDescription>
            Atualize as informações do contrato e altere o status se necessário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES BÁSICAS E STATUS */}
            <div className="grid grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="em_aberto">Em Aberto</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
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

            <DialogFooter className="flex justify-between">
              <div>
                {contrato?.status === 'ativo' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={loading || desativando}
                      >
                        Cancelar Contrato
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Contrato</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação cancelará o contrato permanentemente. Informe o motivo do cancelamento:
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="motivo" className="text-right">
                            Motivo
                          </Label>
                          <Textarea
                            id="motivo"
                            value={motivoCancelamento}
                            onChange={(e) => setMotivoCancelamento(e.target.value)}
                            placeholder="Descreva o motivo do cancelamento..."
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMotivoCancelamento('')}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelarContrato}
                          disabled={!motivoCancelamento.trim() || desativando}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {desativando ? 'Cancelando...' : 'Confirmar Cancelamento'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || desativando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || desativando}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}