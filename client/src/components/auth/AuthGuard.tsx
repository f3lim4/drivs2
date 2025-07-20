/**
 * AuthGuard component para proteger rotas autenticadas
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('AuthGuard - Estado:', { isAuthenticated, isLoading });

  useEffect(() => {
    console.log('AuthGuard - useEffect:', { isLoading, isAuthenticated });
    if (!isLoading && !isAuthenticated) {
      console.log('AuthGuard - Redirecionando para login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}