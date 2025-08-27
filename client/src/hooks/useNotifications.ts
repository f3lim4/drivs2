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
    refetchInterval: 30000, // Refetch a cada 30 segundos
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: alugueisRaw = [] } = useQuery({
    queryKey: [alugueisUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: veiculosRaw = [] } = useQuery({
    queryKey: [veiculosUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: manutencoesRaw = [] } = useQuery({
    queryKey: [manutencoesUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: despesasRaw = [] } = useQuery({
    queryKey: [despesasUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: infracoesRaw = [] } = useQuery({
    queryKey: [infracoesUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: pagamentosRaw = [] } = useQuery({
    queryKey: [pagamentosUrl],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Buscar anúncios ativos
  const { data: anunciosRaw = [] } = useQuery({
    queryKey: ['/api/anuncios/ativos'],
    enabled: !!profile,
    refetchInterval: 60000, // Anúncios podem ser atualizados menos frequentemente
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Buscar dados da locadora para verificar período de teste
  const { data: locadoraData } = useQuery({
    queryKey: [`/api/locadoras/${profile?.locadoraId}`],
    enabled: !!profile?.locadoraId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
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

      if (aluguel.status === 'em_aberto') {
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
        const dataAgendada = manutencao.dataAgendada || manutencao.dataInicio || new Date();
        notifications.push({
          id: `manutencao-agendada-${manutencao.id}`,
          type: 'info',
          title: 'Manutenção Agendada',
          message: `Manutenção ${manutencao.tipo} agendada para ${format(new Date(dataAgendada), 'dd/MM/yyyy', { locale: ptBR })}`,
          timestamp: new Date(dataAgendada),
          isRead: false,
        });
      }
      
      if (manutencao.status === 'em_andamento') {
        notifications.push({
          id: `manutencao-andamento-${manutencao.id}`,
          type: 'warning',
          title: 'Manutenção em Andamento',
          message: `Manutenção ${manutencao.tipo} em andamento na ${manutencao.oficina}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          isRead: false,
        });
      }

      if (manutencao.statusPagamento === 'em_aberto' && manutencao.valorOrcamento && parseFloat(manutencao.valorOrcamento) > 0) {
        notifications.push({
          id: `manutencao-pagamento-${manutencao.id}`,
          type: 'warning',
          title: 'Pagamento Pendente',
          message: `Pagamento de R$ ${parseFloat(manutencao.valorOrcamento).toFixed(2)} pendente para manutenção`,
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

      // Verificar próximas manutenções programadas (apenas para manutenções concluídas)
      if (manutencao.status === 'concluida') {
        const veiculo = veiculos.find((v: any) => v.id === manutencao.veiculoId);
        
        if (veiculo) {
          // Verificar manutenção por data
          if (manutencao.proximaManutencao) {
            const dataProximaManutencao = new Date(manutencao.proximaManutencao);
            const diasParaManutencao = differenceInDays(dataProximaManutencao, today);



            if (diasParaManutencao <= 7 && diasParaManutencao > 2) {
              notifications.push({
                id: `manutencao-data-aviso-${manutencao.id}`,
                type: 'warning',
                title: 'Manutenção Próxima',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - Manutenção programada para ${format(dataProximaManutencao, 'dd/MM/yyyy', { locale: ptBR })} (em ${diasParaManutencao} dias)`,
                timestamp: new Date(),
                isRead: false,
              });
            } else if (diasParaManutencao <= 2 && diasParaManutencao >= 0) {
              notifications.push({
                id: `manutencao-data-urgente-${manutencao.id}`,
                type: 'danger',
                title: 'Manutenção Urgente',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - Manutenção urgente em ${diasParaManutencao} dias (${format(dataProximaManutencao, 'dd/MM/yyyy', { locale: ptBR })})`,
                timestamp: new Date(),
                isRead: false,
              });
            } else if (diasParaManutencao <= 0) {
              notifications.push({
                id: `manutencao-data-vencida-${manutencao.id}`,
                type: 'danger',
                title: 'Manutenção Vencida',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - Manutenção estava programada para ${format(dataProximaManutencao, 'dd/MM/yyyy', { locale: ptBR })} (${Math.abs(diasParaManutencao)} dias em atraso)`,
                timestamp: new Date(),
                isRead: false,
              });
            }
          }


        }
      }

      // Verificar manutenção por quilometragem (se houver dados do veículo) - código antigo a ser removido
      if (false && manutencao.proximaManutencaoKm) {
        const veiculo = veiculos.find((v: any) => v.id === manutencao.veiculoId);
        if (veiculo && veiculo.quilometragem) {
          const kmAtual = parseInt(veiculo.quilometragem) || 0;
          const kmManutencao = parseInt(manutencao.proximaManutencaoKm) || 0;
          const kmRestantes = kmManutencao - kmAtual;
          
          // Alertar quando restam 5000km ou menos
          if (kmRestantes <= 5000 && kmRestantes > 0) {
            const placaVeiculo = `${veiculo.placa} (${veiculo.marca} ${veiculo.modelo})`;
            notifications.push({
              id: `manutencao-km-${manutencao.id}`,
              type: kmRestantes <= 1000 ? 'danger' : 'warning',
              title: kmRestantes <= 1000 ? 'Manutenção Urgente (KM)' : 'Manutenção Próxima (KM)',
              message: `Veículo ${placaVeiculo} precisa de manutenção em ${kmRestantes.toLocaleString()} km`,
              timestamp: new Date(Date.now() - Math.random() * 3600000),
              isRead: false,
            });
          } else if (kmRestantes <= 0) {
            const placaVeiculo = `${veiculo.placa} (${veiculo.marca} ${veiculo.modelo})`;
            notifications.push({
              id: `manutencao-atrasada-${manutencao.id}`,
              type: 'danger',
              title: 'Manutenção Atrasada',
              message: `Veículo ${placaVeiculo} ultrapassou ${Math.abs(kmRestantes).toLocaleString()} km da manutenção programada`,
              timestamp: new Date(Date.now() - Math.random() * 3600000),
              isRead: false,
            });
          }
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

  // Notificações de infrações - alertas de prazo de pagamento
  if (infracoes.length > 0) {
    infracoes.forEach((infracao: any) => {
      if (infracao.situacao === 'ativo' && infracao.status === 'em_aberto') {
        const dataVencimento = new Date(infracao.dataVencimento);
        const diasParaVencer = differenceInDays(dataVencimento, today);
        
        if (diasParaVencer < 0) {
          // Multa vencida
          notifications.push({
            id: `infracao-vencida-${infracao.id}`,
            type: 'danger',
            title: 'Multa Vencida',
            message: `Multa de R$ ${infracao.valorFinal} venceu em ${format(dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}`,
            timestamp: dataVencimento,
            isRead: false,
          });
        } else if (diasParaVencer <= 15) {
          // Multa próxima do vencimento (15 dias)
          notifications.push({
            id: `infracao-vencendo-${infracao.id}`,
            type: 'warning',
            title: 'Multa Vencendo',
            message: `Multa de R$ ${infracao.valorFinal} vence em ${diasParaVencer} dias`,
            timestamp: new Date(Date.now() - Math.random() * 3600000),
            isRead: false,
          });
        }
      }
    });
  }

  // Notificações de pagamentos pendentes
  if (pagamentos.length > 0) {
    pagamentos.forEach((pagamento: any) => {
      if (pagamento.status === 'em_aberto') {
        const dataPagamento = new Date(pagamento.dataPagamento || pagamento.data);
        const diasAtras = differenceInDays(today, dataPagamento);
        
        // Pagamentos pendentes (sem limite de dias)
        notifications.push({
          id: `pagamento-pendente-${pagamento.id}`,
          type: 'warning',
          title: 'Pagamento Pendente',
          message: `Pagamento de R$ ${pagamento.valorTotal || pagamento.valor} para ${pagamento.motoristaNome || 'Motorista'}`,
          timestamp: dataPagamento,
          isRead: false,
        });
      }
    });
  }

  // Notificações de período de teste gratuito - excluir para locadoras Vitalia VIP
  if (locadoraData && locadoraData.testeGratuito && locadoraData.dataVencimentoTeste && !locadoraData.vitalia && locadoraData.plano !== 'vip') {
    const dataVencimento = new Date(locadoraData.dataVencimentoTeste);
    const diasRestantes = differenceInDays(dataVencimento, today);
    
    if (diasRestantes < 0) {
      // Período de teste vencido
      notifications.push({
        id: `teste-vencido-${profile?.locadoraId}`,
        type: 'danger',
        title: 'Período de Teste Expirado',
        message: `Seu período de teste gratuito de ${locadoraData.diasTesteGratuito} dias expirou. Faça o upgrade para continuar usando o sistema.`,
        timestamp: dataVencimento,
        isRead: false,
      });
    } else if (diasRestantes <= 5) {
      // Período de teste vencendo em 5 dias ou menos
      const tipoNotificacao = diasRestantes <= 1 ? 'danger' : 'warning';
      const tituloNotificacao = diasRestantes === 0 
        ? 'Período de Teste Expira Hoje!' 
        : diasRestantes === 1 
        ? 'Período de Teste Expira Amanhã!' 
        : `Período de Teste Expira em ${diasRestantes} dias`;
      
      notifications.push({
        id: `teste-vencendo-${profile?.locadoraId}`,
        type: tipoNotificacao,
        title: tituloNotificacao,
        message: `Seu período de teste gratuito expira ${diasRestantes === 0 ? 'hoje' : diasRestantes === 1 ? 'amanhã' : `em ${diasRestantes} dias`}. Faça o upgrade para não perder acesso ao sistema.`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        isRead: false,
      });
    } else if (diasRestantes <= 10) {
      // Aviso suave quando restam entre 6-10 dias
      notifications.push({
        id: `teste-aviso-${profile?.locadoraId}`,
        type: 'info',
        title: `${diasRestantes} dias restantes do período gratuito`,
        message: `Aproveite os últimos ${diasRestantes} dias do seu período de teste gratuito. Considere fazer upgrade para ter acesso completo.`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        isRead: false,
      });
    }
  }

  // Notificações de anúncios críticos (warning e error)
  if (anunciosRaw.length > 0) {
    anunciosRaw.forEach((anuncio: any) => {
      if (anuncio.tipo === 'warning' || anuncio.tipo === 'error') {
        // Usar created_at se disponível, senão usar data atual menos 1 dia
        const dataPublicacao = anuncio.created_at 
          ? new Date(anuncio.created_at) 
          : new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const diasAtras = differenceInDays(today, dataPublicacao);
        
        // Mostrar anúncios críticos dos últimos 30 dias
        if (diasAtras <= 30) {
          notifications.push({
            id: `anuncio-${anuncio.tipo}-${anuncio.id}`,
            type: anuncio.tipo === 'error' ? 'danger' : 'warning',
            title: anuncio.tipo === 'error' ? 'Erro' : 'Atenção',
            message: anuncio.conteudo,
            timestamp: dataPublicacao,
            isRead: false,
          });
        }
      }
    });
  }

  // Priorizar notificações por tipo de criticidade
  const priorityOrder = {
    'danger': 1,    // Manutenções urgentes, CNH vencida, multas vencidas
    'warning': 2,   // Manutenções próximas, despesas altas, pagamentos pendentes
    'info': 3,      // Informações gerais
    'success': 4    // Confirmações
  };
  
  // Ordenar notificações por prioridade e depois por timestamp
  const sortedNotifications = notifications.sort((a, b) => {
    const priorityA = priorityOrder[a.type] || 999;
    const priorityB = priorityOrder[b.type] || 999;
    
    // Primeiro ordenar por prioridade
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Se a prioridade for igual, ordenar por timestamp (mais recente primeiro)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const unreadCount = sortedNotifications.filter(n => !n.isRead).length;

  return {
    notifications: sortedNotifications,
    unreadCount,
    hasNotifications: sortedNotifications.length > 0,
  };
}