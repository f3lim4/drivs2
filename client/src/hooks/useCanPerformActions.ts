import { useSubscriptionStatus } from "./useSubscriptionStatus";
import { useAuth } from "./useAuth";

export function useCanPerformActions() {
  const { isLocadora } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();

  console.log('[CAN_PERFORM_ACTIONS] isLocadora:', isLocadora);
  console.log('[CAN_PERFORM_ACTIONS] subscriptionStatus:', subscriptionStatus);

  // Admin sempre pode realizar ações
  if (!isLocadora) {
    console.log('[CAN_PERFORM_ACTIONS] Admin - pode realizar ações');
    return {
      canPerformActions: true,
      isExpired: false,
      reason: null
    };
  }

  // Se não tem dados ou não pode acessar
  if (!subscriptionStatus || !subscriptionStatus.canAccess) {
    console.log('[CAN_PERFORM_ACTIONS] Bloqueado - não pode realizar ações');
    return {
      canPerformActions: false,
      isExpired: true,
      reason: subscriptionStatus?.status === 'pending' 
        ? 'Há um pagamento pendente em sua conta' 
        : 'Seu plano está expirado'
    };
  }

  console.log('[CAN_PERFORM_ACTIONS] Permitido - pode realizar ações');
  return {
    canPerformActions: true,
    isExpired: false,
    reason: null
  };
}