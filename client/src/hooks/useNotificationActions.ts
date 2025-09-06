import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Hook para gerenciar ações de notificação (marcar como lida, excluir)
export function useNotificationActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile?.locadoraId) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`/api/notificacoes/${notificationId}/lida?locadoraId=${profile.locadoraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao marcar notificação como lida');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de notificações para refetch (tanto híbridas quanto persistidas)
      const notificationsUrl = profile?.locadoraId ? `/api/notificacoes?locadoraId=${profile.locadoraId}` : '/api/notificacoes';
      queryClient.invalidateQueries({ queryKey: [notificationsUrl] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: [notificationsUrl] });
      
      // Invalidar todas as consultas que dependem de notificações
      queryClient.invalidateQueries({ queryKey: ['/api/notificacoes'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao marcar notificação como lida:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao marcar notificação como lida',
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile?.locadoraId) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`/api/notificacoes/${notificationId}?locadoraId=${profile.locadoraId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir notificação');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de notificações para refetch (tanto híbridas quanto persistidas)
      const notificationsUrl = profile?.locadoraId ? `/api/notificacoes?locadoraId=${profile.locadoraId}` : '/api/notificacoes';
      queryClient.invalidateQueries({ queryKey: [notificationsUrl] });
      
      // Invalidar todas as consultas que dependem de notificações
      queryClient.invalidateQueries({ queryKey: ['/api/notificacoes'] });
      
      toast({
        title: 'Sucesso',
        description: 'Notificação excluída com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir notificação',
        variant: 'destructive',
      });
    },
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
}