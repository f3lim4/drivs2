import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

export interface PersistentNotification {
  id: string;
  tipo: 'warning' | 'danger' | 'info' | 'success';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  locadora_id: string;
}

export interface HybridNotification {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isPersistent: boolean; // Indica se é uma notificação persistida ou dinâmica
}

/**
 * Hook que combina notificações dinâmicas com notificações persistidas
 * Notificações dinâmicas são geradas em tempo real baseadas nos dados
 * Notificações persistidas são armazenadas no banco e podem ser marcadas como lidas/excluídas
 */
export function useHybridNotifications() {
  const { profile } = useAuth();
  
  // Buscar notificações dinâmicas (sistema existente)
  const { notifications: dynamicNotifications } = useNotifications();
  
  // Buscar notificações persistidas da API
  const persistentNotificationsUrl = profile?.locadoraId ? `/api/notificacoes?locadoraId=${profile.locadoraId}` : null;
  
  const { data: persistentNotificationsRaw = [] } = useQuery({
    queryKey: [persistentNotificationsUrl],
    enabled: !!profile?.locadoraId && !!persistentNotificationsUrl,
    refetchInterval: 30 * 1000, // Buscar a cada 30 segundos
    staleTime: 15 * 1000, // Cache por 15 segundos
  });

  // Converter notificações persistidas para o formato híbrido
  const persistentNotifications: HybridNotification[] = persistentNotificationsRaw.map((notification: PersistentNotification) => ({
    id: `persistent-${notification.id}`,
    type: notification.tipo,
    title: notification.titulo,
    message: notification.mensagem,
    timestamp: new Date(notification.created_at),
    isRead: notification.lida,
    isPersistent: true,
  }));

  // Converter notificações dinâmicas para o formato híbrido
  const hybridDynamicNotifications: HybridNotification[] = dynamicNotifications.map(notification => ({
    ...notification,
    id: `dynamic-${notification.id}`,
    isPersistent: false,
    // Notificações dinâmicas são sempre não lidas (não podem ser marcadas como lidas)
    isRead: false,
  }));

  // Combinar e deduplificar notificações (priorizar persistidas)
  const allNotifications = [...persistentNotifications, ...hybridDynamicNotifications];
  
  // Remover duplicatas baseado no conteúdo (título + mensagem)
  const uniqueNotifications = allNotifications.reduce((acc: HybridNotification[], current) => {
    const isDuplicate = acc.some(notification => 
      notification.title === current.title && 
      notification.message === current.message
    );
    
    if (!isDuplicate) {
      acc.push(current);
    } else {
      // Se há duplicata, manter a persistente (se disponível)
      const existingIndex = acc.findIndex(notification => 
        notification.title === current.title && 
        notification.message === current.message
      );
      
      if (current.isPersistent && !acc[existingIndex].isPersistent) {
        acc[existingIndex] = current;
      }
    }
    
    return acc;
  }, []);

  // Ordenar notificações por prioridade e timestamp
  const priorityOrder = {
    'danger': 1,
    'warning': 2,
    'info': 3,
    'success': 4
  };
  
  const sortedNotifications = uniqueNotifications.sort((a, b) => {
    const priorityA = priorityOrder[a.type] || 999;
    const priorityB = priorityOrder[b.type] || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Calcular estatísticas
  const unreadCount = sortedNotifications.filter(n => !n.isRead).length;
  const hasNotifications = sortedNotifications.length > 0;
  const persistentCount = persistentNotifications.length;
  const dynamicCount = hybridDynamicNotifications.length;

  return {
    notifications: sortedNotifications,
    unreadCount,
    hasNotifications,
    persistentCount,
    dynamicCount,
  };
}