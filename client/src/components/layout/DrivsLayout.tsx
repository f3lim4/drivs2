/**
 * Layout principal do sistema DRIVS
 * Integra sidebar, header e conteúdo principal com SidebarProvider
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { DrivsSidebar } from './DrivsSidebar';
import { DrivsHeader } from './DrivsHeader';
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
      case '/locadoras':
        return { title: 'Locadoras', subtitle: 'Gerencie locadoras do sistema' };
      case '/perfil':
        return { title: 'Perfil', subtitle: 'Gerencie informações da conta' };
      default:
        return { title: 'DRIVS', subtitle: 'Sistema de gerenciamento de locadoras' };
    }
  };
  
  const pageInfo = getPageInfo();
  
  return (
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
          <main className="flex-1 overflow-auto pt-16 md:pt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}