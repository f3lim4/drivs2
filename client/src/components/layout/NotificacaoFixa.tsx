import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface NotificacaoFixaProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
}

let setNotificacaoGlobal: ((notificacao: NotificacaoFixaProps | null) => void) | null = null;

export function NotificacaoFixa() {
  const [notificacao, setNotificacao] = useState<NotificacaoFixaProps | null>(null);

  useEffect(() => {
    setNotificacaoGlobal = setNotificacao;
    // Expor globalmente para o hook useToast
    (window as any).__notificacao = { mostrarNotificacao };
    return () => {
      setNotificacaoGlobal = null;
      delete (window as any).__notificacao;
    };
  }, []);

  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => {
        setNotificacao(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacao]);

  if (!notificacao) return null;

  const iconMap = {
    sucesso: CheckCircle,
    erro: XCircle,
    aviso: AlertCircle,
    info: Info
  };

  const colorMap = {
    sucesso: 'text-green-400 bg-green-400/10 border-green-400/20',
    erro: 'text-red-400 bg-red-400/10 border-red-400/20',
    aviso: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  };

  const Icon = iconMap[notificacao.tipo];

  return (
    <div className={`p-2 rounded-md border text-xs flex items-center gap-2 ${colorMap[notificacao.tipo]} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate text-white/90">{notificacao.mensagem}</span>
    </div>
  );
}

// Função global para mostrar notificações
export function mostrarNotificacao(mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso' | 'info' = 'info') {
  if (setNotificacaoGlobal) {
    setNotificacaoGlobal({ mensagem, tipo });
  }
}