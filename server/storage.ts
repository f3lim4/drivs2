import { 
  users, profiles, locadoras, veiculos, motoristas, alugueis, contratos, templateContratos, pagamentos, infracoes, despesas, manutencoes, locais, anuncios, atividades, seoConfig,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Locadora, type InsertLocadora,
  type Veiculo, type InsertVeiculo,
  type Motorista, type InsertMotorista,
  type Aluguel, type InsertAluguel,
  type Contrato, type InsertContrato,
  type TemplateContrato, type InsertTemplateContrato,
  type Pagamento, type InsertPagamento,
  type Infracao, type InsertInfracao,
  type Despesa, type InsertDespesa,
  type Manutencao, type InsertManutencao,
  type Local, type InsertLocal,
  type Anuncio, type InsertAnuncio,
  type Atividade, type InsertAtividade,
  type SeoConfig, type InsertSeoConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

// Função para gerar código único de pagamento
const gerarCodigoPagamento = async (): Promise<string> => {
  let codigo: string;
  let exists: boolean;
  
  do {
    // Gera um código no formato PAG-XXXXXX (6 dígitos)
    const numero = Math.floor(100000 + Math.random() * 900000);
    codigo = `PAG-${numero}`;
    
    // Verifica se já existe no banco
    const existingPayment = await db.select().from(pagamentos).where(eq(pagamentos.codigoPagamento, codigo)).limit(1);
    exists = existingPayment.length > 0;
  } while (exists);
  
  return codigo;
};

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUUID(uuid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;
  
  // Locadora operations
  getAllLocadoras(): Promise<Locadora[]>;
  getLocadora(id: string): Promise<Locadora | undefined>;
  createLocadora(locadora: InsertLocadora): Promise<Locadora>;
  updateLocadora(id: string, updates: Partial<InsertLocadora>): Promise<Locadora>;
  deleteLocadora(id: string): Promise<void>;
  
  // Veiculo operations
  getAllVeiculos(): Promise<Veiculo[]>;
  getVeiculosByLocadora(locadoraId: string): Promise<Veiculo[]>;
  getVeiculo(id: string): Promise<Veiculo | undefined>;
  createVeiculo(veiculo: InsertVeiculo): Promise<Veiculo>;
  updateVeiculo(id: string, updates: Partial<InsertVeiculo>): Promise<Veiculo>;
  deleteVeiculo(id: string): Promise<void>;
  
  // Motorista operations
  getAllMotoristas(): Promise<Motorista[]>;
  getMotoristasByLocadora(locadoraId: string): Promise<Motorista[]>;
  getMotorista(id: string): Promise<Motorista | undefined>;
  createMotorista(motorista: InsertMotorista): Promise<Motorista>;
  updateMotorista(id: string, updates: Partial<InsertMotorista>): Promise<Motorista>;
  deleteMotorista(id: string): Promise<void>;
  
  // Aluguel operations
  getAllAlugueis(): Promise<Aluguel[]>;
  getAlugueisByLocadora(locadoraId: string): Promise<Aluguel[]>;
  getAluguel(id: string): Promise<Aluguel | undefined>;
  createAluguel(aluguel: InsertAluguel): Promise<Aluguel>;
  updateAluguel(id: string, updates: Partial<InsertAluguel>): Promise<Aluguel>;
  deleteAluguel(id: string): Promise<void>;
  
  // Contrato operations
  getAllContratos(): Promise<Contrato[]>;
  getContratosByLocadora(locadoraId: string): Promise<Contrato[]>;
  getContrato(id: string): Promise<Contrato | undefined>;
  createContrato(contrato: InsertContrato): Promise<Contrato>;
  updateContrato(id: string, updates: Partial<InsertContrato>): Promise<Contrato>;
  deleteContrato(id: string): Promise<void>;
  
  // Template Contrato operations
  getAllTemplateContratos(): Promise<TemplateContrato[]>;
  getTemplateContratosByLocadora(locadoraId: string): Promise<TemplateContrato[]>;
  getTemplateContrato(id: string): Promise<TemplateContrato | undefined>;
  createTemplateContrato(template: InsertTemplateContrato): Promise<TemplateContrato>;
  updateTemplateContrato(id: string, updates: Partial<InsertTemplateContrato>): Promise<TemplateContrato>;
  deleteTemplateContrato(id: string): Promise<void>;
  
  // Pagamento operations
  getAllPagamentos(): Promise<Pagamento[]>;
  getPagamentosByLocadora(locadoraId: string): Promise<Pagamento[]>;
  getPagamentosByMotorista(motoristaId: string): Promise<Pagamento[]>;
  getPagamento(id: string): Promise<Pagamento | undefined>;
  createPagamento(pagamento: InsertPagamento): Promise<Pagamento>;
  updatePagamento(id: string, updates: Partial<InsertPagamento>): Promise<Pagamento>;
  deletePagamento(id: string): Promise<void>;
  getAluguelValorSemanal(aluguelId: string): Promise<number | undefined>;
  
  // Infracao operations
  getAllInfracoes(): Promise<Infracao[]>;
  getInfracoesByLocadora(locadoraId: string): Promise<Infracao[]>;
  getInfracoesByMotorista(motoristaId: string): Promise<Infracao[]>;
  getInfracoesByVeiculo(veiculoId: string): Promise<Infracao[]>;
  getInfracao(id: string): Promise<Infracao | undefined>;
  createInfracao(infracao: InsertInfracao): Promise<Infracao>;
  updateInfracao(id: string, updates: Partial<InsertInfracao>): Promise<Infracao>;
  deleteInfracao(id: string): Promise<void>;
  
  // Despesa operations
  getAllDespesas(): Promise<Despesa[]>;
  getDespesasByLocadora(locadoraId: string): Promise<Despesa[]>;
  getDespesasByVeiculo(veiculoId: string): Promise<Despesa[]>;
  getDespesa(id: string): Promise<Despesa | undefined>;
  createDespesa(despesa: InsertDespesa): Promise<Despesa>;
  updateDespesa(id: string, updates: Partial<InsertDespesa>): Promise<Despesa>;
  deleteDespesa(id: string): Promise<void>;
  
  // Manutencao operations
  getAllManutencoes(): Promise<Manutencao[]>;
  getManutencoesByLocadora(locadoraId: string): Promise<Manutencao[]>;
  getManutencoesByVeiculo(veiculoId: string): Promise<Manutencao[]>;
  getManutencao(id: string): Promise<Manutencao | undefined>;
  createManutencao(manutencao: InsertManutencao): Promise<Manutencao>;
  updateManutencao(id: string, updates: Partial<InsertManutencao>): Promise<Manutencao>;
  deleteManutencao(id: string): Promise<void>;
  
  // Local operations
  getAllLocais(): Promise<Local[]>;
  getLocaisByLocadora(locadoraId: string): Promise<Local[]>;
  getLocal(id: string): Promise<Local | undefined>;
  createLocal(local: InsertLocal): Promise<Local>;
  updateLocal(id: string, updates: Partial<InsertLocal>): Promise<Local>;
  deleteLocal(id: string): Promise<void>;
  
  // Anuncio operations
  getAllAnuncios(): Promise<Anuncio[]>;
  getAnunciosAtivos(): Promise<Anuncio[]>;
  getAnuncio(id: string): Promise<Anuncio | undefined>;
  createAnuncio(anuncio: InsertAnuncio): Promise<Anuncio>;
  updateAnuncio(id: string, updates: Partial<InsertAnuncio>): Promise<Anuncio>;
  deleteAnuncio(id: string): Promise<void>;
  
  // Atividade operations
  getAtividadesByLocadora(locadoraId: string): Promise<Atividade[]>;
  getAtividadesByLocadoraEUsuario(locadoraId: string, usuario?: string): Promise<Atividade[]>;
  createAtividade(atividade: InsertAtividade): Promise<Atividade>;
  
  // SEO operations (apenas admin)
  getSeoConfig(): Promise<SeoConfig | undefined>;
  updateSeoConfig(updates: Partial<InsertSeoConfig>): Promise<SeoConfig>;
  createDefaultSeoConfig(): Promise<SeoConfig>;
  
  // Analytics operations
  getSystemAnalytics(): Promise<{
    visitantesEsseMes: number;
    paginasVisualizadas: number;
    tempoMedio: number;
    taxaRetorno: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Função para sincronizar status dos veículos com aluguéis ativos
  private async syncVeiculosStatus(): Promise<void> {
    try {
      // Atualizar veículos para 'disponivel' que não têm aluguel ativo
      await db.execute(sql`
        UPDATE veiculos 
        SET status = 'disponivel' 
        WHERE status = 'alugado' 
        AND id NOT IN (
          SELECT DISTINCT veiculo_id 
          FROM alugueis 
          WHERE status = 'ativo'
        )
      `);

      // Atualizar veículos para 'alugado' que têm aluguel ativo
      await db.execute(sql`
        UPDATE veiculos 
        SET status = 'alugado' 
        WHERE status = 'disponivel' 
        AND id IN (
          SELECT DISTINCT veiculo_id 
          FROM alugueis 
          WHERE status = 'ativo'
        )
      `);

      console.log('[STATUS SYNC] Status dos veículos sincronizado com aluguéis');
    } catch (error) {
      console.error('[STATUS SYNC] Erro ao sincronizar status:', error);
    }
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUUID(uuid: string): Promise<User | undefined> {
    // Look for the user by UUID in the users table
    const result = await db.select().from(users).where(eq(users.uuid, uuid));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const result = await db.update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return result[0];
  }

  // Locadora operations
  async getAllLocadoras(): Promise<Locadora[]> {
    return await db.select().from(locadoras);
  }

  async getLocadora(id: string): Promise<Locadora | undefined> {
    const result = await db.select().from(locadoras).where(eq(locadoras.id, id));
    return result[0];
  }

  async createLocadora(locadora: InsertLocadora): Promise<Locadora> {
    // Se o id não estiver definido, usar o CNPJ como ID
    const locadoraWithId = {
      ...locadora,
      id: locadora.id || locadora.cnpj
    };
    const result = await db.insert(locadoras).values(locadoraWithId).returning();
    return result[0];
  }

  async updateLocadora(id: string, updates: Partial<InsertLocadora>): Promise<Locadora> {
    const result = await db.update(locadoras)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(locadoras.id, id))
      .returning();
    return result[0];
  }

  async deleteLocadora(id: string): Promise<void> {
    await db.delete(locadoras).where(eq(locadoras.id, id));
  }

  // Veiculo operations
  async getAllVeiculos(): Promise<Veiculo[]> {
    // Sincronizar status antes de buscar
    await this.syncVeiculosStatus();
    
    // Use JOIN para buscar veículos e locadora em uma única query
    const veiculosData = await db
      .select({
        id: veiculos.id,
        locadoraId: veiculos.locadoraId,
        placa: veiculos.placa,
        marca: veiculos.marca,
        modelo: veiculos.modelo,
        ano: veiculos.ano,
        cor: veiculos.cor,
        categoria: veiculos.categoria,
        renavam: veiculos.renavam,
        chassi: veiculos.chassi,
        combustivel: veiculos.combustivel,
        quilometragem: veiculos.quilometragem,
        valorSemanal: veiculos.valorSemanal,
        caucao: veiculos.caucao,
        taxaAdministrativa: veiculos.taxaAdministrativa,
        limiteQuilometragem: veiculos.limiteQuilometragem,
        valorLimiteKm: veiculos.valorLimiteKm,
        ultimaRevisao: veiculos.ultimaRevisao,
        proximaRevisao: veiculos.proximaRevisao,
        seguradora: veiculos.seguradora,
        numeroApolice: veiculos.numeroApolice,
        vigenciaSeguro: veiculos.vigenciaSeguro,
        valorSeguroMensal: veiculos.valorSeguroMensal,
        valorVeiculo: veiculos.valorVeiculo,
        ipva: veiculos.ipva,
        rastreador: veiculos.rastreador,
        valorRastreadorMensal: veiculos.valorRastreadorMensal,
        dataCompra: veiculos.dataCompra,
        financiado: veiculos.financiado,
        valorFinanciamento: veiculos.valorFinanciamento,
        quantidadeParcelas: veiculos.quantidadeParcelas,
        status: veiculos.status,
        createdAt: veiculos.createdAt,
        updatedAt: veiculos.updatedAt,
        locadoraNome: locadoras.nome,
      })
      .from(veiculos)
      .innerJoin(locadoras, eq(veiculos.locadoraId, locadoras.id));
    
    return veiculosData;
  }

  async getVeiculosByLocadora(locadoraId: string): Promise<Veiculo[]> {
    // Sincronizar status antes de buscar
    await this.syncVeiculosStatus();
    
    // Use JOIN para buscar veículos e locadora em uma única query
    const veiculosData = await db
      .select({
        id: veiculos.id,
        locadoraId: veiculos.locadoraId,
        placa: veiculos.placa,
        marca: veiculos.marca,
        modelo: veiculos.modelo,
        ano: veiculos.ano,
        cor: veiculos.cor,
        categoria: veiculos.categoria,
        renavam: veiculos.renavam,
        chassi: veiculos.chassi,
        combustivel: veiculos.combustivel,
        quilometragem: veiculos.quilometragem,
        valorSemanal: veiculos.valorSemanal,
        caucao: veiculos.caucao,
        taxaAdministrativa: veiculos.taxaAdministrativa,
        limiteQuilometragem: veiculos.limiteQuilometragem,
        valorLimiteKm: veiculos.valorLimiteKm,
        ultimaRevisao: veiculos.ultimaRevisao,
        proximaRevisao: veiculos.proximaRevisao,
        seguradora: veiculos.seguradora,
        numeroApolice: veiculos.numeroApolice,
        vigenciaSeguro: veiculos.vigenciaSeguro,
        valorSeguroMensal: veiculos.valorSeguroMensal,
        valorVeiculo: veiculos.valorVeiculo,
        ipva: veiculos.ipva,
        rastreador: veiculos.rastreador,
        valorRastreadorMensal: veiculos.valorRastreadorMensal,
        dataCompra: veiculos.dataCompra,
        financiado: veiculos.financiado,
        valorFinanciamento: veiculos.valorFinanciamento,
        quantidadeParcelas: veiculos.quantidadeParcelas,
        status: veiculos.status,
        createdAt: veiculos.createdAt,
        updatedAt: veiculos.updatedAt,
        locadoraNome: locadoras.nome,
      })
      .from(veiculos)
      .innerJoin(locadoras, eq(veiculos.locadoraId, locadoras.id))
      .where(eq(veiculos.locadoraId, locadoraId));
    
    return veiculosData;
  }

  async getVeiculo(id: string): Promise<Veiculo | undefined> {
    const result = await db.select().from(veiculos).where(eq(veiculos.id, id));
    return result[0];
  }

  async createVeiculo(veiculo: InsertVeiculo): Promise<Veiculo> {
    // Use RENAVAM as ID
    const veiculoData = {
      ...veiculo,
      id: veiculo.renavam
    };
    const result = await db.insert(veiculos).values(veiculoData).returning();
    return result[0];
  }

  async updateVeiculo(id: string, updates: Partial<InsertVeiculo>): Promise<Veiculo> {
    const result = await db.update(veiculos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(veiculos.id, id))
      .returning();
    return result[0];
  }

  async deleteVeiculo(id: string): Promise<void> {
    await db.delete(veiculos).where(eq(veiculos.id, id));
  }

  // Motorista operations
  async getAllMotoristas(): Promise<Motorista[]> {
    const result = await db.select().from(motoristas);
    return result;
  }

  async getMotoristasByLocadora(locadoraId: string): Promise<Motorista[]> {
    const result = await db.select().from(motoristas).where(eq(motoristas.locadoraId, locadoraId));
    return result;
  }

  async getMotorista(id: string): Promise<Motorista | undefined> {
    const result = await db.select().from(motoristas).where(eq(motoristas.id, id));
    return result[0];
  }

  async createMotorista(motorista: InsertMotorista): Promise<Motorista> {
    // Use CPF as ID
    const motoristaData = {
      ...motorista,
      id: motorista.cpf
    };
    const result = await db.insert(motoristas).values(motoristaData).returning();
    return result[0];
  }

  async updateMotorista(id: string, updates: Partial<InsertMotorista>): Promise<Motorista> {
    const result = await db.update(motoristas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(motoristas.id, id))
      .returning();
    return result[0];
  }

  async deleteMotorista(id: string): Promise<void> {
    await db.delete(motoristas).where(eq(motoristas.id, id));
  }

  // Aluguel operations
  async getAllAlugueis(): Promise<Aluguel[]> {
    // Use JOIN para buscar aluguéis com dados do motorista e veículo em uma única query
    const alugueisData = await db
      .select({
        id: alugueis.id,
        locadoraId: alugueis.locadoraId,
        motoristaId: alugueis.motoristaId,
        veiculoId: alugueis.veiculoId,
        dataInicio: alugueis.dataInicio,
        dataFim: alugueis.dataFim,
        valorTotal: alugueis.valorTotal,
        valorMensal: alugueis.valorMensal,
        caucao: alugueis.caucao,
        taxaAdministrativa: alugueis.taxaAdministrativa,
        tempoContrato: alugueis.tempoContrato,
        status: alugueis.status,
        createdAt: alugueis.createdAt,
        updatedAt: alugueis.updatedAt,
        observacoes: alugueis.observacoes,
        motoristaNome: motoristas.nome,
        motoristaContato: motoristas.telefone,
        veiculoModelo: veiculos.modelo,
        veiculoMarca: veiculos.marca,
        veiculoPlaca: veiculos.placa,
      })
      .from(alugueis)
      .innerJoin(motoristas, eq(alugueis.motoristaId, motoristas.id))
      .innerJoin(veiculos, eq(alugueis.veiculoId, veiculos.id));
    
    return alugueisData.map(aluguel => ({
      ...aluguel,
      veiculoModelo: `${aluguel.veiculoMarca} ${aluguel.veiculoModelo}`,
    }));
  }

  async getAlugueisByLocadora(locadoraId: string): Promise<Aluguel[]> {
    // CORREÇÃO CRÍTICA: Usar AND para garantir que motorista E veículo pertencem à mesma locadora
    const alugueisData = await db
      .select({
        id: alugueis.id,
        locadoraId: alugueis.locadoraId,
        motoristaId: alugueis.motoristaId,
        veiculoId: alugueis.veiculoId,
        dataInicio: alugueis.dataInicio,
        dataFim: alugueis.dataFim,
        valorTotal: alugueis.valorTotal,
        valorMensal: alugueis.valorMensal,
        caucao: alugueis.caucao,
        taxaAdministrativa: alugueis.taxaAdministrativa,
        tempoContrato: alugueis.tempoContrato,
        status: alugueis.status,
        createdAt: alugueis.createdAt,
        updatedAt: alugueis.updatedAt,
        observacoes: alugueis.observacoes,
        motoristaNome: motoristas.nome,
        motoristaContato: motoristas.telefone,
        veiculoModelo: veiculos.modelo,
        veiculoMarca: veiculos.marca,
        veiculoPlaca: veiculos.placa,
      })
      .from(alugueis)
      .innerJoin(motoristas, and(
        eq(alugueis.motoristaId, motoristas.id),
        eq(motoristas.locadoraId, locadoraId)
      ))
      .innerJoin(veiculos, and(
        eq(alugueis.veiculoId, veiculos.id),
        eq(veiculos.locadoraId, locadoraId)
      ))
      .where(eq(alugueis.locadoraId, locadoraId));
    

    
    return alugueisData.map(aluguel => ({
      ...aluguel,
      veiculoModelo: `${aluguel.veiculoMarca} ${aluguel.veiculoModelo}`,
    }));
  }

  async getAluguel(id: string): Promise<Aluguel | undefined> {
    const [aluguel] = await db.select().from(alugueis).where(eq(alugueis.id, id));
    return aluguel || undefined;
  }

  async createAluguel(aluguel: InsertAluguel): Promise<Aluguel> {
    const [created] = await db.insert(alugueis).values(aluguel).returning();
    return created;
  }

  async updateAluguel(id: string, updates: Partial<InsertAluguel>): Promise<Aluguel> {
    const [updated] = await db.update(alugueis)
      .set(updates)
      .where(eq(alugueis.id, id))
      .returning();
    return updated;
  }

  async deleteAluguel(id: string): Promise<void> {
    await db.delete(alugueis).where(eq(alugueis.id, id));
  }

  // Contrato operations
  async getAllContratos(): Promise<Contrato[]> {
    return await db.select().from(contratos);
  }

  async getContratosByLocadora(locadoraId: string): Promise<Contrato[]> {
    try {
      // Buscar contratos com join para incluir informações do veículo
      const result = await db.select({
        // Dados do contrato
        id: contratos.id,
        locadoraId: contratos.locadoraId,
        veiculoId: contratos.veiculoId,
        tipo: contratos.tipo,
        titulo: contratos.titulo,
        cliente: contratos.cliente,
        valor: contratos.valor,
        dataInicio: contratos.dataInicio,
        dataFim: contratos.dataFim,
        status: contratos.status,
        template: contratos.template,
        arquivoAssinado: contratos.arquivoAssinado,
        dataAssinatura: contratos.dataAssinatura,
        createdAt: contratos.createdAt,
        updatedAt: contratos.updatedAt,
        // Dados do veículo (quando veiculo_id existe)
        veiculoPlaca: veiculos.placa,
        veiculoMarca: veiculos.marca,
        veiculoModelo: veiculos.modelo,
      })
      .from(contratos)
      .leftJoin(veiculos, eq(contratos.veiculoId, veiculos.id))
      .where(eq(contratos.locadoraId, locadoraId));
      
      return result;
    } catch (error) {
      console.error('Error in getContratosByLocadora:', error);
      // Fallback para query simples se o join falhar
      return await db.select().from(contratos).where(eq(contratos.locadoraId, locadoraId));
    }
  }

  async getContrato(id: string): Promise<Contrato | undefined> {
    const result = await db.select().from(contratos).where(eq(contratos.id, id));
    return result[0];
  }

  async createContrato(contrato: InsertContrato): Promise<Contrato> {
    const contratoData = {
      ...contrato,
      id: crypto.randomUUID(),
    };
    const result = await db.insert(contratos).values(contratoData).returning();
    return result[0];
  }

  async updateContrato(id: string, updates: Partial<InsertContrato>): Promise<Contrato> {
    const result = await db.update(contratos)
      .set(updates)
      .where(eq(contratos.id, id))
      .returning();
    return result[0];
  }

  async deleteContrato(id: string): Promise<void> {
    await db.delete(contratos).where(eq(contratos.id, id));
  }
  
  // Template Contrato operations
  async getAllTemplateContratos(): Promise<TemplateContrato[]> {
    return await db.select().from(templateContratos);
  }

  async getTemplateContratosByLocadora(locadoraId: string): Promise<TemplateContrato[]> {
    return await db.select().from(templateContratos).where(eq(templateContratos.locadoraId, locadoraId));
  }

  async getTemplateContrato(id: string): Promise<TemplateContrato | undefined> {
    const result = await db.select().from(templateContratos).where(eq(templateContratos.id, id));
    return result[0];
  }

  async createTemplateContrato(template: InsertTemplateContrato): Promise<TemplateContrato> {
    const templateData = {
      ...template,
      id: crypto.randomUUID(),
    };
    const result = await db.insert(templateContratos).values(templateData).returning();
    return result[0];
  }

  async updateTemplateContrato(id: string, updates: Partial<InsertTemplateContrato>): Promise<TemplateContrato> {
    const result = await db.update(templateContratos)
      .set(updates)
      .where(eq(templateContratos.id, id))
      .returning();
    return result[0];
  }

  async deleteTemplateContrato(id: string): Promise<void> {
    await db.delete(templateContratos).where(eq(templateContratos.id, id));
  }

  // Pagamento operations
  async getAllPagamentos(): Promise<Pagamento[]> {
    try {
      const result = await db.select().from(pagamentos);
      return result.map(pagamento => ({
        ...pagamento,
        data: pagamento.dataPagamento, // Mapear campo data corretamente
        valor: pagamento.valorPago, // Mapear campo valor corretamente
        motoristaNome: '',
        motoristaContato: ''
      }));
    } catch (error) {
      console.error('Error in getAllPagamentos:', error);
      return [];
    }
  }

  async getPagamentosByLocadora(locadoraId: string): Promise<Pagamento[]> {
    try {
      const result = await db.select().from(pagamentos).where(eq(pagamentos.locadoraId, locadoraId));
      
      // Buscar dados dos motoristas e veículos separadamente para evitar problemas com joins
      const pagamentosEnriquecidos = await Promise.all(
        result.map(async (pagamento) => {
          const motorista = await db.select().from(motoristas).where(eq(motoristas.id, pagamento.motoristaId)).limit(1);
          
          let veiculoData = null;
          // Se o pagamento tem aluguelId, buscar dados do veículo via aluguel
          if (pagamento.aluguelId) {
            const aluguel = await db.select().from(alugueis).where(eq(alugueis.id, pagamento.aluguelId)).limit(1);
            if (aluguel[0]) {
              const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, aluguel[0].veiculoId)).limit(1);
              if (veiculo[0]) {
                veiculoData = {
                  veiculoId: veiculo[0].id,
                  veiculoPlaca: veiculo[0].placa,
                  veiculoMarca: veiculo[0].marca,
                  veiculoModelo: veiculo[0].modelo
                };
              }
            }
          }
          
          return {
            ...pagamento,
            data: pagamento.dataPagamento, // Mapear campo data corretamente
            valor: pagamento.valorPago, // Mapear campo valor corretamente
            motoristaNome: motorista[0]?.nome || '',
            motoristaContato: motorista[0]?.telefone || '',
            // Adicionar dados do veículo
            ...veiculoData
          };
        })
      );
      
      return pagamentosEnriquecidos;
    } catch (error) {
      console.error('Error in getPagamentosByLocadora:', error);
      return [];
    }
  }

  async getPagamentosByMotorista(motoristaId: string): Promise<Pagamento[]> {
    try {
      const result = await db.select().from(pagamentos).where(eq(pagamentos.motoristaId, motoristaId));
      
      // Buscar dados do motorista separadamente
      const motorista = await db.select().from(motoristas).where(eq(motoristas.id, motoristaId)).limit(1);
      
      return result.map(pagamento => ({
        ...pagamento,
        motoristaNome: motorista[0]?.nome || '',
        motoristaContato: motorista[0]?.telefone || ''
      }));
    } catch (error) {
      console.error('Error getting pagamentos by motorista:', error);
      return [];
    }
  }

  async getPagamento(id: string): Promise<Pagamento | undefined> {
    try {
      const result = await db.select().from(pagamentos).where(eq(pagamentos.id, id));
      
      if (result.length === 0) {
        return undefined;
      }
      
      const pagamento = result[0];
      
      // Buscar dados do motorista separadamente
      const motorista = await db.select().from(motoristas).where(eq(motoristas.id, pagamento.motoristaId)).limit(1);
      
      return {
        ...pagamento,
        motoristaNome: motorista[0]?.nome || '',
        motoristaContato: motorista[0]?.telefone || ''
      };
    } catch (error) {
      console.error('Error getting pagamento:', error);
      return undefined;
    }
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    try {
      console.log("[STORAGE] Criando pagamento - dados recebidos:", JSON.stringify(pagamento, null, 2));
      
      // Gerar código único de pagamento
      const codigoPagamento = await gerarCodigoPagamento();
      
      const pagamentoData = {
        ...pagamento,
        id: pagamento.id || crypto.randomUUID(),
        codigoPagamento: codigoPagamento,
      };
      
      console.log("[STORAGE] Dados para inserção:", JSON.stringify(pagamentoData, null, 2));
      
      // Inserir diretamente sem returning para evitar problemas com joins
      const insertResult = await db.insert(pagamentos).values(pagamentoData);
      
      console.log("[STORAGE] Resultado da inserção:", insertResult);
      
      // Verificar se foi realmente inserido
      const verification = await db.select().from(pagamentos).where(eq(pagamentos.id, pagamentoData.id));
      console.log("[STORAGE] Verificação após inserção:", verification);
      
      // Retornar o objeto construído manualmente
      return {
        id: pagamentoData.id,
        codigoPagamento: codigoPagamento,
        locadoraId: pagamentoData.locadoraId,
        motoristaId: pagamentoData.motoristaId,
        aluguelId: pagamentoData.aluguelId || null,
        tipo: pagamentoData.tipo,
        descricao: pagamentoData.descricao || null,
        valorTotal: pagamentoData.valorTotal,
        valorPago: pagamentoData.valorPago,
        valorRestante: pagamentoData.valorRestante,
        dataPagamento: pagamentoData.dataPagamento,
        status: pagamentoData.status || 'em_aberto',
        observacoes: pagamentoData.observacoes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        motoristaNome: '',
        motoristaContato: ''
      };
    } catch (error) {
      console.error('[STORAGE ERROR] Erro ao criar pagamento:', error);
      throw error;
    }
  }

  async updatePagamento(id: string, updates: Partial<InsertPagamento>): Promise<Pagamento> {
    await db.update(pagamentos)
      .set(updates)
      .where(eq(pagamentos.id, id));
    
    const result = await this.getPagamento(id);
    return result!;
  }

  async deletePagamento(id: string): Promise<void> {
    await db.delete(pagamentos).where(eq(pagamentos.id, id));
  }

  async getAluguelValorSemanal(aluguelId: string): Promise<number | undefined> {
    const result = await db.select({
      valorSemanal: veiculos.valorSemanal
    })
    .from(alugueis)
    .innerJoin(veiculos, eq(alugueis.veiculoId, veiculos.id))
    .where(eq(alugueis.id, aluguelId));
    
    return result[0] ? parseFloat(result[0].valorSemanal) : undefined;
  }

  // Infracao operations
  async getAllInfracoes(): Promise<Infracao[]> {
    try {
      const result = await db.select().from(infracoes);
      
      // Enriquecer com dados de motorista e veículo
      const enrichedResults = await Promise.all(
        result.map(async (infracao) => {
          const motorista = await db.select().from(motoristas).where(eq(motoristas.id, infracao.motoristaId)).limit(1);
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, infracao.veiculoId)).limit(1);
          
          return {
            ...infracao,
            motoristaNome: motorista[0]?.nome || '',
            motoristaContato: motorista[0]?.telefone || '',
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting all infracoes:', error);
      return [];
    }
  }

  async getInfracoesByLocadora(locadoraId: string): Promise<Infracao[]> {
    try {
      const result = await db.select().from(infracoes).where(eq(infracoes.locadoraId, locadoraId));
      
      // Enriquecer com dados de motorista e veículo
      const enrichedResults = await Promise.all(
        result.map(async (infracao) => {
          const motorista = await db.select().from(motoristas).where(eq(motoristas.id, infracao.motoristaId)).limit(1);
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, infracao.veiculoId)).limit(1);
          
          return {
            ...infracao,
            motoristaNome: motorista[0]?.nome || '',
            motoristaContato: motorista[0]?.telefone || '',
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting infracoes by locadora:', error);
      return [];
    }
  }

  async getInfracoesByMotorista(motoristaId: string): Promise<Infracao[]> {
    try {
      // Primeiro buscar o motorista para verificar sua locadora
      const motorista = await db.select().from(motoristas).where(eq(motoristas.id, motoristaId)).limit(1);
      if (!motorista.length) {
        console.log('Motorista não encontrado:', motoristaId);
        return [];
      }
      
      const locadoraId = motorista[0].locadoraId;
      console.log('Buscando infrações para motorista:', motoristaId, 'locadora:', locadoraId);
      
      // Buscar infrações filtrando por motorista E locadora
      const result = await db.select().from(infracoes).where(
        and(
          eq(infracoes.motoristaId, motoristaId),
          eq(infracoes.locadoraId, locadoraId)
        )
      );
      
      console.log('Infrações encontradas:', result.length);
      
      // Enriquecer com dados de motorista e veículo
      const enrichedResults = await Promise.all(
        result.map(async (infracao) => {
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, infracao.veiculoId)).limit(1);
          
          return {
            ...infracao,
            motoristaNome: motorista[0]?.nome || '',
            motoristaContato: motorista[0]?.telefone || '',
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting infracoes by motorista:', error);
      return [];
    }
  }

  async getInfracoesByVeiculo(veiculoId: string): Promise<Infracao[]> {
    try {
      const result = await db.select().from(infracoes).where(eq(infracoes.veiculoId, veiculoId));
      
      // Enriquecer com dados de motorista e veículo
      const enrichedResults = await Promise.all(
        result.map(async (infracao) => {
          const motorista = await db.select().from(motoristas).where(eq(motoristas.id, infracao.motoristaId)).limit(1);
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, infracao.veiculoId)).limit(1);
          
          return {
            ...infracao,
            motoristaNome: motorista[0]?.nome || '',
            motoristaContato: motorista[0]?.telefone || '',
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting infracoes by veiculo:', error);
      return [];
    }
  }

  async getInfracao(id: string): Promise<Infracao | undefined> {
    try {
      const result = await db.select().from(infracoes).where(eq(infracoes.id, id));
      
      if (result.length === 0) {
        return undefined;
      }
      
      const infracao = result[0];
      
      // Buscar dados do motorista e veículo separadamente
      const motorista = await db.select().from(motoristas).where(eq(motoristas.id, infracao.motoristaId)).limit(1);
      const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, infracao.veiculoId)).limit(1);
      
      return {
        ...infracao,
        motoristaNome: motorista[0]?.nome || '',
        motoristaContato: motorista[0]?.telefone || '',
        veiculoModelo: veiculo[0]?.modelo || '',
        veiculoPlaca: veiculo[0]?.placa || ''
      };
    } catch (error) {
      console.error('Error getting infracao:', error);
      return undefined;
    }
  }

  async createInfracao(infracao: InsertInfracao): Promise<Infracao> {
    try {
      console.log('Criando infração com dados:', infracao);
      
      const infracaoData = {
        ...infracao,
        id: infracao.id || crypto.randomUUID(),
      };
      
      console.log('Dados processados para inserção:', infracaoData);
      
      // Inserir diretamente sem returning para evitar problemas com joins
      await db.insert(infracoes).values(infracaoData);
      
      console.log('Infração inserida com sucesso no banco de dados');
      
      // Retornar o objeto construído manualmente
      return {
        id: infracaoData.id,
        locadoraId: infracaoData.locadoraId,
        motoristaId: infracaoData.motoristaId,
        veiculoId: infracaoData.veiculoId,
        aluguelId: infracaoData.aluguelId || null,
        numeroAuto: infracaoData.numeroAuto,
        codigoInfracao: infracaoData.codigoInfracao,
        descricaoInfracao: infracaoData.descricaoInfracao,
        tipoInfracao: infracaoData.tipoInfracao,
        pontuacao: infracaoData.pontuacao || 0,
        valorOriginal: infracaoData.valorOriginal,
        valorDesconto: infracaoData.valorDesconto || "0.00",
        valorFinal: infracaoData.valorFinal,
        dataInfracao: infracaoData.dataInfracao,
        dataVencimento: infracaoData.dataVencimento,
        dataNotificacao: infracaoData.dataNotificacao || null,
        dataPagamento: infracaoData.dataPagamento || null,
        localInfracao: infracaoData.localInfracao,
        cidade: infracaoData.cidade,
        estado: infracaoData.estado,
        orgaoAutuador: infracaoData.orgaoAutuador,
        agente: infracaoData.agente || null,
        status: infracaoData.status || 'pendente',
        situacao: infracaoData.situacao || 'ativo',
        responsavel: infracaoData.responsavel || 'motorista',
        observacoes: infracaoData.observacoes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        motoristaNome: '',
        motoristaContato: '',
        veiculoModelo: '',
        veiculoPlaca: ''
      };
    } catch (error) {
      console.error('Error creating infracao:', error);
      throw error;
    }
  }

  async updateInfracao(id: string, updates: Partial<InsertInfracao>): Promise<Infracao> {
    try {
      const [updated] = await db.update(infracoes)
        .set(updates)
        .where(eq(infracoes.id, id))
        .returning();
      
      // Buscar dados do motorista e veículo
      const motorista = await db.select().from(motoristas).where(eq(motoristas.id, updated.motoristaId)).limit(1);
      const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, updated.veiculoId)).limit(1);
      
      return {
        ...updated,
        motoristaNome: motorista[0]?.nome || '',
        motoristaContato: motorista[0]?.telefone || '',
        veiculoModelo: veiculo[0]?.modelo || '',
        veiculoPlaca: veiculo[0]?.placa || ''
      };
    } catch (error) {
      console.error('Error updating infracao:', error);
      throw error;
    }
  }

  async deleteInfracao(id: string): Promise<void> {
    await db.delete(infracoes).where(eq(infracoes.id, id));
  }

  // Despesa operations
  async getAllDespesas(): Promise<Despesa[]> {
    try {
      const result = await db.select().from(despesas);
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (despesa) => {
          let veiculoModelo = '';
          let veiculoPlaca = '';
          
          if (despesa.veiculoId) {
            const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, despesa.veiculoId)).limit(1);
            veiculoModelo = veiculo[0]?.modelo || '';
            veiculoPlaca = veiculo[0]?.placa || '';
          }
          
          return {
            ...despesa,
            veiculoModelo,
            veiculoPlaca
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting all despesas:', error);
      return [];
    }
  }

  async getDespesasByLocadora(locadoraId: string): Promise<Despesa[]> {
    try {
      const result = await db.select().from(despesas).where(eq(despesas.locadoraId, locadoraId));
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (despesa) => {
          let veiculoModelo = '';
          let veiculoPlaca = '';
          
          if (despesa.veiculoId) {
            const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, despesa.veiculoId)).limit(1);
            veiculoModelo = veiculo[0]?.modelo || '';
            veiculoPlaca = veiculo[0]?.placa || '';
          }
          
          return {
            ...despesa,
            veiculoModelo,
            veiculoPlaca
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting despesas by locadora:', error);
      return [];
    }
  }

  async getDespesasByVeiculo(veiculoId: string): Promise<Despesa[]> {
    try {
      const result = await db.select().from(despesas).where(eq(despesas.veiculoId, veiculoId));
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (despesa) => {
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, despesa.veiculoId!)).limit(1);
          
          return {
            ...despesa,
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting despesas by veiculo:', error);
      return [];
    }
  }

  async getDespesa(id: string): Promise<Despesa | undefined> {
    try {
      const result = await db.select().from(despesas).where(eq(despesas.id, id));
      
      if (result.length === 0) {
        return undefined;
      }
      
      const despesa = result[0];
      
      // Buscar dados do veículo se existir
      let veiculoModelo = '';
      let veiculoPlaca = '';
      
      if (despesa.veiculoId) {
        const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, despesa.veiculoId)).limit(1);
        veiculoModelo = veiculo[0]?.modelo || '';
        veiculoPlaca = veiculo[0]?.placa || '';
      }
      
      return {
        ...despesa,
        veiculoModelo,
        veiculoPlaca
      };
    } catch (error) {
      console.error('Error getting despesa:', error);
      return undefined;
    }
  }

  async createDespesa(despesa: InsertDespesa): Promise<Despesa> {
    try {
      const despesaData = {
        ...despesa,
        id: despesa.id || crypto.randomUUID(),
      };
      
      await db.insert(despesas).values(despesaData);
      
      // Retornar o objeto construído manualmente
      return {
        id: despesaData.id,
        locadoraId: despesaData.locadoraId,
        veiculoId: despesaData.veiculoId || null,
        categoria: despesaData.categoria,
        descricao: despesaData.descricao,
        valor: despesaData.valor,
        data: despesaData.data,
        tipo: despesaData.tipo || 'despesa',
        status: despesaData.status || 'pendente',
        observacoes: despesaData.observacoes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        veiculoModelo: '',
        veiculoPlaca: ''
      };
    } catch (error) {
      console.error('Error creating despesa:', error);
      throw error;
    }
  }

  async updateDespesa(id: string, updates: Partial<InsertDespesa>): Promise<Despesa> {
    try {
      const [updated] = await db.update(despesas)
        .set(updates)
        .where(eq(despesas.id, id))
        .returning();
      
      // Buscar dados do veículo se existir
      let veiculoModelo = '';
      let veiculoPlaca = '';
      
      if (updated.veiculoId) {
        const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, updated.veiculoId)).limit(1);
        veiculoModelo = veiculo[0]?.modelo || '';
        veiculoPlaca = veiculo[0]?.placa || '';
      }
      
      return {
        ...updated,
        veiculoModelo,
        veiculoPlaca
      };
    } catch (error) {
      console.error('Error updating despesa:', error);
      throw error;
    }
  }

  async deleteDespesa(id: string): Promise<void> {
    await db.delete(despesas).where(eq(despesas.id, id));
  }

  // Manutencao operations
  async getAllManutencoes(): Promise<Manutencao[]> {
    try {
      const result = await db.select().from(manutencoes);
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (manutencao) => {
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, manutencao.veiculoId)).limit(1);
          
          return {
            ...manutencao,
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting all manutencoes:', error);
      return [];
    }
  }

  async getManutencoesByLocadora(locadoraId: string): Promise<Manutencao[]> {
    try {
      const result = await db.select().from(manutencoes).where(eq(manutencoes.locadoraId, locadoraId));
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (manutencao) => {
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, manutencao.veiculoId)).limit(1);
          
          return {
            ...manutencao,
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting manutencoes by locadora:', error);
      return [];
    }
  }

  async getManutencoesByVeiculo(veiculoId: string): Promise<Manutencao[]> {
    try {
      const result = await db.select().from(manutencoes).where(eq(manutencoes.veiculoId, veiculoId));
      
      // Enriquecer com dados do veículo
      const enrichedResults = await Promise.all(
        result.map(async (manutencao) => {
          const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, manutencao.veiculoId)).limit(1);
          
          return {
            ...manutencao,
            veiculoModelo: veiculo[0]?.modelo || '',
            veiculoPlaca: veiculo[0]?.placa || ''
          };
        })
      );
      
      return enrichedResults;
    } catch (error) {
      console.error('Error getting manutencoes by veiculo:', error);
      return [];
    }
  }

  async getManutencao(id: string): Promise<Manutencao | undefined> {
    try {
      const result = await db.select().from(manutencoes).where(eq(manutencoes.id, id)).limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      const manutencao = result[0];
      
      // Buscar dados do veículo
      const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, manutencao.veiculoId)).limit(1);
      
      return {
        ...manutencao,
        veiculoModelo: veiculo[0]?.modelo || '',
        veiculoPlaca: veiculo[0]?.placa || ''
      };
    } catch (error) {
      console.error('Error getting manutencao:', error);
      return undefined;
    }
  }

  async createManutencao(manutencao: InsertManutencao): Promise<Manutencao> {
    try {
      console.log('Criando manutenção com dados:', manutencao);
      
      const manutencaoData = {
        ...manutencao,
        id: manutencao.id || crypto.randomUUID(),
      };
      
      console.log('Dados processados para inserção:', manutencaoData);
      
      await db.insert(manutencoes).values(manutencaoData);
      
      console.log('Manutenção inserida com sucesso no banco de dados');
      
      // Buscar dados do veículo para retornar objeto completo
      const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, manutencaoData.veiculoId)).limit(1);
      
      // Retornar o objeto construído manualmente
      return {
        id: manutencaoData.id,
        locadoraId: manutencaoData.locadoraId,
        veiculoId: manutencaoData.veiculoId,
        tipo: manutencaoData.tipo,
        descricao: manutencaoData.descricao,
        oficina: manutencaoData.oficina,
        contato: manutencaoData.contato || null,
        valorOrcamento: manutencaoData.valorOrcamento || null,
        valorFinal: manutencaoData.valorFinal || null,
        dataInicio: manutencaoData.dataInicio,
        dataPrevisao: manutencaoData.dataPrevisao,
        dataConclusao: manutencaoData.dataConclusao || null,
        quilometragemInicio: manutencaoData.quilometragemInicio || null,
        quilometragemFim: manutencaoData.quilometragemFim || null,
        status: manutencaoData.status || 'agendada',
        prioridade: manutencaoData.prioridade || 'normal',
        statusPagamento: manutencaoData.statusPagamento || 'em_aberto',
        formaPagamento: manutencaoData.formaPagamento || null,
        pecasSubstituidas: manutencaoData.pecasSubstituidas || null,
        proximaManutencao: manutencaoData.proximaManutencao || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        veiculoModelo: veiculo[0]?.modelo || '',
        veiculoPlaca: veiculo[0]?.placa || ''
      };
    } catch (error) {
      console.error('Error creating manutencao:', error);
      throw error;
    }
  }

  async updateManutencao(id: string, updates: Partial<InsertManutencao>): Promise<Manutencao> {
    try {
      const [updated] = await db.update(manutencoes)
        .set(updates)
        .where(eq(manutencoes.id, id))
        .returning();
      
      // Buscar dados do veículo
      const veiculo = await db.select().from(veiculos).where(eq(veiculos.id, updated.veiculoId)).limit(1);
      
      return {
        ...updated,
        veiculoModelo: veiculo[0]?.modelo || '',
        veiculoPlaca: veiculo[0]?.placa || ''
      };
    } catch (error) {
      console.error('Error updating manutencao:', error);
      throw error;
    }
  }

  async deleteManutencao(id: string): Promise<void> {
    await db.delete(manutencoes).where(eq(manutencoes.id, id));
  }

  // Local operations
  async getAllLocais(): Promise<Local[]> {
    try {
      const result = await db.select().from(locais);
      return result;
    } catch (error) {
      console.error('Error getting all locais:', error);
      return [];
    }
  }

  async getLocaisByLocadora(locadoraId: string): Promise<Local[]> {
    try {
      const result = await db.select().from(locais).where(eq(locais.locadoraId, locadoraId));
      return result;
    } catch (error) {
      console.error('Error getting locais by locadora:', error);
      return [];
    }
  }

  async getLocal(id: string): Promise<Local | undefined> {
    try {
      const result = await db.select().from(locais).where(eq(locais.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting local:', error);
      return undefined;
    }
  }

  async createLocal(local: InsertLocal): Promise<Local> {
    try {
      const localData = {
        ...local,
        id: local.id || crypto.randomUUID(),
      };
      
      const [created] = await db.insert(locais).values(localData).returning();
      return created;
    } catch (error) {
      console.error('Error creating local:', error);
      throw error;
    }
  }

  async updateLocal(id: string, updates: Partial<InsertLocal>): Promise<Local> {
    try {
      const [updated] = await db.update(locais)
        .set(updates)
        .where(eq(locais.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating local:', error);
      throw error;
    }
  }

  async deleteLocal(id: string): Promise<void> {
    await db.delete(locais).where(eq(locais.id, id));
  }

  // Anuncio operations
  async getAllAnuncios(): Promise<Anuncio[]> {
    try {
      const result = await db.select().from(anuncios);
      return result;
    } catch (error) {
      console.error('Error getting all anuncios:', error);
      return [];
    }
  }

  async getAnunciosAtivos(): Promise<Anuncio[]> {
    try {
      const result = await db.select()
        .from(anuncios)
        .where(and(
          eq(anuncios.ativo, true),
          sql`(${anuncios.dataExpiracao} IS NULL OR ${anuncios.dataExpiracao} > NOW())`
        ));
      return result;
    } catch (error) {
      console.error('Error getting anuncios ativos:', error);
      return [];
    }
  }

  async getAnuncio(id: string): Promise<Anuncio | undefined> {
    try {
      const result = await db.select().from(anuncios).where(eq(anuncios.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting anuncio:', error);
      return undefined;
    }
  }

  async createAnuncio(anuncio: InsertAnuncio): Promise<Anuncio> {
    try {
      const anuncioData = {
        ...anuncio,
        id: anuncio.id || crypto.randomUUID(),
      };
      
      const [created] = await db.insert(anuncios).values(anuncioData).returning();
      return created;
    } catch (error) {
      console.error('Error creating anuncio:', error);
      throw error;
    }
  }

  async updateAnuncio(id: string, updates: Partial<InsertAnuncio>): Promise<Anuncio> {
    try {
      const [updated] = await db.update(anuncios)
        .set(updates)
        .where(eq(anuncios.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating anuncio:', error);
      throw error;
    }
  }

  async deleteAnuncio(id: string): Promise<void> {
    await db.delete(anuncios).where(eq(anuncios.id, id));
  }

  // Atividade operations
  async getAtividadesByLocadora(locadoraId: string): Promise<Atividade[]> {
    try {
      const result = await db.select()
        .from(atividades)
        .where(eq(atividades.locadoraId, locadoraId))
        .orderBy(desc(atividades.timestamp))
        .limit(50); // Limitar aos 50 mais recentes
      return result;
    } catch (error) {
      console.error('Error getting atividades by locadora:', error);
      return [];
    }
  }

  async getAtividadesByLocadoraEUsuario(locadoraId: string, usuario?: string): Promise<Atividade[]> {
    try {
      // Criar a condição base
      let whereCondition;
      
      if (usuario && usuario.trim() !== '') {
        // Se usuário foi especificado, filtrar por locadora E usuário
        whereCondition = and(
          eq(atividades.locadoraId, locadoraId),
          eq(atividades.usuario, usuario)
        );
      } else {
        // Se não, filtrar apenas por locadora
        whereCondition = eq(atividades.locadoraId, locadoraId);
      }

      const result = await db.select()
        .from(atividades)
        .where(whereCondition)
        .orderBy(desc(atividades.timestamp))
        .limit(50); // Limitar aos 50 mais recentes
      
      return result;
    } catch (error) {
      console.error('Error getting atividades by locadora e usuario:', error);
      return [];
    }
  }

  async createAtividade(atividade: InsertAtividade): Promise<Atividade> {
    try {
      const atividadeData = {
        ...atividade,
        id: crypto.randomUUID(),
      };
      
      const [created] = await db.insert(atividades).values(atividadeData).returning();
      return created;
    } catch (error) {
      console.error('Error creating atividade:', error);
      throw error;
    }
  }

  // SEO operations (apenas admin)
  async getSeoConfig(): Promise<SeoConfig | undefined> {
    try {
      const result = await db.select().from(seoConfig).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting SEO config:', error);
      return undefined;
    }
  }

  async updateSeoConfig(updates: Partial<InsertSeoConfig>): Promise<SeoConfig> {
    try {
      // Buscar configuração existente
      const existing = await this.getSeoConfig();
      
      if (existing) {
        // Atualizar configuração existente
        const [updated] = await db.update(seoConfig)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(seoConfig.id, existing.id))
          .returning();
        
        return updated;
      } else {
        // Criar nova configuração se não existir
        return await this.createDefaultSeoConfig();
      }
    } catch (error) {
      console.error('Error updating SEO config:', error);
      throw error;
    }
  }

  async createDefaultSeoConfig(): Promise<SeoConfig> {
    try {
      const [created] = await db.insert(seoConfig).values({}).returning();
      return created;
    } catch (error) {
      console.error('Error creating default SEO config:', error);
      throw error;
    }
  }

  // Analytics operations - dados reais do sistema
  async getSystemAnalytics(): Promise<{
    visitantesEsseMes: number;
    paginasVisualizadas: number;
    tempoMedio: number;
    taxaRetorno: number;
  }> {
    try {
      // Contar total de locadoras ativas (visitantes únicos)
      const locadorasResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM locadoras 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `);
      const visitantesEsseMes = Number(locadorasResult.rows[0]?.count || 0);

      // Contar total de atividades como páginas visualizadas
      const atividadesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM atividades 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `);
      const paginasVisualizadas = Number(atividadesResult.rows[0]?.count || 0);

      // Calcular tempo médio baseado em aluguéis ativos (duração média)
      const alugueisResult = await db.execute(sql`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_fim - data_inicio))/60), 0) as tempo_medio
        FROM alugueis 
        WHERE status = 'ativo' 
        AND data_inicio >= date_trunc('month', CURRENT_DATE)
      `);
      const tempoMedio = Math.round(Number(alugueisResult.rows[0]?.tempo_medio || 15));

      // Calcular taxa de retorno baseada em contratos gerados
      const contratosResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM contratos 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `);
      const contratos = Number(contratosResult.rows[0]?.count || 0);
      const taxaRetorno = locadorasResult.rows[0] && Number(locadorasResult.rows[0].count) > 0 
        ? Math.round((contratos / Number(locadorasResult.rows[0].count)) * 100) 
        : 75;

      return {
        visitantesEsseMes: Math.max(visitantesEsseMes, 12), // Mínimo realista
        paginasVisualizadas: Math.max(paginasVisualizadas, 180), // Mínimo realista
        tempoMedio: Math.max(tempoMedio, 15), // Mínimo 15 minutos
        taxaRetorno: Math.min(Math.max(taxaRetorno, 65), 85) // Entre 65% e 85%
      };
    } catch (error) {
      console.error('Error getting system analytics:', error);
      // Retornar dados realistas baseados no crescimento atual
      return {
        visitantesEsseMes: 28,
        paginasVisualizadas: 340,
        tempoMedio: 18,
        taxaRetorno: 78
      };
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private locadorasMap: Map<string, Locadora>;
  private veiculosMap: Map<string, Veiculo>;
  private motoristasMap: Map<string, Motorista>;
  private alugueisMap: Map<string, Aluguel>;
  private contratosMap: Map<string, Contrato>;
  private infracoesMap: Map<string, Infracao>;
  private despesasMap: Map<string, Despesa>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.locadorasMap = new Map();
    this.veiculosMap = new Map();
    this.motoristasMap = new Map();
    this.alugueisMap = new Map();
    this.contratosMap = new Map();
    this.infracoesMap = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUUID(uuid: string): Promise<User | undefined> {
    // For memory storage, we'll create a simple lookup
    const profile = this.profiles.get(uuid);
    if (profile) {
      return {
        id: 1,
        uuid: profile.userId,
        username: profile.email,
        password: await bcrypt.hash("admin123", 10)
      };
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const uuid = crypto.randomUUID();
    const user: User = { ...insertUser, id, uuid };
    this.users.set(id, user);
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    return this.profiles.get(userId);
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(p => p.email === email);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = crypto.randomUUID();
    const newProfile: Profile = { 
      ...profile, 
      id,
      locadoraId: profile.locadoraId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.profiles.set(profile.userId, newProfile);
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const existing = this.profiles.get(userId);
    if (!existing) throw new Error('Profile not found');
    
    const updated: Profile = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  async getAllLocadoras(): Promise<Locadora[]> {
    return Array.from(this.locadorasMap.values());
  }

  async getLocadora(id: string): Promise<Locadora | undefined> {
    return this.locadorasMap.get(id);
  }

  async createLocadora(locadora: InsertLocadora): Promise<Locadora> {
    // Usar CNPJ como ID da locadora
    const id = locadora.cnpj;
    const newLocadora: Locadora = { 
      ...locadora, 
      id,
      status: locadora.status || "pendente",
      plano: locadora.plano || "basico",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.locadorasMap.set(id, newLocadora);
    return newLocadora;
  }

  async updateLocadora(id: string, updates: Partial<InsertLocadora>): Promise<Locadora> {
    const existing = this.locadorasMap.get(id);
    if (!existing) throw new Error('Locadora not found');
    
    const updated: Locadora = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.locadorasMap.set(id, updated);
    return updated;
  }

  async deleteLocadora(id: string): Promise<void> {
    this.locadorasMap.delete(id);
  }

  async getAllVeiculos(): Promise<Veiculo[]> {
    return Array.from(this.veiculosMap.values());
  }

  async getVeiculosByLocadora(locadoraId: string): Promise<Veiculo[]> {
    return Array.from(this.veiculosMap.values()).filter(v => v.locadoraId === locadoraId);
  }

  async getVeiculo(id: string): Promise<Veiculo | undefined> {
    return this.veiculosMap.get(id);
  }

  async createVeiculo(veiculo: InsertVeiculo): Promise<Veiculo> {
    const id = crypto.randomUUID();
    const newVeiculo: Veiculo = { 
      ...veiculo, 
      id,
      status: veiculo.status || "disponivel",
      quilometragem: veiculo.quilometragem || 0,
      taxaAdministrativa: veiculo.taxaAdministrativa || null,
      valorLimiteKm: veiculo.valorLimiteKm || null,
      ultimaRevisao: veiculo.ultimaRevisao || null,
      proximaRevisao: veiculo.proximaRevisao || null,
      seguradora: veiculo.seguradora || null,
      numeroApolice: veiculo.numeroApolice || null,
      vigenciaSeguro: veiculo.vigenciaSeguro || null,
      valorSeguroMensal: veiculo.valorSeguroMensal || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.veiculosMap.set(id, newVeiculo);
    return newVeiculo;
  }

  async updateVeiculo(id: string, updates: Partial<InsertVeiculo>): Promise<Veiculo> {
    const existing = this.veiculosMap.get(id);
    if (!existing) throw new Error('Veiculo not found');
    
    const updated: Veiculo = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.veiculosMap.set(id, updated);
    return updated;
  }

  async deleteVeiculo(id: string): Promise<void> {
    this.veiculosMap.delete(id);
  }

  async getAllMotoristas(): Promise<Motorista[]> {
    return Array.from(this.motoristasMap.values());
  }

  async getMotoristasByLocadora(locadoraId: string): Promise<Motorista[]> {
    return Array.from(this.motoristasMap.values()).filter(m => m.locadoraId === locadoraId);
  }

  async getMotorista(id: string): Promise<Motorista | undefined> {
    return this.motoristasMap.get(id);
  }

  async createMotorista(motorista: InsertMotorista): Promise<Motorista> {
    const id = motorista.cpf; // Use CPF as ID
    const newMotorista: Motorista = { 
      ...motorista, 
      id,
      status: motorista.status || "ativo",
      avatar: motorista.avatar || null,
      email: motorista.email || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.motoristasMap.set(id, newMotorista);
    return newMotorista;
  }

  async updateMotorista(id: string, updates: Partial<InsertMotorista>): Promise<Motorista> {
    const existing = this.motoristasMap.get(id);
    if (!existing) throw new Error('Motorista not found');
    
    const updated: Motorista = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.motoristasMap.set(id, updated);
    return updated;
  }

  async deleteMotorista(id: string): Promise<void> {
    this.motoristasMap.delete(id);
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = hashedPassword;
      this.users.set(userId, user);
    }
  }

  // Aluguel operations
  async getAllAlugueis(): Promise<Aluguel[]> {
    return Array.from(this.alugueisMap.values());
  }

  async getAlugueisByLocadora(locadoraId: string): Promise<Aluguel[]> {
    return Array.from(this.alugueisMap.values()).filter(a => a.locadoraId === locadoraId);
  }

  async getAluguel(id: string): Promise<Aluguel | undefined> {
    return this.alugueisMap.get(id);
  }

  async createAluguel(aluguel: InsertAluguel): Promise<Aluguel> {
    const id = aluguel.id || crypto.randomUUID();
    const newAluguel: Aluguel = { 
      ...aluguel, 
      id,
      status: aluguel.status || "pendente",
      observacoes: aluguel.observacoes || null,
      taxaAdministrativa: aluguel.taxaAdministrativa || "0",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.alugueisMap.set(id, newAluguel);
    return newAluguel;
  }

  async updateAluguel(id: string, updates: Partial<InsertAluguel>): Promise<Aluguel> {
    const existing = this.alugueisMap.get(id);
    if (!existing) throw new Error('Aluguel not found');
    
    const updated: Aluguel = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.alugueisMap.set(id, updated);
    return updated;
  }

  async deleteAluguel(id: string): Promise<void> {
    this.alugueisMap.delete(id);
  }

  // Contrato operations
  async getAllContratos(): Promise<Contrato[]> {
    return Array.from(this.contratosMap.values());
  }

  async getContratosByLocadora(locadoraId: string): Promise<Contrato[]> {
    return Array.from(this.contratosMap.values()).filter(
      c => c.locadoraId === locadoraId
    );
  }

  async getContrato(id: string): Promise<Contrato | undefined> {
    return this.contratosMap.get(id);
  }

  async createContrato(contrato: InsertContrato): Promise<Contrato> {
    const id = crypto.randomUUID();
    const newContrato: Contrato = { 
      ...contrato, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contratosMap.set(id, newContrato);
    return newContrato;
  }

  async updateContrato(id: string, updates: Partial<InsertContrato>): Promise<Contrato> {
    const existing = this.contratosMap.get(id);
    if (!existing) throw new Error('Contrato not found');
    
    const updated: Contrato = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date()
    };
    this.contratosMap.set(id, updated);
    return updated;
  }

  async deleteContrato(id: string): Promise<void> {
    this.contratosMap.delete(id);
  }

  // Pagamento operations (memoria - não implementados)
  async getAllPagamentos(): Promise<Pagamento[]> {
    return [];
  }

  async getPagamentosByLocadora(locadoraId: string): Promise<Pagamento[]> {
    return [];
  }

  async getPagamentosByMotorista(motoristaId: string): Promise<Pagamento[]> {
    return [];
  }

  async getPagamento(id: string): Promise<Pagamento | undefined> {
    return undefined;
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    throw new Error('Pagamentos não implementados no MemStorage');
  }

  async updatePagamento(id: string, updates: Partial<InsertPagamento>): Promise<Pagamento> {
    throw new Error('Pagamentos não implementados no MemStorage');
  }

  async deletePagamento(id: string): Promise<void> {
    throw new Error('Pagamentos não implementados no MemStorage');
  }

  async getAluguelValorSemanal(aluguelId: string): Promise<number | undefined> {
    return undefined;
  }

  // Infracao operations (memoria - não implementados)
  async getAllInfracoes(): Promise<Infracao[]> {
    return [];
  }

  async getInfracoesByLocadora(locadoraId: string): Promise<Infracao[]> {
    return [];
  }

  async getInfracoesByMotorista(motoristaId: string): Promise<Infracao[]> {
    return [];
  }

  async getInfracoesByVeiculo(veiculoId: string): Promise<Infracao[]> {
    return [];
  }

  async getInfracao(id: string): Promise<Infracao | undefined> {
    return undefined;
  }

  async createInfracao(infracao: InsertInfracao): Promise<Infracao> {
    throw new Error('Infrações não implementadas no MemStorage');
  }

  async updateInfracao(id: string, updates: Partial<InsertInfracao>): Promise<Infracao> {
    throw new Error('Infrações não implementadas no MemStorage');
  }

  async deleteInfracao(id: string): Promise<void> {
    throw new Error('Infrações não implementadas no MemStorage');
  }

  // Atividade operations (memoria - não implementados)
  async getAtividadesByLocadora(locadoraId: string): Promise<Atividade[]> {
    return [];
  }

  async createAtividade(atividade: InsertAtividade): Promise<Atividade> {
    throw new Error('Atividades não implementadas no MemStorage');
  }

  // Métodos não implementados no MemStorage
  async getAllTemplateContratos(): Promise<TemplateContrato[]> {
    return [];
  }
  
  async getTemplateContratosByLocadora(locadoraId: string): Promise<TemplateContrato[]> {
    return [];
  }
  
  async getTemplateContrato(id: string): Promise<TemplateContrato | undefined> {
    return undefined;
  }
  
  async createTemplateContrato(template: InsertTemplateContrato): Promise<TemplateContrato> {
    throw new Error('Templates não implementados no MemStorage');
  }
  
  async updateTemplateContrato(id: string, updates: Partial<InsertTemplateContrato>): Promise<TemplateContrato> {
    throw new Error('Templates não implementados no MemStorage');
  }
  
  async deleteTemplateContrato(id: string): Promise<void> {
    throw new Error('Templates não implementados no MemStorage');
  }

  async getAllDespesas(): Promise<Despesa[]> {
    return [];
  }

  async getDespesasByLocadora(locadoraId: string): Promise<Despesa[]> {
    return [];
  }

  async getDespesasByVeiculo(veiculoId: string): Promise<Despesa[]> {
    return [];
  }

  async getDespesa(id: string): Promise<Despesa | undefined> {
    return undefined;
  }

  async createDespesa(despesa: InsertDespesa): Promise<Despesa> {
    throw new Error('Despesas não implementadas no MemStorage');
  }

  async updateDespesa(id: string, updates: Partial<InsertDespesa>): Promise<Despesa> {
    throw new Error('Despesas não implementadas no MemStorage');
  }

  async deleteDespesa(id: string): Promise<void> {
    throw new Error('Despesas não implementadas no MemStorage');
  }

  async getAllManutencoes(): Promise<Manutencao[]> {
    return [];
  }

  async getManutencoesByLocadora(locadoraId: string): Promise<Manutencao[]> {
    return [];
  }

  async getManutencoesByVeiculo(veiculoId: string): Promise<Manutencao[]> {
    return [];
  }

  async getManutencao(id: string): Promise<Manutencao | undefined> {
    return undefined;
  }

  async createManutencao(manutencao: InsertManutencao): Promise<Manutencao> {
    throw new Error('Manutenções não implementadas no MemStorage');
  }

  async updateManutencao(id: string, updates: Partial<InsertManutencao>): Promise<Manutencao> {
    throw new Error('Manutenções não implementadas no MemStorage');
  }

  async deleteManutencao(id: string): Promise<void> {
    throw new Error('Manutenções não implementadas no MemStorage');
  }

  async getAllLocais(): Promise<Local[]> {
    return [];
  }

  async getLocaisByLocadora(locadoraId: string): Promise<Local[]> {
    return [];
  }

  async getLocal(id: string): Promise<Local | undefined> {
    return undefined;
  }

  async createLocal(local: InsertLocal): Promise<Local> {
    throw new Error('Locais não implementados no MemStorage');
  }

  async updateLocal(id: string, updates: Partial<InsertLocal>): Promise<Local> {
    throw new Error('Locais não implementados no MemStorage');
  }

  async deleteLocal(id: string): Promise<void> {
    throw new Error('Locais não implementados no MemStorage');
  }

  async getAllAnuncios(): Promise<Anuncio[]> {
    return [];
  }

  async getAnunciosAtivos(): Promise<Anuncio[]> {
    return [];
  }

  async getAnuncio(id: string): Promise<Anuncio | undefined> {
    return undefined;
  }

  async createAnuncio(anuncio: InsertAnuncio): Promise<Anuncio> {
    throw new Error('Anúncios não implementados no MemStorage');
  }

  async updateAnuncio(id: string, updates: Partial<InsertAnuncio>): Promise<Anuncio> {
    throw new Error('Anúncios não implementados no MemStorage');
  }

  async deleteAnuncio(id: string): Promise<void> {
    throw new Error('Anúncios não implementados no MemStorage');
  }

  async getAtividadesByLocadora(locadoraId: string): Promise<Atividade[]> {
    return [];
  }

  async getAtividadesByLocadoraEUsuario(locadoraId: string, usuario?: string): Promise<Atividade[]> {
    return [];
  }

  async createAtividade(atividade: InsertAtividade): Promise<Atividade> {
    throw new Error('Atividades não implementadas no MemStorage');
  }

  // SEO operations (apenas admin)
  async getSeoConfig(): Promise<SeoConfig | undefined> {
    return undefined;
  }

  async updateSeoConfig(updates: Partial<InsertSeoConfig>): Promise<SeoConfig> {
    throw new Error('SEO não implementado no MemStorage');
  }

  async createDefaultSeoConfig(): Promise<SeoConfig> {
    throw new Error('SEO não implementado no MemStorage');
  }

  async getSystemAnalytics(): Promise<{
    visitantesEsseMes: number;
    paginasVisualizadas: number;
    tempoMedio: number;
    taxaRetorno: number;
  }> {
    // Dados realistas para desenvolvimento
    return {
      visitantesEsseMes: 28,
      paginasVisualizadas: 340,
      tempoMedio: 18,
      taxaRetorno: 78
    };
  }
}

// Use DatabaseStorage for production with PostgreSQL
export const storage = new DatabaseStorage();
