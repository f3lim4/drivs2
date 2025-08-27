import { AlertTriangle, Crown, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCanPerformActions } from "@/hooks/useCanPerformActions";
import { useNavigate } from "react-router-dom";

export function SubscriptionAlert() {
  const { canPerformActions, isExpired, reason } = useCanPerformActions();
  const navigate = useNavigate();

  // Se pode realizar ações, não mostrar alerta
  if (canPerformActions) {
    return null;
  }

  const handleGoToPlans = () => {
    navigate('/planos');
  };

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-orange-800 dark:text-orange-200">
            {reason} - Visualização disponível, mas ações de edição estão bloqueadas.
          </span>
        </div>
        <Button 
          onClick={handleGoToPlans}
          variant="outline"
          size="sm"
          className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
        >
          <Crown className="h-3 w-3 mr-1" />
          Renovar Plano
        </Button>
      </AlertDescription>
    </Alert>
  );
}