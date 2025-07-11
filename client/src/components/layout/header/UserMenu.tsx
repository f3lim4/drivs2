
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfiguracoesModal } from '../ConfiguracoesModal';

export function UserMenu() {
  const [showConfiguracoesModal, setShowConfiguracoesModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado do sistema.",
      });

      // Redirecionar para login
      navigate('/login');
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{profile?.name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.type === 'admin' ? 'Administrador' : 'Locadora'}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Modal de Configurações */}
      <ConfiguracoesModal
        open={showConfiguracoesModal}
        onOpenChange={setShowConfiguracoesModal}
      />
    </>
  );
}
