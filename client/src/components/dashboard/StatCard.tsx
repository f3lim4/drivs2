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

// Configurações de variantes com cores mais clean e neutras
const variantConfig = {
  blue: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  green: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  yellow: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  red: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
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
      "border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Conteúdo textual */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">
              {title}
            </p>
            
            <p className="text-2xl font-semibold text-slate-800">
              {formatValue(value)}
            </p>
            
            {/* Tendência/comparativo se disponível */}
            {trend && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
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

// Componente específico para card clean e neutro
export function StatCardWhite({ 
  title, 
  value, 
  icon, 
  trend, 
  className 
}: Omit<StatCardProps, 'variant'>) {
  return (
    <Card className={cn(
      "border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">
              {title}
            </p>
            
            <p className="text-2xl font-semibold text-slate-800">
              {typeof value === 'number' && title.toLowerCase().includes('receita')
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                : value
              }
            </p>
            
            {trend && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
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

          <div className="p-3 rounded-xl bg-slate-100">
            <div className="w-6 h-6 text-slate-600">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}