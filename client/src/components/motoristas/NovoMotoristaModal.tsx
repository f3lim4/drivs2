/**
 * Modal para cadastro de novos motoristas
 * Formulário completo com validação
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Motorista } from '@/types';
import { generateId } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

// Schema de validação baseado no schema do banco
const motoristaSchema = z.object({
  // Informações Pessoais
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  rg: z.string().min(7, 'RG deve ter pelo menos 7 dígitos'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  
  // Contato
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Carteira de Motorista
  cnh: z.string().min(11, 'CNH deve ter 11 dígitos'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  vencimentoCnh: z.string().min(1, 'Data de vencimento é obrigatória'),
  
  // Endereço
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  
  // Status
  status: z.enum(['ativo', 'inativo', 'vencido']),
});

type MotoristaFormData = z.infer<typeof motoristaSchema>;

interface NovoMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMotoristaAdicionado: (motorista: Motorista) => void;
}

export function NovoMotoristaModal({ 
  open, 
  onOpenChange, 
  onMotoristaAdicionado 
}: NovoMotoristaModalProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      cnh: '',
      categoria: '',
      vencimentoCnh: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      status: 'ativo',
    },
  });

  const onSubmit = async (data: MotoristaFormData) => {
    setLoading(true);
    
    try {
      // Debug: Log dos dados do formulário
      console.log('[DEBUG] NovoMotoristaModal - Dados do formulário:', data);
      
      // Preparar dados para envio à API
      const motoristaData = {
        id: data.cpf.replace(/\D/g, ''), // Usar CPF limpo como ID
        locadoraId: profile?.locadoraId || '123456789',
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        dataNascimento: data.dataNascimento,
        telefone: data.telefone,
        email: data.email || '',
        cnh: data.cnh,
        categoria: data.categoria,
        vencimentoCnh: data.vencimentoCnh,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        status: data.status,
      };

      // Debug: Log dos dados preparados
      console.log('[DEBUG] NovoMotoristaModal - Dados preparados para API:', motoristaData);

      // Enviar para API
      const response = await fetch('/api/motoristas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motoristaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar motorista');
      }

      const novoMotorista = await response.json();
      
      // Debug: Log da resposta da API
      console.log('[DEBUG] NovoMotoristaModal - Resposta da API:', novoMotorista);
      
      onMotoristaAdicionado(novoMotorista);
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Erro ao cadastrar motorista:', error);
      alert('Erro ao cadastrar motorista: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Motorista</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo motorista para cadastrá-lo no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* INFORMAÇÕES PESSOAIS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Informações Pessoais
              </h3>
              
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF e RG */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CONTATO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Contato
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@exemplo.com (opcional)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CARTEIRA DE MOTORISTA */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Carteira de Motorista
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da CNH *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000000000" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="B" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cat. A">Cat. A</SelectItem>
                          <SelectItem value="Cat. B">Cat. B</SelectItem>
                          <SelectItem value="Cat. AB">Cat. AB</SelectItem>
                          <SelectItem value="Cat. C">Cat. C</SelectItem>
                          <SelectItem value="Cat. D">Cat. D</SelectItem>
                          <SelectItem value="Cat. E">Cat. E</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vencimentoCnh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento da CNH *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ENDEREÇO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Endereço
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da rua" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 8) {
                              value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Status
              </h3>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="vencido">CNH Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Motorista'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}