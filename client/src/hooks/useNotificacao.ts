import { mostrarNotificacao } from '@/components/layout/NotificacaoFixa';

export function useNotificacao() {
  return {
    toast: (options: { 
      title?: string; 
      description?: string; 
      variant?: 'default' | 'destructive' | 'success' 
    }) => {
      const mensagem = options.title || options.description || '';
      let tipo: 'sucesso' | 'erro' | 'aviso' | 'info' = 'info';
      
      if (options.variant === 'destructive') {
        tipo = 'erro';
      } else if (options.variant === 'success') {
        tipo = 'sucesso';
      }
      
      mostrarNotificacao(mensagem, tipo);
    }
  };
}

// Alias para compatibilidade
export const useToast = useNotificacao;