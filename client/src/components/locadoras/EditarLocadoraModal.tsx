/**
 * Modal para editar dados da locadora
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface Locadora {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  logo: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'free' | 'basico' | 'premium' | 'enterprise' | 'vip';
  dataCadastro: string;
  vitalia?: boolean; // Campo VIP
}

interface EditarLocadoraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locadora: Locadora;
}

export function EditarLocadoraModal({ open, onOpenChange, locadora }: EditarLocadoraModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    responsavel: '',
    logo: '',
    status: 'ativa' as 'ativa' | 'inativa' | 'pendente',
    plano: 'free' as 'free' | 'basico' | 'premium' | 'enterprise' | 'vip',
    vitalia: false, // Campo VIP
  });

  useEffect(() => {
    if (locadora) {
      setFormData({
        nome: locadora.nome || '',
        razaoSocial: locadora.razaoSocial || '',
        cnpj: locadora.cnpj || '',
        email: locadora.email || '',
        telefone: locadora.telefone || '',
        endereco: locadora.endereco || '',
        numero: locadora.numero || '',
        complemento: locadora.complemento || '',
        bairro: locadora.bairro || '',
        cidade: locadora.cidade || '',
        estado: locadora.estado || '',
        cep: locadora.cep || '',
        responsavel: locadora.responsavel || '',
        logo: locadora.logo || '',
        status: locadora.status || 'ativa',
        plano: locadora.plano || 'free',
        vitalia: locadora.vitalia || false, // Campo VIP
      });
    }
  }, [locadora]);

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
          
          toast({
            title: "Endereço encontrado!",
            description: `${data.logradouro}, ${data.localidade} - ${data.uf}`,
          });
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado e tente novamente.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao buscar CEP",
          description: "Não foi possível consultar o endereço. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/locadoras/${locadora.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar locadora');
      }

      // Invalidar caches para atualizar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/locadoras'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/locadoras/${locadora.id}`] });
      
      toast({
        title: "Locadora atualizada com sucesso!",
        description: `Os dados de ${formData.nome} foram atualizados.`,
      });

      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar locadora",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => {
      // Se estiver ativando/desativando VIP (Vitalia)
      if (field === 'vitalia') {
        return { 
          ...prev, 
          [field]: value,
          // Se ativar VIP, definir plano como "vip"
          // Se desativar VIP, manter o plano atual (não alterar automaticamente)
          plano: value === true ? 'vip' : prev.plano
        };
      }
      
      return { ...prev, [field]: value };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Locadora</DialogTitle>
          <DialogDescription>
            Altere os dados da locadora conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* INFORMAÇÕES BÁSICAS */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => updateFormData('nome', e.target.value)}
                  placeholder="Nome fantasia da empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => updateFormData('razaoSocial', e.target.value)}
                  placeholder="Razão social da empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => updateFormData('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => updateFormData('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => updateFormData('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                  required
                />
              </div>
            </div>
          </div>

          {/* ENDEREÇO */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Endereço</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => updateFormData('cep', e.target.value)}
                  onBlur={(e) => buscarEnderecoPorCEP(e.target.value)}
                  placeholder="00000-000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => updateFormData('endereco', e.target.value)}
                  placeholder="Nome da rua"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => updateFormData('numero', e.target.value)}
                  placeholder="123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => updateFormData('complemento', e.target.value)}
                  placeholder="Apto, sala, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => updateFormData('bairro', e.target.value)}
                  placeholder="Nome do bairro"
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
                  onChange={(e) => updateFormData('estado', e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* CONFIGURAÇÕES DO SISTEMA */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Configurações do Sistema</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Plano *</Label>
                <Select value={formData.plano} onValueChange={(value) => updateFormData('plano', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano: any) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.preco}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.plano && (
                  <div className="text-sm text-slate-600 mt-1">
                    {(() => {
                      const planoSelecionado = planos.find((p: any) => p.id === formData.plano);
                      return planoSelecionado ? planoSelecionado.descricao : '';
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vitalia">Locadora VIP (Vitalia)</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="vitalia"
                    checked={formData.vitalia}
                    onCheckedChange={(checked) => updateFormData('vitalia', checked)}
                  />
                  <span className="text-sm text-slate-600">
                    {formData.vitalia ? 'Locadora VIP - Acesso ilimitado sem cobrança' : 'Locadora padrão - Sujeita a cobrança'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}