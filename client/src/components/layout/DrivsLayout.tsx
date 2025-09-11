/**
 * Layout principal do sistema DRIVS
 * Integra sidebar, header e conteúdo principal com SidebarProvider
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { DrivsSidebar } from './DrivsSidebar';
import { DrivsHeader } from './DrivsHeader';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { SubscriptionAlert } from '@/components/subscription/SubscriptionAlert';
import { useLocation } from 'wouter';

interface DrivsLayoutProps {
  children: React.ReactNode;
}

export function DrivsLayout({ children }: DrivsLayoutProps) {
  const [location] = useLocation();
  
  // Função para obter título e subtítulo baseado na rota
  const getPageInfo = () => {
    switch (location) {
      case '/':
      case '/dashboard':
        return { title: 'Dashboard', subtitle: 'Visão geral da sua locadora' };
      case '/alugueis':
        return { title: 'Aluguéis', subtitle: 'Gerencie contratos de locação' };
      case '/veiculos':
        return { title: 'Veículos', subtitle: 'Gerencie sua frota' };
      case '/motoristas':
        return { title: 'Motoristas', subtitle: 'Gerencie motoristas cadastrados' };
      case '/contratos':
        return { title: 'Contratos', subtitle: 'Gerencie contratos e templates' };
      case '/pagamentos':
        return { title: 'Pagamentos', subtitle: 'Gerencie pagamentos dos motoristas' };
      case '/infracoes':
        return { title: 'Infrações', subtitle: 'Gerencie infrações de trânsito' };
      case '/relatorios-financeiros':
        return { title: 'Relatórios Financeiros', subtitle: 'Análise completa da situação financeira' };
      case '/manutencoes':
        return { title: 'Manutenções', subtitle: 'Gerencie manutenções dos veículos' };
      case '/anuncios':
        return { title: 'Anúncios', subtitle: 'Gerencie comunicados do sistema' };
      case '/admin/planos':
        return { title: 'Gestão de Planos', subtitle: 'Configure planos e limites de veículos' };
      case '/admin/dashboard':
        return { title: 'Configuração do Dashboard', subtitle: 'Configure o conteúdo exibido no dashboard das locadoras' };
      case '/locadoras':
        return { title: 'Locadoras', subtitle: 'Gerencie locadoras do sistema' };
      case '/perfil':
        return { title: 'Perfil', subtitle: 'Gerencie informações da conta' };
      case '/planos':
        return { title: 'Planos', subtitle: 'Gerencie planos e assinatura' };
      default:
        return { title: 'DRIVS', subtitle: '' };
    }
  };
  
  const pageInfo = getPageInfo();
  
  return (
    <SubscriptionGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {/* Sidebar principal */}
          <DrivsSidebar />
          
          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header fixo no topo */}
            <DrivsHeader 
              title={pageInfo.title}
              subtitle={pageInfo.subtitle}
            />
            
            {/* Área de conteúdo */}
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
              <div className="p-6">
                <SubscriptionAlert />
                <div className="-mx-6 -mb-6">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SubscriptionGuard>
  );
}