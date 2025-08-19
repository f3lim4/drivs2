/**
 * Tipos TypeScript para o sistema DRIVS
 * Define todas as interfaces e tipos utilizados no sistema de locadora
 */

export interface Motorista {
  id: string;
  locadoraId: string;
  // Informações Pessoais
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  // Contato
  telefone: string;
  email?: string;
  // Carteira de Motorista
  cnh: string;
  categoria: string;
  vencimentoCnh: string;
  // Endereço
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  cidade: string;
  estado: string;
  cep: string;
  // Status e outros
  status: 'ativo' | 'inativo' | 'vencido';
  avatar?: string;
  // Negativação
  negativado?: boolean;
  motivoNegativacao?: string;
  dataNegativacao?: string;
  // Imagens
  imagem1?: string;
  imagem2?: string;
  imagem3?: string;
  imagem4?: string;
  imagem5?: string;
  imagem6?: string;
  // Campos legados para compatibilidade
  contato?: string;
  localizacao?: string;
}

export interface Veiculo {
  id: string;
  // Informações Básicas
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  categoria: string;
  // Documentação
  renavam: string;
  chassi: string;
  // Características Técnicas
  combustivel: string;
  quilometragem: number;
  valorSemanal: number;
  caucao: number;
  taxaAdministrativa?: number;
  limiteQuilometragem: string;
  valorLimiteKm?: number; // Campo para valor específico quando limitada
  // Manutenção
  ultimaRevisao?: string;
  proximaRevisao?: string;
  // Seguro
  seguradora?: string;
  numeroApolice?: string;
  vigenciaSeguro?: string;
  valorSeguroMensal?: number;
  // Valor do Veículo e IPVA
  valorVeiculo?: number;
  ipva?: number;
  // Rastreador
  rastreador?: string;
  valorRastreadorMensal?: number;
  // Status
  status: 'disponivel' | 'alugado' | 'manutencao' | 'indisponivel';
  // Campos legados para compatibilidade
  valorDiario?: number;
  valorCaucao?: number;
  kmLimite?: string;
  seguro?: string;
  observacoes?: string;
  // Dados da locadora
  locadoraNome?: string;
}

export interface Aluguel {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  motoristaContato: string;
  veiculoId: string;
  veiculoModelo: string;
  veiculoPlaca: string;
  periodo: {
    inicio: string;
    fim: string;
    dias: number;
  };
  valores: {
    diario: number;
    total: number;
    caucao: number;
    taxaAdmin?: number;
  };
  status: 'ativo' | 'finalizado' | 'cancelado' | 'pendente';
  observacoes?: string;
}

export interface Locadora {
  id: string; // CNPJ
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'basico' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Contrato {
  id: string;
  tipo: 'locacao' | 'compra' | 'servico';
  titulo: string;
  cliente: string;
  valor: number;
  dataInicio: string;
  dataFim?: string;
  status: 'em_aberto' | 'ativo' | 'cancelado' | 'encerrado';
  template?: string;
  arquivoAssinado?: string; // Nome do arquivo de contrato assinado
  dataAssinatura?: string; // Data de assinatura do contrato
  
  // Campos adicionais para cálculos
  valorSemanal?: number;
  tempoContrato?: number;
  caucao?: number;
  veiculoId?: string;
  motoristaNome?: string;
  motoristaCpf?: string;
  veiculoPlaca?: string;
  veiculoMarca?: string;
  veiculoModelo?: string;
}

export interface DashboardStats {
  totalMotoristas: number;
  motoristasAtivos: number;
  totalVeiculos: number;
  veiculosDisponiveis: number;
  veiculosAlugados: number;
  veiculosManutencao: number;
  alugueisAtivos: number;
  receitaMensal: number;
  cnhVencendo: number;
  cnhVencida: number;
  alertas: Alert[];
}

export interface Alert {
  id: string;
  tipo: 'warning' | 'danger' | 'info';
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
}

export type StatusVeiculo = 'disponivel' | 'alugado' | 'manutencao' | 'indisponivel';
export type StatusMotorista = 'ativo' | 'inativo' | 'vencido';
export type StatusAluguel = 'ativo' | 'finalizado' | 'cancelado' | 'pendente';