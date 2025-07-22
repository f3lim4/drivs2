/**
 * Sistema automático para verificar e encerrar contratos vencidos
 */

import { db } from './db';
import { contratos } from '@shared/schema';
import { eq, and, lte } from 'drizzle-orm';

/**
 * Verifica contratos que atingiram a data final e os encerra automaticamente
 */
export async function verificarContratosVencidos() {
  try {
    console.log('[CONTRACT-CHECKER] Verificando contratos vencidos...');
    
    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Buscar contratos ativos que passaram da data final
    const contratosVencidos = await db
      .select()
      .from(contratos)
      .where(
        and(
          eq(contratos.status, 'ativo'),
          lte(contratos.dataFim, hoje) // Data final menor ou igual a hoje
        )
      );
      
    if (contratosVencidos.length === 0) {
      console.log('[CONTRACT-CHECKER] Nenhum contrato vencido encontrado');
      return { processados: 0, encerrados: [] };
    }
    
    console.log(`[CONTRACT-CHECKER] Encontrados ${contratosVencidos.length} contratos vencidos`);
    
    const contratosEncerrados = [];
    
    // Encerrar cada contrato vencido
    for (const contrato of contratosVencidos) {
      console.log(`[ENCERRANDO] Contrato ${contrato.id} - Cliente: ${contrato.cliente} - Data Final: ${contrato.dataFim}`);
      
      // Atualizar status para 'encerrado'
      await db
        .update(contratos)
        .set({
          status: 'encerrado',
          updatedAt: new Date()
        })
        .where(eq(contratos.id, contrato.id));
        
      contratosEncerrados.push({
        id: contrato.id,
        cliente: contrato.cliente,
        dataFim: contrato.dataFim
      });
      
      console.log(`[ENCERRADO] Contrato ${contrato.id} encerrado automaticamente`);
    }
    
    console.log(`[CONTRACT-CHECKER] Processamento concluído: ${contratosEncerrados.length} contratos encerrados`);
    
    return {
      processados: contratosVencidos.length,
      encerrados: contratosEncerrados
    };
    
  } catch (error) {
    console.error('[CONTRACT-CHECKER] Erro ao verificar contratos vencidos:', error);
    return { processados: 0, encerrados: [], erro: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Inicia verificação periódica de contratos (executa a cada 1 hora)
 */
export function iniciarVerificacaoPeriodicaContratos() {
  console.log('[CONTRACT-CHECKER] Iniciando verificação periódica de contratos...');
  
  // Executar imediatamente ao inicializar
  verificarContratosVencidos();
  
  // Executar a cada hora (3600000ms = 1 hora)
  setInterval(() => {
    verificarContratosVencidos();
  }, 3600000);
  
  console.log('[CONTRACT-CHECKER] Verificação periódica configurada (a cada 1 hora)');
}