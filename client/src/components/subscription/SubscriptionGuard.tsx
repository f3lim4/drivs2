import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionBlock } from "./SubscriptionBlock";
import { Loading } from "@/components/ui/loading";
import { useLocation } from "wouter";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { profile, isLocadora } = useAuth();
  const { data: subscriptionStatus, isLoading } = useSubscriptionStatus();
  const [location] = useLocation();

  // Se é admin, não precisa verificar assinatura
  if (!isLocadora) {
    return <>{children}</>;
  }

  // Ainda carregando status da assinatura
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Rotas que devem sempre estar acessíveis, mesmo com plano expirado
  const allowedRoutes = ['/planos', '/perfil', '/suporte'];
  const isAllowedRoute = allowedRoutes.includes(location);

  // Se não conseguiu carregar ou não pode acessar, verificar se é rota permitida
  if (!subscriptionStatus || !subscriptionStatus.canAccess) {
    // Se está em uma rota permitida, deixar acessar
    if (isAllowedRoute) {
      return <>{children}</>;
    }
    
    // Caso contrário, mostrar bloqueio
    return (
      <SubscriptionBlock 
        status={subscriptionStatus?.status === 'pending' ? 'pending' : 'expired'}
        expiresAt={subscriptionStatus?.expiresAt}
        companyName={profile?.name}
      />
    );
  }

  // Pode acessar normalmente
  return <>{children}</>;
}