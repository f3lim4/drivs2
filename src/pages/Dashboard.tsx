/**
 * Página principal do dashboard do sistema DRIVS
 * Exibe estatísticas principais, alertas e resumo do negócio
 */

import { useEffect, useState } from 'react';
import { Users, Car, TrendingUp, DollarSign, AlertTriangle, Clock, Activity, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Alert } from '@/types';
import { DrivsHeader } from '@/components/layout/DrivsHeader';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMotoristas: 0,
    motoristasAtivos: 0,
    veiculosDisponiveis: 0,
    totalVeiculos: 0,
    veiculosAlugados: 0,
    alugueisAtivos: 0,
    receitaMensal: 0,
    cnhVencendo: 0,
    cnhVencida: 0,
    veiculosManutencao: 0,
    alertas: []
  });
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header da página */}
      <DrivsHeader 
        title="Dashboard"
        subtitle="Sistema Drivs - Gerencie sua locadora de forma eficiente"
      />

      {/* Grid de estatísticas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Motoristas */}
        <StatCard
          title="Total de Motoristas"
          value={stats.totalMotoristas}
          icon={<Activity />}
          variant="blue"
          trend={{
            value: "12%",
            isPositive: true,
            label: "vs mês anterior"
          }}
        />

        {/* Veículos Disponíveis */}
        <StatCard
          title="Veículos Disponíveis"
          value={stats.veiculosDisponiveis}
          icon={<Car />}
          variant="green"
        />

        {/* Aluguéis Ativos */}
        <StatCard
          title="Aluguéis Ativos"
          value={stats.alugueisAtivos}
          icon={<BarChart3 />}
          variant="yellow"
        />

        {/* Receita Mensal */}
        <StatCard
          title="Receita Mensal"
          value={stats.receitaMensal}
          icon={<DollarSign />}
          variant="green"
          trend={{
            value: "8%",
            isPositive: true,
            label: "vs mês anterior"
          }}
        />
      </div>

      {/* Seção inferior com alertas e aluguéis recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Aluguéis Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Aluguéis Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum aluguel encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os aluguéis recentes aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alertas
              {stats.alertas.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {stats.alertas.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.alertas.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.tipo === 'danger' ? 'bg-destructive' :
                    alert.tipo === 'warning' ? 'bg-warning' :
                    'bg-primary'
                  }`} />
                  
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-medium">{alert.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                  </div>
                  
                  {alert.tipo === 'info' && (
                    <Badge variant="outline" className="text-xs">
                      Info
                    </Badge>
                  )}
                </div>
              ))}
              
              {stats.alertas.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas detalhadas em grid menor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CNH Vencendo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.cnhVencendo}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CNH Vencida</p>
                <p className="text-2xl font-bold text-red-600">{stats.cnhVencida}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Veículos em Manutenção</p>
                <p className="text-2xl font-bold text-gray-600">{stats.veiculosManutencao}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Car className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}