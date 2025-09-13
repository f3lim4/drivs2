// Sistema de Pagamentos Automáticos para Aluguéis Ativos
import { db } from './db';
import { contratos, pagamentos, alugueis, motoristas } from '../shared/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface PagamentoAutomatico {
  id: string;
  aluguelId: string | null;
  motoristaId: string;
  locadoraId: string;
  dataPagamento: string | null; // Data no formato YYYY-MM-DD (nullable para pagamentos em aberto)
  dataVencimento: string; // Data de vencimento obrigatória
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
    
    // CORREÇÃO: Buscar contrato relacionado por nome do motorista
    // Primeiro buscar o nome do motorista pelo ID
    const motoristasData = await db
      .select()
      .from(motoristas)
      .where(eq(motoristas.id, aluguel.motoristaId))
      .limit(1);
    
    let contratosRelacionados: any[] = [];
    
    if (motoristasData.length > 0) {
      const nomeMotorista = motoristasData[0].nome;
      
      // Buscar contrato pelo nome do motorista e veículo
      contratosRelacionados = await db
        .select()
        .from(contratos)
        .where(and(
          eq(contratos.veiculoId, aluguel.veiculoId),
          eq(contratos.cliente, nomeMotorista), // cliente é o nome do motorista
          or(eq(contratos.status, 'ativo'), eq(contratos.status, 'em_aberto'))
        ))
        .limit(1);
    }
    
    let contratoRelacionado = null;
    let recorrencia = 'semanal';
    let valorSemanal = 0;
    let valorMensal = 0;
    
    if (contratosRelacionados.length > 0) {
      contratoRelacionado = contratosRelacionados[0];
      recorrencia = contratoRelacionado.recorrencia || 'semanal';
      valorSemanal = contratoRelacionado.valorSemanal ? parseFloat(contratoRelacionado.valorSemanal) : 0;
      valorMensal = contratoRelacionado.valor ? parseFloat(contratoRelacionado.valor) : 0;
      console.log(`[CONTRATO] Encontrado contrato ${contratoRelacionado.id} - Recorrência: ${recorrencia}`);
    } else {
      // Fallback para alugueis antigos sem contrato
      valorSemanal = aluguel.valorMensal ? parseFloat(aluguel.valorMensal) / 4.35 : 0;
      console.log(`[CONTRATO] Nenhum contrato encontrado, usando valores do aluguel`);
    }
    
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
      
      // Usar dados já obtidos acima para determinar intervalo
      let intervaloDias = 7; // Default: semanal
      
      switch (recorrencia) {
        case 'semanal':
          intervaloDias = 7;
          break;
        case 'quinzenal':
          intervaloDias = 14;
          break;
        case 'mensal':
          intervaloDias = 30;
          break;
        default:
          intervaloDias = 7;
      }
      
      // Calcular próxima data usando recorrência específica do contrato
      const baseDate = new Date(`${ultimoPagamento.dataPagamento}T00:00:00Z`);
      baseDate.setUTCDate(baseDate.getUTCDate() + intervaloDias);
      proximaDataPagamentoStr = baseDate.toISOString().slice(0, 10);
      console.log(`[PRÓXIMO PAGAMENTO] Aluguel ${aluguel.id} - Data: ${proximaDataPagamentoStr} (${intervaloDias} dias)`);
    }

    // Verificar se precisa criar pagamento (no dia do vencimento ou atrasado para catch-up)
    if (hojeStr >= proximaDataPagamentoStr) {
      console.log(`[CRIANDO] Pagamento para aluguel ${aluguel.id} - Vencimento: ${proximaDataPagamentoStr}`);
      const proximaDataPagamento = new Date(`${proximaDataPagamentoStr}T00:00:00Z`);
      
      // CORREÇÃO: Passar dados do contrato para cálculo correto do valor
      await criarPagamentoAutomatico(aluguel, proximaDataPagamento, {
        recorrencia,
        valorSemanal,
        valorMensal,
        contratoRelacionado
      });
    } else {
      console.log(`[AGUARDANDO] Aluguel ${aluguel.id} - Criar em: ${proximaDataPagamentoStr}`);
    }

  } catch (error) {
    console.error(`[ERRO ALUGUEL ${aluguel.id}]`, error);
  }
};

