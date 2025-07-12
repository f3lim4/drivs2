
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NotificationsDropdownProps {
  notificationCount: number;
}

export function NotificationsDropdown({ notificationCount }: NotificationsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-10 h-10">
          <div className="w-5 h-5 flex items-center justify-center">
            <Bell className="w-full h-full" />
          </div>
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
            <div className="flex items-center gap-2 w-full">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <span className="font-medium text-sm">Contrato Vencendo</span>
              <span className="text-xs text-muted-foreground ml-auto">2 min</span>
            </div>
            <p className="text-xs text-muted-foreground">
              O contrato #12345 com João Silva vence amanhã
            </p>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
            <div className="flex items-center gap-2 w-full">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <span className="font-medium text-sm">Pagamento Recebido</span>
              <span className="text-xs text-muted-foreground ml-auto">1h</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamento de R$ 1.200,00 de Maria Santos confirmado
            </p>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
            <div className="flex items-center gap-2 w-full">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <span className="font-medium text-sm">Manutenção Agendada</span>
              <span className="text-xs text-muted-foreground ml-auto">3h</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Veículo ABC-1234 agendado para revisão na segunda-feira
            </p>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-center justify-center text-primary">
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
