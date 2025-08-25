import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  // Sistema de toast desabilitado - retorna apenas o provider vazio
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
