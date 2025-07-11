import { pgTable, text, serial, integer, boolean, uuid, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
  locadoraId: uuid("locadora_id"),
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
  id: uuid("id").primaryKey().defaultRandom(),
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
  status: text("status").notNull().default("disponivel"), // 'disponivel', 'alugado', 'manutencao', 'indisponivel'
  // Timestamps
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
  id: true,
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
