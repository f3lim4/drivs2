import { 
  users, profiles, locadoras, veiculos,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Locadora, type InsertLocadora,
  type Veiculo, type InsertVeiculo
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUUID(uuid: string): Promise<User | undefined> {
    // For now, we'll create a simple mapping since we don't have UUID in users table
    // In production, you'd store the UUID relationship properly
    const allProfiles = await db.select().from(profiles);
    for (const profile of allProfiles) {
      if (profile.userId === uuid) {
        // Return a mock user for authentication
        return {
          id: 1,
          username: profile.email,
          password: await bcrypt.hash("admin123", 10) // Default password for demo
        };
      }
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
    const result = await db.insert(locadoras).values(locadora).returning();
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
    const result = await db.insert(veiculos).values(veiculo).returning();
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private locadorasMap: Map<string, Locadora>;
  private veiculosMap: Map<string, Veiculo>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.locadorasMap = new Map();
    this.veiculosMap = new Map();
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
    const user: User = { ...insertUser, id };
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
    const id = crypto.randomUUID();
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
}

// Use DatabaseStorage for production with PostgreSQL
export const storage = new DatabaseStorage();
