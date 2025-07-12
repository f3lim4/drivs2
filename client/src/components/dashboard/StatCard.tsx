/**
 * Componente de card para exibir estatísticas no dashboard
 * Utiliza diferentes cores e gradientes baseados no tipo de estatística
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  variant?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

// Configurações de variantes para diferentes tipos de cards
const variantConfig = {
  blue: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  green: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  yellow: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  red: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  }
};

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'blue',
  className 
}: StatCardProps) {
  const config = variantConfig[variant];
  
  // Formata o valor se for numérico
  const formatValue = (val: string | number) => {
    return val;
  };

  return (
    <Card className={cn(
      "border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Conteúdo textual */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            
            <p className="text-3xl font-bold text-foreground">
              {formatValue(value)}
            </p>
            
            {/* Tendência/comparativo se disponível */}
            {trend && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className={cn(
                  "font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}
                </span>
                <span>{trend.label}</span>
              </div>
            )}
          </div>

          {/* Ícone */}
          <div className={cn(
            "p-3 rounded-xl",
            config.iconBg
          )}>
            <div className={cn("w-6 h-6", config.iconColor)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente específico para card sem gradiente (branco com borda)
export function StatCardWhite({ 
  title, 
  value, 
  icon, 
  trend, 
  className 
}: Omit<StatCardProps, 'variant'>) {
  return (
    <Card className={cn(
      "shadow-card hover:shadow-hover transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            
            <p className="text-3xl font-bold text-foreground">
              {typeof value === 'number' && title.toLowerCase().includes('receita')
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                : value
              }
            </p>
            
            {trend && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className={cn(
                  "font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}
                </span>
                <span>{trend.label}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted">
            <div className="w-6 h-6 text-muted-foreground">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}