/**
 * Modal para cadastrar nova locadora
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


interface NovaLocadoraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NovaLocadoraModal({ open, onOpenChange, onSuccess }: NovaLocadoraModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    responsavel: '',
    plano: 'basico'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('locadoras')
        .insert({
          nome: formData.nome,
          razao_social: formData.razaoSocial,
          cnpj: formData.cnpj,
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          responsavel: formData.responsavel,
          plano: formData.plano
        });

      if (error) throw error;

      toast({
        title: "Locadora cadastrada com sucesso!",
        description: `${formData.nome} foi adicionada ao sistema.`,
      });

      // Reset form
      setFormData({
        nome: '',
        razaoSocial: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        responsavel: '',
        plano: 'basico'
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao cadastrar locadora:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar a locadora",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Locadora</DialogTitle>
          <DialogDescription>
            Preencha os dados da locadora para adicionar ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Fantasia *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => updateFormData('nome', e.target.value)}
                placeholder="AutoRent Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => updateFormData('responsavel', e.target.value)}
                placeholder="João Silva"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                value={formData.razaoSocial}
                onChange={(e) => updateFormData('razaoSocial', e.target.value)}
                placeholder="AutoRent Premium Locadora Ltda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => updateFormData('cnpj', e.target.value)}
                placeholder="12.345.678/0001-90"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano">Plano *</Label>
              <Select value={formData.plano} onValueChange={(value) => updateFormData('plano', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="contato@autorent.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => updateFormData('telefone', e.target.value)}
                placeholder="(11) 98765-4321"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => updateFormData('endereco', e.target.value)}
                placeholder="Av. Paulista, 1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => updateFormData('cidade', e.target.value)}
                placeholder="São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => updateFormData('estado', e.target.value)}
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => updateFormData('cep', e.target.value)}
                placeholder="01310-100"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Locadora</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}