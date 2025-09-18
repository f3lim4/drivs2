/**
 * Modal para geração de novos contratos
 * Formulário com dados do motorista, veículo e condições da locação
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Contrato, Motorista, Veiculo } from '@/types';
import { generateId } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '../../hooks/useContratos';
import { useTemplateContratos } from '../../hooks/useTemplateContratos';
import { registrarAtividade } from '@/utils/activityLogger';
import { useToast } from '@/hooks/use-toast';
import { calcularContratoExato } from '@/utils/contratoCalculos';

// Schema de validação
const contratoSchema = z.object({
  motoristaId: z.string().min(1, 'Motorista é obrigatório'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  dataInicio: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  dataFim: z.date().optional(), // Data final opcional - se não preenchida, contrato é renovável
  prazoMinimo: z.string().optional(),
  valorSemanal: z.number().min(0.01, 'Valor semanal deve ser maior que 0'),
  caucao: z.number().min(0, 'Caução deve ser maior ou igual a 0'),
  templateId: z.string().optional(),
  // Campos de pagamento recorrente
  pagamentoRecorrente: z.boolean().default(false),
  dataPrimeiroPagamento: z.date().optional(),
  recorrencia: z.enum(['semanal', 'quinzenal', 'mensal']).optional(),
  // Novos campos para controle de pagamentos
  tipoPagamento: z.enum(['ilimitado', 'limitado']).default('ilimitado'),
  quantidadePagamentos: z.number().min(1).optional(),
  // Campo para marcar pagamentos anteriores como pagos
  marcarPagamentosAnteriores: z.boolean().default(false),
}).refine((data) => {
  // Se pagamento recorrente está ativado, campos são obrigatórios
  if (data.pagamentoRecorrente) {
    console.log('[VALIDATION DEBUG] Pagamento recorrente ativo, validando campos:', {
      temData: !!data.dataPrimeiroPagamento,
      temRecorrencia: !!data.recorrencia,
      tipoPagamento: data.tipoPagamento,
      quantidadePagamentos: data.quantidadePagamentos
    });
    
    // Validação básica
    if (!data.dataPrimeiroPagamento || !data.recorrencia) {
      return false;
    }
    
    // Se é limitado, deve ter quantidade
    if (data.tipoPagamento === 'limitado' && !data.quantidadePagamentos) {
      return false;
    }
    
    return true;
  }
  return true;
}, {
  message: 'Preencha todos os campos obrigatórios de pagamento',
  path: ['pagamentoRecorrente'],
});

type ContratoFormData = z.infer<typeof contratoSchema>;

interface NovoContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContratoGerado: (contrato: Contrato) => void;
}

// Função para calcular datas de recorrência
const calcularProximaData = (dataBase: Date, recorrencia: string, incremento: number): Date => {
  const novaData = new Date(dataBase);
  
  switch (recorrencia) {
    case 'semanal':
      novaData.setDate(novaData.getDate() + (7 * incremento));
      break;
    case 'quinzenal':
      novaData.setDate(novaData.getDate() + (15 * incremento));
      break;
    case 'mensal':
      novaData.setMonth(novaData.getMonth() + incremento);
      break;
  }
  
  return novaData;
};

// Função para criar pagamentos recorrentes com lógica retroativa inteligente
const criarPagamentosRecorrentes = async (
  aluguelId: string,
  motoristaId: string,
  dataPrimeiroPagamento: Date,
  recorrencia: 'semanal' | 'quinzenal' | 'mensal',
  valorSemanal: number,
  tempoMinimoContrato: string,
  dataInicioContrato: Date,
  tipoPagamento: 'ilimitado' | 'limitado' = 'ilimitado',
  quantidadePagamentos?: number,
  marcarAnterioresComoPago?: boolean
) => {
  try {
    const auth = JSON.parse(localStorage.getItem('drivs_profile') || '{}');
    const profile = auth;
    
    // Data atual para comparação
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Data do primeiro pagamento sem horas
    const dataPrimeiro = new Date(dataPrimeiroPagamento);
    dataPrimeiro.setHours(0, 0, 0, 0);
    
    console.log('[PAGAMENTOS RETROATIVOS] Iniciando geração inteligente:', {
      dataPrimeiroPagamento: format(dataPrimeiro, 'dd/MM/yyyy'),
      dataAtual: format(hoje, 'dd/MM/yyyy'),
      recorrencia,
      marcarAnterioresComoPago
    });
    
    // Calcula valor por pagamento baseado na recorrência
    let valorPagamento = 0;
    switch (recorrencia) {
      case 'semanal':
        valorPagamento = valorSemanal;
        break;
      case 'quinzenal':
        valorPagamento = valorSemanal * 2; // 2 semanas = 14 dias
        break;
      case 'mensal':
        valorPagamento = valorSemanal * 4.35; // Média de semanas por mês
        break;
    }
    
    let pagamentosCriados = 0;
    let pagamentosRetroativos = 0;
    
    // LÓGICA CORRIGIDA: Só gerar pagamentos passados se checkbox marcado
    console.log('[PAGAMENTOS INTELIGENTES] Verificando necessidade de pagamentos retroativos:', {
      marcarAnterioresComoPago,
      dataPrimeiro: format(dataPrimeiro, 'dd/MM/yyyy'),
      hoje: format(hoje, 'dd/MM/yyyy')
    });
    
    // Se data do primeiro pagamento é no passado E checkbox marcado, criar retroativos
    if (dataPrimeiro < hoje && marcarAnterioresComoPago) {
      console.log('[RETROATIVOS] Gerando pagamentos retroativos como PAGOS');
      
      // Calcular quantos pagamentos devem existir desde a data inicial até hoje
      const diffDias = Math.ceil((hoje.getTime() - dataPrimeiro.getTime()) / (1000 * 60 * 60 * 24));
      const semanasPassadas = Math.floor(diffDias / 7); // Usar floor para não incluir semana atual
      
      console.log('[RETROATIVOS] Cálculo:', {
        diasPassados: diffDias,
        semanasPassadas,
      });
      
      // Gerar pagamentos para cada semana passada
      for (let i = 0; i < semanasPassadas; i++) {
        const dataVencimento = new Date(dataPrimeiro);
        dataVencimento.setDate(dataPrimeiro.getDate() + (i * 7));
        
        // Só cria pagamentos realmente passados
        if (dataVencimento < hoje) {
            const pagamento = {
              id: crypto.randomUUID(),
              aluguelId,
              motoristaId,
              locadoraId: profile.locadoraId,
              dataPagamento: format(dataVencimento, 'yyyy-MM-dd'),
              valorTotal: valorSemanal.toString(),
              valorPago: valorSemanal.toString(), // PAGO automaticamente
              valorRestante: "0", // ZERO restante pois está pago
              valorJuros: "0.00",
              valorMulta: "0.00", 
              status: 'pago', // STATUS PAGO
              tipo: 'aluguel',
              descricao: `Pagamento retroativo ${i + 1} - Marcado automaticamente como pago`,
              observacoes: `Pagamento retroativo ${i + 1} - Marcado automaticamente como pago`,
              automatico: true
            };

            console.log('[RETROATIVO PAGO]', {
              numero: i + 1,
              data: format(dataVencimento, 'dd/MM/yyyy'),
              status: 'pago',
              valor: pagamento.valorTotal
            });
            
            const response = await fetch('/api/pagamentos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pagamento)
            });

            if (response.ok) {
              pagamentosCriados++;
              pagamentosRetroativos++;
              console.log(`✓ Pagamento retroativo PAGO ${i + 1} criado:`, format(dataVencimento, 'dd/MM/yyyy'));
            } else {
              console.error(`✗ Erro ao criar pagamento retroativo ${i + 1}:`, await response.text());
            }
        }
      }
    }
    
    // PAGAMENTO DA SEMANA ATUAL: Criar sempre o pagamento da semana que inclui hoje
    // Calcular quantas semanas se passaram desde o primeiro pagamento até hoje
    const diffDias = Math.floor((hoje.getTime() - dataPrimeiro.getTime()) / (1000 * 60 * 60 * 24));
    const semanasCompletas = Math.floor(diffDias / 7);
    
    // Data do pagamento da semana atual (segunda-feira da semana atual)
    const pagamentoSemanaAtual = new Date(dataPrimeiro);
    pagamentoSemanaAtual.setDate(dataPrimeiro.getDate() + (semanasCompletas * 7));
    
    console.log('[SEMANA ATUAL] Cálculo:', {
      diffDias,
      semanasCompletas,
      dataCalculada: format(pagamentoSemanaAtual, 'dd/MM/yyyy'),
      hoje: format(hoje, 'dd/MM/yyyy'),
      marcarComosPago: marcarAnterioresComoPago
    });
    
    // CORREÇÃO: Semana atual SEMPRE fica como EM ABERTO, independente do checkbox
    // O checkbox "marcar anteriores" se refere apenas aos pagamentos ANTERIORES à semana atual
    const statusSemanaAtual = 'em_aberto'; // Sempre pendente, independente do checkbox
    const valorPagoAtual = "0"; // Sempre 0 pago na semana atual
    const valorRestanteAtual = valorSemanal.toString(); // Sempre valor total restante
    
    const pagamentoAtual = {
      id: crypto.randomUUID(),
      aluguelId,
      motoristaId,
      locadoraId: profile.locadoraId,
      dataPagamento: format(pagamentoSemanaAtual, 'yyyy-MM-dd'),
      valorTotal: valorSemanal.toString(),
      valorPago: valorPagoAtual,
      valorRestante: valorRestanteAtual,
      valorJuros: "0.00",
      valorMulta: "0.00",
      status: statusSemanaAtual,
      tipo: 'aluguel',
      descricao: 'Pagamento da semana atual',
      observacoes: 'Pagamento da semana atual - sempre fica em aberto (pagamentos são sempre segundas-feiras)',
      automatico: true
    };
    
    const responseAtual = await fetch('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagamentoAtual)
    });
    
    if (responseAtual.ok) {
      pagamentosCriados++;
      console.log(`[SEMANA ATUAL] Criado pagamento para ${format(pagamentoSemanaAtual, 'dd/MM/yyyy')} como ${statusSemanaAtual.toUpperCase()}`);
    }
    
    // IMPORTANTE: NÃO criar pagamento da próxima semana aqui
    // Isso será feito pelo sistema automático 1 dia antes do vencimento

    console.log(`[RESULTADO FINAL] ${pagamentosCriados} pagamentos criados (${pagamentosRetroativos} retroativos + 1 semana atual)`);
    
    return {
      totalCriados: pagamentosCriados,
      retroativos: pagamentosRetroativos,
      statusRetroativos: marcarAnterioresComoPago ? 'pago' : 'em_aberto'
    };

  } catch (error) {
    console.error('[ERRO] Falha na criação de pagamentos recorrentes:', error);
    return { totalCriados: 0, retroativos: 0, statusRetroativos: 'em_aberto' };
  }
};

export function NovoContratoModal({ 
  open, 
  onOpenChange, 
  onContratoGerado 
}: NovoContratoModalProps) {
  const [alugueis, setAlugueis] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [contratoGerado, setContratoGerado] = useState(false);
  const [duplicateContractError, setDuplicateContractError] = useState<any>(null);
  const processandoRef = useRef(false); // Proteção adicional via ref
  const { profile } = useAuth();
  
  // Reset do estado quando modal abrir
  useEffect(() => {
    if (open) {
      setContratoGerado(false);
      processandoRef.current = false;
      console.log('🔄 RESET: Modal aberto, todos os estados resetados');
    }
  }, [open]);
  const userProfile = profile;
  const { toast } = useToast();
  
  // Hook para gerenciar contratos
  const { createContrato } = useContratos();
  
  // 🎯 ACTION HANDLERS: Functions to handle error dialog actions
  const handleViewRentals = () => {
    setDuplicateContractError(null);
    onOpenChange(false);
    // Navigate to rentals page - assuming router navigation
    window.location.href = '/alugueis';
  };
  
  const handleChangeDriver = () => {
    setDuplicateContractError(null);
    // Clear the current driver selection to allow user to choose another
    form.setValue('motoristaId', '');
    toast({
      title: "Motorista limpo",
      description: "Selecione outro motorista disponível para continuar.",
      duration: 3000,
    });
  };
  
  const handleViewContracts = () => {
    setDuplicateContractError(null);
    onOpenChange(false);
    // Navigate to contracts page
    window.location.href = '/contratos';
  };
  
  const handleCloseErrorDialog = () => {
    setDuplicateContractError(null);
  };
  
  // Hook para gerenciar templates
  const { templates } = useTemplateContratos();
  
  // Debug: Log dos templates carregados
  useEffect(() => {
    console.log('Templates no modal:', templates);
  }, [templates]);

  // Função para obter a data de hoje sem problemas de timezone
  const getHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();
    
    // Cria nova data local para hoje
    return new Date(ano, mes, dia);
  };

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      motoristaId: '',
      veiculoId: '',
      dataInicio: getHoje(),
      dataFim: undefined, // ✅ DATA FINAL OPCIONAL PARA CONTRATOS RENOVÁVEIS
      prazoMinimo: '',
      valorSemanal: 0,
      caucao: 0,
      templateId: 'default',
      pagamentoRecorrente: true, // ✅ HABILITADO POR PADRÃO
      dataPrimeiroPagamento: getHoje(), // ✅ DATA PADRÃO
      recorrencia: 'semanal', // ✅ RECORRÊNCIA PADRÃO
      tipoPagamento: 'ilimitado', // ✅ TIPO PADRÃO
      quantidadePagamentos: undefined, // ✅ QUANTIDADE OPCIONAL
      marcarPagamentosAnteriores: false, // ✅ PAGAMENTOS ANTERIORES DESMARCADO POR PADRÃO
    },
  });

  // Carrega dados dos veículos e motoristas disponíveis
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      
      const locadoraId = profile?.locadoraId || profile?.id;
      
      console.log('🏢 MODAL CONTRATO - Locadora atual:', locadoraId);
      console.log('🏢 MODAL CONTRATO - Profile completo:', profile);
      
      // PRODUÇÃO: Usar locadoraId do contexto de pagamentos (que está funcionando)
      const locadoraFinal = '9e30a0f8-8683-4f12-9c0d-3f35d5686a53';
      console.log('🏢 MODAL CONTRATO - Locadora final usada:', locadoraFinal);
      
      if (!locadoraFinal) return;
      
      // LIMPAR ESTADO ANTERIOR
      setVeiculos([]);
      setMotoristas([]);
      setAlugueis([]);
      
      setLoadingData(true);
      
      try {
        console.log('🔍 BUSCANDO DADOS REAIS COM REGRAS DE NEGÓCIO');
        
        // 1. BUSCAR CONTRATOS ATIVOS PRIMEIRO
        let contratosAtivos: any[] = [];
        try {
          const contratosResponse = await fetch(`/api/contratos`);
          if (contratosResponse.ok) {
            const contratosData = await contratosResponse.json();
            console.log('📋 CONTRATOS TODOS encontrados:', contratosData);
            contratosAtivos = contratosData.filter((contrato: any) => 
              contrato.status === 'ativo' || contrato.status === 'em_aberto'
            );
            console.log('📋 CONTRATOS ATIVOS/ABERTOS encontrados:', contratosAtivos);
            console.log('📋 Clientes ocupados:', contratosAtivos.map(c => c.cliente));
            console.log('📋 Veículos ocupados (IDs):', contratosAtivos.map(c => c.veiculoId || c.veiculo_id || c.veiculo));
          }
        } catch (error) {
          console.error('❌ Erro ao buscar contratos:', error);
        }

        // 2. BUSCAR VEÍCULOS E FILTRAR APENAS OS DISPONÍVEIS
        try {
          const veiculosResponse = await fetch(`/api/veiculos`, {
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (veiculosResponse.ok) {
            const veiculosData = await veiculosResponse.json();
            console.log('🚗 VEÍCULOS TOTAIS encontrados:', veiculosData.length);
            console.log('🚗 DADOS dos veículos:', veiculosData);
            
            // 🎯 REGRA DE NEGÓCIO: Mostrar apenas veículos com status "disponivel"
            const veiculosDisponiveis = veiculosData.filter((veiculo: any) => {
              const isDisponivel = veiculo.status === 'disponivel';
              console.log(`🚗 VERIFICANDO ${veiculo.placa} (Status: ${veiculo.status}): ${isDisponivel ? 'DISPONÍVEL' : 'NÃO DISPONÍVEL'}`);
              return isDisponivel;
            });
            
            console.log('🚗 VEÍCULOS FILTRADOS (status disponivel):', {
              total: veiculosData.length,
              disponiveis: veiculosDisponiveis.length,
              placasDisponiveis: veiculosDisponiveis.map(v => v.placa)
            });
            
            setVeiculos(veiculosDisponiveis);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar veículos:', error);
        }

        // 3. BUSCAR MOTORISTAS E FILTRAR APENAS OS APROVADOS
        try {
          const motoristasResponse = await fetch(`/api/motoristas`, {
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (motoristasResponse.ok) {
            const motoristasData = await motoristasResponse.json();
            console.log('👤 MOTORISTAS TOTAIS encontrados:', motoristasData.length);
            console.log('👤 DADOS dos motoristas:', motoristasData);
            
            // 🎯 REGRA DE NEGÓCIO: Mostrar apenas motoristas com status "aprovado"
            const motoristasDisponiveis = motoristasData.filter((motorista: any) => {
              const isAprovado = motorista.status === 'aprovado';
              console.log(`👤 VERIFICANDO ${motorista.nome} (Status: ${motorista.status}): ${isAprovado ? 'APROVADO' : 'NÃO APROVADO'}`);
              return isAprovado;
            }).map((motorista: any) => ({
              ...motorista,
              nome: motorista.nome?.trim() || motorista.nome
            }));
            
            console.log('👤 MOTORISTAS FILTRADOS (status aprovado):', {
              total: motoristasData.length,
              aprovados: motoristasDisponiveis.length,
              nomesAprovados: motoristasDisponiveis.map(m => m.nome)
            });
            
            setMotoristas(motoristasDisponiveis);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar motoristas:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [open, profile?.locadoraId, profile?.id]);

  // Função para preencher valor semanal e caução automaticamente quando veículo é selecionado
  const handleVeiculoChange = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (veiculo) {
      // Preenche automaticamente valor semanal e caução do veículo
      const valorSemanal = parseFloat(veiculo.valorSemanal) || 0;
      const caucao = parseFloat(veiculo.caucao) || 0;
      
      form.setValue('veiculoId', veiculoId);
      form.setValue('valorSemanal', valorSemanal);
      form.setValue('caucao', caucao);
      
      console.log(`Veículo selecionado: ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`);
      console.log(`Valor semanal preenchido: R$ ${valorSemanal.toFixed(2)}`);
      console.log(`Caução preenchida: R$ ${caucao.toFixed(2)}`);
    }
  };

  const onSubmit = async (data: ContratoFormData) => {
    // BLOQUEIO TRIPLO: Evita duplo clique e múltiplas submissões
    if (createContrato.isPending || contratoGerado || processandoRef.current) {
      console.log('🚫 BLOCKED: Contrato já está sendo processado', {
        isPending: createContrato.isPending,
        contratoGerado: contratoGerado,
        processandoRef: processandoRef.current
      });
      return;
    }
    
    // BLOQUEIO IMEDIATO: Marca como processando antes de qualquer operação
    processandoRef.current = true;
    console.log('🔒 LOCKED: Processamento iniciado, ref = true');
    
    // PREVINE EVENTOS DE FORMULÁRIO ADICIONAIS
    const formElement = document.querySelector('form');
    if (formElement) {
      formElement.style.pointerEvents = 'none';
      console.log('🚫 FORM DISABLED: Eventos de formulário bloqueados');
    }
    
    try {
      console.log('Iniciando envio do formulário com dados:', data);
      
      let aluguel;
      
      // Sempre cria novo aluguel com veículo e motorista selecionados
      if (!data.veiculoId || !data.motoristaId) {
        throw new Error('Veículo e motorista são obrigatórios');
      }
      
      // Busca dados do veículo e motorista
      const veiculo = veiculos.find(v => v.id === data.veiculoId);
      const motorista = motoristas.find(m => m.id === data.motoristaId);
      
      if (!veiculo || !motorista) {
        throw new Error('Veículo ou motorista não encontrado');
      }
      
      // Para cálculos, assume 1 mês como padrão
      let mesesParaCalculo = 1;
      if (data.prazoMinimo && data.prazoMinimo.trim()) {
        const numeroExtraido = data.prazoMinimo.match(/\d+/);
        if (numeroExtraido) {
          mesesParaCalculo = parseInt(numeroExtraido[0]);
        }
      }
      
      // CÁLCULO EXATO: Usa nova função que conta apenas semanas completas
      const calculoContrato = calcularContratoExato(
        data.dataInicio,
        mesesParaCalculo,
        data.valorSemanal
      );
      
      // Extrai valores calculados
      const valorTotalExato = calculoContrato.valorTotal;
      const valorMensalCalculado = valorTotalExato / mesesParaCalculo; // Para compatibilidade com o banco
      
      console.log(`📊 CÁLCULO EXATO DO CONTRATO (NOVA FUNÇÃO):
• Período: ${calculoContrato.dataInicio.toLocaleDateString()} até ${calculoContrato.dataFim.toLocaleDateString()}
• Total de dias: ${calculoContrato.totalDias}
• Semanas completas: ${calculoContrato.detalhes.semanasCompletas}
• Dias restantes: ${calculoContrato.detalhes.diasRestantes} (não cobrados)
• Total de semanas para cobrança: ${calculoContrato.totalSemanas}
• Valor semanal: R$ ${data.valorSemanal.toFixed(2)}
• Valor total exato: R$ ${valorTotalExato.toFixed(2)}
• Valor mensal calculado: R$ ${valorMensalCalculado.toFixed(2)}`);
      
      const valorMensalAluguel = valorMensalCalculado;
      const valorTotalAluguel = valorTotalExato;
      
      // Calcula data final baseada na data final fornecida ou tempo mínimo
      let dataFimAluguel;
      if (data.dataFim) {
        dataFimAluguel = data.dataFim;
      } else {
        // Se não tiver data final, usa tempo mínimo para calcular
        dataFimAluguel = new Date(data.dataInicio);
        dataFimAluguel.setMonth(dataFimAluguel.getMonth() + mesesParaCalculo);
      }
      
      // Prepara dados do aluguel (mas NÃO cria ainda)
      const locadoraId = profile?.locadoraId || profile?.id;
      const aluguelId = crypto.randomUUID();
      const novoAluguel = {
        id: aluguelId,
        locadoraId: locadoraId,
        motoristaId: data.motoristaId,
        veiculoId: data.veiculoId,
        dataInicio: format(data.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFimAluguel, 'yyyy-MM-dd'),
        tempoContrato: mesesParaCalculo,
        valorMensal: valorMensalAluguel.toFixed(2),
        valorTotal: valorTotalAluguel.toFixed(2),
        caucao: data.caucao.toFixed(2),
        status: 'ativo'
      };
      
      console.log('[DEBUG] Aluguel preparado (não criado ainda):', novoAluguel);
      
      // Cria objeto compatível com a estrutura esperada (usando dados preparados)
      aluguel = {
        id: aluguelId,
        motoristaId: motorista.id,
        veiculoId: veiculo.id,
        motoristaNome: motorista.nome,
        veiculoPlaca: veiculo.placa, // ✅ CORRIGIDO: usar placa ao invés de modelo
        veiculoModelo: `${veiculo.marca} ${veiculo.modelo}`,
        valorMensal: valorMensalAluguel,
        caucao: data.caucao,
        status: 'ativo' // Aluguel continua ativo
      };

      console.log('Aluguel para contrato:', aluguel);

      // Buscar dados da locadora
      let dadosLocadora = null;
      if (profile?.locadoraId) {
        const response = await fetch(`/api/locadoras/${profile.locadoraId}`);
        if (response.ok) {
          dadosLocadora = await response.json();
        }
      }

      // Buscar dados do veículo
      let dadosVeiculo = null;
      if (aluguel.veiculoId) {
        const response = await fetch(`/api/veiculos/${aluguel.veiculoId}`);
        if (response.ok) {
          dadosVeiculo = await response.json();
        }
      }
      
      // Usar dados reais da locadora ou dados padrão
      const locadorInfo = dadosLocadora ? {
        nome: dadosLocadora.nome,
        cnpj: dadosLocadora.cnpj,
        endereco: `${dadosLocadora.endereco}, ${dadosLocadora.cidade}/${dadosLocadora.estado} - CEP: ${dadosLocadora.cep}`,
        responsavel: dadosLocadora.responsavel,
        telefone: dadosLocadora.telefone
      } : {
        nome: "DRIVS LOCADORA DE VEÍCULOS LTDA",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua das Empresas, 123 - Centro, Embu das Artes/SP",
        responsavel: "Responsável da Locadora",
        telefone: "11977263156"
      };

      // Calcula data final apenas se fornecida, caso contrário deixa como contrato renovável
      let dataFimContrato = null;
      if (data.dataFim) {
        dataFimContrato = data.dataFim;
      }
      // Se não tem data fim específica, o contrato é renovável (dataFimContrato = null)

      // Usa os valores já calculados com semanas exatas
      const valorMensal = valorMensalAluguel; // Já calculado acima com semanas exatas
      const valorTotal = valorTotalAluguel; // Já calculado com semanas exatas

      // Buscar template selecionado ou usar padrão
      let templateContent = '';
      
      console.log('Template ID selecionado:', data.templateId);
      console.log('Templates disponíveis:', templates);
      
      if (data.templateId && data.templateId !== 'default') {
        // Buscar template personalizado
        const templateSelecionado = templates.find((t: any) => t.id === data.templateId);
        console.log('Template encontrado:', templateSelecionado);
        if (templateSelecionado) {
          templateContent = templateSelecionado.conteudo;
          console.log('Usando template personalizado:', templateSelecionado.nome);
        }
      }
      
      // Se não encontrou template personalizado ou selecionou padrão, usar template padrão
      if (!templateContent) {
        templateContent = `LOCADOR: ${locadorInfo.nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${locadorInfo.cnpj}, com sede em ${locadorInfo.endereco}.
Telefone: ${locadorInfo.telefone || motorista.telefone} E-mail: contato@drivs.me.

LOCATÁRIO: ${motorista.nome}, profissão: Motorista de Aplicativo, portador do CPF nº ${motorista.cpf}, RG nº ${motorista.rg} e CNH nº ${motorista.cnh} (validade ${motorista.vencimentoCnh ? new Date(motorista.vencimentoCnh).toLocaleDateString('pt-BR') : '_________'}), 
residente em ${motorista.rua}, ${motorista.numero}${motorista.complemento ? ', ' + motorista.complemento : ''} - ${motorista.bairro}, ${motorista.cidade}/${motorista.estado} - CEP: ${motorista.cep}, telefone ${motorista.telefone}.

As partes celebram o presente Contrato de Locação de Veículo, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA – RELAÇÃO JURÍDICA

1.1. O presente contrato não configura vínculo empregatício entre as partes, nos termos do artigo 593 do Código Civil, tratando-se exclusivamente de locação de bem móvel.
1.2. O LOCADOR limita-se a disponibilizar o veículo, enquanto o LOCATÁRIO é responsável por sua atividade de transporte de passageiros.

CLÁUSULA SEGUNDA – FINALIDADE

2.1. O veículo será utilizado para transporte de passageiros e entregas por meio de aplicativos, como Uber, 99, Mercado Livre, InDrive e outros similares, dentro da Grande São Paulo.
2.2. O LOCATÁRIO é o único responsável por eventuais ganhos, taxas e tributações associadas à sua atividade, conforme estabelece o artigo 421 do Código Civil.

CLÁUSULA TERCEIRA – RESPONSABILIDADES DAS PARTES

3.1. O LOCADOR se compromete a:
• Manter o veículo regularizado perante os órgãos competentes;
• Assegurar que o veículo esteja segurado contra sinistros, nos termos do art. 566 do Código Civil;
• Entregar o veículo em boas condições mecânicas e adequado ao uso;
• Prestar assistência mecânica em falhas oriundas de desgaste natural do veículo;
• Fornecer guincho para até 80 km da base. Caso seja necessária remoção em distância maior, os custos adicionais serão pagos pelo LOCATÁRIO;
• Comunicar ao LOCATÁRIO qualquer alteração relevante no contrato ou nas condições do veículo.

3.2. O LOCATÁRIO se compromete a:
• Utilizar o veículo respeitando o Código de Trânsito Brasileiro (Lei nº 9.503/97);
• Não conduzir sob efeito de álcool, substâncias entorpecentes ou quaisquer outras que comprometam sua capacidade, nem transportar tais substâncias no veículo;
• Não transportar drogas, substâncias ilícitas, armas, contrabando ou mercadorias sem nota fiscal, sob pena de rescisão imediata, recolhimento do veículo e responsabilização civil e criminal;
• Não vender, doar, emprestar, sublocar, comercializar ou negociar o veículo objeto deste contrato, por qualquer meio;
• Apresentar semanalmente o veículo para inspeção junto ao LOCADOR e enviar fotos e vídeo semanalmente utilizando aplicativo de vistoria indicado pela empresa;
• Responsabilizar-se integralmente por multas, infrações de trânsito e penalidades decorrentes do uso do veículo;
• Abastecer com combustível de qualidade e seguir as recomendações do fabricante quanto à manutenção;
• Verificar diariamente água do radiador e óleo, comunicando imediatamente qualquer problema ao LOCADOR;
• Devolver o veículo ao final do contrato no mesmo estado de conservação em que o recebeu, salvo desgaste natural;
• Comunicar imediatamente ao LOCADOR acidentes, avarias, roubo, furto ou qualquer ocorrência envolvendo o veículo.

CLÁUSULA QUARTA – OBJETO

4.1. O objeto do presente contrato é a locação do veículo ${veiculo.marca} ${veiculo.modelo}, ano ${dadosVeiculo?.ano || 'N/I'}, cor ${dadosVeiculo?.cor || 'N/I'}, placa ${aluguel.veiculoPlaca}, RENAVAM ${dadosVeiculo?.renavam || 'N/I'}, CHASSI ${dadosVeiculo?.chassi || 'N/I'}, entregue ao LOCATÁRIO Vistoriado com fotos e video${data.prazoMinimo && data.prazoMinimo.trim() ? `, prazo mínimo: ${data.prazoMinimo}` : ''} a partir da assinatura.
4.2. O contrato poderá ser renovado automaticamente caso ambas as partes concordem. Caso contrário, o veículo deverá ser devolvido nas mesmas condições em que foi recebido.
4.3. O LOCATÁRIO reconhece que recebeu o veículo em bom estado e se compromete a devolvê-lo nas mesmas condições, salvo desgaste natural.

CLÁUSULA QUINTA – DEPÓSITO CAUÇÃO

5.1. O LOCATÁRIO pagará, no ato da retirada, R$ ${parseFloat(String(data.caucao)).toFixed(2)} a título de caução.
5.2. A caução será devolvida ao final do contrato no mesmo valor, desde que não haja pendências financeiras, avarias ou multas, considerando o desconto da taxa administrativa de R$100,00 referente aos custos operacionais da empresa.
5.3. A devolução será realizada em até 30 (trinta) dias úteis após a entrega do veículo.
5.4. A caução poderá ser retida total ou parcialmente em caso de:
• Pendências financeiras;
• Avarias no veículo;
• Multas de trânsito não transferidas;
• Descumprimento de cláusulas contratuais.

CLÁUSULA SEXTA – ALUGUEL E PAGAMENTO

6.1. O LOCATÁRIO pagará ao LOCADOR o valor de R$ ${parseFloat(String(data.valorSemanal)).toFixed(2)} por semana, via depósito bancário, sempre às segundas-feiras.
6.2. Caso o pagamento não seja efetuado na segunda-feira, poderá ser realizado na terça-feira até 23h59 com multa de 10%.
6.3. Após 00h00 de terça-feira, o veículo será bloqueado. Para desbloqueio, o LOCATÁRIO deverá pagar: (i) o valor em atraso; (ii) a multa de 10%; e (iii) taxa de R$50,00 pelo serviço de desbloqueio.
6.4. Caso o pagamento não seja regularizado até quarta-feira, o veículo será recolhido, e o LOCATÁRIO deverá pagar multa correspondente a duas semanas de locação, além dos custos adicionais decorrentes de avarias e remoção.

CLÁUSULA SÉTIMA – DEVOLUÇÃO VOLUNTÁRIA

7.1. Caso o LOCATÁRIO perceba que não conseguirá manter os pagamentos, deverá comunicar imediatamente o LOCADOR e devolver voluntariamente o veículo no mesmo local da retirada.
7.2. Caso o veículo não seja devolvido nesse local e seja necessária busca/remoção, será cobrada taxa fixa de R$200,00 + R$10,00 por quilômetro rodado.
7.3. A não devolução voluntária será considerada descumprimento contratual.

CLÁUSULA OITAVA – VISTORIAS

8.1. O LOCATÁRIO tem direito a duas vistorias mensais.
8.2. Se o veículo permanecer em oficina por mais de 10 (dez) horas devido a desgaste natural, o aluguel será abatido proporcionalmente.
8.3. Se a paralisação decorrer de mau uso, o aluguel continuará sendo cobrado.

CLÁUSULA NONA – PENALIDADES

9.1. O LOCATÁRIO é responsável por todas as multas e infrações de trânsito, acrescidas de taxa administrativa de 20%. Caso não haja transferência dos pontos em até 10 (dez) dias, o LOCADOR poderá solicitar a devolução do veículo e cobrar o valor da multa em dobro.
9.2. O veículo possui seguro contra roubo, furto, colisão e perda total (PT).
• Em caso de sinistro coberto, o LOCATÁRIO arcará apenas com os dias de indisponibilidade;
• Caso a seguradora recuse a cobertura, o LOCATÁRIO será responsável por todos os custos de reparo, além dos dias parados;
• Em caso de perda total, o LOCATÁRIO arcará com o valor integral do veículo conforme tabela FIPE;
• Danos não cobertos pelo seguro serão de responsabilidade do LOCATÁRIO.
9.3. O LOCADOR poderá recolher definitivamente o veículo em caso de má utilização, reincidência de acidentes ou comprometimento da segurança.
9.4. O limite de quilometragem mensal é de ${dadosVeiculo?.limiteQuilometragem || '8000'} km. O excedente será cobrado a R$0,50 por km.

CLÁUSULA DÉCIMA – RESCISÃO

10.1. A rescisão antecipada requer notificação prévia de 30 dias. Caso não ocorra, o LOCATÁRIO pagará multa de R$1.200,00.
10.2. O descumprimento de qualquer cláusula resultará na rescisão do contrato e multa equivalente a duas semanas de locação.

CLÁUSULA DÉCIMA PRIMEIRA – DISPOSIÇÕES FINAIS

11.1. As partes elegem o foro de Embu das Artes/SP.
11.2. O presente contrato constitui título executivo extrajudicial (art. 784, III, CPC).

Taboão da Serra/SP, ${format(data.dataInicio, 'dd/MM/yyyy')}.




Assinaturas:



____________________________________        ____________________________________
${aluguel.motoristaNome}                    ${locadorInfo.nome}
(LOCATÁRIO)                                 (LOCADORA)




____________________________________        ____________________________________
(Testemunha 1 – Nome / RG / CPF)           (Testemunha 2 – Nome / RG / CPF)`;
      }

      // Cria novo contrato
      const novoContrato = {
        locadoraId: profile?.locadoraId || '',
        tipo: 'locacao' as const,
        titulo: `Contrato de Locação - ${aluguel.motoristaNome}`,
        cliente: aluguel.motoristaNome,
        valor: valorTotal.toFixed(2), // Enviar como string
        valorSemanal: data.valorSemanal.toFixed(2), // ✅ INCLUIR VALOR SEMANAL
        caucao: data.caucao.toFixed(2), // ✅ INCLUIR CAUÇÃO
        prazoMinimo: data.prazoMinimo, // ✅ INCLUIR PRAZO MÍNIMO
        dataInicio: format(data.dataInicio, 'yyyy-MM-dd'),
        dataFim: dataFimContrato ? format(dataFimContrato, 'yyyy-MM-dd') : null, // ✅ NULL para contratos renováveis
        status: 'em_aberto' as const, // Inicia sempre como em_aberto
        template: templateContent,
        veiculoId: data.veiculoId // ✅ INCLUIR VEÍCULO ID NO CONTRATO
      };

      console.log('[FRONTEND] Criando contrato com dados:', novoContrato);
      
      // Usa o hook para criar o contrato PRIMEIRO
      const contratoCriado = await createContrato.mutateAsync(novoContrato);
      console.log('[FRONTEND] Contrato criado:', contratoCriado);
      
      // SÓ AGORA cria o aluguel (após contrato criado com sucesso)
      console.log('[DEBUG] Criando aluguel após contrato ter sido criado com sucesso');
      const aluguelResponse = await fetch('/api/alugueis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoAluguel),
      });
      
      if (!aluguelResponse.ok) {
        // Se aluguel falhar, deveria reverter contrato mas por simplicidade vamos manter
        console.error('Erro ao criar aluguel após contrato criado');
        throw new Error('Erro ao criar aluguel');
      }
      
      const aluguelCriado = await aluguelResponse.json();
      console.log('[FRONTEND] Aluguel criado após contrato:', aluguelCriado);
      
      // Log da atividade
      await registrarAtividade(
        profile?.locadoraId || '',
        profile?.email || 'usuario@drivs.me',
        'cadastrar',
        'contrato',
        contratoCriado.id,
        `Novo contrato gerado: ${aluguel.motoristaNome} - ${aluguel.veiculoModelo} (${aluguel.veiculoPlaca})`
      );

      // Criar pagamentos recorrentes se habilitado
      console.log('[DEBUG PAGAMENTOS] Verificando criação automática:', {
        pagamentoRecorrente: data.pagamentoRecorrente,
        dataPrimeiroPagamento: data.dataPrimeiroPagamento,
        recorrencia: data.recorrencia
      });
      
      if (data.pagamentoRecorrente && data.dataPrimeiroPagamento && data.recorrencia) {
        console.log('[DEBUG PAGAMENTOS] Iniciando criação de pagamentos recorrentes...');
        const quantidadePagamentos = await criarPagamentosRecorrentes(
          aluguel.id,
          data.motoristaId,
          data.dataPrimeiroPagamento,
          data.recorrencia,
          data.valorSemanal,
          data.prazoMinimo || '',
          data.dataInicio,  // Passa a data de início do contrato
          data.tipoPagamento,  // Tipo: ilimitado ou limitado
          data.quantidadePagamentos,  // Quantidade específica (se limitado)
          data.marcarPagamentosAnteriores  // Marcar pagamentos anteriores como pagos
        );
        
        console.log('[DEBUG PAGAMENTOS] Resultado:', quantidadePagamentos);
        
        // Exibir notificação baseada no resultado
        if (quantidadePagamentos.totalCriados > 0) {
          let mensagem = '';
          
          if (quantidadePagamentos.statusRetroativos === 'pago') {
            // Checkbox marcado - pagamentos anteriores como pagos, semana atual em aberto
            if (quantidadePagamentos.retroativos > 0) {
              mensagem = `${quantidadePagamentos.totalCriados} pagamentos criados: ${quantidadePagamentos.retroativos} retroativos como PAGOS + semana atual EM ABERTO`;
            } else {
              mensagem = `1 pagamento da semana atual criado como EM ABERTO - pagamentos são sempre segundas`;
            }
          } else {
            // Checkbox desmarcado - todos em aberto
            mensagem = `${quantidadePagamentos.totalCriados} pagamento${quantidadePagamentos.totalCriados > 1 ? 's' : ''} criado${quantidadePagamentos.totalCriados > 1 ? 's' : ''} como EM ABERTO`;
          }
            
          toast({
            title: "✅ Pagamentos Recorrentes Criados",
            description: mensagem,
            duration: 4000,
          });
        } else {
          console.log('[DEBUG PAGAMENTOS] Nenhum pagamento foi criado');
        }
      } else {
        console.log('[DEBUG PAGAMENTOS] Criação de pagamentos recorrentes DESABILITADA:', {
          habilitado: data.pagamentoRecorrente,
          temData: !!data.dataPrimeiroPagamento,
          temRecorrencia: !!data.recorrencia
        });
      }

      // Marcar contrato como gerado para desabilitar botão
      setContratoGerado(true);
      console.log('✅ SUCCESS: Contrato gerado com sucesso');
      
      // Aguardar um pouco para mostrar o estado "Contrato Gerado"
      setTimeout(() => {
        onContratoGerado(contratoCriado);
        onOpenChange(false);
        // Reset do formulário e estado quando modal fechar
        form.reset({
          motoristaId: '',
          veiculoId: '',
          dataInicio: getHoje(),
          dataFim: undefined, // ✅ DATA FINAL OPCIONAL PARA CONTRATOS RENOVÁVEIS
          prazoMinimo: '',
          valorSemanal: 0,
          caucao: 0,
          templateId: 'default',
          pagamentoRecorrente: true, // ✅ HABILITADO POR PADRÃO
          dataPrimeiroPagamento: getHoje(), // ✅ DATA PADRÃO
          recorrencia: 'semanal', // ✅ RECORRÊNCIA PADRÃO
          tipoPagamento: 'ilimitado', // ✅ TIPO PADRÃO
          quantidadePagamentos: undefined, // ✅ QUANTIDADE OPCIONAL
          marcarPagamentosAnteriores: false, // ✅ PAGAMENTOS ANTERIORES DESMARCADO POR PADRÃO
        });
        setContratoGerado(false);
        processandoRef.current = false; // Reset do ref também
        
        // REABILITA FORMULÁRIO
        const formElement = document.querySelector('form');
        if (formElement) {
          formElement.style.pointerEvents = 'auto';
          console.log('✅ FORM ENABLED: Eventos de formulário reabilitados');
        }
        
        console.log('🔄 RESET: Todos os estados resetados após sucesso');
      }, 2000); // 2 segundos para mostrar "Contrato Gerado"
      
    } catch (error: any) {
      console.error('[FRONTEND] ERRO COMPLETO ao gerar contrato:', error);
      console.error('[FRONTEND] Stack trace:', error.stack);
      console.error('[FRONTEND] Mensagem do erro:', error.message);
      console.error('[FRONTEND] Response error:', error.response);
      
      // 🎯 ENHANCED ERROR HANDLING: Check if error is actionable
      const errorData = error.response?.data || error;
      
      if (errorData.errorType === "DUPLICATE_CONTRACT" && errorData.actionable) {
        // Show enhanced error with action buttons
        setDuplicateContractError(errorData);
      } else {
        // Show regular error toast
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar contrato. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      // Reset do ref em caso de erro
      processandoRef.current = false;
      
      // REABILITA FORMULÁRIO EM CASO DE ERRO
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.style.pointerEvents = 'auto';
        console.log('✅ FORM ENABLED: Eventos reabilitados após erro');
      }
      
      console.log('🔓 UNLOCKED: Ref resetado após erro/conclusão');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-w-[800px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-6">
          <DialogTitle className="text-lg sm:text-xl">Gerar Novo Contrato</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Preencha as informações para gerar um contrato de locação.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
              
              {/* SELEÇÃO DE VEÍCULO, MOTORISTA E TEMPLATE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* SELEÇÃO DE VEÍCULO */}
                <FormField
                  control={form.control}
                  name="veiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo Disponível *</FormLabel>
                      <Select onValueChange={handleVeiculoChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {veiculos.length > 0 ? (
                            veiculos.map((veiculo) => (
                              <SelectItem key={veiculo.id} value={veiculo.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {veiculo.placa} • {veiculo.marca} {veiculo.modelo}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {veiculo.ano} • {veiculo.cor} • {veiculo.quilometragem?.toLocaleString()} km
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Nenhum veículo disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SELEÇÃO DE MOTORISTA */}
                <FormField
                  control={form.control}
                  name="motoristaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorista Disponível *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {motoristas.length > 0 ? (
                            motoristas.map((motorista) => (
                              <SelectItem key={motorista.id} value={motorista.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {motorista.nome}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    CPF: {motorista.id}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {loadingData ? "Carregando motoristas..." : "Nenhum motorista disponível. Cadastre um motorista com CNH válida primeiro."}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {motoristas.length === 0 && !loadingData && (
                        <p className="text-sm text-orange-600 mt-1">
                          💡 Para criar contratos, primeiro cadastre motoristas na seção "Motoristas" do menu.
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* TEMPLATE */}
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template de Contrato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Usar template padrão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">
                            Template Padrão DRIVS
                          </SelectItem>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* TODOS OS CAMPOS EM UMA ÚNICA LINHA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* DATA DE INÍCIO */}
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10"
                            value={field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value) {
                                // Cria data local sem conversões de timezone
                                const [ano, mes, dia] = value.split('-').map(Number);
                                const dataLocal = new Date(ano, mes - 1, dia);
                                field.onChange(dataLocal);
                              } else {
                                field.onChange(undefined);
                              }
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DATA FINAL */}
                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Final</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10"
                            placeholder="Deixe vazio para contrato renovável"
                            value={field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value) {
                                // Cria data local sem conversões de timezone
                                const [ano, mes, dia] = value.split('-').map(Number);
                                const dataLocal = new Date(ano, mes - 1, dia);
                                field.onChange(dataLocal);
                              } else {
                                field.onChange(undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deixe vazio para contrato renovável
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PRAZO MÍNIMO */}
                <FormField
                  control={form.control}
                  name="prazoMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Prazo Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="ex: 30 dias, 3 meses, sem prazo"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Campo opcional. Digite livremente (ex: 30 dias, 3 meses, sem prazo)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* VALOR SEMANAL */}
                <FormField
                  control={form.control}
                  name="valorSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Semanal (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          placeholder="Preenchido automaticamente"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caucao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caução (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="Preenchido automaticamente"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SEÇÃO DE PAGAMENTO RECORRENTE */}
              <div className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
                <FormField
                  control={form.control}
                  name="pagamentoRecorrente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Configurar Pagamentos Recorrentes
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Criar automaticamente os pagamentos com datas de vencimento baseadas na recorrência
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('pagamentoRecorrente') && (
                  <div className="space-y-3 sm:space-y-4 ml-3 sm:ml-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="dataPrimeiroPagamento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data do Primeiro Pagamento *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10"
                                value={field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value) {
                                    // Cria data local sem conversões de timezone
                                    const [ano, mes, dia] = value.split('-').map(Number);
                                    const dataLocal = new Date(ano, mes - 1, dia);
                                    field.onChange(dataLocal);
                                  } else {
                                    field.onChange(undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recorrencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recorrência *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar recorrência" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="semanal">Semanal</SelectItem>
                                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                <SelectItem value="mensal">Mensal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipoPagamento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Pagamento *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ilimitado">Ilimitado</SelectItem>
                                <SelectItem value="limitado">Limitado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch('tipoPagamento') === 'limitado' && (
                      <FormField
                        control={form.control}
                        name="quantidadePagamentos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Pagamentos *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Ex: 12"
                                min="1"
                                max="200"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : undefined);
                                }}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Número total de pagamentos que serão cobrados
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* CHECKBOX PARA MARCAR PAGAMENTOS ANTERIORES COMO PAGOS */}
                {form.watch('pagamentoRecorrente') && (
                  <FormField
                    control={form.control}
                    name="marcarPagamentosAnteriores"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-3 sm:ml-6 border-t pt-3 sm:pt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Pagamentos Anteriores - Marcar como Pago
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Marca automaticamente como "pago total" todos os pagamentos desde a data inicial até a penúltima semana (data atual)
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-3 pt-3 sm:pt-6 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createContrato.isPending}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createContrato.isPending || contratoGerado || processandoRef.current}
                  className={`w-full sm:w-auto order-1 sm:order-2 ${contratoGerado ? "bg-green-600 hover:bg-green-600" : ""}`}
                >
                  {createContrato.isPending || processandoRef.current ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Gerando Contrato...
                    </>
                  ) : contratoGerado ? (
                    '✅ Contrato Gerado'
                  ) : (
                    'Gerar Contrato'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>

    {/* 🎯 ENHANCED ERROR DIALOG: Show actionable error with buttons */}
    <AlertDialog open={!!duplicateContractError} onOpenChange={handleCloseErrorDialog}>
      <AlertDialogContent data-testid="duplicate-contract-error-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Contrato não pode ser criado</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {duplicateContractError?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {duplicateContractError?.suggestions?.map((suggestion: any, index: number) => (
            suggestion.enabled && (
              <AlertDialogAction
                key={index}
                onClick={() => {
                  if (suggestion.action === "VIEW_RENTALS") {
                    handleViewRentals();
                  } else if (suggestion.action === "CHANGE_DRIVER") {
                    handleChangeDriver();
                  } else if (suggestion.action === "VIEW_CONTRACTS") {
                    handleViewContracts();
                  }
                }}
                className={index === 0 ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90"}
                data-testid={`button-${suggestion.action.toLowerCase().replace('_', '-')}`}
              >
                {suggestion.label}
              </AlertDialogAction>
            )
          ))}
          <AlertDialogCancel 
            onClick={handleCloseErrorDialog}
            data-testid="button-close-error"
          >
            Fechar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}