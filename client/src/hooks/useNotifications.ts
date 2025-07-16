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
  
  // Buscar todos os dados necessários para gerar notificações
  const { data: motoristas = [] } = useQuery({
    queryKey: ['/api/motoristas'],
    enabled: !!profile?.locadoraId,
  });

  const { data: alugueis = [] } = useQuery({
    queryKey: ['/api/alugueis'],
    enabled: !!profile?.locadoraId,
  });

  const { data: veiculos = [] } = useQuery({
    queryKey: ['/api/veiculos'],
    enabled: !!profile?.locadoraId,
  });

  const { data: manutencoes = [] } = useQuery({
    queryKey: ['/api/manutencoes'],
    enabled: !!profile?.locadoraId,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ['/api/despesas'],
    enabled: !!profile?.locadoraId,
  });

  const { data: infracoes = [] } = useQuery({
    queryKey: ['/api/infracoes'],
    enabled: !!profile?.locadoraId,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['/api/pagamentos'],
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

  // Notificações de manutenções
  if (manutencoes.length > 0) {
    manutencoes.forEach((manutencao: any) => {
      if (manutencao.status === 'agendada') {
        notifications.push({
          id: `manutencao-agendada-${manutencao.id}`,
          type: 'info',
          title: 'Manutenção Agendada',
          message: `Manutenção ${manutencao.tipoManutencao} agendada para ${format(new Date(manutencao.dataAgendada), 'dd/MM/yyyy', { locale: ptBR })}`,
          timestamp: new Date(manutencao.dataAgendada),
          isRead: false,
        });
      }
      
      if (manutencao.status === 'em_andamento') {
        notifications.push({
          id: `manutencao-andamento-${manutencao.id}`,
          type: 'warning',
          title: 'Manutenção em Andamento',
          message: `Manutenção ${manutencao.tipoManutencao} em andamento na ${manutencao.oficina}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          isRead: false,
        });
      }

      if (manutencao.statusPagamento === 'em_aberto' && manutencao.valor > 0) {
        notifications.push({
          id: `manutencao-pagamento-${manutencao.id}`,
          type: 'warning',
          title: 'Pagamento Pendente',
          message: `Pagamento de R$ ${manutencao.valor.toFixed(2)} pendente para manutenção`,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          isRead: false,
        });
      }
    });
  }

  // Notificações de despesas altas
  if (despesas.length > 0) {
    const despesasRecentes = despesas.filter((despesa: any) => {
      const dataDespesa = new Date(despesa.data);
      const diasAtras = differenceInDays(today, dataDespesa);
      return diasAtras <= 7; // Despesas dos últimos 7 dias
    });

    despesasRecentes.forEach((despesa: any) => {
      if (despesa.valor > 500) { // Despesas acima de R$ 500
        notifications.push({
          id: `despesa-alta-${despesa.id}`,
          type: 'warning',
          title: 'Despesa Alta Registrada',
          message: `Despesa de R$ ${despesa.valor.toFixed(2)} em ${despesa.categoria}`,
          timestamp: new Date(despesa.data),
          isRead: false,
        });
      }
    });
  }

  // Notificações de infrações
  if (infracoes.length > 0) {
    infracoes.forEach((infracao: any) => {
      if (infracao.situacao === 'ativo') {
        const dataInfracao = new Date(infracao.data);
        const diasAtras = differenceInDays(today, dataInfracao);
        
        if (diasAtras <= 3) { // Infrações dos últimos 3 dias
          notifications.push({
            id: `infracao-nova-${infracao.id}`,
            type: 'danger',
            title: 'Nova Infração',
            message: `Infração de R$ ${infracao.valor.toFixed(2)} - ${infracao.descricao}`,
            timestamp: dataInfracao,
            isRead: false,
          });
        }
      }
    });
  }

  // Notificações de pagamentos
  if (pagamentos.length > 0) {
    pagamentos.forEach((pagamento: any) => {
      if (pagamento.status === 'pendente') {
        const dataPagamento = new Date(pagamento.data);
        const diasAtras = differenceInDays(today, dataPagamento);
        
        if (diasAtras <= 7) { // Pagamentos pendentes dos últimos 7 dias
          notifications.push({
            id: `pagamento-pendente-${pagamento.id}`,
            type: 'warning',
            title: 'Pagamento Pendente',
            message: `Pagamento de R$ ${pagamento.valor.toFixed(2)} para ${pagamento.motoristaNome}`,
            timestamp: dataPagamento,
            isRead: false,
          });
        }
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