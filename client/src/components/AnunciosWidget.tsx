import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnunciosAtivos } from '@/hooks/useAnuncios';
import { 
  Megaphone, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Anuncio } from '@shared/schema';

interface AnunciosWidgetProps {
  className?: string;
}

export default function AnunciosWidget({ className = '' }: AnunciosWidgetProps) {
  const { data: anuncios, isLoading } = useAnunciosAtivos();
  const [dismissedAnuncios, setDismissedAnuncios] = useState<string[]>([]);
  const [expandedAnuncios, setExpandedAnuncios] = useState<string[]>([]);

  // Carregar anúncios dispensados do localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnuncios');
    if (dismissed) {
      setDismissedAnuncios(JSON.parse(dismissed));
    }
  }, []);

  // Salvar anúncios dispensados no localStorage
  useEffect(() => {
    localStorage.setItem('dismissedAnuncios', JSON.stringify(dismissedAnuncios));
  }, [dismissedAnuncios]);

  const dismissAnuncio = (id: string) => {
    setDismissedAnuncios(prev => [...prev, id]);
  };

  const toggleExpanded = (id: string) => {
    setExpandedAnuncios(prev => 
      prev.includes(id) 
        ? prev.filter(anuncioId => anuncioId !== id)
        : [...prev, id]
    );
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCardBorder = (tipo: string) => {
    switch (tipo) {
      case 'warning': return 'border-l-4 border-l-yellow-500';
      case 'success': return 'border-l-4 border-l-green-500';
      case 'error': return 'border-l-4 border-l-red-500';
      default: return 'border-l-4 border-l-blue-500';
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-20 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (!anuncios?.length) {
    return null;
  }

  // Filtrar anúncios não dispensados e ordenar por prioridade
  const visibleAnuncios = anuncios
    .filter(anuncio => !dismissedAnuncios.includes(anuncio.id))
    .sort((a, b) => b.prioridade - a.prioridade);

  if (!visibleAnuncios.length) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleAnuncios.map((anuncio) => {
        const isExpanded = expandedAnuncios.includes(anuncio.id);
        const shouldTruncate = anuncio.conteudo.length > 150;
        
        return (
          <Card 
            key={anuncio.id} 
            className={`${getCardBorder(anuncio.tipo)} hover:shadow-md transition-shadow`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {getIcon(anuncio.tipo)}
                  <CardTitle className="text-base font-medium">
                    {anuncio.titulo}
                  </CardTitle>
                  <Badge className={`${getBadgeColor(anuncio.tipo)} text-xs`}>
                    {anuncio.tipo === 'warning' && 'Atenção'}
                    {anuncio.tipo === 'success' && 'Sucesso'}
                    {anuncio.tipo === 'error' && 'Erro'}
                    {anuncio.tipo === 'info' && 'Informação'}
                  </Badge>
                  {anuncio.prioridade === 2 && (
                    <Badge variant="destructive" className="text-xs">
                      Alta Prioridade
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAnuncio(anuncio.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-sm text-gray-700">
                {shouldTruncate && !isExpanded ? (
                  <>
                    {anuncio.conteudo.substring(0, 150)}...
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(anuncio.id)}
                      className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-2"
                    >
                      <ChevronDown className="h-4 w-4 inline mr-1" />
                      Ver mais
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="whitespace-pre-wrap">{anuncio.conteudo}</span>
                    {shouldTruncate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(anuncio.id)}
                        className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-2"
                      >
                        <ChevronUp className="h-4 w-4 inline mr-1" />
                        Ver menos
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>
                  {format(new Date(anuncio.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
                {anuncio.dataExpiracao && (
                  <span>
                    Expira em: {format(new Date(anuncio.dataExpiracao), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}