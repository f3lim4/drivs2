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

  // Buscar anúncios ativos
  const { data: anunciosRaw = [] } = useQuery({
    queryKey: ['/api/anuncios/ativos'],
    enabled: !!profile,
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
    anuncios: anunciosRaw.length,
    locadoraId: profile?.locadoraId
  });

  // Log específico para anúncios
  console.log('Notificações - Anúncios carregados:', anunciosRaw.map(a => ({
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    conteudo: a.conteudo,
    created_at: a.created_at
  })));

  // Log detalhado dos dados
  console.log('Notificações - Detalhes dos dados:', {
    motoristas: motoristas.map(m => ({ id: m.id, nome: m.nome, vencimentoCnh: m.vencimentoCnh })),
    infracoes: infracoes.map(i => ({ id: i.id, status: i.status, dataVencimento: i.dataVencimento, situacao: i.situacao })),
    pagamentos: pagamentos.map(p => ({ id: p.id, status: p.status, valor: p.valor, motoristaNome: p.motoristaNome }))
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
      dataFinalizacao: m.dataFinalizacao,
      proximaManutencao: m.proximaManutencao,
      proximaManutencaoKm: m.proximaManutencaoKm,
      veiculoId: m.veiculoId
    })));

    console.log('Notificações - Veículos disponíveis:', veiculos.map(v => ({
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      quilometragem: v.quilometragem
    })));
    
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



            if (diasParaManutencao <= 15 && diasParaManutencao > 7) {
              notifications.push({
                id: `manutencao-data-aviso-${manutencao.id}`,
                type: 'warning',
                title: 'Manutenção Programada se Aproxima',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - Manutenção programada para ${format(dataProximaManutencao, 'dd/MM/yyyy', { locale: ptBR })} (em ${diasParaManutencao} dias)`,
                timestamp: new Date(),
                isRead: false,
              });
            } else if (diasParaManutencao <= 7 && diasParaManutencao > 0) {
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

          // Verificar manutenção por quilometragem
          if (manutencao.proximaManutencaoKm && veiculo.quilometragem) {
            const kmRestantes = manutencao.proximaManutencaoKm - veiculo.quilometragem;



            if (kmRestantes <= 5000 && kmRestantes > 1000) {
              notifications.push({
                id: `manutencao-km-aviso-${manutencao.id}`,
                type: 'warning',
                title: 'Manutenção por Quilometragem se Aproxima',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - Restam ${kmRestantes.toLocaleString()}km para próxima manutenção (${manutencao.proximaManutencaoKm.toLocaleString()}km)`,
                timestamp: new Date(),
                isRead: false,
              });
            } else if (kmRestantes <= 1000 && kmRestantes > 0) {
              notifications.push({
                id: `manutencao-km-urgente-${manutencao.id}`,
                type: 'danger',
                title: 'Manutenção por Quilometragem Urgente',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - URGENTE: Apenas ${kmRestantes.toLocaleString()}km restantes para manutenção (${manutencao.proximaManutencaoKm.toLocaleString()}km)`,
                timestamp: new Date(),
                isRead: false,
              });
            } else if (kmRestantes <= 0) {
              notifications.push({
                id: `manutencao-km-critica-${manutencao.id}`,
                type: 'danger',
                title: 'Manutenção por Quilometragem Crítica',
                message: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) - CRÍTICO: Quilometragem de manutenção ultrapassada (atual: ${veiculo.quilometragem.toLocaleString()}km, deveria ser: ${manutencao.proximaManutencaoKm.toLocaleString()}km)`,
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
      if (infracao.situacao === 'ativo' && infracao.status === 'pendente') {
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
      if (pagamento.status === 'pendente') {
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