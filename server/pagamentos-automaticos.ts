// Sistema de Pagamentos Automáticos para Aluguéis Ativos
import { db } from './db';
import { contratos, pagamentos, alugueis, pagamentosExcluidos } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

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

// Função para gerar próximo pagamento para aluguéis ativos
export const gerarProximosPagamentos = async () => {
  try {
    console.log('[PAGAMENTOS AUTOMÁTICOS] Iniciando verificação de aluguéis ativos...');

    // Buscar todos os aluguéis ativos
    const alugueisAtivos = await db
      .select()
      .from(alugueis)
      .where(eq(alugueis.status, 'ativo'));

    console.log(`[PAGAMENTOS AUTOMÁTICOS] Encontrados ${alugueisAtivos.length} aluguéis ativos`);

    for (const aluguel of alugueisAtivos) {
      await processarAluguelAtivo(aluguel);
    }

    console.log('[PAGAMENTOS AUTOMÁTICOS] Verificação concluída');
  } catch (error) {
    console.error('[ERRO PAGAMENTOS AUTOMÁTICOS]', error);
  }
};

// Processar cada aluguel ativo individualmente
const processarAluguelAtivo = async (aluguel: any) => {
  try {
    console.log(`[PROCESSANDO] Aluguel ${aluguel.id} - Motorista: ${aluguel.motoristaId}`);
    
    // Buscar último pagamento do aluguel
    const ultimosPagamentos = await db
      .select()
      .from(pagamentos)
      .where(and(
        eq(pagamentos.aluguelId, aluguel.id),
        eq(pagamentos.automatico, true)
      ))
      .orderBy(desc(pagamentos.dataPagamento))
      .limit(1);

    // Obter data de hoje como string no formato YYYY-MM-DD (local timezone)
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    // Se não há pagamentos, usar data de início do aluguel
    let proximaDataPagamentoStr: string;
    
    if (ultimosPagamentos.length === 0) {
      // Primeiro pagamento baseado na data de início
      proximaDataPagamentoStr = aluguel.dataInicio;
      console.log(`[PRIMEIRO PAGAMENTO] Aluguel ${aluguel.id} - Data: ${proximaDataPagamentoStr}`);
    } else {
      const ultimoPagamento = ultimosPagamentos[0];
      // Calcular próxima data (7 dias depois) usando UTC para evitar problemas de timezone
      const baseDate = new Date(`${ultimoPagamento.dataPagamento}T00:00:00Z`);
      baseDate.setUTCDate(baseDate.getUTCDate() + 7);
      proximaDataPagamentoStr = baseDate.toISOString().slice(0, 10);
      console.log(`[PRÓXIMO PAGAMENTO] Aluguel ${aluguel.id} - Data: ${proximaDataPagamentoStr}`);
    }

    // Verificar se precisa criar pagamento (no dia do vencimento ou atrasado para catch-up)
    if (hojeStr >= proximaDataPagamentoStr) {
      console.log(`[CRIANDO] Pagamento para aluguel ${aluguel.id} - Vencimento: ${proximaDataPagamentoStr}`);
      const proximaDataPagamento = new Date(`${proximaDataPagamentoStr}T00:00:00Z`);
      await criarPagamentoAutomatico(aluguel, proximaDataPagamento);
    } else {
      console.log(`[AGUARDANDO] Aluguel ${aluguel.id} - Criar em: ${proximaDataPagamentoStr}`);
    }

  } catch (error) {
    console.error(`[ERRO ALUGUEL ${aluguel.id}]`, error);
  }
};

