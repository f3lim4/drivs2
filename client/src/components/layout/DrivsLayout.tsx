/**
 * Layout principal do sistema DRIVS
 * Integra sidebar, header e conteúdo principal com SidebarProvider
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { DrivsSidebar } from './DrivsSidebar';
import { DrivsHeader } from './DrivsHeader';

interface DrivsLayoutProps {
  children: React.ReactNode;
}

export function DrivsLayout({ children }: DrivsLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar principal */}
        <DrivsSidebar />
        
        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header opcional - pode ser usado nas páginas individuais */}
          
          {/* Área de conteúdo */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}