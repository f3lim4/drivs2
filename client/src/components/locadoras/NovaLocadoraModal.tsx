/**
 * Modal para cadastrar nova locadora
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { 
  formatarDocumento, 
  validarDocumento, 
  getLabelDocumento, 
  getPlaceholderDocumento,
  limparDocumento 
} from '@/utils/documentValidation';


interface NovaLocadoraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NovaLocadoraModal({ open, onOpenChange, onSuccess }: NovaLocadoraModalProps) {
  const { toast } = useToast();
  
  // Buscar planos da API
  const { data: planosFromServer } = useQuery({
    queryKey: ['/api/planos'],
    retry: false
  });
  
  // Converter dados do servidor para array se necessário
  const planos = React.useMemo(() => {
    if (!planosFromServer) return [];
    
    // Se planosFromServer é um objeto com propriedades de planos, converter para array
    if (typeof planosFromServer === 'object' && !Array.isArray(planosFromServer)) {
      return Object.values(planosFromServer).filter(plano => plano && typeof plano === 'object');
    }
    
    // Se já é um array, usar diretamente
    if (Array.isArray(planosFromServer)) {
      return planosFromServer;
    }
    
    return [];
  }, [planosFromServer]);
  const [formData, setFormData] = useState({
    nome: '',
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
    
    // Validar documento (CPF ou CNPJ)
    if (!validarDocumento(formData.cnpj)) {
      toast({
        title: "Erro na validação",
        description: "Digite um CPF ou CNPJ válido.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/locadoras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: limparDocumento(formData.cnpj), // Usar documento limpo como ID
          nome: formData.nome,
          razaoSocial: formData.nome, // Usar nome como razão social também
          cnpj: limparDocumento(formData.cnpj), // Salvar documento limpo
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          responsavel: formData.responsavel,
          plano: formData.plano
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar locadora');
      }

      toast({
        title: "Locadora cadastrada com sucesso!",
        description: `${formData.nome} foi adicionada ao sistema.`,
      });

      // Reset form
      setFormData({
        nome: '',
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
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => updateFormData('nome', e.target.value)}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => updateFormData('responsavel', e.target.value)}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">{getLabelDocumento(formData.cnpj)} *</Label>
              <Input
                id="cnpj"
                value={formatarDocumento(formData.cnpj)}
                onChange={(e) => updateFormData('cnpj', e.target.value)}
                placeholder={getPlaceholderDocumento(formData.cnpj)}
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
                  {planos.map((plano: any) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.preco}/mês
                    </SelectItem>
                  ))}
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
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => updateFormData('telefone', e.target.value)}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => updateFormData('endereco', e.target.value)}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => updateFormData('cidade', e.target.value)}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => updateFormData('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => updateFormData('cep', e.target.value)}
                placeholder=""
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