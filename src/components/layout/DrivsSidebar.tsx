
/**
 * Sidebar principal do sistema DRIVS
 * Contém navegação entre as diferentes seções do sistema
 */

import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  File,
  TrendingUp,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Itens de navegação do sistema
const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  {
    title: 'Motoristas',
    url: '/motoristas',
    icon: Users,
    description: 'Gestão de motoristas'
  },
  {
    title: 'Veículos',
    url: '/veiculos',
    icon: Car,
    description: 'Gestão de frota'
  },
  {
    title: 'Aluguéis',
    url: '/alugueis',
    icon: TrendingUp,
    description: 'Contratos de locação'
  },
  {
    title: 'Contratos',
    url: '/contratos',
    icon: File,
    description: 'Gestão de contratos'
  },
  {
    title: 'Locadoras',
    url: '/locadoras',
    icon: Building2,
    description: 'Gerenciar locadoras',
    adminOnly: true  // Só admins podem ver este item
  }
];

export function DrivsSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, isAdmin } = useAuth();

  // Filtrar itens baseado no tipo de usuário
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  // Função para verificar se a rota está ativa
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  // Classes CSS para links ativos/inativos
  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px]";
    
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-accent-foreground font-medium`;
    }
    
    return `${baseClasses} text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`;
  };

  return (
    <Sidebar className={`border-r border-sidebar-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <SidebarContent className="bg-sidebar">
        {/* Header da sidebar com logo DRIVS */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Drivs</h1>
                <p className="text-xs text-sidebar-foreground/70">Sistema de Locadoras</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
              <Car className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupContent className="px-3">
            <SidebarMenu>
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getLinkClasses(item.url)}
                      title={item.description}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Informações do sistema */}
        <div className="mt-auto p-6 border-t border-sidebar-border">
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/50">
              <p>DRIVS v1.0</p>
              <p>Sistema de Gestão</p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
