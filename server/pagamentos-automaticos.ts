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
    
    // ✅ VERIFICAR STATUS DO CONTRATO ANTES DE GERAR PAGAMENTOS
    // Buscar contrato relacionado ao aluguel para verificar se ainda está ativo
    const contratosRelacionados = await db
      .select()
      .from(contratos)
      .where(eq(contratos.locadoraId, aluguel.locadoraId));
    
    const contratoRelacionado = contratosRelacionados.find(c => 
      c.cliente === aluguel.motoristaNome || 
      (c.veiculoId && c.veiculoId === aluguel.veiculoId)
    );
    
    // Se contrato foi excluído ou está encerrado/cancelado, não gerar pagamentos
    if (!contratoRelacionado) {
      console.log(`[SKIP] Aluguel ${aluguel.id} - Contrato relacionado não encontrado (pode ter sido excluído)`);
      return;
    }
    
    if (contratoRelacionado.status === 'encerrado' || contratoRelacionado.status === 'cancelado') {
      console.log(`[SKIP] Aluguel ${aluguel.id} - Contrato com status '${contratoRelacionado.status}' - não gerando novos pagamentos`);
      return;
    }
    
    console.log(`[OK] Aluguel ${aluguel.id} - Contrato ${contratoRelacionado.id} ativo (status: ${contratoRelacionado.status})`);
    
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

// Executar uma vez ao iniciar o servidor
setTimeout(gerarProximosPagamentos, 10000); // 10 segundos após iniciar