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
 * Calcula o número exato de semanas no período do contrato
 * e o valor total baseado no valor semanal
 */
export function calcularContratoExato(
  dataInicio: Date,
  meses: number,
  valorSemanal: number
): CalculoContrato {
  // Calcula a data final (início + meses)
  const dataFim = addMonths(dataInicio, meses);
  
  // Calcula o total de dias no período
  const totalDias = differenceInDays(dataFim, dataInicio);
  
  // Calcula semanas completas
  const semanasCompletas = Math.floor(totalDias / 7);
  
  // Dias restantes (menos de uma semana)
  const diasRestantes = totalDias % 7;
  
  // Decide se inclui os dias restantes como uma semana parcial
  // Se há 3 ou mais dias restantes, considera como uma semana adicional
  const incluirDiasRestantes = diasRestantes >= 3;
  
  // Total de semanas para cobrança
  const totalSemanas = semanasCompletas + (incluirDiasRestantes ? 1 : 0);
  
  // Valor total do contrato
  const valorTotal = totalSemanas * valorSemanal;
  
  return {
    dataInicio,
    dataFim,
    totalDias,
    totalSemanas,
    valorSemanal,
    valorTotal,
    detalhes: {
      diasCompletos: totalDias,
      semanasCompletas,
      diasRestantes,
      incluirDiasRestantes
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
• Dias restantes: ${detalhes.diasRestantes}`;

  if (detalhes.incluirDiasRestantes) {
    explicacao += `
• Como há ${detalhes.diasRestantes} dias restantes (≥3), conta como +1 semana`;
  } else {
    explicacao += `
• Como há apenas ${detalhes.diasRestantes} dias restantes (<3), não conta semana extra`;
  }

  explicacao += `
• Total de semanas para cobrança: ${totalSemanas}

💰 CÁLCULO FINANCEIRO:
• Valor semanal: R$ ${valorSemanal.toFixed(2).replace('.', ',')}
• Total de semanas: ${totalSemanas}
• Valor total do contrato: R$ ${valorTotal.toFixed(2).replace('.', ',')}

🔍 COMPARAÇÃO COM MÉTODO ANTERIOR:
• Método antigo (×4): R$ ${(valorSemanal * 4 * (totalDias / 30.44)).toFixed(2).replace('.', ',')}
• Método médio (×4.35): R$ ${(valorSemanal * 4.35 * (totalDias / 30.44)).toFixed(2).replace('.', ',')}
• Método exato (semanas reais): R$ ${valorTotal.toFixed(2).replace('.', ',')}
  `;

  return explicacao;
}

/**
 * Exemplos de teste com diferentes cenários
 */
export function exemploCalculos(): string {
  const valorSemanal = 400; // R$ 400 por semana
  
  const exemplos = [
    // Contrato de 4 meses
    {
      titulo: "CONTRATO DE 4 MESES",
      dataInicio: new Date(2025, 0, 1), // 1º de janeiro de 2025
      meses: 4
    },
    // Contrato de 6 meses
    {
      titulo: "CONTRATO DE 6 MESES", 
      dataInicio: new Date(2025, 0, 15), // 15 de janeiro de 2025
      meses: 6
    },
    // Contrato de 12 meses
    {
      titulo: "CONTRATO DE 12 MESES",
      dataInicio: new Date(2025, 2, 1), // 1º de março de 2025
      meses: 12
    }
  ];
  
  let resultado = `EXEMPLOS DE CÁLCULOS EXATOS DE CONTRATOS\n${'='.repeat(50)}\n\n`;
  
  exemplos.forEach((exemplo, index) => {
    resultado += `${index + 1}. ${exemplo.titulo}\n`;
    const calculo = calcularContratoExato(exemplo.dataInicio, exemplo.meses, valorSemanal);
    resultado += formatarCalculoContrato(calculo);
    resultado += `\n${'='.repeat(50)}\n\n`;
  });
  
  return resultado;
}