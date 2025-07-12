import { 
  users, profiles, locadoras, veiculos, motoristas,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Locadora, type InsertLocadora,
  type Veiculo, type InsertVeiculo,
  type Motorista, type InsertMotorista
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
    return await db.select().from(veiculos);
  }

  async getVeiculosByLocadora(locadoraId: string): Promise<Veiculo[]> {
    return await db.select().from(veiculos).where(eq(veiculos.locadoraId, locadoraId));
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private locadorasMap: Map<string, Locadora>;
  private veiculosMap: Map<string, Veiculo>;
  private motoristasMap: Map<string, Motorista>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.locadorasMap = new Map();
    this.veiculosMap = new Map();
    this.motoristasMap = new Map();
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
}

// Use DatabaseStorage for production with PostgreSQL
export const storage = new DatabaseStorage();
