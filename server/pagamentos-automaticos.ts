// Sistema de Pagamentos Automáticos para Contratos Ativos
import { db } from './db';
import { contratos, pagamentos, alugueis } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface PagamentoAutomatico {
  id: string;
  aluguelId: string | null;
  motoristaId: string;
  locadoraId: string;
  dataPagamento: string; // Data no formato YYYY-MM-DD
  valorTotal: string; // Decimal como string
  valorPago: string; // Decimal como string  
  valorRestante: string; // Decimal como string
  status: 'em_aberto';
  tipo: 'aluguel';
  descricao: string | null;
  automatico: boolean;
  codigoPagamento: string | null;
}

// Função para gerar próximo pagamento para contratos ativos
export const gerarProximosPagamentos = async () => {
  try {
    console.log('[PAGAMENTOS AUTOMÁTICOS] Iniciando verificação de contratos ativos...');

    // Buscar todos os contratos ativos
    const contratosAtivos = await db
      .select()
      .from(contratos)
      .where(eq(contratos.status, 'ativo'));

    console.log(`[PAGAMENTOS AUTOMÁTICOS] Encontrados ${contratosAtivos.length} contratos ativos`);

    for (const contrato of contratosAtivos) {
      await processarContratoAtivo(contrato);
    }

    console.log('[PAGAMENTOS AUTOMÁTICOS] Verificação concluída');
  } catch (error) {
    console.error('[ERRO PAGAMENTOS AUTOMÁTICOS]', error);
  }
};

// Processar cada contrato ativo individualmente
const processarContratoAtivo = async (contrato: any) => {
  try {
    // Buscar último pagamento do contrato
    const ultimosPagamentos = await db
      .select()
      .from(pagamentos)
      .where(and(
        eq(pagamentos.aluguelId, contrato.aluguelId),
        eq(pagamentos.automatico, true)
      ))
      .orderBy(desc(pagamentos.dataPagamento))
      .limit(1);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Se não há pagamentos, usar data de início do contrato
    let proximaDataPagamento: Date;
    
    if (ultimosPagamentos.length === 0) {
      // Primeiro pagamento baseado na data de início
      proximaDataPagamento = new Date(contrato.dataInicio);
    } else {
      const ultimoPagamento = ultimosPagamentos[0];
      proximaDataPagamento = new Date(ultimoPagamento.dataPagamento);
      proximaDataPagamento.setDate(proximaDataPagamento.getDate() + 7); // Próxima semana
    }

    // Verificar se precisa criar pagamento (1 dia antes do vencimento)
    const dataLimite = new Date(proximaDataPagamento);
    dataLimite.setDate(dataLimite.getDate() - 1); // 1 dia antes

    if (hoje >= dataLimite) {
      await criarPagamentoAutomatico(contrato, proximaDataPagamento);
    }

  } catch (error) {
    console.error(`[ERRO CONTRATO ${contrato.id}]`, error);
  }
};

// Criar pagamento automático para contrato
const criarPagamentoAutomatico = async (contrato: any, dataVencimento: Date) => {
  try {
    // Verificar se já existe pagamento para esta data
    const dataFormatada = dataVencimento.toISOString().split('T')[0]; // YYYY-MM-DD
    const pagamentoExistente = await db
      .select()
      .from(pagamentos)
      .where(and(
        eq(pagamentos.aluguelId, contrato.aluguelId),
        eq(pagamentos.dataPagamento, dataFormatada)
      ))
      .limit(1);

    if (pagamentoExistente.length > 0) {
      console.log(`[SKIP] Pagamento já existe para ${contrato.aluguelId} em ${dataVencimento.toDateString()}`);
      return;
    }

    // Criar novo pagamento automático
    const novoPagamento: PagamentoAutomatico = {
      id: crypto.randomUUID(),
      aluguelId: contrato.aluguelId,
      motoristaId: contrato.motoristaId,
      locadoraId: contrato.locadoraId,
      dataPagamento: dataFormatada,
      valorTotal: contrato.valorSemanal?.toString() || '0',
      valorPago: '0',
      valorRestante: contrato.valorSemanal?.toString() || '0',
      status: 'em_aberto',
      tipo: 'aluguel',
      descricao: 'Pagamento gerado automaticamente pelo sistema',
      automatico: true,
      codigoPagamento: `PAG-AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    await db.insert(pagamentos).values([novoPagamento]);

    console.log(`[PAGAMENTO CRIADO] Contrato ${contrato.id} - Vencimento: ${dataVencimento.toDateString()}`);

  } catch (error) {
    console.error(`[ERRO CRIAÇÃO PAGAMENTO] Contrato ${contrato.id}:`, error);
  }
};

// Função para parar pagamentos automáticos quando contrato encerra
export const pararPagamentosAutomaticos = async (contratoId: string, status: string) => {
  if (status === 'encerrado' || status === 'cancelado') {
    console.log(`[PAGAMENTOS AUTOMÁTICOS] Parando geração para contrato ${contratoId} - Status: ${status}`);
    
    // Aqui podemos adicionar lógica adicional se necessário
    // Por exemplo, marcar pagamentos futuros como cancelados
  }
};

// Executar verificação a cada hora
setInterval(gerarProximosPagamentos, 60 * 60 * 1000); // 1 hora

// Executar uma vez ao iniciar o servidor
setTimeout(gerarProximosPagamentos, 10000); // 10 segundos após iniciar