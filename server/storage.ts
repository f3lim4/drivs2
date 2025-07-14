import { 
  users, profiles, locadoras, veiculos, motoristas, alugueis, contratos, templateContratos,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Locadora, type InsertLocadora,
  type Veiculo, type InsertVeiculo,
  type Motorista, type InsertMotorista,
  type Aluguel, type InsertAluguel,
  type Contrato, type InsertContrato,
  type TemplateContrato, type InsertTemplateContrato
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

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
}

export class DatabaseStorage implements IStorage {
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
        motoristaNome: motoristas.nome,
        motoristaContato: motoristas.telefone,
        veiculoModelo: veiculos.modelo,
        veiculoMarca: veiculos.marca,
        veiculoPlaca: veiculos.placa,
      })
      .from(alugueis)
      .innerJoin(motoristas, eq(alugueis.motoristaId, motoristas.id))
      .innerJoin(veiculos, eq(alugueis.veiculoId, veiculos.id))
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
    return await db.select().from(contratos).where(eq(contratos.locadoraId, locadoraId));
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private locadorasMap: Map<string, Locadora>;
  private veiculosMap: Map<string, Veiculo>;
  private motoristasMap: Map<string, Motorista>;
  private alugueisMap: Map<string, Aluguel>;
  private contratosMap: Map<string, Contrato>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.locadorasMap = new Map();
    this.veiculosMap = new Map();
    this.motoristasMap = new Map();
    this.alugueisMap = new Map();
    this.contratosMap = new Map();
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
}

// Use DatabaseStorage for production with PostgreSQL
export const storage = new DatabaseStorage();
