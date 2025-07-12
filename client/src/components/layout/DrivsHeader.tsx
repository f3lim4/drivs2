
/**
 * Header principal do sistema DRIVS
 * Contém busca global, notificações e informações do usuário
 */

import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchBar } from './header/SearchBar';
import { NotificationsDropdown } from './header/NotificationsDropdown';
import { UserMenu } from './header/UserMenu';
import { HeaderTitle } from './header/HeaderTitle';

interface DrivsHeaderProps {
  title?: string;
  subtitle?: string;
}

export function DrivsHeader({ title, subtitle }: DrivsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Botão para colapsar/expandir sidebar */}
        <SidebarTrigger className="lg:hidden" />
        
        {/* Título da página atual */}
        <HeaderTitle title={title} subtitle={subtitle} />

        {/* Spacer para empurrar elementos para a direita */}
        <div className="flex-1" />

        {/* Barra de busca global */}
        <SearchBar />

        {/* Notificações com badge */}
        <NotificationsDropdown />

        {/* Menu do usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
