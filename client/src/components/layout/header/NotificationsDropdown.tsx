
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Check, X } from 'lucide-react';
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
import { useHybridNotifications } from '@/hooks/useHybridNotifications';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function NotificationsDropdown() {
  const { notifications, unreadCount, hasNotifications } = useHybridNotifications();
  const navigate = useNavigate();
  const { markAsRead, deleteNotification, isMarkingAsRead, isDeleting } = useNotificationActions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Marcar todas as notificações persistentes como lidas quando o dropdown for aberto
  useEffect(() => {
    if (isDropdownOpen && notifications.length > 0) {
      // Aguardar um breve momento para que o usuário veja as notificações
      const timer = setTimeout(() => {
        const unreadPersistentNotifications = notifications.filter(
          notification => notification.isPersistent && !notification.isRead
        );
        
        // Marcar cada notificação persistente não lida como lida
        unreadPersistentNotifications.forEach(notification => {
          const realId = notification.id.replace('persistent-', '');
          markAsRead(realId);
        });
      }, 1000); // 1 segundo de delay
      
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen, notifications, markAsRead]);
  
  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string, isPersistent: boolean) => {
    e.stopPropagation();
    if (isPersistent) {
      // Remover o prefixo 'persistent-' do ID para a API
      const realId = notificationId.replace('persistent-', '');
      markAsRead(realId);
    }
  };
  
  const handleDelete = (e: React.MouseEvent, notificationId: string, isPersistent: boolean) => {
    e.stopPropagation();
    if (isPersistent) {
      // Remover o prefixo 'persistent-' do ID para a API
      const realId = notificationId.replace('persistent-', '');
      deleteNotification(realId);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Navegar baseado no tipo de notificação
    switch (notification.type) {
      case 'cnh_vencida':
      case 'cnh_vencendo':
        navigate('/motoristas');
        break;
      case 'multa_vencendo':
      case 'multa_vencida':
        navigate('/infracoes');
        break;
      case 'pagamento_pendente':
      case 'pagamento_vencido':
        navigate('/pagamentos');
        break;
      case 'manutencao_agendada':
      case 'manutencao_atrasada':
        navigate('/manutencoes');
        break;
      default:
        navigate('/dashboard');
        break;
    }
    setIsDropdownOpen(false);
  };
  


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
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
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
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {hasNotifications ? (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`}></div>
                    <span className="font-medium text-sm flex-1">{notification.title}</span>
                    <div className="flex items-center gap-1">
                      {notification.isPersistent ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
                            onClick={(e) => handleMarkAsRead(e, notification.id, notification.isPersistent)}
                            disabled={isMarkingAsRead || isDeleting}
                            data-testid={`button-mark-read-${notification.id}`}
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                            onClick={(e) => handleDelete(e, notification.id, notification.isPersistent)}
                            disabled={isMarkingAsRead || isDeleting}
                            data-testid={`button-delete-${notification.id}`}
                            title="Excluir notificação"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">Alerta automático</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground w-full">
                    {notification.message}
                  </p>
                </DropdownMenuItem>
                {index < notifications.length - 1 && <DropdownMenuSeparator />}
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
            <DropdownMenuItem 
              className="text-center justify-center text-primary cursor-pointer"
              onClick={() => navigate('/notificacoes')}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
