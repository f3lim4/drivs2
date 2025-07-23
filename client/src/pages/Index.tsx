/**
 * Página Index - exibe Home Page para visitantes e Dashboard para usuários autenticados
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Home from './Home';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, isAuthenticated, isLoading]);

  // Se ainda está carregando, mostra spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se não está autenticado, mostra a página Home
  if (!isAuthenticated) {
    return <Home />;
  }

  // Se chegou aqui, usuário está autenticado e será redirecionado
  return null;
};

export default Index;
