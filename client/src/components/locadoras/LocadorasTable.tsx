/**
 * Table component for displaying Locadoras
 */

import { Mail, Phone, MapPin, Edit, Trash2, Eye, UserX, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Locadora } from '@/types/locadora';
import { getStatusBadge, getPlanoBadge } from '@/utils/locadoraHelpers';

interface LocadorasTableProps {
  locadoras: Locadora[];
  onView: (locadora: Locadora) => void;
  onEdit: (locadora: Locadora) => void;
  onDelete: (locadora: Locadora) => void;
  onToggleStatus: (locadora: Locadora) => void;
}

export function LocadorasTable({ locadoras, onView, onEdit, onDelete, onToggleStatus }: LocadorasTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Locadora</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locadoras.map((locadora) => (
            <TableRow key={locadora.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{locadora.nome}</div>
                  <div className="text-sm text-muted-foreground">{locadora.responsavel}</div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{locadora.cnpj}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="w-3 h-3" />
                    {locadora.email}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {locadora.telefone}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3" />
                  {locadora.cidade}, {locadora.estado}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(locadora.status)}</TableCell>
              <TableCell>{getPlanoBadge(locadora.plano)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(locadora)}
                    title="Visualizar detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(locadora)}
                    title="Editar locadora"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(locadora)}
                    title={locadora.status === 'ativa' ? 'Desativar locadora' : 'Ativar locadora'}
                    className={locadora.status === 'ativa' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                  >
                    {locadora.status === 'ativa' ? <UserX className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(locadora)}
                    title="EXCLUIR permanentemente (remove tudo)"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}