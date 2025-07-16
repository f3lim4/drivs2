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
  
  // Buscar todos os dados necessários para gerar notificações com isolamento por locadora
  const motoristasUrl = profile?.locadoraId ? `/api/motoristas?locadoraId=${profile.locadoraId}` : '/api/motoristas';
  const alugueisUrl = profile?.locadoraId ? `/api/alugueis?locadoraId=${profile.locadoraId}` : '/api/alugueis';
  const veiculosUrl = profile?.locadoraId ? `/api/veiculos?locadoraId=${profile.locadoraId}` : '/api/veiculos';
  const manutencoesUrl = profile?.locadoraId ? `/api/manutencoes?locadoraId=${profile.locadoraId}` : '/api/manutencoes';
  const despesasUrl = profile?.locadoraId ? `/api/despesas?locadoraId=${profile.locadoraId}` : '/api/despesas';
  const infracoesUrl = profile?.locadoraId ? `/api/infracoes?locadoraId=${profile.locadoraId}` : '/api/infracoes';
  const pagamentosUrl = profile?.locadoraId ? `/api/pagamentos?locadoraId=${profile.locadoraId}` : '/api/pagamentos';

  const { data: motoristasRaw = [] } = useQuery({
    queryKey: [motoristasUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: alugueisRaw = [] } = useQuery({
    queryKey: [alugueisUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: veiculosRaw = [] } = useQuery({
    queryKey: [veiculosUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: manutencoesRaw = [] } = useQuery({
    queryKey: [manutencoesUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: despesasRaw = [] } = useQuery({
    queryKey: [despesasUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: infracoesRaw = [] } = useQuery({
    queryKey: [infracoesUrl],
    enabled: !!profile?.locadoraId,
  });

  const { data: pagamentosRaw = [] } = useQuery({
    queryKey: [pagamentosUrl],
    enabled: !!profile?.locadoraId,
  });

  // Filtrar dados com isolamento de segurança
  const motoristas = profile?.locadoraId ? motoristasRaw.filter((m: any) => m.locadoraId === profile.locadoraId) : motoristasRaw;
  const alugueis = profile?.locadoraId ? alugueisRaw.filter((a: any) => a.locadoraId === profile.locadoraId) : alugueisRaw;
  const veiculos = profile?.locadoraId ? veiculosRaw.filter((v: any) => v.locadoraId === profile.locadoraId) : veiculosRaw;
  const manutencoes = profile?.locadoraId ? manutencoesRaw.filter((m: any) => m.locadoraId === profile.locadoraId) : manutencoesRaw;
  const despesas = profile?.locadoraId ? despesasRaw.filter((d: any) => d.locadoraId === profile.locadoraId) : despesasRaw;
  const infracoes = profile?.locadoraId ? infracoesRaw.filter((i: any) => i.locadoraId === profile.locadoraId) : infracoesRaw;
  const pagamentos = profile?.locadoraId ? pagamentosRaw.filter((p: any) => p.locadoraId === profile.locadoraId) : pagamentosRaw;

  // Gerar notificações baseadas nos dados reais
  const notifications: Notification[] = [];
  const today = new Date();

  // Log para debug - verificar dados carregados
  console.log('Notificações - Dados carregados:', {
    motoristas: motoristas.length,
    alugueis: alugueis.length,
    veiculos: veiculos.length,
    manutencoes: manutencoes.length,
    despesas: despesas.length,
    infracoes: infracoes.length,
    pagamentos: pagamentos.length,
    locadoraId: profile?.locadoraId
  });

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
    console.log('Notificações - Verificando manutenções:', manutencoes.map(m => ({
      id: m.id,
      status: m.status,
      statusPagamento: m.statusPagamento,
      valor: m.valor,
      tipoManutencao: m.tipoManutencao,
      dataAgendada: m.dataAgendada,
      dataInicio: m.dataInicio,
      dataFinalizacao: m.dataFinalizacao
    })));
    
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

      // Manutenções concluídas recentemente (últimos 7 dias)
      if (manutencao.status === 'concluida' && manutencao.dataFinalizacao) {
        const dataFinalizacao = new Date(manutencao.dataFinalizacao);
        const diasAtras = differenceInDays(today, dataFinalizacao);
        
        if (diasAtras <= 7) {
          notifications.push({
            id: `manutencao-concluida-${manutencao.id}`,
            type: 'success',
            title: 'Manutenção Concluída',
            message: `Manutenção ${manutencao.tipoManutencao} finalizada com sucesso`,
            timestamp: dataFinalizacao,
            isRead: false,
          });
        }
      }
    });
  }

  // Notificações de despesas altas
  if (despesas.length > 0) {
    const despesasRecentes = despesas.filter((despesa: any) => {
      const dataDespesa = new Date(despesa.data);
      const diasAtras = differenceInDays(today, dataDespesa);
      return diasAtras <= 30; // Despesas dos últimos 30 dias
    });

    despesasRecentes.forEach((despesa: any) => {
      const valor = parseFloat(despesa.valor);
      if (valor > 200) { // Despesas acima de R$ 200
        notifications.push({
          id: `despesa-alta-${despesa.id}`,
          type: 'warning',
          title: 'Despesa Significativa',
          message: `Despesa de R$ ${valor.toFixed(2)} em ${despesa.categoria}`,
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

  // Log final das notificações geradas
  console.log('Notificações - Geradas:', {
    total: sortedNotifications.length,
    unread: unreadCount,
    tipos: sortedNotifications.map(n => ({ id: n.id, type: n.type, title: n.title }))
  });

  return {
    notifications: sortedNotifications,
    unreadCount,
    hasNotifications: sortedNotifications.length > 0,
  };
}