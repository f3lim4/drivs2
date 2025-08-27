import { useCanPerformActions } from "@/hooks/useCanPerformActions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";
import { cloneElement, ReactElement } from "react";

interface ProtectedActionProps {
  children: ReactElement;
  fallbackMessage?: string;
}

export function ProtectedAction({ children, fallbackMessage = "Renove seu plano para realizar esta ação" }: ProtectedActionProps) {
  const { canPerformActions, reason } = useCanPerformActions();

  if (canPerformActions) {
    return children;
  }

  // Desabilitar o botão/elemento
  const disabledElement = cloneElement(children, {
    disabled: true,
    className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
    onClick: undefined
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabledElement}
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center space-x-2">
          <Crown className="h-4 w-4" />
          <span>{reason || fallbackMessage}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}