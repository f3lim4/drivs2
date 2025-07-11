import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema, insertMotoristaSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
