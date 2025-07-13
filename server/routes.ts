import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema, insertMotoristaSchema, insertAluguelSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with admin user if it doesn't exist
  try {
    const adminProfile = await storage.getProfileByEmail("drivs@drivs.com.br");
    if (!adminProfile) {
      await storage.createProfile({
        userId: "admin-user-id",
        email: "drivs@drivs.com.br",
        name: "Admin DRIVS", 
        type: "admin",
        locadoraId: null
      });
      console.log("Admin profile created");
    }
  } catch (error) {
    console.log("Note: Could not create admin profile (database may not be connected)");
  }
  // Authentication routes
  app.get("/api/auth/profile", async (req, res) => {
    try {
      // Para simplificar, vou usar um endpoint que retorna o perfil baseado no email
      // Em produção, isso seria baseado na sessão do usuário
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const profile = await storage.getProfileByEmail(email as string);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user profile by email
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Get user by user ID and verify password
      const user = await storage.getUserByUUID(profile.userId);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        profile,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, type } = req.body;
      
      // Check if user already exists
      const existingProfile = await storage.getProfileByEmail(username);
      if (existingProfile) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user first
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });
      
      // Get the created user with all fields to obtain the uuid
      const createdUser = await storage.getUserByUsername(username);
      if (!createdUser) {
        throw new Error('Failed to create user');
      }
      
      // Create profile
      const profileData = {
        userId: createdUser.uuid,
        email: username,
        name,
        type,
        locadoraId: null
      };
      
      const profileResult = insertProfileSchema.safeParse(profileData);
      if (!profileResult.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: profileResult.error.errors });
      }
      
      const profile = await storage.createProfile(profileResult.data);
      
      res.json({ 
        user,
        profile,
        message: "Registration successful" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { email, senhaAtual, novaSenha } = req.body;
      
      if (!email || !senhaAtual || !novaSenha) {
        return res.status(400).json({ message: "Email, senha atual e nova senha são obrigatórios" });
      }
      
      // Find user profile by email
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Get user by user ID to verify current password
      const user = await storage.getUserByUUID(profile.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Check current password
      const isValidPassword = await bcrypt.compare(senhaAtual, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(novaSenha, 10);
      
      // Update password (we'll need to add this method to storage)
      await storage.updateUserPassword(user.id, hashedNewPassword);
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile routes
  app.put("/api/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const profile = await storage.updateProfile(userId, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Locadora routes
  app.get("/api/locadoras", async (req, res) => {
    try {
      const locadoras = await storage.getAllLocadoras();
      res.json(locadoras);
    } catch (error) {
      console.error("Error fetching locadoras:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/locadoras/:id", async (req, res) => {
    try {
      const locadora = await storage.getLocadora(req.params.id);
      if (!locadora) {
        return res.status(404).json({ message: "Locadora not found" });
      }
      res.json(locadora);
    } catch (error) {
      console.error("Error fetching locadora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/locadoras", async (req, res) => {
    try {
      const result = insertLocadoraSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const locadora = await storage.createLocadora(result.data);
      
      // Atualizar o perfil da locadora com o locadora_id
      try {
        await storage.updateProfile(locadora.id, { locadoraId: locadora.id });
      } catch (error) {
        console.error("Error updating profile with locadora_id:", error);
      }
      
      res.json(locadora);
    } catch (error) {
      console.error("Error creating locadora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/locadoras/:id", async (req, res) => {
    try {
      const locadora = await storage.updateLocadora(req.params.id, req.body);
      res.json(locadora);
    } catch (error) {
      console.error("Error updating locadora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/locadoras/:id", async (req, res) => {
    try {
      await storage.deleteLocadora(req.params.id);
      res.json({ message: "Locadora deleted successfully" });
    } catch (error) {
      console.error("Error deleting locadora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Veiculo routes
  app.get("/api/veiculos", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      if (locadoraId) {
        const veiculos = await storage.getVeiculosByLocadora(locadoraId as string);
        
        // SECURITY: Validar que todos os veículos pertencem à locadora solicitada
        const todosVeiculosCorretos = veiculos.every(v => v.locadoraId === locadoraId);
        if (!todosVeiculosCorretos) {
          console.error('SECURITY ALERT: Veículos de outras locadoras detectados no backend');
          return res.status(403).json({ message: "Acesso negado: dados inconsistentes" });
        }
        
        res.json(veiculos);
      } else {
        const veiculos = await storage.getAllVeiculos();
        res.json(veiculos);
      }
    } catch (error) {
      console.error("Error fetching veiculos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/veiculos/:id", async (req, res) => {
    try {
      const veiculo = await storage.getVeiculo(req.params.id);
      if (!veiculo) {
        return res.status(404).json({ message: "Veiculo not found" });
      }
      res.json(veiculo);
    } catch (error) {
      console.error("Error fetching veiculo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/veiculos", async (req, res) => {
    try {
      const result = insertVeiculoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const veiculo = await storage.createVeiculo(result.data);
      res.json(veiculo);
    } catch (error) {
      console.error("Error creating veiculo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/veiculos/:id", async (req, res) => {
    try {
      const veiculo = await storage.updateVeiculo(req.params.id, req.body);
      res.json(veiculo);
    } catch (error) {
      console.error("Error updating veiculo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/veiculos/:id", async (req, res) => {
    try {
      await storage.deleteVeiculo(req.params.id);
      res.json({ message: "Veiculo deleted successfully" });
    } catch (error) {
      console.error("Error deleting veiculo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Motoristas routes
  app.get("/api/motoristas", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      let motoristas;
      if (locadoraId) {
        motoristas = await storage.getMotoristasByLocadora(locadoraId as string);
      } else {
        motoristas = await storage.getAllMotoristas();
      }
      
      res.json(motoristas);
    } catch (error) {
      console.error("Error fetching motoristas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/motoristas/:id", async (req, res) => {
    try {
      const motorista = await storage.getMotorista(req.params.id);
      if (!motorista) {
        return res.status(404).json({ message: "Motorista not found" });
      }
      res.json(motorista);
    } catch (error) {
      console.error("Error fetching motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/motoristas", async (req, res) => {
    try {
      const result = insertMotoristaSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const motorista = await storage.createMotorista(result.data);
      res.json(motorista);
    } catch (error) {
      console.error("Error creating motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/motoristas/:id", async (req, res) => {
    try {
      const motorista = await storage.updateMotorista(req.params.id, req.body);
      res.json(motorista);
    } catch (error) {
      console.error("Error updating motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/motoristas/:id", async (req, res) => {
    try {
      await storage.deleteMotorista(req.params.id);
      res.json({ message: "Motorista deleted successfully" });
    } catch (error) {
      console.error("Error deleting motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Aluguéis routes
  app.get("/api/alugueis", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      let alugueis;
      if (locadoraId) {
        alugueis = await storage.getAlugueisByLocadora(locadoraId as string);
      } else {
        alugueis = await storage.getAllAlugueis();
      }
      
      res.json(alugueis);
    } catch (error) {
      console.error("Error fetching alugueis:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/alugueis/:id", async (req, res) => {
    try {
      const aluguel = await storage.getAluguel(req.params.id);
      if (!aluguel) {
        return res.status(404).json({ message: "Aluguel not found" });
      }
      res.json(aluguel);
    } catch (error) {
      console.error("Error fetching aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/alugueis", async (req, res) => {
    try {
      const result = insertAluguelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const aluguel = await storage.createAluguel(result.data);
      res.json(aluguel);
    } catch (error) {
      console.error("Error creating aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/alugueis/:id", async (req, res) => {
    try {
      const aluguel = await storage.updateAluguel(req.params.id, req.body);
      res.json(aluguel);
    } catch (error) {
      console.error("Error updating aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/alugueis/:id", async (req, res) => {
    try {
      await storage.deleteAluguel(req.params.id);
      res.json({ message: "Aluguel deleted successfully" });
    } catch (error) {
      console.error("Error deleting aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
