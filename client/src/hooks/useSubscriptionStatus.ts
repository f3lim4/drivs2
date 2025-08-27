import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  daysRemaining?: number;
  status: 'active' | 'expired' | 'trial' | 'pending';
  canAccess: boolean;
}

export function useSubscriptionStatus() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['subscription-status-v2', profile?.locadoraId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!profile?.locadoraId) {
        return {
          isActive: false,
          isExpired: true,
          status: 'expired',
          canAccess: false
        };
      }

      const response = await fetch(`/api/locadoras/${profile.locadoraId}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar dados da locadora');
      }

      const locadora = await response.json();
      const today = new Date();
      
      // PRIMEIRO: Verificar se é plano Infinity (acesso total)
      if (locadora.plano === 'infinity') {
        return {
          isActive: true,
          isExpired: false,
          status: 'active',
          canAccess: true
        };
      }
      
      // SEGUNDO: Verificar se está em teste gratuito
      if (locadora.testeGratuito && locadora.dataVencimentoTeste) {
        const expiresAt = new Date(locadora.dataVencimentoTeste);
        const daysRemaining = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          // Teste gratuito expirado
          return {
            isActive: false,
            isExpired: true,
            expiresAt,
            daysRemaining: 0,
            status: 'expired',
            canAccess: false
          };
        }
        
        return {
          isActive: true,
          isExpired: false,
          expiresAt,
          daysRemaining,
          status: 'trial',
          canAccess: true
        };
      }
      
      // Verificar status da assinatura paga
      if (locadora.status === 'ativa') {
        return {
          isActive: true,
          isExpired: false,
          status: 'active',
          canAccess: true
        };
      }
      
      if (locadora.status === 'pendente') {
        return {
          isActive: false,
          isExpired: true,
          status: 'pending',
          canAccess: false
        };
      }
      
      if (locadora.status === 'suspensa') {
        return {
          isActive: false,
          isExpired: true,
          status: 'expired',
          canAccess: false
        };
      }
      
      // Status inativo ou não definido
      return {
        isActive: false,
        isExpired: true,
        status: 'expired',
        canAccess: false
      };
    },
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000, // Verificar a cada 30 segundos
    staleTime: 20000, // Dados são considerados frescos por 20 segundos
  });
}