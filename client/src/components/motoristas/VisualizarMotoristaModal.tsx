/**
 * Modal para visualizar detalhes do motorista
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
import { User, Phone, Mail, Calendar, CreditCard, FileText } from 'lucide-react';
import { Motorista } from '@/types';

interface VisualizarMotoristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
}

export function VisualizarMotoristaModal({ open, onOpenChange, motorista }: VisualizarMotoristaModalProps) {
  if (!motorista) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'vencido':
        return <Badge variant="destructive">CNH Vencida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {motorista.nome}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do motorista
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(motorista.status)}
            </div>
          </div>

          <Separator />

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                <p className="text-sm">{motorista.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="text-sm font-mono">{motorista.cpf}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                  <p className="text-sm">{motorista.dataNascimento || 'Não informado'}</p>
                </div>
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
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {motorista.telefone || motorista.contato}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {motorista.email || 'Não informado'}
                </p>
              </div>
              {motorista.localizacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localização</p>
                  <p className="text-sm">{motorista.localizacao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CNH */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Carteira Nacional de Habilitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número da CNH</p>
                  <p className="text-sm font-mono">{motorista.cnh}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                  <p className="text-sm">{motorista.categoria}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Vencimento</p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {motorista.vencimentoCnh}
                </p>
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