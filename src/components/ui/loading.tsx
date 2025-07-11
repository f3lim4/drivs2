/**
 * Componente de Loading reutilizável para o sistema DRIVS
 * Exibe diferentes estados de carregamento com animações suaves
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

export function Loading({ 
  size = 'md', 
  text, 
  className,
  variant = 'spinner' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerSizeClasses = {
    sm: 'gap-2 text-sm',
    md: 'gap-3 text-base',
    lg: 'gap-4 text-lg'
  };

  if (variant === 'spinner') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        containerSizeClasses[size],
        className
      )}>
        <Loader2 className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )} />
        {text && (
          <span className="text-muted-foreground font-medium">{text}</span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        containerSizeClasses[size],
        className
      )}>
        <div className="flex space-x-1">
          <div className={cn(
            'bg-primary rounded-full animate-bounce',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )} style={{ animationDelay: '0ms' }}></div>
          <div className={cn(
            'bg-primary rounded-full animate-bounce',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )} style={{ animationDelay: '150ms' }}></div>
          <div className={cn(
            'bg-primary rounded-full animate-bounce',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && (
          <span className="text-muted-foreground font-medium ml-3">{text}</span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        containerSizeClasses[size],
        className
      )}>
        <div className={cn(
          'bg-primary rounded-full animate-pulse',
          sizeClasses[size]
        )}></div>
        {text && (
          <span className="text-muted-foreground font-medium">{text}</span>
        )}
      </div>
    );
  }

  return null;
}

// Componente de loading para páginas inteiras
export function PageLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading size="lg" text={text} />
    </div>
  );
}

// Componente de loading para cards/seções
export function SectionLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading size="md" text={text} />
    </div>
  );
}