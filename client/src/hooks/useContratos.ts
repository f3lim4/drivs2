/**
 * Hook para gerenciar contratos com persistência no banco de dados
 * Substitui o armazenamento em memória por operações reais no banco
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contrato, InsertContrato } from '@shared/schema';
import { useAuth } from './useAuth';

export function useContratos() {
  const { profile } = useAuth();
  const locadoraId = profile?.locadoraId;
  const queryClient = useQueryClient();

  // Buscar contratos (incluindo aluguéis ativos como contratos)
  const { 
    data: contratos = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['contratos', locadoraId],
    queryFn: async () => {
      // Buscar contratos formais
      const contratosResponse = await fetch(`/api/contratos?locadoraId=${locadoraId}`);
      if (!contratosResponse.ok) throw new Error('Failed to fetch contratos');
      const contratosFormais = await contratosResponse.json();

      // Buscar aluguéis ativos para incluir como contratos
      const alugueisResponse = await fetch(`/api/alugueis?locadoraId=${locadoraId}`);
      if (!alugueisResponse.ok) throw new Error('Failed to fetch alugueis');
      const todosAlugueis = await alugueisResponse.json();
      const alugueisAtivos = todosAlugueis.filter((aluguel: any) => aluguel.status === 'ativo');

      // Buscar dados dos motoristas para fazer a comparação correta
      const motoristasResponse = await fetch(`/api/motoristas?locadoraId=${locadoraId}`);
      if (!motoristasResponse.ok) throw new Error('Failed to fetch motoristas');
      const motoristas = await motoristasResponse.json();
      
      // Criar mapa de CPF -> Nome para comparação
      const cpfParaNome = new Map();
      motoristas.forEach((m: any) => {
        cpfParaNome.set(m.id, m.nome); // m.id é o CPF
      });

      // Filtrar aluguéis que NÃO têm contrato formal correspondente
      const alugueisMotoristas = alugueisAtivos.map((a: any) => a.motoristaId); // CPFs
      const contratosClientes = contratosFormais.map((c: any) => c.cliente); // Nomes
      
      // Converter CPFs dos aluguéis para nomes para comparação
      const alugueisNomes = alugueisMotoristas.map((cpf: string) => cpfParaNome.get(cpf));
      
      console.log('[CONTRATOS DEBUG]', {
        alugueisAtivos: alugueisAtivos.length,
        contratosFormais: contratosFormais.length,
        alugueisMotoristas, // CPFs
        contratosClientes, // Nomes
        alugueisNomes, // Nomes convertidos dos CPFs
        intersecao: alugueisNomes.filter((nome: string) => contratosClientes.includes(nome))
      });

      // CORREÇÃO: Deduplicação mais robusta - usar ID único para evitar duplicatas
      const contratosIdUnicos = new Set();
      const alugueisIdUnicos = new Set();
      
      // Marcar contratos formais existentes
      contratosFormais.forEach((c: any) => {
        contratosIdUnicos.add(c.id);
      });
      
      // Converter apenas aluguéis que NÃO têm contrato formal correspondente e não são duplicados
      const aluguelsSemContrato = alugueisAtivos.filter((aluguel: any) => {
        const nomeMotorista: string = cpfParaNome.get(aluguel.motoristaId);
        const idUnico = `aluguel_${aluguel.id}`;
        
        // Verificar se já foi processado
        if (alugueisIdUnicos.has(idUnico)) {
          console.log('[ANTI-DUPLICATE] Aluguel já processado:', idUnico);
          return false;
        }
        
        // Verificar se não tem contrato formal correspondente (comparação mais robusta)
        const temContratoFormal = contratosClientes.some((cliente: string) => {
          return cliente && nomeMotorista && cliente.trim().toLowerCase() === nomeMotorista.trim().toLowerCase();
        });
        
        if (!temContratoFormal) {
          alugueisIdUnicos.add(idUnico);
          console.log('[INCLUINDO ALUGUEL] Sem contrato formal:', {
            nomeMotorista,
            id: aluguel.id,
            veiculoId: aluguel.veiculoId
          });
          return true;
        } else {
          console.log('[EXCLUINDO ALUGUEL] Já tem contrato formal:', {
            nomeMotorista,
            id: aluguel.id,
            contratosClientes
          });
        }
        
        return false;
      });

      const contratosDeAlugueis = aluguelsSemContrato.map((aluguel: any) => ({
        id: `aluguel_${aluguel.id}`,
        locadoraId: aluguel.locadoraId,
        motoristaId: aluguel.motoristaId,
        motoristaNome: aluguel.motoristaNome,
        motoristaCpf: aluguel.motoristaCpf,
        veiculoId: aluguel.veiculoId,
        veiculoPlaca: aluguel.veiculoPlaca,
        veiculoMarca: aluguel.veiculoMarca,
        veiculoModelo: aluguel.veiculoModelo,
        dataInicio: aluguel.dataInicio,
        dataFim: aluguel.dataFim,
        valorMensal: aluguel.valorMensal,
        valorSemanal: aluguel.valorSemanal,
        caucao: aluguel.caucao,
        observacoes: aluguel.observacoes,
        status: 'ativo',
        tipo: 'Ativo', // Status unificado para aluguéis ativos
        createdAt: aluguel.createdAt,
        updatedAt: aluguel.updatedAt,
      }));

      // Modificar tipo dos contratos formais ativos para "Ativo"
      const contratosFormaisCorrigidos = contratosFormais.map((contrato: any) => ({
        ...contrato,
        tipo: contrato.status === 'ativo' ? 'Ativo' : contrato.tipo // Se status é ativo, tipo deve ser "Ativo"
      }));

      // Combinar contratos formais corrigidos + aluguéis sem contrato formal
      const todosContratos = [...contratosFormaisCorrigidos, ...contratosDeAlugueis];
      
      // VERIFICAÇÃO FINAL: Deduplicação por cliente/motorista para evitar duplicatas visuais
      const contratosDeduplicados = todosContratos.filter((contrato, index, arr) => {
        const nomeDoContrato = contrato.cliente || contrato.motoristaNome;
        
        // Encontrar se há outro contrato/aluguel para o mesmo motorista
        const primeiroIndice = arr.findIndex(c => {
          const nomeComparacao = c.cliente || c.motoristaNome;
          return nomeComparacao === nomeDoContrato;
        });
        
        const isDuplicado = primeiroIndice !== index;
        
        if (isDuplicado) {
          console.log('[ANTI-DUPLICATE] Contrato duplicado removido:', {
            cliente: nomeDoContrato,
            id: contrato.id,
            tipo: contrato.tipo,
            status: contrato.status,
            primeiroIndice,
            indiceAtual: index
          });
        }
        
        return !isDuplicado;
      });
      
      console.log('[CONTRATOS FINAL]', {
        contratosOriginais: todosContratos.length,
        contratosDeduplicados: contratosDeduplicados.length,
        removidos: todosContratos.length - contratosDeduplicados.length
      });
      
      return contratosDeduplicados;
    },
    enabled: !!locadoraId,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
    refetchOnMount: true, // Sempre recarregar ao montar
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
  });

  // Criar contrato
  const createContrato = useMutation({
    mutationFn: async (contrato: InsertContrato) => {
      const contratoData = {
        ...contrato,
        locadoraId,
      };
      
      console.log('Enviando dados do contrato:', contratoData);
      
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        
        // Tentar fazer parse do JSON de erro para mensagem mais amigável
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message && errorJson.message.includes('contrato/aluguel ativo')) {
            throw new Error(`Este motorista já possui um contrato/aluguel ativo. Finalize o contrato atual antes de criar um novo.`);
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, usa mensagem original
        }
        
        throw new Error(`Failed to create contrato: ${response.status} - ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Limpar cache completamente para evitar duplicações
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['motoristas', locadoraId] });
      queryClient.removeQueries({ queryKey: ['contratos', locadoraId] });
    },
  });

  // Atualizar contrato
  const updateContrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contrato> & { id: string }) => {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contrato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
    },
  });

  // Excluir contrato
  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      // Se for um aluguel ativo (ID prefixado com "aluguel_"), extrair o ID real
      if (id.startsWith('aluguel_')) {
        const realAluguelId = id.replace('aluguel_', '');
        console.log(`Excluindo aluguel ativo: ${realAluguelId}`);
        
        const response = await fetch(`/api/alugueis/${realAluguelId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete aluguel');
        }
        
        return response.json();
      } else {
        // É um contrato formal
        console.log(`Excluindo contrato formal: ${id}`);
        const response = await fetch(`/api/contratos/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete contrato');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidar cache de contratos, aluguéis E pagamentos ao excluir contrato
      queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['alugueis', locadoraId] });
      queryClient.invalidateQueries({ queryKey: ['/api/pagamentos', locadoraId] });
      queryClient.removeQueries({ queryKey: ['/api/pagamentos', locadoraId] });
    },
  });

  // Função para limpar cache completamente
  const clearCache = () => {
    console.log('[CACHE CLEAR] Limpando cache de contratos...');
    queryClient.removeQueries({ queryKey: ['contratos'] });
    queryClient.removeQueries({ queryKey: ['alugueis'] });
    queryClient.removeQueries({ queryKey: ['motoristas'] });
    queryClient.invalidateQueries({ queryKey: ['contratos', locadoraId] });
  };

  return {
    contratos,
    isLoading,
    error,
    createContrato,
    updateContrato,
    deleteContrato,
    clearCache, // Nova função para limpar cache
  };
}