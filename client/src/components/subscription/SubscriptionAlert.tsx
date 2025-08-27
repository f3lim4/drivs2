import { AlertTriangle, Crown, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCanPerformActions } from "@/hooks/useCanPerformActions";
import { useNavigate, useLocation } from "react-router-dom";

export function SubscriptionAlert() {
  const { canPerformActions, isExpired, reason } = useCanPerformActions();
  const navigate = useNavigate();
  const location = useLocation();

  // Se pode realizar ações, não mostrar alerta
  if (canPerformActions) {
    return null;
  }

  // Não mostrar alerta na página de planos
  if (location.pathname === '/planos') {
    return null;
  }

  const handleGoToPlans = () => {
    navigate('/planos');
  };

  const isExpiredAlert = reason === 'Seu plano está expirado';

  return (
    <Alert className={`mb-6 ${
      isExpiredAlert 
        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
        : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
    }`}>
      <AlertTriangle className={`h-4 w-4 ${
        isExpiredAlert ? 'text-red-600' : 'text-orange-600'
      }`} />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={
            isExpiredAlert 
              ? 'text-red-800 dark:text-red-200'
              : 'text-orange-800 dark:text-orange-200'
          }>
            {reason}
          </span>
        </div>
        <Button 
          onClick={handleGoToPlans}
          variant="outline"
          size="sm"
          className={`ml-4 ${
            isExpiredAlert
              ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900'
              : 'border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900'
          }`}
        >
          <Crown className="h-3 w-3 mr-1" />
          Ir para Planos
        </Button>
      </AlertDescription>
    </Alert>
  );
}