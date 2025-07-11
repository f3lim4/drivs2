/**
 * Layout principal do sistema DRIVS
 * Integra sidebar, header e conteúdo principal com SidebarProvider
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DrivsSidebar } from './DrivsSidebar';
import { DrivsHeader } from './DrivsHeader';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          {/* Header fixo com botão de menu */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 gap-4">
              {/* Botão para minimizar/expandir sidebar */}
              <SidebarTrigger className="shrink-0" />
            </div>
          </header>
          
          {/* Área de conteúdo */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}