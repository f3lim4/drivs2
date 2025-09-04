import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function EmergencyLogout() {
  const [, setLocation] = useLocation();

  const forceLogout = () => {
    try {
      // Limpar TODOS os dados do localStorage
      localStorage.removeItem('drivs_profile');
      localStorage.removeItem('drivs_session');
      localStorage.removeItem('user_profile');
      
      // Limpar sessionStorage também
      sessionStorage.clear();
      
      // Limpar cookies relacionados ao DRIVS
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // Forçar reload da página para limpar cache
      window.location.href = '/';
      
    } catch (error) {
      console.error('Erro ao fazer logout de emergência:', error);
      // Se tudo der errado, força reload
      window.location.reload();
    }
  };

  // Auto-executar o logout após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      forceLogout();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div className="text-center space-y-6">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              Logout de Emergência
            </h1>
            <p className="text-slate-600">
              Detectamos dados corrompidos na sua sessão. Estamos limpando automaticamente...
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Você será redirecionado para a página de login em alguns segundos.
            </p>
          </div>

          <Button 
            onClick={forceLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-force-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Forçar Logout Agora
          </Button>

          <p className="text-xs text-slate-500">
            Se o problema persistir, feche e abra o navegador novamente.
          </p>
        </div>
      </div>
    </div>
  );
}