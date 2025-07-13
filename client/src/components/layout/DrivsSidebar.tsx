
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
  Menu,
  User
} from 'lucide-react';
import logoPath from "@assets/icone_1752434737434.png";
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
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
  const { profile, isAdmin, isLocadora } = useAuth();

  // Filtrar itens baseado no tipo de usuário
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    if (item.locadoraOnly) {
      return isLocadora;
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
      return `${baseClasses} bg-blue-800 text-white font-medium`;
    }
    
    return `${baseClasses} text-white hover:bg-blue-500/50 hover:text-white`;
  };

  return (
    <Sidebar className="border-r transition-all duration-300 bg-blue-600 border-blue-500">
      <SidebarContent className="bg-blue-600">
        {/* Header da sidebar com logo DRIVS */}
        <div className="p-6 border-b border-blue-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
              <img src={logoPath} alt="DRIVS Logo" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Drivs</h1>
              <p className="text-xs text-white/70">Sistema de Locadoras</p>
            </div>
          </div>
          <SidebarTrigger className="text-white hover:bg-blue-500/50 p-2" />
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
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-full h-full" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Informações do sistema */}
        <div className="mt-auto p-6 border-t border-blue-500">
          <div className="text-xs text-white/70">
            <p>DRIVS v1.0</p>
            <p>Sistema de Gestão</p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