// Criar pagamento automático para aluguel
const criarPagamentoAutomatico = async (aluguel: any, dataVencimento: Date) => {
  try {
    // Verificar se já existe pagamento para esta data
    const dataFormatada = dataVencimento.toISOString().split('T')[0]; // YYYY-MM-DD
    const pagamentoExistente = await db
      .select()
      .from(pagamentos)
      .where(and(
        eq(pagamentos.aluguelId, aluguel.id),
        eq(pagamentos.dataPagamento, dataFormatada)
      ))
      .limit(1);

    if (pagamentoExistente.length > 0) {
      console.log(`[SKIP] Pagamento já existe para aluguel ${aluguel.id} em ${dataVencimento.toDateString()}`);
      return;
    }

    // Verificar se este pagamento foi excluído manualmente
    const foiExcluidoManualmente = await db
      .select()
      .from(pagamentosExcluidos)
      .where(and(
        eq(pagamentosExcluidos.aluguelId, aluguel.id),
        eq(pagamentosExcluidos.locadoraId, aluguel.locadoraId),
        eq(pagamentosExcluidos.dataPagamento, dataFormatada)
      ))
      .limit(1);

    if (foiExcluidoManualmente.length > 0) {
      console.log(`[SKIP] Pagamento foi excluído manualmente para aluguel ${aluguel.id} em ${dataVencimento.toDateString()}`);
      return;
    }

    // Calcular valor semanal baseado no valor mensal
    const valorSemanal = parseFloat(aluguel.valorMensal) / 4.35; // Conversão mensal para semanal

    // Criar novo pagamento automático
    const novoPagamento: PagamentoAutomatico = {
      id: crypto.randomUUID(),
      aluguelId: aluguel.id,
      motoristaId: aluguel.motoristaId,
      locadoraId: aluguel.locadoraId,
      dataPagamento: dataFormatada,
      valorTotal: valorSemanal.toFixed(2),
      valorPago: '0',
      valorRestante: valorSemanal.toFixed(2),
      status: 'em_aberto',
      tipo: 'aluguel',
      descricao: 'Pagamento semanal gerado automaticamente pelo sistema',
      automatico: true,
      codigoPagamento: `PAG-AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    await db.insert(pagamentos).values([novoPagamento]);

    console.log(`[PAGAMENTO CRIADO] Aluguel ${aluguel.id} - Valor: R$ ${valorSemanal.toFixed(2)} - Vencimento: ${dataVencimento.toDateString()}`);

  } catch (error) {
    console.error(`[ERRO CRIAÇÃO PAGAMENTO] Aluguel ${aluguel.id}:`, error);
  }
};

// Função para parar pagamentos automáticos quando aluguel encerra
export const pararPagamentosAutomaticos = async (aluguelId: string, status: string) => {
  if (status === 'finalizado' || status === 'cancelado') {
    console.log(`[PAGAMENTOS AUTOMÁTICOS] Parando geração para aluguel ${aluguelId} - Status: ${status}`);
    
    // O sistema automático irá detectar na próxima verificação que o aluguel não está mais ativo
    // e não criará mais pagamentos para este aluguel
  }
};

// Executar verificação a cada 30 minutos para capturar primeiros minutos do dia
setInterval(gerarProximosPagamentos, 30 * 60 * 1000); // 30 minutos

// Função para criar pagamentos recorrentes quando um contrato é criado ou ativado
export const criarPagamentosRecorrentes = async (contrato: any, opcoes?: {
  marcarPagamentosAnterioresComoPago?: boolean;
  pagamentoRecorrente?: boolean;
  tipoRecorrencia?: 'semanal' | 'quinzenal' | 'mensal';
}) => {
  try {
    if (!opcoes?.pagamentoRecorrente) {
      console.log('[PAGAMENTOS CONTRATO] Pagamentos recorrentes desabilitados para contrato:', contrato.id);
      return;
    }

    console.log('[PAGAMENTOS CONTRATO] Criando pagamentos recorrentes para contrato:', contrato.id);
    console.log('[PAGAMENTOS CONTRATO] Opções:', opcoes);

    const tipoRecorrencia = opcoes.tipoRecorrencia || 'semanal';
    const marcarAnterioresComoPago = opcoes.marcarPagamentosAnterioresComoPago || false;

    // Calcular valor do pagamento baseado no tipo de recorrência
    let valorPagamento: number;
    let intervaloDias: number;
    let descricaoTipo: string;

    switch (tipoRecorrencia) {
      case 'semanal':
        valorPagamento = contrato.valorSemanal ? parseFloat(contrato.valorSemanal) : parseFloat(contrato.valor) / 4.35;
        intervaloDias = 7;
        descricaoTipo = 'semanal';
        break;
      case 'quinzenal':
        valorPagamento = contrato.valorSemanal ? parseFloat(contrato.valorSemanal) * 2 : parseFloat(contrato.valor) / 2.17;
        intervaloDias = 14;
        descricaoTipo = 'quinzenal';
        break;
      case 'mensal':
        valorPagamento = parseFloat(contrato.valor);
        intervaloDias = 30;
        descricaoTipo = 'mensal';
        break;
      default:
        valorPagamento = contrato.valorSemanal ? parseFloat(contrato.valorSemanal) : parseFloat(contrato.valor) / 4.35;
        intervaloDias = 7;
        descricaoTipo = 'semanal';
    }

    console.log(`[PAGAMENTOS CONTRATO] Valor ${descricaoTipo}: R$ ${valorPagamento.toFixed(2)}`);

    // Datas de início e fim
    const dataInicio = new Date(contrato.dataInicio);
    const dataFim = contrato.dataFim ? new Date(contrato.dataFim) : null;
    const hoje = new Date();

    // Se não há data fim, criar pagamentos por 3 meses (período padrão)
    const dataFimEfetiva = dataFim || new Date(dataInicio.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias

    console.log(`[PAGAMENTOS CONTRATO] Período: ${dataInicio.toDateString()} até ${dataFimEfetiva.toDateString()}`);

    // Gerar todas as datas de pagamento no período
    const datasPagamento: Date[] = [];
    let dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFimEfetiva) {
      datasPagamento.push(new Date(dataAtual));
      dataAtual.setDate(dataAtual.getDate() + intervaloDias);
    }

    console.log(`[PAGAMENTOS CONTRATO] Total de pagamentos a criar: ${datasPagamento.length}`);

    // Criar pagamentos
    let pagamentosCriados = 0;
    let pagamentosRetroativos = 0;

    for (const dataPagamento of datasPagamento) {
      const isRetroativo = dataPagamento < hoje;
      
      // Verificar se pagamento já existe
      const pagamentoExistente = await db
        .select()
        .from(pagamentos)
        .where(and(
          eq(pagamentos.contratoId, contrato.id),
          eq(pagamentos.dataVencimento, dataPagamento.toISOString().split('T')[0])
        ))
        .limit(1);

      if (pagamentoExistente.length > 0) {
        console.log(`[SKIP] Pagamento já existe para contrato ${contrato.id} em ${dataPagamento.toDateString()}`);
        continue;
      }

      // Definir status do pagamento
      let statusPagamento: string;
      let dataPagamentoEfetiva: string | null;

      if (isRetroativo && marcarAnterioresComoPago) {
        statusPagamento = 'pago';
        dataPagamentoEfetiva = dataPagamento.toISOString().split('T')[0];
        pagamentosRetroativos++;
      } else {
        statusPagamento = 'em_aberto';
        dataPagamentoEfetiva = null; // Null para pagamentos em aberto
      }

      // Criar novo pagamento
      const novoPagamento = {
        id: crypto.randomUUID(),
        contratoId: contrato.id,
        locadoraId: contrato.locadoraId,
        dataPagamento: dataPagamentoEfetiva,
        dataVencimento: dataPagamento.toISOString().split('T')[0],
        valorTotal: valorPagamento.toFixed(2),
        valorPago: statusPagamento === 'pago' ? valorPagamento.toFixed(2) : '0',
        valorRestante: statusPagamento === 'pago' ? '0' : valorPagamento.toFixed(2),
        status: statusPagamento,
        tipo: 'aluguel',
        descricao: `Pagamento ${descricaoTipo} do contrato - ${contrato.cliente}`,
        automatico: true,
        codigoPagamento: `PAG-CONT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      await db.insert(pagamentos).values([novoPagamento]);
      pagamentosCriados++;

      console.log(`[PAGAMENTO CRIADO] Contrato ${contrato.id} - ${statusPagamento} - R$ ${valorPagamento.toFixed(2)} - Vencimento: ${dataPagamento.toDateString()}`);
    }

    console.log(`[PAGAMENTOS CONTRATO] Criados ${pagamentosCriados} pagamentos para contrato ${contrato.id} (${pagamentosRetroativos} retroativos)`);

  } catch (error) {
    console.error('[ERRO PAGAMENTOS CONTRATO]', error);
    throw error;
  }
};

// Executar uma vez ao iniciar o servidor
setTimeout(gerarProximosPagamentos, 10000); // 10 segundos após iniciar