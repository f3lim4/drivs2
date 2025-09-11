
/**
 * Header principal do sistema DRIVS
 * Contém notificações e informações do usuário
 */

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsDropdown } from './header/NotificationsDropdown';
import { UserMenu } from './header/UserMenu';
import { HeaderTitle } from './header/HeaderTitle';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DrivsHeaderProps {
  title?: string;
  subtitle?: string;
}

export function DrivsHeader({ title, subtitle }: DrivsHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:sticky md:left-auto">
      <div className="container flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Botão hambúrguer para colapsar/expandir sidebar */}
        <SidebarTrigger className="md:hidden p-2 hover:bg-muted rounded-md">
          <Menu className="h-6 w-6" />
        </SidebarTrigger>
        
        {/* Título da página atual */}
        <HeaderTitle title={title} subtitle={subtitle} />

        {/* Spacer para empurrar elementos para a direita */}
        <div className="flex-1" />

        {/* Notificações com badge */}
        <NotificationsDropdown />

        {/* Menu do usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
