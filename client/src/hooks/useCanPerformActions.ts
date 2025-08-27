import { useSubscriptionStatus } from "./useSubscriptionStatus";
import { useAuth } from "./useAuth";

export function useCanPerformActions() {
  const { isLocadora } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();

  // Admin sempre pode realizar ações
  if (!isLocadora) {
    return {
      canPerformActions: true,
      isExpired: false,
      reason: null
    };
  }

  // Se não tem dados ou não pode acessar
  if (!subscriptionStatus || !subscriptionStatus.canAccess) {
    return {
      canPerformActions: false,
      isExpired: true,
      reason: subscriptionStatus?.status === 'pending' 
        ? 'Há um pagamento pendente em sua conta' 
        : 'Seu plano está expirado'
    };
  }

  return {
    canPerformActions: true,
    isExpired: false,
    reason: null
  };
}