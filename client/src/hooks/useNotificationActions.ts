import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Hook para gerenciar ações de notificação (marcar como lida, excluir)
export function useNotificationActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notificacoes/${notificationId}/lida`, {
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
      // Invalidar cache de notificações para refetch
      queryClient.invalidateQueries({ queryKey: ['/api/notificacoes'] });
      
      toast({
        title: 'Sucesso',
        description: 'Notificação marcada como lida',
      });
    },
    onError: (error: Error) => {
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
      const response = await fetch(`/api/notificacoes/${notificationId}`, {
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
      // Invalidar cache de notificações para refetch
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