// Criar pagamento automático para aluguel
const criarPagamentoAutomatico = async (aluguel: any, dataVencimento: Date, dadosContrato?: {
  recorrencia: string;
  valorSemanal: number;
  valorMensal: number;
  contratoRelacionado: any;
}) => {
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

    // CORREÇÃO: Calcular valor correto baseado na recorrência
    let valorPagamento: number;
    let descricaoTipo: string;
    
    if (dadosContrato) {
      // Usar dados do contrato se disponível
      const recorrencia = dadosContrato.recorrencia;
      
      switch (recorrencia) {
        case 'semanal':
          valorPagamento = dadosContrato.valorSemanal || (dadosContrato.valorMensal / 4.35);
          descricaoTipo = 'semanal';
          break;
        case 'quinzenal':
          valorPagamento = dadosContrato.valorSemanal ? dadosContrato.valorSemanal * 2 : (dadosContrato.valorMensal / 2.17);
          descricaoTipo = 'quinzenal';
          break;
        case 'mensal':
          valorPagamento = dadosContrato.valorMensal;
          descricaoTipo = 'mensal';
          break;
        default:
          valorPagamento = dadosContrato.valorSemanal || (dadosContrato.valorMensal / 4.35);
          descricaoTipo = 'semanal';
      }
      
      console.log(`[VALOR] Contrato ${dadosContrato.contratoRelacionado?.id} - Recorrência: ${recorrencia} - Valor: R$ ${valorPagamento.toFixed(2)}`);
    } else {
      // Fallback para alugueis sem contrato (usar valor semanal padrão)
      valorPagamento = parseFloat(aluguel.valorMensal) / 4.35;
      descricaoTipo = 'semanal';
      console.log(`[VALOR] Sem contrato - Usando valor semanal padrão: R$ ${valorPagamento.toFixed(2)}`);
    }

    // SEGURANÇA: Evitar pagamentos com valor zero
    if (valorPagamento <= 0) {
      console.warn(`[ERRO VALOR] Aluguel ${aluguel.id} - Valor inválido: R$ ${valorPagamento.toFixed(2)}, pulando criação`);
      return;
    }

    // Criar novo pagamento automático
    const novoPagamento: PagamentoAutomatico = {
      id: crypto.randomUUID(),
      aluguelId: aluguel.id,
      motoristaId: aluguel.motoristaId,
      locadoraId: aluguel.locadoraId,
      dataPagamento: dataFormatada,
      dataVencimento: dataFormatada, // Adicionar dataVencimento obrigatório
      valorTotal: valorPagamento.toFixed(2),
      valorPago: '0',
      valorRestante: valorPagamento.toFixed(2),
      status: 'em_aberto',
      tipo: 'aluguel',
      descricao: `Pagamento ${descricaoTipo} gerado automaticamente pelo sistema`,
      automatico: true,
      codigoPagamento: `PAG-AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    await db.insert(pagamentos).values([novoPagamento]);

    console.log(`[PAGAMENTO CRIADO] Aluguel ${aluguel.id} - Valor: R$ ${valorPagamento.toFixed(2)} - Vencimento: ${dataVencimento.toDateString()}`);

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

// SCHEDULER ESPECÍFICO: Executar às 00:10 todos os dias
const agendarPagamentosAs0010 = () => {
  const agora = new Date();
  const proxima0010 = new Date();
  
  // Configurar para 00:10 do dia seguinte
  proxima0010.setDate(agora.getDate() + 1);
  proxima0010.setHours(0, 10, 0, 0); // 00:10:00
  
  // Se ainda não passou das 00:10 hoje, usar hoje mesmo
  const hoje0010 = new Date();
  hoje0010.setHours(0, 10, 0, 0);
  if (agora < hoje0010) {
    proxima0010.setDate(agora.getDate()); // Usar hoje
  }
  
  const tempoAteProxima = proxima0010.getTime() - agora.getTime();
  
  console.log(`[SCHEDULER] Próxima execução de pagamentos: ${proxima0010.toLocaleString('pt-BR')} (em ${Math.round(tempoAteProxima / 60000)} minutos)`);
  
  setTimeout(() => {
    console.log('[SCHEDULER] Executando pagamentos automáticos às 00:10...');
    gerarProximosPagamentos();
    
    // Reagendar para o próximo dia às 00:10
    setInterval(() => {
      console.log('[SCHEDULER] Executando pagamentos automáticos diários às 00:10...');
      gerarProximosPagamentos();
    }, 24 * 60 * 60 * 1000); // 24 horas
    
  }, tempoAteProxima);
};

// Inicializar scheduler
agendarPagamentosAs0010();

// Função para criar pagamentos recorrentes quando um contrato é criado ou ativado
export const criarPagamentosRecorrentes = async (contrato: any, opcoes?: {
  marcarPagamentosAnterioresComoPago?: boolean;
  pagamentoRecorrente?: boolean;
  tipoRecorrencia?: 'semanal' | 'quinzenal' | 'mensal';
  dataPrimeiroPagamento?: string; // Data específica para primeiro pagamento
  tipoPagamento?: 'ilimitado' | 'limitado'; // Tipo de pagamento
  quantidadePagamentos?: number; // Quantidade específica de pagamentos
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
    const tipoPagamento = opcoes.tipoPagamento || 'ilimitado';
    const quantidadeEspecifica = opcoes.quantidadePagamentos;

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
    const dataInicioContrato = new Date(contrato.dataInicio);
    const dataFim = contrato.dataFim ? new Date(contrato.dataFim) : null;
    const hoje = new Date();

    // Usar data do primeiro pagamento se especificada, senão usar data de início do contrato
    const dataPrimeiro = opcoes.dataPrimeiroPagamento 
      ? new Date(opcoes.dataPrimeiroPagamento)
      : dataInicioContrato;

    console.log(`[PAGAMENTOS CONTRATO] Data primeiro pagamento: ${dataPrimeiro.toDateString()}`);
    console.log(`[PAGAMENTOS CONTRATO] Tipo pagamento: ${tipoPagamento}`);
    if (quantidadeEspecifica) {
      console.log(`[PAGAMENTOS CONTRATO] Quantidade específica: ${quantidadeEspecifica} pagamentos`);
    }

    // Determinar data fim baseada no tipo de pagamento
    let dataFimEfetiva: Date;
    
    if (tipoPagamento === 'limitado' && quantidadeEspecifica) {
      // Para pagamentos limitados, calcular data fim baseada na quantidade
      const duracaoTotalDias = quantidadeEspecifica * intervaloDias;
      dataFimEfetiva = new Date(dataPrimeiro.getTime() + (duracaoTotalDias * 24 * 60 * 60 * 1000));
      console.log(`[PAGAMENTOS CONTRATO] Fim calculado por quantidade: ${dataFimEfetiva.toDateString()}`);
    } else {
      // Para ilimitados, usar data fim do contrato ou 3 meses como padrão
      dataFimEfetiva = dataFim || new Date(dataPrimeiro.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias
      console.log(`[PAGAMENTOS CONTRATO] Fim por data contrato/padrão: ${dataFimEfetiva.toDateString()}`);
    }

    // Gerar todas as datas de pagamento no período
    const datasPagamento: Date[] = [];
    let dataAtual = new Date(dataPrimeiro);

    while (dataAtual <= dataFimEfetiva) {
      datasPagamento.push(new Date(dataAtual));
      
      // Se é limitado e já atingiu a quantidade, parar
      if (tipoPagamento === 'limitado' && quantidadeEspecifica && datasPagamento.length >= quantidadeEspecifica) {
        break;
      }
      
      dataAtual.setDate(dataAtual.getDate() + intervaloDias);
    }

    console.log(`[PAGAMENTOS CONTRATO] Total de pagamentos a criar: ${datasPagamento.length}`);

    // Criar pagamentos
    let pagamentosCriados = 0;
    let pagamentosRetroativos = 0;

    for (const dataPagamento of datasPagamento) {
      const isRetroativo = dataPagamento < hoje;
      
      
      // VERIFICAÇÃO SIMPLES: Verificar se pagamento já existe para este contrato específico nesta data
      // Cada contrato deve criar seus próprios pagamentos únicos
      const dataPagamentoStr = dataPagamento.toISOString().split('T')[0];
      
      const pagamentoExistente = await db
        .select()
        .from(pagamentos)
        .where(and(
          eq(pagamentos.aluguelId, contrato.id),
          eq(pagamentos.dataPagamento, dataPagamentoStr)
        ))
        .limit(1);

      if (pagamentoExistente.length > 0) {
        console.log(`[SKIP] Pagamento já existe para contrato ${contrato.id} em ${dataPagamento.toDateString()}`);
        continue;
      }
      
      // Buscar motorista real pelo nome do cliente
      let motoristaIdReal = null;
      try {
        const motoristaResult = await db
          .select({ id: motoristas.id })
          .from(motoristas)
          .where(and(
            sql`lower(${motoristas.nome}) = lower(${contrato.cliente})`,
            eq(motoristas.locadoraId, contrato.locadoraId)
          ))
          .limit(1);
        
        if (motoristaResult.length > 0) {
          motoristaIdReal = motoristaResult[0].id;
          console.log(`[CONTRATO-PAGAMENTO] Motorista encontrado: ${contrato.cliente} -> ${motoristaIdReal}`);
        } else {
          console.log(`[CONTRATO-PAGAMENTO] Motorista não encontrado para: ${contrato.cliente}`);
        }
      } catch (error) {
        console.log(`[CONTRATO-PAGAMENTO] Erro ao buscar motorista: ${error}`);
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


      // Criar novo pagamento (usar aluguelId para armazenar ID do contrato)
      const novoPagamento = {
        id: crypto.randomUUID(),
        aluguelId: contrato.id, // Usando aluguelId para armazenar ID do contrato
        motoristaId: motoristaIdReal || `SYS-CONTRATO-${Date.now()}`, // Usar motorista real ou ID especial único
        locadoraId: contrato.locadoraId,
        dataPagamento: dataPagamentoEfetiva,
        dataVencimento: dataPagamento.toISOString().split('T')[0],
        valorTotal: valorPagamento.toFixed(2),
        valorPago: statusPagamento === 'pago' ? valorPagamento.toFixed(2) : '0',
        valorRestante: statusPagamento === 'pago' ? '0' : valorPagamento.toFixed(2),
        status: statusPagamento,
        tipo: 'contrato', // Mudar de 'aluguel' para 'contrato'
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