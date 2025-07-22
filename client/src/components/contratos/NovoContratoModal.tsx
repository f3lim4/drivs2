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
  dataFinal: z.date().optional(), // Data final opcional - se não preenchida, contrato é renovável
  tempoMinimoContrato: z.number().min(1, 'Tempo mínimo de contrato deve ser maior que 0'),
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
  tempoMinimoContrato: number,
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
    
    // LÓGICA INTELIGENTE: Gerar pagamentos retroativos se necessário
    if (dataPrimeiro < hoje) {
      console.log('[RETROATIVO] Data do primeiro pagamento é anterior à atual - gerando pagamentos em atraso');
      
      // Calcular quantos pagamentos devem existir entre a data inicial e hoje
      const diffDias = Math.ceil((hoje.getTime() - dataPrimeiro.getTime()) / (1000 * 60 * 60 * 24));
      let intervalosDias = 0;
      
      switch (recorrencia) {
        case 'semanal':
          intervalosDias = 7;
          break;
        case 'quinzenal':
          intervalosDias = 15;
          break;
        case 'mensal':
          intervalosDias = 30; // Aproximação para cálculo
          break;
      }
      
      const quantidadeRetroativa = Math.ceil(diffDias / intervalosDias);
      
      console.log('[RETROATIVO] Cálculo:', {
        diasPassados: diffDias,
        intervaloDias: intervalosDias,
        quantidadeRetroativa
      });
      
      // Criar pagamentos retroativos
      for (let i = 0; i < quantidadeRetroativa; i++) {
        const dataVencimento = new Date(dataPrimeiro);
        
        switch (recorrencia) {
          case 'semanal':
            dataVencimento.setDate(dataPrimeiro.getDate() + (i * 7));
            break;
          case 'quinzenal':
            dataVencimento.setDate(dataPrimeiro.getDate() + (i * 15));
            break;
          case 'mensal':
            dataVencimento.setMonth(dataPrimeiro.getMonth() + i);
            break;
        }
        
        // Só cria se a data de vencimento for anterior ou igual a hoje
        if (dataVencimento <= hoje) {
          const statusPagamento = marcarAnterioresComoPago ? 'pago_total' : 'em_aberto';
          
          const pagamento = {
            id: crypto.randomUUID(),
            aluguelId,
            motoristaId,
            locadoraId: profile.locadoraId,
            dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
            valor: valorPagamento,
            status: statusPagamento as const,
            observacoes: marcarAnterioresComoPago 
              ? `Pagamento retroativo ${i + 1} - Marcado automaticamente como pago`
              : `Pagamento retroativo ${i + 1} - ${recorrencia}`,
            codigoPagamento: `PAG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          };

          console.log('[RETROATIVO CRIADO]', {
            numero: i + 1,
            data: format(dataVencimento, 'dd/MM/yyyy'),
            status: statusPagamento,
            valor: pagamento.valor
          });
          
          const response = await fetch('/api/pagamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pagamento)
          });

          if (response.ok) {
            pagamentosCriados++;
            pagamentosRetroativos++;
            console.log(`✓ Pagamento retroativo ${i + 1} criado:`, format(dataVencimento, 'dd/MM/yyyy'));
          } else {
            console.error(`✗ Erro ao criar pagamento retroativo ${i + 1}:`, await response.text());
          }
        }
      }
    }
    
    // SEMPRE CRIAR PRÓXIMO PAGAMENTO (como "em_aberto")
    const proximaData = new Date(dataPrimeiro);
    
    if (dataPrimeiro < hoje) {
      // Se há pagamentos retroativos, calcular a próxima data baseada no último pagamento
      const ultimoPagamentoIndex = pagamentosRetroativos;
      
      switch (recorrencia) {
        case 'semanal':
          proximaData.setDate(dataPrimeiro.getDate() + (ultimoPagamentoIndex * 7));
          break;
        case 'quinzenal':
          proximaData.setDate(dataPrimeiro.getDate() + (ultimoPagamentoIndex * 15));
          break;
        case 'mensal':
          proximaData.setMonth(dataPrimeiro.getMonth() + ultimoPagamentoIndex);
          break;
      }
    }
    
    // Criar próximo pagamento sempre como "em_aberto"
    const proximoPagamento = {
      id: crypto.randomUUID(),
      aluguelId,
      motoristaId,
      locadoraId: profile.locadoraId,
      dataVencimento: format(proximaData, 'yyyy-MM-dd'),
      valor: valorPagamento,
      status: 'em_aberto' as const,
      observacoes: `Próximo pagamento - ${recorrencia}`,
      codigoPagamento: `PAG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    console.log('[PRÓXIMO PAGAMENTO CRIADO]', {
      data: format(proximaData, 'dd/MM/yyyy'),
      valor: proximoPagamento.valor,
      status: 'em_aberto'
    });
    
    const responseProximo = await fetch('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proximoPagamento)
    });

    if (responseProximo.ok) {
      pagamentosCriados++;
      console.log(`✓ Próximo pagamento criado:`, format(proximaData, 'dd/MM/yyyy'));
    } else {
      console.error(`✗ Erro ao criar próximo pagamento:`, await responseProximo.text());
    }

    console.log(`[RESULTADO FINAL] ${pagamentosCriados} pagamentos criados (${pagamentosRetroativos} retroativos + 1 próximo)`);
    
    return {
      totalCriados: pagamentosCriados,
      retroativos: pagamentosRetroativos,
      statusRetroativos: marcarAnterioresComoPago ? 'pago_total' : 'em_aberto'
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
  
  // Hook para gerenciar templates
  const { templates } = useTemplateContratos();
  
  // Debug: Log dos templates carregados
  useEffect(() => {
    console.log('Templates no modal:', templates);
  }, [templates]);

  // Função para obter a data de amanhã sem problemas de timezone
  const getAmanha = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();
    
    // Cria nova data local para amanhã
    const amanha = new Date(ano, mes, dia + 1);
    return amanha;
  };

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      motoristaId: '',
      veiculoId: '',
      dataInicio: getAmanha(),
      dataFinal: undefined, // ✅ DATA FINAL OPCIONAL PARA CONTRATOS RENOVÁVEIS
      tempoMinimoContrato: 1,
      valorSemanal: 0,
      caucao: 0,
      templateId: 'default',
      pagamentoRecorrente: true, // ✅ HABILITADO POR PADRÃO
      dataPrimeiroPagamento: getAmanha(), // ✅ DATA PADRÃO
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
      if (!locadoraId) return;
      
      setLoadingData(true);
      
      try {
        // Carrega veículos disponíveis
        const veiculosResponse = await fetch(`/api/veiculos?locadoraId=${locadoraId}`);
        if (veiculosResponse.ok) {
          const veiculosData = await veiculosResponse.json();
          const veiculosDisponiveis = veiculosData.filter((veiculo: any) => veiculo.status === 'disponivel');
          setVeiculos(veiculosDisponiveis);
        }

        // Carrega aluguéis primeiro para filtrar motoristas
        const alugueisResponse = await fetch(`/api/alugueis?locadoraId=${locadoraId}`);
        let alugueisAtivos: any[] = [];
        if (alugueisResponse.ok) {
          const alugueisData = await alugueisResponse.json();
          alugueisAtivos = alugueisData.filter((aluguel: any) => aluguel.status === 'ativo');
          setAlugueis(alugueisAtivos);
        }

        // Carrega motoristas disponíveis (sem aluguéis ativos)
        const motoristasResponse = await fetch(`/api/motoristas?locadoraId=${locadoraId}`);
        if (motoristasResponse.ok) {
          const motoristasData = await motoristasResponse.json();
          const now = new Date();
          
          const motoristasDisponiveis = motoristasData.filter((motorista: any) => {
            // Verifica CNH válida
            const temVencimento = !!motorista.vencimentoCnh;
            let cnhValida = false;
            if (temVencimento) {
              const vencimento = new Date(motorista.vencimentoCnh);
              cnhValida = vencimento > now;
            }
            
            // Verifica se tem aluguel ativo
            const temAluguelAtivo = alugueisAtivos.some((aluguel: any) => 
              aluguel.motoristaCpf === motorista.id || aluguel.motoristaId === motorista.id
            );
            
            const disponivel = temVencimento && cnhValida && !temAluguelAtivo;
            

            
            return disponivel;
          });
          
          
          setMotoristas(motoristasDisponiveis);
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
      console.log('[FORM DEBUG] Dados do formulário recebidos:', data);
      console.log('[FORM DEBUG] Checkbox pagamento recorrente:', data.pagamentoRecorrente);
      console.log('[FORM DEBUG] Data primeiro pagamento:', data.dataPrimeiroPagamento);
      console.log('[FORM DEBUG] Recorrência:', data.recorrencia);
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
      
      // CÁLCULO EXATO: Usa nova função que conta apenas semanas completas
      const calculoContrato = calcularContratoExato(
        data.dataInicio,
        data.tempoMinimoContrato,
        data.valorSemanal
      );
      
      // Extrai valores calculados
      const valorTotalExato = calculoContrato.valorTotal;
      const valorMensalCalculado = valorTotalExato / data.tempoMinimoContrato; // Para compatibilidade com o banco
      
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
      if (data.dataFinal) {
        dataFimAluguel = data.dataFinal;
      } else {
        // Se não tiver data final, usa tempo mínimo para calcular
        dataFimAluguel = new Date(data.dataInicio);
        dataFimAluguel.setMonth(dataFimAluguel.getMonth() + data.tempoMinimoContrato);
      }
      
      // Cria o aluguel no banco primeiro
      const locadoraId = profile?.locadoraId || profile?.id;
      const novoAluguel = {
        id: crypto.randomUUID(),
        locadoraId: locadoraId,
        motoristaId: data.motoristaId,
        veiculoId: data.veiculoId,
        dataInicio: format(data.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFimAluguel, 'yyyy-MM-dd'),
        tempoContrato: data.tempoMinimoContrato,
        valorMensal: valorMensalAluguel.toFixed(2),
        valorTotal: valorTotalAluguel.toFixed(2),
        caucao: data.caucao.toFixed(2),
        status: 'ativo'
      };
      
      console.log('[DEBUG] Criando aluguel com locadoraId:', locadoraId);
      
      const aluguelResponse = await fetch('/api/alugueis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoAluguel),
      });
      
      if (!aluguelResponse.ok) {
        throw new Error('Erro ao criar aluguel');
      }
      
      const aluguelCriado = await aluguelResponse.json();
      
      // Cria objeto compatível com a estrutura esperada
      aluguel = {
        id: aluguelCriado.id,
        motoristaId: motorista.id,
        veiculoId: veiculo.id,
        motoristaNome: motorista.nome,
        veiculoPlaca: veiculo.placa, // ✅ CORRIGIDO: usar placa ao invés de modelo
        veiculoModelo: `${veiculo.marca} ${veiculo.modelo}`,
        valorMensal: valorMensalAluguel,
        caucao: data.caucao,
        status: 'ativo'
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
        responsavel: dadosLocadora.responsavel
      } : {
        nome: "DRIVS LOCADORA DE VEÍCULOS LTDA",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua das Empresas, 123 - Centro, Embu das Artes/SP",
        responsavel: "Responsável da Locadora"
      };

      // Calcula data final
      const dataFim = new Date(data.dataInicio);
      dataFim.setMonth(dataFim.getMonth() + data.tempoMinimoContrato);

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
        templateContent = `CONTRATO DE LOCAÇÃO DE VEÍCULO

LOCADOR: ${locadorInfo.nome}, Ramo de atividade: Locação de Veículos, portador do CNPJ: ${locadorInfo.cnpj}, cuja
sede se encontra na ${locadorInfo.endereco}. 

LOCATÁRIO: ${aluguel.motoristaNome}, Telefone: ${aluguel.motoristaId}
profissão: Motorista de Aplicativo. As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Locação de
Automóvel que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

1. CLÁUSULA PRIMEIRA – DO OBJETO, PRAZO E USO
1.1. O LOCADOR declara ser o legítimo possuidor e/ou proprietário do veículo de modelo ${aluguel.veiculoModelo}, placa ${aluguel.veiculoPlaca}, Vistoriado com fotos e video no dia da retirada, e que resolveu dá-lo em locação ao LOCATÁRIO pelo prazo de ${data.tempoContrato} mês(es)
contados a partir da assinatura do presente contrato.

1.2. Findo o prazo acima estipulado, o contrato poderá ser renovado automaticamente, desde que seja do desejo de
ambas as partes, ou o veículo deverá ser devolvido ao LOCADOR nas mesmas condições em que estava quando foi
recebido, ou seja, em perfeitas condições de uso, respondendo o LOCATÁRIO pelos danos ou prejuízos causados e pela
devolução do veículo após o término do contrato.
1.2.1. Caso o LOCATÁRIO não pague o aluguel na data estipulada, após 02 dias de vencido, além dos juros e multa por
atraso, o veículo será recolhido, e as diárias serão cobradas normalmente, mesmo sem a utilização dele. O veículo só
será liberado ao LOCATÁRIO novamente após a quitação dos débitos pendentes.
1.3. Caso o LOCATÁRIO não restituir o automóvel na data estipulada, deverá pagar, enquanto detiver em seu poder, o
valor da locação que o LOCADOR arbitrar, e responderá pelo dano que o automóvel venha a sofrer, mesmo se
proveniente de caso fortuito.
1.4. Uso Exclusivo e Restrições de Localidade
O veículo locado será destinado exclusivamente ao uso nas plataformas de transporte de passageiros, como UBER, 99,
CABIFY e outros aplicativos similares, somente dentro do estado de São Paulo. É expressamente proibida a utilização
do veículo fora do estado de São Paulo, bem como o empréstimo, sublocação ou qualquer transferência de posse a
terceiros. O descumprimento desta cláusula resultará em multa de 02 semanais do veículo, além da remoção imediata
do veículo.
Adicionalmente, a empresa arcará com os custos de guincho em um raio de até 100 km da nossa base. Caso o veículo
necessite de remoção em uma distância superior, o custo adicional do guincho e as horas necessárias até a chegada do
veículo à mecânica serão cobrados do motorista responsável.
1.5. O bem locado apenas poderá ser dirigido pelo LOCATÁRIO. Havendo qualquer tipo de problema no veículo ou
alteração no endereço do LOCATÁRIO, o mesmo deverá comunicar imediatamente ao LOCADOR.

2. CLÁUSULA SEGUNDA – DO VALOR
2.1. O LOCATÁRIO pagará ao LOCADOR, a título de locação, o valor semanal de R$ ${parseFloat(String(data.valorSemanal)).toFixed(2)}.
2.2. O pagamento será feito toda segunda-feira, via depósito em conta do LOCADOR, e o atraso no pagamento do acordo
da cláusula acima enseja multa de 10% (dez por cento) e juros de 2% (dois por cento) ao dia.

3. CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES
3.1. No caso de o veículo ficar parado em oficina, se por desgaste natural nas manutenções, o carro que ultrapassar 08
horas parado terá os dias/horas abonados do aluguel semanal. Se a paralisação for por má utilização do condutor, os
dias/períodos parados serão cobrados normalmente do aluguel.
3.2. É de inteira responsabilidade do LOCATÁRIO os débitos sobre infrações de trânsito (multas), e que seus pontos
sejam repassados/transmitidos de imediato, mais o pagamento de 20% sobre o valor da multa. Caso não transfira em
até 10 dias, o LOCADOR poderá solicitar o carro, e o LOCATÁRIO pagará o valor dobrado da multa.
3.3. O veículo alugado possui seguro contra roubo, furto, colisões e perda total (PT). Em caso de sinistro, o seguro será
acionado, e o motorista será responsável pelo pagamento dos dias em que o veículo permanecer fora de circulação até
que volte a estar disponível para uso, além de arcar com 10% do valor do carro, correspondente à franquia. Caso a
seguradora rejeite a cobertura por qualquer motivo, o motorista deverá pagar o valor integral do veículo conforme a
tabela FIPE vigente na data do sinistro.

4. CLÁUSULA QUARTA - Vistorias
Fica determinado entre as partes que o LOCATÁRIO tem direito a duas vistorias mensais no veículo, cujo dia fica a
combinar entre ambas as partes.

5. CLÁUSULA QUINTA - Verificações do LOCADOR
É de total responsabilidade do LOCADOR a verificação diária da água do radiador e do óleo. Em caso de falta, deverá
avisar ao LOCATÁRIO, e em hipótese alguma deve andar com o veículo fervendo ou sem óleo, caso o motorista ande com veículo nessas condições ele será responsável pelos danos.

6. CLÁUSULA SEXTA– DA RESCISÃO / CAUÇÃO
6.1. A rescisão, antes do vencimento contratual, por iniciativa de qualquer das partes, deverá ser precedida de
notificação expressa com antecedência mínima de 1 mês. Caso não haja essa notificação, haverá multa por quebra do
contrato no valor de 02 semanais do veículo.
6.2. A caução no valor de R$ ${parseFloat(String(data.caucao)).toFixed(2)} será devolvida no término do contrato, após o prazo de 30 dias úteis, desde que não haja nenhuma avaria
ou infração pendente.
6.3. O descumprimento de qualquer uma das cláusulas por parte dos contratantes ensejará a rescisão deste
instrumento e o devido pagamento de multa pela parte inadimplente, no valor correspondente a 02 semanas de
locação.

7. CLÁUSULA SÉTIMA - Limite de Quilometragem Mensal
Fica estipulado o limite mensal de quilometragem de ${dadosVeiculo?.valorLimiteKm ? `${dadosVeiculo.valorLimiteKm * 4} km` : 'ILIMITADO'} para o veículo alugado. Caso o condutor exceda esse
limite, será cobrado o valor de R$ 0,50 (cinquenta centavos) por quilômetro excedido.

8. CLÁUSULA OITAVA - Responsabilidade por Batidas e Reparos
Em caso de colisão, batida simples ou qualquer tipo de acidente envolvendo o veículo locado, o motorista é obrigado
a comunicar a empresa imediatamente após o ocorrido.
Todos os custos relacionados aos reparos serão de total responsabilidade do motorista, incluindo as diárias em que o
veículo estiver parado para conserto. Durante o período de reparo, o valor das diárias será cobrado até que o veículo
esteja em plenas condições de uso.
Além disso, a empresa se reserva o direito de não devolver o veículo ao motorista caso considere necessário, seja por
motivos de má utilização, recorrência de acidentes ou qualquer outra razão que comprometa a segurança do veículo
ou a operação.

9. CLÁUSULA NONA – DAS DISPOSIÇÕES GERAIS
As partes contratantes
elegem o foro de Embu das Artes para dirimir qualquer ação oriunda deste contrato. E, por estarem justas e
contratadas, assinam o presente instrumento em Embu das Artes - SP, ${format(data.dataInicio, 'dd/MM/yyyy')}.



            __________________                          __________________
            ${aluguel.motoristaNome}                          ${locadorInfo.responsavel}
                LOCATÁRIO                                    LOCADORA

Contrato gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`;
      }

      // Cria novo contrato
      const novoContrato = {
        tipo: 'locacao' as const,
        titulo: `Contrato de Locação - ${aluguel.motoristaNome}`,
        cliente: aluguel.motoristaNome,
        valor: parseFloat(valorTotal.toFixed(2)),
        dataInicio: format(data.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFim, 'yyyy-MM-dd'),
        status: 'ativo' as const,
        template: templateContent,
        veiculoId: data.veiculoId // ✅ INCLUIR VEÍCULO ID NO CONTRATO
      };

      console.log('[FRONTEND] Criando contrato com dados:', novoContrato);
      
      // Usa o hook para criar o contrato
      const contratoCriado = await createContrato.mutateAsync(novoContrato);
      console.log('[FRONTEND] Contrato criado:', contratoCriado);
      
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
          data.tempoMinimoContrato,
          data.dataInicio,  // Passa a data de início do contrato
          data.tipoPagamento,  // Tipo: ilimitado ou limitado
          data.quantidadePagamentos,  // Quantidade específica (se limitado)
          data.marcarPagamentosAnteriores  // Marcar pagamentos anteriores como pagos
        );
        
        console.log('[DEBUG PAGAMENTOS] Resultado:', quantidadePagamentos);
        
        // Exibir notificação baseada no resultado
        if (quantidadePagamentos.totalCriados > 0) {
          const mensagem = quantidadePagamentos.retroativos > 0 
            ? `${quantidadePagamentos.totalCriados} pagamentos criados (${quantidadePagamentos.retroativos} retroativos${quantidadePagamentos.statusRetroativos === 'pago_total' ? ' marcados como pagos' : ''} + 1 próximo)`
            : `${quantidadePagamentos.totalCriados} pagamento${quantidadePagamentos.totalCriados > 1 ? 's' : ''} ${data.recorrencia}${quantidadePagamentos.totalCriados > 1 ? 's' : ''} criado${quantidadePagamentos.totalCriados > 1 ? 's' : ''} automaticamente`;
            
          toast({
            title: "Pagamentos Recorrentes Criados",
            description: mensagem,
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
          dataInicio: getAmanha(),
          dataFinal: undefined, // ✅ DATA FINAL OPCIONAL PARA CONTRATOS RENOVÁVEIS
          tempoMinimoContrato: 1,
          valorSemanal: 0,
          caucao: 0,
          templateId: 'default',
          pagamentoRecorrente: true, // ✅ HABILITADO POR PADRÃO
          dataPrimeiroPagamento: getAmanha(), // ✅ DATA PADRÃO
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
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar contrato. Tente novamente.",
        variant: "destructive",
      });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha as informações para gerar um contrato de locação.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* SELEÇÃO DE VEÍCULO, MOTORISTA E TEMPLATE */}
              <div className="grid grid-cols-3 gap-4">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              Nenhum motorista com CNH válida
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
              <div className="grid grid-cols-5 gap-3">
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
                  name="dataFinal"
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

                {/* TEMPO MÍNIMO DE CONTRATO */}
                <FormField
                  control={form.control}
                  name="tempoMinimoContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo Mínimo de Contrato (meses) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? '' : parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
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
              <div className="space-y-4 border-t pt-4">
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
                  <div className="space-y-4 ml-6">
                    <div className="grid grid-cols-3 gap-4">
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-6 border-t pt-4">
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createContrato.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createContrato.isPending || contratoGerado || processandoRef.current}
                  className={contratoGerado ? "bg-green-600 hover:bg-green-600" : ""}
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
  );
}