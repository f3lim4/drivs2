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

  // Agora sempre permite visualização - o bloqueio será feito em ações específicas
  return <>{children}</>;
}