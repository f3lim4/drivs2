import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { testConnection } from "./db";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema, insertMotoristaSchema, insertAluguelSchema, insertContratoSchema, insertPagamentoSchema, insertInfracaoSchema, insertDespesaSchema, insertManutencaoSchema, insertLocalSchema, insertAnuncioSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection first
  console.log("Testing database connection...");
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error("Database connection failed. Starting server without database functionality.");
  }

  // Initialize database with admin user if it doesn't exist
  if (connectionOk) {
    try {
      const adminProfile = await storage.getProfileByEmail("drivs@drivs.com.br");
      if (!adminProfile) {
        await storage.createProfile({
          userId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID format
          email: "drivs@drivs.com.br",
          name: "Admin DRIVS", 
          type: "admin",
          locadoraId: null
        });
        console.log("Admin profile created");
      }
    } catch (error) {
      console.error("Database initialization error:", error);
      console.log("Note: Could not create admin profile (database may not be connected)");
    }
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
      console.log("Atualizando veículo:", req.params.id, "com dados:", req.body);
      const veiculo = await storage.updateVeiculo(req.params.id, req.body);
      console.log("Veículo atualizado:", veiculo);
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
      
      // Debug: Log parâmetros recebidos
      console.log('[DEBUG] GET /api/motoristas - Parâmetros:', { locadoraId });
      
      let motoristas;
      if (locadoraId) {
        motoristas = await storage.getMotoristasByLocadora(locadoraId as string);
      } else {
        motoristas = await storage.getAllMotoristas();
      }
      
      // Debug: Log resultado do storage
      console.log('[DEBUG] GET /api/motoristas - Resultado do storage:', motoristas.length, 'motoristas');
      
      // Debug: Verificar se há "alias" nos dados
      const aliasData = motoristas.filter(m => 
        Object.values(m).some(value => 
          typeof value === 'string' && value.toLowerCase().includes('alias')
        )
      );
      
      if (aliasData.length > 0) {
        console.warn('[DEBUG] GET /api/motoristas - ENCONTRADO "alias" nos dados:', aliasData);
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
      // Debug: Log dados recebidos
      console.log('[DEBUG] POST /api/motoristas - Dados recebidos:', req.body);
      
      const result = insertMotoristaSchema.safeParse(req.body);
      if (!result.success) {
        console.log('[DEBUG] POST /api/motoristas - Erro de validação:', result.error.errors);
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      // Debug: Log dados validados
      console.log('[DEBUG] POST /api/motoristas - Dados validados:', result.data);
      
      const motorista = await storage.createMotorista(result.data);
      
      // Debug: Log resultado do storage
      console.log('[DEBUG] POST /api/motoristas - Motorista criado:', motorista);
      
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
      
      if (locadoraId) {
        const alugueis = await storage.getAlugueisByLocadora(locadoraId as string);
        
        // SECURITY: Validar que todos os aluguéis pertencem à locadora solicitada
        const todosAlugueisCorretos = alugueis.every(a => a.locadoraId === locadoraId);
        if (!todosAlugueisCorretos) {
          console.error('SECURITY ALERT: Aluguéis de outras locadoras detectados no backend');
          return res.status(403).json({ message: "Acesso negado: dados inconsistentes" });
        }
        
        res.json(alugueis);
      } else {
        const alugueis = await storage.getAllAlugueis();
        res.json(alugueis);
      }
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
      
      // CRITICAL SECURITY: Validar integridade dos dados antes de criar aluguel
      const { locadoraId, motoristaId, veiculoId } = result.data;
      
      // Verificar se motorista pertence à mesma locadora
      const motorista = await storage.getMotorista(motoristaId);
      if (!motorista || motorista.locadoraId !== locadoraId) {
        console.error('SECURITY ALERT: Tentativa de criar aluguel com motorista de outra locadora');
        return res.status(403).json({ 
          message: "Acesso negado: motorista não pertence à sua locadora",
          details: `Motorista ${motoristaId} não encontrado ou pertence à outra locadora`
        });
      }
      
      // Verificar se veículo pertence à mesma locadora
      const veiculo = await storage.getVeiculo(veiculoId);
      if (!veiculo || veiculo.locadoraId !== locadoraId) {
        console.error('SECURITY ALERT: Tentativa de criar aluguel com veículo de outra locadora');
        return res.status(403).json({ 
          message: "Acesso negado: veículo não pertence à sua locadora",
          details: `Veículo ${veiculoId} não encontrado ou pertence à outra locadora`
        });
      }
      
      const aluguel = await storage.createAluguel(result.data);
      
      // Atualizar status do veículo para "alugado"
      await storage.updateVeiculo(veiculoId, { status: 'alugado' });
      
      res.json(aluguel);
    } catch (error) {
      console.error("Error creating aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/alugueis/:id", async (req, res) => {
    try {
      // Buscar dados do aluguel antes de atualizar
      const aluguelAnterior = await storage.getAluguel(req.params.id);
      if (!aluguelAnterior) {
        return res.status(404).json({ message: "Aluguel not found" });
      }
      
      const aluguel = await storage.updateAluguel(req.params.id, req.body);
      
      // Atualizar status do veículo baseado no status do aluguel
      if (req.body.status) {
        const novoStatusVeiculo = req.body.status === 'ativo' ? 'alugado' : 'disponivel';
        await storage.updateVeiculo(aluguel.veiculoId, { status: novoStatusVeiculo });
      }
      
      res.json(aluguel);
    } catch (error) {
      console.error("Error updating aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/alugueis/:id", async (req, res) => {
    try {
      // Buscar dados do aluguel antes de deletar para atualizar o veículo
      const aluguel = await storage.getAluguel(req.params.id);
      if (!aluguel) {
        return res.status(404).json({ message: "Aluguel not found" });
      }
      
      await storage.deleteAluguel(req.params.id);
      
      // Atualizar status do veículo para "disponivel"
      await storage.updateVeiculo(aluguel.veiculoId, { status: 'disponivel' });
      
      res.json({ message: "Aluguel deleted successfully" });
    } catch (error) {
      console.error("Error deleting aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Contratos routes
  app.get("/api/contratos", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      if (locadoraId) {
        const contratos = await storage.getContratosByLocadora(locadoraId as string);
        res.json(contratos);
      } else {
        const contratos = await storage.getAllContratos();
        res.json(contratos);
      }
    } catch (error) {
      console.error("Error fetching contratos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/contratos/:id", async (req, res) => {
    try {
      const contrato = await storage.getContrato(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato not found" });
      }
      res.json(contrato);
    } catch (error) {
      console.error("Error fetching contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/contratos", async (req, res) => {
    try {
      const result = insertContratoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const contrato = await storage.createContrato(result.data);
      res.json(contrato);
    } catch (error) {
      console.error("Error creating contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/contratos/:id", async (req, res) => {
    try {
      // Validate the request body
      const result = insertContratoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const contrato = await storage.updateContrato(req.params.id, result.data);
      res.json(contrato);
    } catch (error) {
      console.error("Error updating contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/contratos/:id", async (req, res) => {
    try {
      await storage.deleteContrato(req.params.id);
      res.json({ message: "Contrato deleted successfully" });
    } catch (error) {
      console.error("Error deleting contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Template Contratos routes
  app.get("/api/template-contratos", async (req, res) => {
    try {
      const locadoraId = req.query.locadoraId as string;
      const templates = locadoraId 
        ? await storage.getTemplateContratosByLocadora(locadoraId)
        : await storage.getAllTemplateContratos();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching template contratos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/template-contratos/:id", async (req, res) => {
    try {
      const template = await storage.getTemplateContrato(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/template-contratos", async (req, res) => {
    try {
      const template = await storage.createTemplateContrato(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating template contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/template-contratos/:id", async (req, res) => {
    try {
      const template = await storage.updateTemplateContrato(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating template contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/template-contratos/:id", async (req, res) => {
    try {
      await storage.deleteTemplateContrato(req.params.id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pagamentos routes
  app.get("/api/pagamentos", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      const pagamentos = locadoraId
        ? await storage.getPagamentosByLocadora(locadoraId as string)
        : await storage.getAllPagamentos();
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pagamentos/:id", async (req, res) => {
    try {
      const pagamento = await storage.getPagamento(req.params.id);
      if (!pagamento) {
        return res.status(404).json({ message: "Pagamento not found" });
      }
      res.json(pagamento);
    } catch (error) {
      console.error("Error fetching pagamento:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pagamentos/motorista/:motoristaId", async (req, res) => {
    try {
      const pagamentos = await storage.getPagamentosByMotorista(req.params.motoristaId);
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos by motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/aluguel/:aluguelId/valor-semanal", async (req, res) => {
    try {
      const valorSemanal = await storage.getAluguelValorSemanal(req.params.aluguelId);
      if (valorSemanal === undefined) {
        return res.status(404).json({ message: "Aluguel not found" });
      }
      res.json({ valorSemanal });
    } catch (error) {
      console.error("Error fetching aluguel valor semanal:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pagamentos", async (req, res) => {
    try {
      const validatedData = insertPagamentoSchema.parse(req.body);
      const pagamento = await storage.createPagamento(validatedData);
      res.json(pagamento);
    } catch (error) {
      console.error("Error creating pagamento:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/pagamentos/:id", async (req, res) => {
    try {
      const validatedData = insertPagamentoSchema.partial().parse(req.body);
      const pagamento = await storage.updatePagamento(req.params.id, validatedData);
      res.json(pagamento);
    } catch (error) {
      console.error("Error updating pagamento:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pagamentos/:id", async (req, res) => {
    try {
      await storage.deletePagamento(req.params.id);
      res.json({ message: "Pagamento deleted successfully" });
    } catch (error) {
      console.error("Error deleting pagamento:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Infrações routes
  app.get("/api/infracoes", async (req, res) => {
    try {
      const { locadoraId, motoristaId } = req.query;
      
      if (motoristaId) {
        const infracoes = await storage.getInfracoesByMotorista(motoristaId as string);
        res.json(infracoes);
      } else if (locadoraId) {
        const infracoes = await storage.getInfracoesByLocadora(locadoraId as string);
        res.json(infracoes);
      } else {
        const infracoes = await storage.getAllInfracoes();
        res.json(infracoes);
      }
    } catch (error) {
      console.error("Error fetching infracoes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/infracoes/:id", async (req, res) => {
    try {
      const infracao = await storage.getInfracao(req.params.id);
      if (!infracao) {
        return res.status(404).json({ message: "Infracao not found" });
      }
      res.json(infracao);
    } catch (error) {
      console.error("Error fetching infracao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/infracoes", async (req, res) => {
    try {
      const validatedData = insertInfracaoSchema.omit({ id: true }).parse(req.body);
      const infracao = await storage.createInfracao(validatedData);
      res.json(infracao);
    } catch (error) {
      console.error("Error creating infracao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/infracoes/:id", async (req, res) => {
    try {
      const validatedData = insertInfracaoSchema.partial().parse(req.body);
      const infracao = await storage.updateInfracao(req.params.id, validatedData);
      res.json(infracao);
    } catch (error) {
      console.error("Error updating infracao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/infracoes/:id", async (req, res) => {
    try {
      await storage.deleteInfracao(req.params.id);
      res.json({ message: "Infracao deleted successfully" });
    } catch (error) {
      console.error("Error deleting infracao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Despesa routes
  app.get("/api/despesas", async (req, res) => {
    try {
      const { locadoraId, veiculoId } = req.query;
      
      if (veiculoId) {
        const despesas = await storage.getDespesasByVeiculo(veiculoId as string);
        res.json(despesas);
      } else if (locadoraId) {
        const despesas = await storage.getDespesasByLocadora(locadoraId as string);
        res.json(despesas);
      } else {
        const despesas = await storage.getAllDespesas();
        res.json(despesas);
      }
    } catch (error) {
      console.error("Error fetching despesas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/despesas/:id", async (req, res) => {
    try {
      const despesa = await storage.getDespesa(req.params.id);
      if (!despesa) {
        return res.status(404).json({ message: "Despesa not found" });
      }
      res.json(despesa);
    } catch (error) {
      console.error("Error fetching despesa:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/despesas", async (req, res) => {
    try {
      const validatedData = insertDespesaSchema.omit({ id: true }).parse(req.body);
      const despesa = await storage.createDespesa(validatedData);
      res.json(despesa);
    } catch (error) {
      console.error("Error creating despesa:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/despesas/:id", async (req, res) => {
    try {
      const validatedData = insertDespesaSchema.partial().parse(req.body);
      const despesa = await storage.updateDespesa(req.params.id, validatedData);
      res.json(despesa);
    } catch (error) {
      console.error("Error updating despesa:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/despesas/:id", async (req, res) => {
    try {
      await storage.deleteDespesa(req.params.id);
      res.json({ message: "Despesa deleted successfully" });
    } catch (error) {
      console.error("Error deleting despesa:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manutencao routes
  app.get("/api/manutencoes", async (req, res) => {
    try {
      const { locadoraId, veiculoId } = req.query;
      
      if (veiculoId) {
        const manutencoes = await storage.getManutencoesByVeiculo(veiculoId as string);
        res.json(manutencoes);
      } else if (locadoraId) {
        const manutencoes = await storage.getManutencoesByLocadora(locadoraId as string);
        res.json(manutencoes);
      } else {
        const manutencoes = await storage.getAllManutencoes();
        res.json(manutencoes);
      }
    } catch (error) {
      console.error("Error fetching manutencoes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/manutencoes/:id", async (req, res) => {
    try {
      const manutencao = await storage.getManutencao(req.params.id);
      if (!manutencao) {
        return res.status(404).json({ message: "Manutencao not found" });
      }
      res.json(manutencao);
    } catch (error) {
      console.error("Error fetching manutencao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/manutencoes", async (req, res) => {
    try {
      // Limpar campos vazios para evitar erros de validação
      const cleanedData = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => {
          // Converter strings vazias para null em campos numéricos e de data
          if (value === "" && ['quilometragemInicio', 'quilometragemFim', 'valorOrcamento', 'valorFinal', 'dataConclusao', 'proximaManutencao'].includes(key)) {
            return [key, null];
          }
          return [key, value];
        })
      );
      
      const validatedData = insertManutencaoSchema.omit({ id: true }).parse(cleanedData);
      const manutencao = await storage.createManutencao(validatedData);
      res.json(manutencao);
    } catch (error) {
      console.error("Error creating manutencao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/manutencoes/:id", async (req, res) => {
    try {
      // Limpar campos vazios para evitar erros de validação
      const cleanedData = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => {
          // Converter strings vazias para null em campos numéricos e de data
          if (value === "" && ['quilometragemInicio', 'quilometragemFim', 'valorOrcamento', 'valorFinal', 'dataConclusao', 'proximaManutencao'].includes(key)) {
            return [key, null];
          }
          return [key, value];
        })
      );
      
      const validatedData = insertManutencaoSchema.partial().parse(cleanedData);
      const manutencao = await storage.updateManutencao(req.params.id, validatedData);
      res.json(manutencao);
    } catch (error) {
      console.error("Error updating manutencao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/manutencoes/:id", async (req, res) => {
    try {
      await storage.deleteManutencao(req.params.id);
      res.json({ message: "Manutencao deleted successfully" });
    } catch (error) {
      console.error("Error deleting manutencao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Locais (Oficinas/Locais) API routes
  app.get("/api/locais", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      if (locadoraId) {
        const locais = await storage.getLocaisByLocadora(locadoraId as string);
        res.json(locais);
      } else {
        const locais = await storage.getAllLocais();
        res.json(locais);
      }
    } catch (error) {
      console.error("Error fetching locais:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/locais/:id", async (req, res) => {
    try {
      const local = await storage.getLocal(req.params.id);
      if (!local) {
        return res.status(404).json({ message: "Local not found" });
      }
      res.json(local);
    } catch (error) {
      console.error("Error fetching local:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/locais", async (req, res) => {
    try {
      const validatedData = insertLocalSchema.omit({ id: true }).parse(req.body);
      const local = await storage.createLocal(validatedData);
      res.json(local);
    } catch (error) {
      console.error("Error creating local:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/locais/:id", async (req, res) => {
    try {
      const validatedData = insertLocalSchema.partial().parse(req.body);
      const local = await storage.updateLocal(req.params.id, validatedData);
      res.json(local);
    } catch (error) {
      console.error("Error updating local:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/locais/:id", async (req, res) => {
    try {
      await storage.deleteLocal(req.params.id);
      res.json({ message: "Local deleted successfully" });
    } catch (error) {
      console.error("Error deleting local:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Anuncios routes
  app.get("/api/anuncios", async (req, res) => {
    try {
      const anuncios = await storage.getAllAnuncios();
      res.json(anuncios);
    } catch (error) {
      console.error("Error fetching anuncios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/anuncios/ativos", async (req, res) => {
    try {
      const anuncios = await storage.getAnunciosAtivos();
      res.json(anuncios);
    } catch (error) {
      console.error("Error fetching anuncios ativos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/anuncios/:id", async (req, res) => {
    try {
      const anuncio = await storage.getAnuncio(req.params.id);
      if (!anuncio) {
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }
      res.json(anuncio);
    } catch (error) {
      console.error("Error fetching anuncio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/anuncios", async (req, res) => {
    try {
      const validatedData = insertAnuncioSchema.parse(req.body);
      const anuncio = await storage.createAnuncio(validatedData);
      res.json(anuncio);
    } catch (error) {
      console.error("Error creating anuncio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/anuncios/:id", async (req, res) => {
    try {
      const validatedData = insertAnuncioSchema.partial().parse(req.body);
      const anuncio = await storage.updateAnuncio(req.params.id, validatedData);
      res.json(anuncio);
    } catch (error) {
      console.error("Error updating anuncio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/anuncios/:id", async (req, res) => {
    try {
      await storage.deleteAnuncio(req.params.id);
      res.json({ message: "Anúncio deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting anuncio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
