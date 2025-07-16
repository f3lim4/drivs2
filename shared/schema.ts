import { pgTable, text, serial, integer, boolean, uuid, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Profiles table for user information
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'admin' or 'locadora'
  locadoraId: text("locadora_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locadoras table
export const locadoras = pgTable("locadoras", {
  id: text("id").primaryKey(), // CNPJ será usado como ID
  nome: text("nome").notNull(),
  razaoSocial: text("razao_social").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email").notNull().unique(),
  telefone: text("telefone").notNull().unique(),
  endereco: text("endereco").notNull(),
  cidade: text("cidade").notNull(),
  estado: text("estado").notNull(),
  cep: text("cep").notNull(),
  responsavel: text("responsavel").notNull(),
  status: text("status").notNull().default("pendente"), // 'ativa', 'inativa', 'pendente'
  plano: text("plano").notNull().default("basico"), // 'basico', 'premium', 'enterprise'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Veiculos table
export const veiculos = pgTable("veiculos", {
  id: text("id").primaryKey(), // RENAVAM será usado como ID
  locadoraId: text("locadora_id").notNull(), // Referência ao CNPJ da locadora
  // Informações Básicas
  placa: text("placa").notNull().unique(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  ano: integer("ano").notNull(),
  cor: text("cor").notNull(),
  categoria: text("categoria").notNull(),
  // Documentação
  renavam: text("renavam").notNull().unique(),
  chassi: text("chassi").notNull().unique(),
  // Características Técnicas
  combustivel: text("combustivel").notNull(),
  quilometragem: integer("quilometragem").notNull().default(0),
  valorSemanal: decimal("valor_semanal", { precision: 10, scale: 2 }).notNull(),
  caucao: decimal("caucao", { precision: 10, scale: 2 }).notNull(),
  taxaAdministrativa: decimal("taxa_administrativa", { precision: 10, scale: 2 }),
  limiteQuilometragem: text("limite_quilometragem").notNull(),
  valorLimiteKm: integer("valor_limite_km"),
  // Manutenção
  ultimaRevisao: date("ultima_revisao"),
  proximaRevisao: date("proxima_revisao"),
  // Seguro
  seguradora: text("seguradora"),
  numeroApolice: text("numero_apolice"),
  vigenciaSeguro: date("vigencia_seguro"),
  valorSeguroMensal: decimal("valor_seguro_mensal", { precision: 10, scale: 2 }),
  // Status
  status: text("status").notNull().default("disponivel"), // 'disponivel', 'alugado' (controlado automaticamente)
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Motoristas table
export const motoristas = pgTable("motoristas", {
  id: text("id").primaryKey(), // CPF será usado como ID
  locadoraId: text("locadora_id").notNull(), // Referência ao CNPJ da locadora
  // Informações Pessoais
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull().unique(),
  rg: text("rg").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  // Contato
  telefone: text("telefone").notNull(),
  email: text("email"),
  // Carteira de Motorista
  cnh: text("cnh").notNull().unique(),
  categoria: text("categoria").notNull(),
  vencimentoCnh: date("vencimento_cnh").notNull(),
  // Endereço
  rua: text("rua").notNull(),
  numero: text("numero").notNull(),
  bairro: text("bairro").notNull(),
  cidade: text("cidade").notNull(),
  estado: text("estado").notNull(),
  cep: text("cep").notNull(),
  // Status
  status: text("status").notNull().default("ativo"), // 'ativo', 'inativo', 'vencido'
  avatar: text("avatar"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Aluguéis table
export const alugueis = pgTable("alugueis", {
  id: text("id").primaryKey(),
  locadoraId: text("locadora_id").notNull(),
  motoristaId: text("motorista_id").notNull(),
  veiculoId: text("veiculo_id").notNull(),
  // Período
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim").notNull(),
  tempoContrato: integer("tempo_contrato").notNull(), // em meses
  // Valores
  valorMensal: decimal("valor_mensal", { precision: 10, scale: 2 }).notNull(),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).notNull(),
  caucao: decimal("caucao", { precision: 10, scale: 2 }).notNull(),
  taxaAdministrativa: decimal("taxa_administrativa", { precision: 10, scale: 2 }),
  // Status
  status: text("status").notNull().default("pendente"), // 'pendente', 'ativo', 'finalizado', 'cancelado'
  // Observações
  observacoes: text("observacoes"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contratos table
export const contratos = pgTable("contratos", {
  id: text("id").primaryKey(),
  locadoraId: text("locadora_id").notNull(),
  tipo: text("tipo").notNull().default("locacao"), // 'locacao', 'compra', 'servico'
  titulo: text("titulo").notNull(),
  cliente: text("cliente").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim"),
  status: text("status").notNull().default("ativo"), // 'ativo', 'finalizado', 'cancelado'
  template: text("template"), // conteúdo do contrato
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Templates de contratos table
export const templateContratos = pgTable("template_contratos", {
  id: text("id").primaryKey(),
  locadoraId: text("locadora_id").notNull(),
  nome: text("nome").notNull(),
  conteudo: text("conteudo").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocadoraSchema = createInsertSchema(locadoras).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVeiculoSchema = createInsertSchema(veiculos).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMotoristaSchema = createInsertSchema(motoristas).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAluguelSchema = createInsertSchema(alugueis).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertContratoSchema = createInsertSchema(contratos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateContratoSchema = createInsertSchema(templateContratos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Pagamentos table
export const pagamentos = pgTable("pagamentos", {
  id: text("id").primaryKey(),
  locadoraId: text("locadora_id").notNull(),
  motoristaId: text("motorista_id").notNull(),
  aluguelId: text("aluguel_id"), // Opcional - apenas para pagamentos de aluguel
  tipo: text("tipo").notNull(), // 'aluguel', 'infrações', 'manutenção', 'danos', 'outros'
  descricao: text("descricao"), // Descrição adicional do pagamento
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).notNull(),
  valorPago: decimal("valor_pago", { precision: 10, scale: 2 }).notNull(),
  valorRestante: decimal("valor_restante", { precision: 10, scale: 2 }).notNull(),
  dataPagamento: date("data_pagamento").notNull(),
  status: text("status").notNull().default("pendente"), // 'pendente', 'parcial', 'pago', 'atrasado'
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({
  createdAt: true,
  updatedAt: true,
});

// Infrações table
export const infracoes = pgTable("infracoes", {
  id: text("id").primaryKey(),
  locadoraId: text("locadora_id").notNull(),
  motoristaId: text("motorista_id").notNull(),
  veiculoId: text("veiculo_id").notNull(),
  aluguelId: text("aluguel_id"), // Opcional - referência ao aluguel
  
  // Dados da infração
  numeroAuto: text("numero_auto").notNull().unique(), // Número do auto de infração
  codigoInfracao: text("codigo_infracao").notNull(), // Código da infração (ex: 554-20)
  descricaoInfracao: text("descricao_infracao").notNull(), // Descrição da infração
  tipoInfracao: text("tipo_infracao").notNull(), // 'leve', 'media', 'grave', 'gravissima'
  pontuacao: integer("pontuacao").notNull().default(0), // Pontos na carteira
  
  // Valores financeiros
  valorOriginal: decimal("valor_original", { precision: 10, scale: 2 }).notNull(),
  valorDesconto: decimal("valor_desconto", { precision: 10, scale: 2 }).default("0.00"),
  valorFinal: decimal("valor_final", { precision: 10, scale: 2 }).notNull(),
  
  // Datas importantes
  dataInfracao: date("data_infracao").notNull(), // Data da infração
  dataVencimento: date("data_vencimento").notNull(), // Data de vencimento
  dataNotificacao: date("data_notificacao"), // Data que foi notificado
  dataPagamento: date("data_pagamento"), // Data do pagamento
  
  // Local da infração
  localInfracao: text("local_infracao").notNull(), // Endereço onde ocorreu
  cidade: text("cidade").notNull(),
  estado: text("estado").notNull(),
  
  // Órgão autuador
  orgaoAutuador: text("orgao_autuador").notNull(), // DETRAN, PRF, etc.
  agente: text("agente"), // Nome do agente
  
  // Status e controle
  status: text("status").notNull().default("pendente"), // 'pendente', 'pago', 'contestado', 'cancelado'
  situacao: text("situacao").notNull().default("ativo"), // 'ativo', 'prescrito', 'cancelado'
  responsavel: text("responsavel").notNull().default("motorista"), // 'motorista', 'locadora'
  
  // Observações
  observacoes: text("observacoes"),
  
  // Controle interno
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInfracaoSchema = createInsertSchema(infracoes).omit({
  createdAt: true,
  updatedAt: true,
});

// Despesas table
export const despesas = pgTable("despesas", {
  id: uuid("id").primaryKey().defaultRandom(),
  locadoraId: text("locadora_id").notNull(), // Referência ao CNPJ da locadora
  veiculoId: text("veiculo_id"), // Referência ao veículo (opcional)
  categoria: text("categoria").notNull(), // 'manutencao', 'seguro', 'financiamento', 'outros'
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  data: date("data").notNull(),
  tipo: text("tipo").notNull().default("operacional"), // 'operacional', 'administrativo', 'financeiro'
  status: text("status").notNull().default("pago"), // 'pendente', 'pago', 'vencido'
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDespesaSchema = createInsertSchema(despesas).omit({
  createdAt: true,
  updatedAt: true,
});

// Manutencoes table
export const manutencoes = pgTable("manutencoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  locadoraId: text("locadora_id").notNull(), // Referência ao CNPJ da locadora
  veiculoId: text("veiculo_id").notNull(), // Referência ao veículo
  
  // Informações da manutenção
  tipo: text("tipo").notNull(), // 'preventiva', 'corretiva', 'revisao', 'outros'
  descricao: text("descricao").notNull(),
  oficina: text("oficina").notNull(),
  contato: text("contato"), // Telefone da oficina
  
  // Valores
  valorOrcamento: decimal("valor_orcamento", { precision: 10, scale: 2 }),
  valorFinal: decimal("valor_final", { precision: 10, scale: 2 }),
  
  // Datas
  dataInicio: date("data_inicio").notNull(),
  dataPrevisao: date("data_previsao").notNull(),
  dataConclusao: date("data_conclusao"),
  
  // Quilometragem
  quilometragemInicio: integer("quilometragem_inicio"),
  quilometragemFim: integer("quilometragem_fim"),
  
  // Status
  status: text("status").notNull().default("agendada"), // 'agendada', 'em_andamento', 'concluida', 'cancelada'
  prioridade: text("prioridade").notNull().default("normal"), // 'baixa', 'normal', 'alta', 'urgente'
  
  // Observações
  observacoes: text("observacoes"),
  pecasSubstituidas: text("pecas_substituidas"), // Lista de peças
  proximaManutencao: date("proxima_manutencao"),
  
  // Controle interno
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertManutencaoSchema = createInsertSchema(manutencoes).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type InsertLocadora = z.infer<typeof insertLocadoraSchema>;
export type Locadora = typeof locadoras.$inferSelect;

export type InsertVeiculo = z.infer<typeof insertVeiculoSchema>;
export type Veiculo = typeof veiculos.$inferSelect;

export type InsertMotorista = z.infer<typeof insertMotoristaSchema>;
export type Motorista = typeof motoristas.$inferSelect;

export type InsertAluguel = z.infer<typeof insertAluguelSchema>;
export type Aluguel = typeof alugueis.$inferSelect & {
  motoristaNome?: string;
  motoristaContato?: string;
  veiculoModelo?: string;
  veiculoPlaca?: string;
};

export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type Contrato = typeof contratos.$inferSelect;

export type InsertTemplateContrato = z.infer<typeof insertTemplateContratoSchema>;
export type TemplateContrato = typeof templateContratos.$inferSelect;

export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentos.$inferSelect & {
  motoristaNome?: string;
  motoristaContato?: string;
  aluguelVeiculoModelo?: string;
  aluguelVeiculoPlaca?: string;
};

export type InsertInfracao = z.infer<typeof insertInfracaoSchema>;
export type Infracao = typeof infracoes.$inferSelect & {
  motoristaNome?: string;
  motoristaContato?: string;
  veiculoModelo?: string;
  veiculoPlaca?: string;
};

export type InsertDespesa = z.infer<typeof insertDespesaSchema>;
export type Despesa = typeof despesas.$inferSelect & {
  veiculoModelo?: string;
  veiculoPlaca?: string;
};

export type InsertManutencao = z.infer<typeof insertManutencaoSchema>;
export type Manutencao = typeof manutencoes.$inferSelect & {
  veiculoModelo?: string;
  veiculoPlaca?: string;
};
