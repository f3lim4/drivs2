
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
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
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationsDropdown() {
  const { notifications, unreadCount, hasNotifications } = useNotifications();
  


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-destructive';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-10 h-10">
          <div className="w-5 h-5 flex items-center justify-center">
            <Bell className="w-full h-full" />
          </div>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {hasNotifications ? (
            notifications.slice(0, 5).map((notification, index) => (
              <div key={notification.id}>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`}></div>
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(notification.timestamp, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                </DropdownMenuItem>
                {index < Math.min(notifications.length, 5) - 1 && <DropdownMenuSeparator />}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Sem nenhum alerta no momento</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tudo em dia com CNHs, multas e pagamentos!
              </p>
            </div>
          )}
        </div>
        
        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-primary">
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
