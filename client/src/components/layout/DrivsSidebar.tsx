
/**
 * Sidebar principal do sistema DRIVS
 * Contém navegação entre as diferentes seções do sistema
 */

import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Bike,
  Truck,
  Bus,
  FileText, 
  File,
  TrendingUp,
  Building2,
  Menu,
  User,
  CreditCard,
  AlertTriangle,
  Wrench,
  Megaphone,
  Crown,
  Search,
  Settings
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';
import logoPath from "@assets/icone_1752434737434.png";
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NotificacaoFixa } from './NotificacaoFixa';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// Itens de navegação do sistema
const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  {
    title: 'Veículos',
    url: '/veiculos',
    icon: Car,
    description: 'Gestão de frota'
  },
  {
    title: 'Motoristas',
    url: '/motoristas',
    icon: Users,
    description: 'Gestão de motoristas'
  },

  {
    title: 'Contratos',
    url: '/contratos',
    icon: File,
    description: 'Gestão de contratos',
    locadoraOnly: true  // Só locadoras podem ver este item
  },
  {
    title: 'Pagamentos',
    url: '/pagamentos',
    icon: CreditCard,
    description: 'Gestão de pagamentos',
    locadoraOnly: true  // Só locadoras podem ver este item
  },
  {
    title: 'Infrações',
    url: '/infracoes',
    icon: AlertTriangle,
    description: 'Gestão de infrações'
  },
  {
    title: 'Manutenções',
    url: '/manutencoes',
    icon: Wrench,
    description: 'Gestão de manutenções',
    locadoraOnly: true  // Só locadoras podem ver este item
  },
  {
    title: 'Financeiro',
    url: '/relatorios-financeiros',
    icon: FileText,
    description: 'Análise financeira completa'
  },
  {
    title: 'Anúncios',
    url: '/anuncios',
    icon: Megaphone,
    description: 'Gerenciar anúncios do sistema',
    adminOnly: true  // Só admins podem ver este item
  },
  {
    title: 'Planos',
    url: '/admin/planos',
    icon: Crown,
    description: 'Gerenciar planos do sistema',
    adminOnly: true  // Só admins podem ver este item
  },
  {
    title: 'Dashboard Config',
    url: '/admin/dashboard',
    icon: Settings,
    description: 'Configurar conteúdo do dashboard das locadoras',
    adminOnly: true  // Só admins podem ver este item
  },
  {
    title: 'SEO',
    url: '/seo',
    icon: Search,
    description: 'Configurações de SEO e Analytics',
    adminOnly: true  // Só admins podem ver este item
  },
  {
    title: 'Locadoras',
    url: '/locadoras',
    icon: Building2,
    description: 'Gerenciar locadoras',
    adminOnly: true  // Só admins podem ver este item
  }
];

// Ícones de veículos para alternância
const vehicleIcons = [Car, Bike, Truck, Bus];
const vehicleIconNames = ['Carro', 'Moto', 'Caminhão', 'Utilitário'];

export function DrivsSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, isAdmin, isLocadora } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const [currentVehicleIconIndex, setCurrentVehicleIconIndex] = useState(0);

  // Alternar ícone de veículo a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVehicleIconIndex((prev) => (prev + 1) % vehicleIcons.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filtrar itens baseado no tipo de usuário e aplicar ícone dinâmico
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    if (item.locadoraOnly) {
      return isLocadora;
    }
    return true;
  }).map(item => {
    // Aplicar ícone alternante para veículos
    if (item.url === '/veiculos') {
      return {
        ...item,
        icon: vehicleIcons[currentVehicleIconIndex],
        description: `Gestão de ${vehicleIconNames[currentVehicleIconIndex].toLowerCase()}s`
      };
    }
    return item;
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

  // Função para lidar com cliques em links do menu
  const handleLinkClick = () => {
    // Fechar o menu mobile quando um link for clicado
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r transition-all duration-300 bg-blue-600 border-blue-500">
      <SidebarContent className="bg-blue-600">
        {/* Header da sidebar com logo DRIVS */}
        <div className="p-6 border-b border-blue-500 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
              <img src={logoPath} alt="DRIVS Logo" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Drivs</h1>
              <p className="text-xs text-white/70">Sistema de Locadoras</p>
            </div>
          </div>
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
                      onClick={handleLinkClick}
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

        {/* Área de notificação fixa */}
        <div className="mt-auto p-3">
          <NotificacaoFixa />
        </div>

        {/* Informações do sistema */}
        <div className="p-6 border-t border-blue-500">
          <div className="text-xs text-white/70 mb-3">
            <p>DRIVS v1.0</p>
            <p>Sistema de Gestão</p>
          </div>
          
          {/* Redes Sociais */}
          <div className="flex space-x-3 justify-center">
            <a 
              href="https://instagram.com/drivs.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-pink-400 transition-colors duration-300"
              title="Instagram @drivs.me"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a 
              href="https://youtube.com/@drivs.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-red-400 transition-colors duration-300"
              title="YouTube @drivs.me"
            >
              <FaYoutube className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com/company/drivs.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-blue-400 transition-colors duration-300"
              title="LinkedIn @drivs.me"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
