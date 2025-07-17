/**
 * Página Index - redireciona para o Dashboard
 * Esta página não é mais utilizada pois o Dashboard é a rota principal
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default Index;
