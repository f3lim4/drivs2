import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema } from "@shared/schema";
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
      
      // For now, we'll use a simple authentication check
      // In production, you'd verify the password against the auth system
      const isValidPassword = password === "Fbl@4510" && email === "drivs@drivs.com.br";
      
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
      const { email, password, name, type, locadoraData } = req.body;
      
      // Check if user already exists
      const existingProfile = await storage.getProfileByEmail(email);
      if (existingProfile) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create user ID (in production, this would come from auth system)
      const userId = crypto.randomUUID();
      
      let locadoraId: string | undefined;
      
      // If registering as locadora, create locadora first
      if (type === "locadora" && locadoraData) {
        const locadoraResult = insertLocadoraSchema.safeParse(locadoraData);
        if (!locadoraResult.success) {
          return res.status(400).json({ message: "Invalid locadora data", errors: locadoraResult.error.errors });
        }
        
        const locadora = await storage.createLocadora(locadoraResult.data);
        locadoraId = locadora.id;
      }
      
      // Create profile
      const profileData = {
        userId,
        email,
        name,
        type,
        locadoraId
      };
      
      const profileResult = insertProfileSchema.safeParse(profileData);
      if (!profileResult.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: profileResult.error.errors });
      }
      
      const profile = await storage.createProfile(profileResult.data);
      
      res.json({ 
        profile,
        message: "Registration successful" 
      });
    } catch (error) {
      console.error("Registration error:", error);
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

  const httpServer = createServer(app);

  return httpServer;
}
