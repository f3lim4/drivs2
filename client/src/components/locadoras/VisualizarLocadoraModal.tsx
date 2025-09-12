/**
 * Modal para visualizar detalhes da locadora
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, Mail, Phone, Calendar, CreditCard, User } from 'lucide-react';

interface Locadora {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'basico' | 'premium' | 'enterprise';
  dataCadastro: string;
}

interface VisualizarLocadoraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locadora: Locadora;
}

export function VisualizarLocadoraModal({ open, onOpenChange, locadora }: VisualizarLocadoraModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'pendente':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanoBadge = (plano: string) => {
    switch (plano) {
      case 'basico':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Básico</Badge>;
      case 'profissional':
        return <Badge variant="default" className="bg-cyan-100 text-cyan-800 border-cyan-200">Profissional</Badge>;
      case 'avancado':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Avançado</Badge>;
      case 'master':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">Master</Badge>;
      default:
        return <Badge variant="outline">{plano}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {locadora.nome}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da locadora
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Plano */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(locadora.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Plano:</span>
              {getPlanoBadge(locadora.plano)}
            </div>
          </div>

          <Separator />

          {/* Informações da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="text-sm">{locadora.razaoSocial}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="text-sm font-mono">{locadora.cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(locadora.dataCadastro).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responsável</p>
                <p className="text-sm flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {locadora.responsavel}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {locadora.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {locadora.telefone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logradouro</p>
                <p className="text-sm">{locadora.endereco}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                  <p className="text-sm">{locadora.cidade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <p className="text-sm">{locadora.estado}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CEP</p>
                <p className="text-sm font-mono">{locadora.cep}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}