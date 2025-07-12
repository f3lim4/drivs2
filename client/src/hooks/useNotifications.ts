import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export function useNotifications() {
  const { profile } = useAuth();
  
  // Buscar motoristas para verificar CNH
  const { data: motoristas = [] } = useQuery({
    queryKey: ['/api/motoristas'],
    enabled: !!profile?.locadoraId,
  });

  // Buscar aluguéis para verificar vencimentos
  const { data: alugueis = [] } = useQuery({
    queryKey: ['/api/alugueis'],
    enabled: !!profile?.locadoraId,
  });

  // Buscar veículos para verificar manutenção
  const { data: veiculos = [] } = useQuery({
    queryKey: ['/api/veiculos'],
    enabled: !!profile?.locadoraId,
  });

  // Gerar notificações baseadas nos dados reais
  const notifications: Notification[] = [];
  const today = new Date();

  if (motoristas.length > 0) {
    motoristas.forEach((motorista: any) => {
      const vencimentoCnh = new Date(motorista.vencimentoCnh);
      const diasParaVencer = differenceInDays(vencimentoCnh, today);

      if (diasParaVencer < 0) {
        // CNH vencida
        notifications.push({
          id: `cnh-vencida-${motorista.id}`,
          type: 'danger',
          title: 'CNH Vencida',
          message: `CNH de ${motorista.nome} venceu em ${format(vencimentoCnh, 'dd/MM/yyyy', { locale: ptBR })}`,
          timestamp: new Date(Date.now() - Math.random() * 3600000), // Random timestamp within last hour
          isRead: false,
        });
      } else if (diasParaVencer <= 30) {
        // CNH vencendo em 30 dias
        notifications.push({
          id: `cnh-vencendo-${motorista.id}`,
          type: 'warning',
          title: 'CNH Vencendo',
          message: `CNH de ${motorista.nome} vence em ${diasParaVencer} dias`,
          timestamp: new Date(Date.now() - Math.random() * 3600000),
          isRead: false,
        });
      }
    });
  }

  if (alugueis.length > 0) {
    alugueis.forEach((aluguel: any) => {
      const dataFim = new Date(aluguel.dataFim);
      const diasParaVencer = differenceInDays(dataFim, today);

      if (diasParaVencer <= 7 && diasParaVencer > 0) {
        // Contrato vencendo em 7 dias
        notifications.push({
          id: `contrato-vencendo-${aluguel.id}`,
          type: 'warning',
          title: 'Contrato Vencendo',
          message: `Contrato com ${aluguel.motoristaNome} vence em ${diasParaVencer} dias`,
          timestamp: new Date(Date.now() - Math.random() * 3600000),
          isRead: false,
        });
      }

      if (aluguel.status === 'pendente') {
        // Novo aluguel pendente
        notifications.push({
          id: `aluguel-pendente-${aluguel.id}`,
          type: 'info',
          title: 'Aluguel Pendente',
          message: `Aluguel com ${aluguel.motoristaNome} aguarda confirmação`,
          timestamp: new Date(aluguel.createdAt),
          isRead: false,
        });
      }
    });
  }

  if (veiculos.length > 0) {
    veiculos.forEach((veiculo: any) => {
      if (veiculo.status === 'manutencao') {
        notifications.push({
          id: `manutencao-${veiculo.id}`,
          type: 'info',
          title: 'Veículo em Manutenção',
          message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) está em manutenção`,
          timestamp: new Date(Date.now() - Math.random() * 86400000), // Random timestamp within last day
          isRead: false,
        });
      }
    });
  }

  // Ordenar notificações por timestamp (mais recentes primeiro)
  const sortedNotifications = notifications.sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const unreadCount = sortedNotifications.filter(n => !n.isRead).length;

  return {
    notifications: sortedNotifications,
    unreadCount,
    hasNotifications: sortedNotifications.length > 0,
  };
}