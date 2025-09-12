/**
 * Modal de configurações do sistema DRIVS
 * Permite ajustar preferências gerais da aplicação
 */

import { useState } from 'react';
import { Settings, Globe, Calendar, DollarSign, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface ConfiguracoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfiguracoesModal({ open, onOpenChange }: ConfiguracoesModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Estados das configurações
  const [configs, setConfigs] = useState({
    // Configurações da empresa
    nomeEmpresa: 'DRIVS LOCADORA DE VEÍCULOS LTDA',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Empresas, 123 - Centro, Embu das Artes/SP',
    telefone: '11977263156',
    email: 'contato@drivs.com.br',
    
    // Configurações do sistema
    moedaPadrao: 'BRL',
    formatoData: 'dd/MM/yyyy',
    fusoHorario: 'America/Sao_Paulo',
    
    // Notificações
    notificarVencimentos: true,
    notificarPagamentos: true,
    notificarManutencao: true,
    emailNotificacoes: true,
    
    // Configurações de contratos
    diasAntecedenciaVencimento: 7,
    percentualMultaAtraso: 10,
    percentualJurosDiario: 2,
    limitePadrao: 8000,
    
    // Aparência
    tema: 'system',
    exibirAvatares: true,
    compactarTabelas: false,
  });

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Simula salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui normalmente salvaria no localStorage ou enviaria para API
      localStorage.setItem('drivs-configs', JSON.stringify(configs));
      
      toast({
        title: "Configurações Salvas",
        description: "Suas configurações foram atualizadas com sucesso!",
      });
      
      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Personalize as configurações do sistema DRIVS de acordo com suas necessidades.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="notificacoes">Alertas</TabsTrigger>
          </TabsList>

          {/* ABA EMPRESA */}
          <TabsContent value="empresa" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" />
              <h3 className="font-medium">Dados da Empresa</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                <Input
                  id="nomeEmpresa"
                  value={configs.nomeEmpresa}
                  onChange={(e) => updateConfig('nomeEmpresa', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={configs.cnpj}
                    onChange={(e) => updateConfig('cnpj', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configs.telefone}
                    onChange={(e) => updateConfig('telefone', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={configs.endereco}
                  onChange={(e) => updateConfig('endereco', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={configs.email}
                  onChange={(e) => updateConfig('email', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA SISTEMA */}
          <TabsContent value="sistema" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" />
              <h3 className="font-medium">Configurações Gerais</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Moeda Padrão</Label>
                  <Select value={configs.moedaPadrao} onValueChange={(value) => updateConfig('moedaPadrao', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Formato de Data</Label>
                  <Select value={configs.formatoData} onValueChange={(value) => updateConfig('formatoData', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Tema da Interface</Label>
                <Select value={configs.tema} onValueChange={(value) => updateConfig('tema', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exibir Avatares</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar avatares dos usuários na interface
                  </p>
                </div>
                <Switch
                  checked={configs.exibirAvatares}
                  onCheckedChange={(checked) => updateConfig('exibirAvatares', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tabelas Compactas</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduzir espaçamento das tabelas
                  </p>
                </div>
                <Switch
                  checked={configs.compactarTabelas}
                  onCheckedChange={(checked) => updateConfig('compactarTabelas', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA CONTRATOS */}
          <TabsContent value="contratos" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" />
              <h3 className="font-medium">Configurações de Contratos</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="diasAntecedencia">Dias Antecedência Vencimento</Label>
                  <Input
                    id="diasAntecedencia"
                    type="number"
                    min="1"
                    max="30"
                    value={configs.diasAntecedenciaVencimento}
                    onChange={(e) => updateConfig('diasAntecedenciaVencimento', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="limitePadrao">Limite KM Padrão/Mês</Label>
                  <Input
                    id="limitePadrao"
                    type="number"
                    min="1000"
                    step="100"
                    value={configs.limitePadrao}
                    onChange={(e) => updateConfig('limitePadrao', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="multaAtraso">Multa por Atraso (%)</Label>
                  <Input
                    id="multaAtraso"
                    type="number"
                    min="0"
                    max="50"
                    value={configs.percentualMultaAtraso}
                    onChange={(e) => updateConfig('percentualMultaAtraso', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="jurosDiario">Juros Diário (%)</Label>
                  <Input
                    id="jurosDiario"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={configs.percentualJurosDiario}
                    onChange={(e) => updateConfig('percentualJurosDiario', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ABA NOTIFICAÇÕES */}
          <TabsContent value="notificacoes" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" />
              <h3 className="font-medium">Alertas e Notificações</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar Vencimentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertar sobre contratos próximos do vencimento
                  </p>
                </div>
                <Switch
                  checked={configs.notificarVencimentos}
                  onCheckedChange={(checked) => updateConfig('notificarVencimentos', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar Pagamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertar sobre pagamentos pendentes ou em atraso
                  </p>
                </div>
                <Switch
                  checked={configs.notificarPagamentos}
                  onCheckedChange={(checked) => updateConfig('notificarPagamentos', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertar sobre manutenções programadas dos veículos
                  </p>
                </div>
                <Switch
                  checked={configs.notificarManutencao}
                  onCheckedChange={(checked) => updateConfig('notificarManutencao', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações também por e-mail
                  </p>
                </div>
                <Switch
                  checked={configs.emailNotificacoes}
                  onCheckedChange={(checked) => updateConfig('emailNotificacoes', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}