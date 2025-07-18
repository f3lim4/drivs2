import type { InsertAtividade } from '@shared/schema';

// Função utilitária para registrar atividades
export async function registrarAtividade(
  locadoraId: string,
  usuario: string,
  acao: string,
  entidade: string,
  entidadeId?: string,
  detalhes?: string
) {
  try {
    const data: InsertAtividade = {
      locadoraId,
      usuario,
      acao,
      entidade,
      entidadeId,
      detalhes,
    };

    const response = await fetch('/api/atividades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to register activity');
    }

    return response.json();
  } catch (error) {
    console.error('Error registering activity:', error);
    // Não bloquear a operação principal se não conseguir registrar a atividade
  }
}

// Função para formatar nome da ação
export function formatarAcao(acao: string): string {
  const acoes: { [key: string]: string } = {
    'criar': 'Criar',
    'editar': 'Editar',
    'excluir': 'Excluir',
    'cadastrar': 'Cadastrar',
    'atualizar': 'Atualizar',
    'deletar': 'Deletar',
    'pagar': 'Pagar',
    'cancelar': 'Cancelar',
    'gerar': 'Gerar',
    'upload': 'Upload',
    'download': 'Download',
    'enviar': 'Enviar',
    'receber': 'Receber',
    'aprovar': 'Aprovar',
    'rejeitar': 'Rejeitar',
    'concluir': 'Concluir',
    'agendar': 'Agendar',
    'iniciar': 'Iniciar',
    'pausar': 'Pausar',
    'retomar': 'Retomar',
    'finalizar': 'Finalizar'
  };

  return acoes[acao.toLowerCase()] || acao;
}

// Função para formatar nome da entidade
export function formatarEntidade(entidade: string): string {
  const entidades: { [key: string]: string } = {
    'veiculo': 'Veículo',
    'veiculos': 'Veículos',
    'motorista': 'Motorista',
    'motoristas': 'Motoristas',
    'aluguel': 'Aluguel',
    'alugueis': 'Aluguéis',
    'contrato': 'Contrato',
    'contratos': 'Contratos',
    'pagamento': 'Pagamento',
    'pagamentos': 'Pagamentos',
    'manutencao': 'Manutenção',
    'manutencoes': 'Manutenções',
    'despesa': 'Despesa',
    'despesas': 'Despesas',
    'infracao': 'Infração',
    'infracoes': 'Infrações',
    'local': 'Local',
    'locais': 'Locais',
    'anuncio': 'Anúncio',
    'anuncios': 'Anúncios',
    'locadora': 'Locadora',
    'locadoras': 'Locadoras',
    'perfil': 'Perfil',
    'template': 'Template',
    'templates': 'Templates',
    'relatorio': 'Relatório',
    'relatorios': 'Relatórios',
    'dashboard': 'Dashboard',
    'sistema': 'Sistema'
  };

  return entidades[entidade.toLowerCase()] || entidade;
}