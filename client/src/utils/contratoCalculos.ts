/**
 * Funções para cálculos precisos de contratos
 * Considera o número exato de semanas no período do contrato
 */

import { addMonths, differenceInDays, format } from 'date-fns';

export interface CalculoContrato {
  dataInicio: Date;
  dataFim: Date;
  totalDias: number;
  totalSemanas: number;
  valorSemanal: number;
  valorTotal: number;
  detalhes: {
    diasCompletos: number;
    semanasCompletas: number;
    diasRestantes: number;
    incluirDiasRestantes: boolean;
  };
}

/**
 * Calcula o número exato de semanas completas no período do contrato
 * Conta apenas semanas completas (grupos de 7 dias) - dias restantes não são cobrados
 */
export function calcularContratoExato(
  dataInicio: Date | string,
  meses: number,
  valorSemanal: number
): CalculoContrato {
  // Normaliza data de início
  const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : new Date(dataInicio);
  
  // Calcula a data final (início + meses exatos)
  const dataFim = addMonths(inicio, meses);
  
  // Calcula o total de dias no período
  const totalDias = differenceInDays(dataFim, inicio);
  
  // Conta APENAS semanas completas (cada 7 dias = 1 semana)
  const semanasCompletas = Math.floor(totalDias / 7);
  
  // Dias restantes (não são cobrados)
  const diasRestantes = totalDias % 7;
  
  // Total de semanas = apenas semanas completas
  const totalSemanas = semanasCompletas;
  
  // Valor total do contrato = semanas completas × valor semanal
  const valorTotal = totalSemanas * valorSemanal;
  
  console.log('[CÁLCULO CONTRATO EXATO]', {
    periodo: `${format(inicio, 'dd/MM/yyyy')} até ${format(dataFim, 'dd/MM/yyyy')}`,
    totalDias,
    semanasCompletas: `${totalDias} ÷ 7 = ${semanasCompletas} semanas`,
    diasRestantes: `${diasRestantes} dias (não cobrados)`,
    calculo: `${semanasCompletas} semanas × R$ ${valorSemanal} = R$ ${valorTotal.toFixed(2)}`,
    exemplo: meses === 26 && valorSemanal === 550 ? 
      `Exemplo conforme especificação: ${semanasCompletas} semanas × R$ 550 = R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
      undefined
  });
  
  return {
    dataInicio: inicio,
    dataFim,
    totalDias,
    totalSemanas,
    valorSemanal,
    valorTotal,
    detalhes: {
      diasCompletos: totalDias,
      semanasCompletas,
      diasRestantes,
      incluirDiasRestantes: false // Nunca inclui dias restantes
    }
  };
}

/**
 * Formatar o resultado do cálculo para exibição
 */
export function formatarCalculoContrato(calculo: CalculoContrato): string {
  const { dataInicio, dataFim, totalDias, totalSemanas, valorSemanal, valorTotal, detalhes } = calculo;
  
  let explicacao = `
📅 PERÍODO DO CONTRATO:
• Início: ${format(dataInicio, 'dd/MM/yyyy')}
• Fim: ${format(dataFim, 'dd/MM/yyyy')}
• Total de dias: ${totalDias} dias

⏰ CÁLCULO DE SEMANAS:
• Semanas completas: ${detalhes.semanasCompletas}
• Dias restantes: ${detalhes.diasRestantes} (não cobrados)
• Total de semanas para cobrança: ${totalSemanas}

💰 CÁLCULO FINANCEIRO:
• Valor semanal: R$ ${valorSemanal.toFixed(2).replace('.', ',')}
• Total de semanas: ${totalSemanas}
• Valor total do contrato: R$ ${valorTotal.toFixed(2).replace('.', ',')}

🔍 COMPARAÇÃO COM MÉTODOS ANTERIORES:
• Método antigo (×4): R$ ${(valorSemanal * 4 * (totalDias / 30.44)).toFixed(2).replace('.', ',')}
• Método médio (×4.35): R$ ${(valorSemanal * 4.35 * (totalDias / 30.44)).toFixed(2).replace('.', ',')}
• Método exato (apenas semanas completas): R$ ${valorTotal.toFixed(2).replace('.', ',')}

✅ REGRA APLICADA: Cobra apenas semanas completas (grupos de 7 dias)
  `;

  return explicacao;
}

/**
 * Exemplos de teste com diferentes cenários, incluindo o exemplo especificado
 */
export function exemploCalculos(): string {
  const exemplos = [
    // Exemplo específico da especificação
    {
      titulo: "EXEMPLO ESPECIFICADO - 26 MESES (28/04/2025)",
      dataInicio: new Date(2025, 3, 28), // 28 de abril de 2025
      meses: 26,
      valorSemanal: 550 // R$ 550 por semana
    },
    // Outros exemplos para comparação
    {
      titulo: "CONTRATO DE 4 MESES",
      dataInicio: new Date(2025, 0, 1), // 1º de janeiro de 2025
      meses: 4,
      valorSemanal: 400
    },
    {
      titulo: "CONTRATO DE 12 MESES",
      dataInicio: new Date(2025, 2, 1), // 1º de março de 2025
      meses: 12,
      valorSemanal: 400
    }
  ];
  
  let resultado = `EXEMPLOS DE CÁLCULOS EXATOS DE CONTRATOS\n${'='.repeat(60)}\n\n`;
  
  exemplos.forEach((exemplo, index) => {
    resultado += `${index + 1}. ${exemplo.titulo}\n`;
    const calculo = calcularContratoExato(exemplo.dataInicio, exemplo.meses, exemplo.valorSemanal);
    resultado += formatarCalculoContrato(calculo);
    
    // Destaque especial para o exemplo da especificação
    if (exemplo.meses === 26 && exemplo.valorSemanal === 550) {
      resultado += `\n🎯 RESULTADO CONFORME ESPECIFICAÇÃO:
• ${calculo.totalSemanas} semanas completas × R$ 550 = R$ ${calculo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Período: 28/04/2025 a ${format(calculo.dataFim, 'dd/MM/yyyy')}`;
    }
    
    resultado += `\n${'='.repeat(60)}\n\n`;
  });
  
  return resultado;
}

/**
 * Função específica para o cenário da especificação
 * Retorna o valor exato para 26 meses a partir de 28/04/2025 com R$ 550/semana
 */
export function calcularEspecificacao(): CalculoContrato {
  return calcularContratoExato(
    new Date(2025, 3, 28), // 28/04/2025
    26, // 26 meses
    550 // R$ 550 por semana
  );
}