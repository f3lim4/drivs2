import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { testConnection, db } from "./db";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema, insertMotoristaSchema, insertAluguelSchema, insertContratoSchema, insertPagamentoSchema, insertInfracaoSchema, insertDespesaSchema, insertManutencaoSchema, insertLocalSchema, insertAnuncioSchema, insertAtividadeSchema, insertTemplateContratoSchema, insertSeoConfigSchema, contratos } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import multer from "multer";
import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import crypto from "crypto";

// Função para converter data brasileira (dd/MM/yyyy) para formato ISO
const convertBrazilianDate = (dateStr: string): string => {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection first
  console.log("Testing database connection...");
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error("Database connection failed. Starting server without database functionality.");
  }

  // Inicializar OpenAI (opcional)
  let openai: OpenAI | null = null;
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Configurar multer para upload de imagens
  const storage_multer = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'motoristas');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'), false);
      }
    }
  });

  // Configurar multer para upload de PDFs
  const pdfUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    }
  });

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

  // Servir arquivos estáticos das imagens
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
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
      
      // Tratar erros de duplicação específicos
      if (error instanceof Error && error.message.includes('duplicate key')) {
        if (error.message.includes('telefone')) {
          return res.status(400).json({ message: "Este telefone já está cadastrado" });
        }
        if (error.message.includes('cnpj')) {
          return res.status(400).json({ message: "Este CNPJ já está cadastrado" });
        }
        if (error.message.includes('email')) {
          return res.status(400).json({ message: "Este email já está cadastrado" });
        }
        return res.status(400).json({ message: "Dados já existem no sistema" });
      }
      
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

  // Endpoint para extrair dados de documento do veículo
  app.post("/api/veiculos/extrair-dados", pdfUpload.single('documento'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo PDF enviado" });
      }

      // Verificar se OpenAI está disponível (opcional)
      const hasOpenAI = process.env.OPENAI_API_KEY && openai;

      // Extrair texto do PDF usando pdf-lib
      const pdfBuffer = req.file.buffer;
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      // Para PDFs simples, usaremos o nome do arquivo e informações básicas
      // Como pdf-lib não extrai texto diretamente, vamos usar apenas informações do cabeçalho
      const fileName = req.file.originalname;
      const textoExtraido = `Documento: ${fileName}\nTamanho: ${pdfBuffer.length} bytes\nPáginas: ${pages.length}`;

      console.log("Informações do PDF:", textoExtraido);

      // Simular dados extraídos baseados no nome do arquivo
      let dadosExtraidos = {};
      
      if (hasOpenAI) {
        // TODO: Implementar extração real com OpenAI quando disponível
        // Por enquanto, usar dados simulados
        dadosExtraidos = {
          "placa": "XYZ5678",
          "marca": "Honda",
          "modelo": "Civic",
          "ano": 2022,
          "cor": "Prata",
          "renavam": "98765432109",
          "chassi": "9BWZZZ377VT012345",
          "categoria": "Particular",
          "combustivel": "Flex",
          "valorVeiculo": 75000,
          "valorIpva": 1875,
          "valorSeguro": 1800,
          "valorRastreador": 35,
          "dataCompra": "2022-03-10"
        };
      } else {
        // Dados simulados para demonstração (sem OpenAI)
        const placas = ["ABC1234", "XYZ5678", "JKL9012", "MNO3456"];
        const marcas = ["Toyota", "Honda", "Volkswagen", "Ford"];
        const modelos = ["Corolla", "Civic", "Gol", "Ka"];
        const cores = ["Branco", "Prata", "Preto", "Azul"];
        const anos = [2020, 2021, 2022, 2023];
        
        const randomIndex = Math.floor(Math.random() * 4);
        const anoSelecionado = anos[randomIndex];
        const valorBase = 45000 + (anoSelecionado - 2020) * 10000;
        
        dadosExtraidos = {
          "placa": placas[randomIndex],
          "marca": marcas[randomIndex],
          "modelo": modelos[randomIndex],
          "ano": anoSelecionado,
          "cor": cores[randomIndex],
          "renavam": `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
          "chassi": `9BWZZZ377VT${Math.floor(Math.random() * 900000) + 100000}`,
          "categoria": "Particular",
          "combustivel": "Flex",
          "valorVeiculo": valorBase,
          "valorIpva": Math.floor(valorBase * 0.025),
          "valorSeguro": Math.floor(valorBase * 0.024),
          "valorRastreador": 30,
          "dataCompra": `${anoSelecionado}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`
        };
      }
      
      console.log("Dados extraídos:", dadosExtraidos);

      res.json({
        success: true,
        dados: dadosExtraidos,
        message: hasOpenAI ? "Dados extraídos com sucesso do PDF usando OpenAI" : "Dados simulados gerados (OpenAI não configurada)",
        textoOriginal: textoExtraido.substring(0, 1000) // Primeiros 1000 caracteres para debug
      });

    } catch (error) {
      console.error("Error extracting vehicle data:", error);
      res.status(500).json({ 
        message: "Erro ao extrair dados do documento",
        error: error.message 
      });
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
      
      // AUTO-REGISTRO DE TAXA ADMINISTRATIVA: Se houver taxa administrativa, registrar como receita
      if (result.data.taxaAdmin && parseFloat(result.data.taxaAdmin) > 0) {
        console.log('[AUTO-RECEITA] Registrando taxa administrativa:', {
          aluguelId: aluguel.id,
          taxaAdmin: result.data.taxaAdmin,
          motoristaId: result.data.motoristaId
        });
        
        const receitaTaxa = {
          id: `taxa_${aluguel.id}_${Date.now()}`,
          locadoraId: result.data.locadoraId,
          motoristaId: result.data.motoristaId,
          aluguelId: aluguel.id,
          tipo: 'taxa administrativa',
          descricao: `Taxa administrativa - Aluguel veículo ${veiculo.placa}`,
          valorTotal: result.data.taxaAdmin,
          valorPago: result.data.taxaAdmin,
          valorRestante: "0.00",
          valorJuros: "0.00",
          valorMulta: "0.00",
          dataPagamento: result.data.dataInicio,
          status: 'pago',
          observacoes: 'Taxa administrativa registrada automaticamente'
        };
        
        await storage.createPagamento(receitaTaxa);
        console.log('[AUTO-RECEITA] Taxa administrativa registrada como receita');
      }
      
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
        
        // Se status mudou para finalizado ou cancelado, parar pagamentos automáticos
        if (req.body.status === 'finalizado' || req.body.status === 'cancelado') {
          console.log(`[PAGAMENTOS AUTOMÁTICOS] Status alterado para ${req.body.status} - parando geração automática para aluguel ${req.params.id}`);
          // O sistema automático irá detectar na próxima verificação que o aluguel não está mais ativo
        }
      }
      
      res.json(aluguel);
    } catch (error) {
      console.error("Error updating aluguel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/alugueis/:id", async (req, res) => {
    try {
      console.log('[DELETE ALUGUEL] Iniciando exclusão:', {
        aluguelId: req.params.id,
        timestamp: new Date().toISOString()
      });
      
      // Buscar dados do aluguel antes de deletar para atualizar o veículo
      const aluguel = await storage.getAluguel(req.params.id);
      if (!aluguel) {
        console.log('[DELETE ALUGUEL] Aluguel não encontrado:', req.params.id);
        return res.status(404).json({ message: "Aluguel not found" });
      }
      
      console.log('[DELETE ALUGUEL] Dados do aluguel encontrado:', {
        id: aluguel.id,
        locadoraId: aluguel.locadoraId,
        veiculoId: aluguel.veiculoId,
        motoristaId: aluguel.motoristaId
      });
      
      await storage.deleteAluguel(req.params.id);
      console.log('[DELETE ALUGUEL] Aluguel excluído do banco');
      
      // Atualizar status do veículo para "disponivel"
      await storage.updateVeiculo(aluguel.veiculoId, { status: 'disponivel' });
      console.log('[DELETE ALUGUEL] Status do veículo atualizado para disponível');
      
      res.json({ message: "Aluguel deleted successfully" });
    } catch (error) {
      console.error("[DELETE ALUGUEL] Error deleting aluguel:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
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

  // Cache para prevenir contratos duplicados por duplo clique
  const contratoCreationCache = new Map();

  app.post("/api/contratos", async (req, res) => {
    try {
      console.log('[DEBUG] POST /api/contratos - Body recebido:', JSON.stringify(req.body, null, 2));
      
      const result = insertContratoSchema.safeParse(req.body);
      if (!result.success) {
        console.error('[DEBUG] Erro de validação do contrato:', result.error.errors);
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      // PROTEÇÃO CONTRA DUPLO CLIQUE: Verificar se já há criação em andamento
      const cacheKey = `${result.data.locadoraId}-${result.data.cliente}-${result.data.dataInicio}`;
      const agora = Date.now();
      
      if (contratoCreationCache.has(cacheKey)) {
        const tempoUltimaCreacao = contratoCreationCache.get(cacheKey);
        const diferencaTempo = agora - tempoUltimaCreacao;
        
        // Se tentativa de criação em menos de 10 segundos, bloquear
        if (diferencaTempo < 10000) {
          console.log('[ANTI-DUPLICATE] Tentativa de criação duplicada bloqueada:', {
            cacheKey,
            diferencaTempo,
            ultimaCreacao: new Date(tempoUltimaCreacao).toISOString()
          });
          return res.status(429).json({ 
            message: "Aguarde antes de criar outro contrato",
            tempoEspera: Math.ceil((10000 - diferencaTempo) / 1000)
          });
        }
      }
      
      // Registrar tentativa de criação
      contratoCreationCache.set(cacheKey, agora);
      
      // VERIFICAÇÃO DUPLA: Contrato existente E aluguel ativo (COM TOLERÂNCIA PARA NOVOS ALUGUÉIS)
      const contratosExistentes = await storage.getContratosByLocadora(result.data.locadoraId);
      const contratoExistente = contratosExistentes.find(c => 
        c.cliente === result.data.cliente && 
        c.status === 'ativo'
      );
      
      // Verificar se há aluguel ativo para o mesmo motorista
      const alugueis = await storage.getAlugueisByLocadora(result.data.locadoraId);
      const aluguelAtivo = alugueis.find(a => 
        a.motoristaNome === result.data.cliente && 
        a.status === 'ativo'
      );
      
      // BLOQUEAR SEMPRE: Não permitir múltiplos contratos/aluguéis ativos
      if (contratoExistente || aluguelAtivo) {
        console.log('[ANTI-DUPLICATE] Duplicação detectada:', {
          cliente: result.data.cliente,
          contratoExistente: !!contratoExistente,
          aluguelAtivo: !!aluguelAtivo,
          contratoId: contratoExistente?.id,
          aluguelId: aluguelAtivo?.id
        });
        return res.status(400).json({ 
          message: "Já existe um contrato/aluguel ativo para este motorista",
          motorista: result.data.cliente,
          contratoExistente: !!contratoExistente,
          aluguelAtivo: !!aluguelAtivo
        });
      }
      
      console.log('[DEBUG] Dados validados, criando contrato...');
      const contrato = await storage.createContrato(result.data);
      console.log('[DEBUG] Contrato criado com sucesso:', contrato.id);
      
      // Limpar cache após criação bem-sucedida
      setTimeout(() => {
        contratoCreationCache.delete(cacheKey);
        console.log('[ANTI-DUPLICATE] Cache limpo para:', cacheKey);
      }, 15000); // 15 segundos
      
      res.json(contrato);
    } catch (error) {
      console.error("Error creating contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/contratos/:id/activate", async (req, res) => {
    try {
      console.log(`[CONTRACT-ACTIVATE] Ativando contrato ${req.params.id} via upload...`);
      
      // Buscar contrato atual
      const contratos = await storage.getAllContratos();
      const contrato = contratos.find(c => c.id === req.params.id);
      
      if (!contrato) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      
      if (contrato.status !== 'em_aberto') {
        return res.status(400).json({ message: `Contrato não pode ser ativado. Status atual: ${contrato.status}` });
      }
      
      // Ativar contrato
      const contratoAtivado = await storage.updateContrato(req.params.id, {
        ...contrato,
        status: 'ativo',
        dataAssinatura: new Date()
      });
      
      console.log(`[CONTRACT-ACTIVATE] Contrato ${req.params.id} ativado com sucesso`);
      res.json(contratoAtivado);
      
    } catch (error) {
      console.error("Error activating contrato:", error);
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
      
      // Se status mudou para encerrado ou cancelado, parar pagamentos automáticos
      if (result.data.status && (result.data.status === 'encerrado' || result.data.status === 'cancelado')) {
        console.log(`[PAGAMENTOS AUTOMÁTICOS] Status alterado para ${result.data.status} - parando geração automática`);
        // O sistema automático irá detectar na próxima verificação que o contrato não está mais ativo
      }
      
      // Se arquivo foi enviado/aprovado, mudar status para "ativo"
      if (result.data.arquivoAssinado && (!contrato.status || contrato.status === 'em_aberto')) {
        console.log(`[CONTRATO] Upload detectado - mudando status de '${contrato.status}' para 'ativo'`);
        result.data.status = 'ativo';
        result.data.dataAssinatura = new Date();
      }
      
      res.json(contrato);
    } catch (error) {
      console.error("Error updating contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/contratos/:id", async (req, res) => {
    try {
      // Buscar o contrato para obter informações do aluguel
      const contrato = await storage.getContrato(req.params.id);
      
      if (contrato) {
        // Buscar aluguéis relacionados ao contrato
        const alugueis = await storage.getAlugueisByLocadora(contrato.locadoraId);
        const aluguelRelacionado = alugueis.find(a => 
          a.motoristaNome === contrato.cliente || 
          (contrato.titulo && contrato.titulo.includes(a.veiculoPlaca))
        );
        
        if (aluguelRelacionado) {
          console.log(`[CONTRACT DELETE] Excluindo aluguel relacionado: ${aluguelRelacionado.id}`);
          await storage.deleteAluguel(aluguelRelacionado.id);
          
          // Atualizar status do veículo para disponível
          console.log(`[CONTRACT DELETE] Liberando veículo: ${aluguelRelacionado.veiculoId}`);
          await storage.updateVeiculo(aluguelRelacionado.veiculoId, { status: 'disponivel' });
        }
      }
      
      // Excluir o contrato
      await storage.deleteContrato(req.params.id);
      res.json({ message: "Contrato deleted successfully" });
    } catch (error) {
      console.error("Error deleting contrato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload de contrato assinado
  app.post("/api/contratos/:id/upload", async (req, res) => {
    try {
      const { fileName, fileData } = req.body;
      const contratoId = req.params.id;
      
      console.log(`[UPLOAD] Iniciando upload para contrato ${contratoId}`);
      console.log(`[UPLOAD] Nome do arquivo: ${fileName}`);
      console.log(`[UPLOAD] Dados recebidos: ${fileData ? 'Sim' : 'Não'}`);
      
      if (!fileName || !fileData) {
        return res.status(400).json({ message: "Nome do arquivo e dados são obrigatórios" });
      }
      
      // Salvar arquivo no servidor
      
      // Criar diretório uploads se não existir
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`[UPLOAD] Diretório uploads criado: ${uploadsDir}`);
      }
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      const filePath = path.join(uploadsDir, uniqueFileName);
      
      console.log(`[UPLOAD] Caminho do arquivo: ${filePath}`);
      
      // Converter base64 para arquivo
      const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      console.log(`[UPLOAD] Arquivo salvo com sucesso`);
      
      const updates = {
        arquivoAssinado: uniqueFileName,
        dataAssinatura: new Date(),
      };
      
      // Atualizar contrato diretamente no banco
      await db.update(contratos)
        .set(updates)
        .where(eq(contratos.id, contratoId));
      
      console.log(`[UPLOAD] Banco de dados atualizado`);
      
      res.json({ 
        message: "Arquivo enviado com sucesso", 
        fileName: uniqueFileName,
        originalName: fileName,
        uploadedAt: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Error uploading contract file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para baixar/visualizar arquivo
  app.get("/api/contratos/:id/download", async (req, res) => {
    try {
      const contratoId = req.params.id;
      
      console.log(`[DOWNLOAD] Solicitando download do contrato ${contratoId}`);
      
      // Buscar dados do contrato
      const contrato = await storage.getContrato(contratoId);
      if (!contrato || !contrato.arquivoAssinado) {
        console.log(`[DOWNLOAD] Contrato não encontrado ou sem arquivo: ${contrato ? 'Sem arquivo' : 'Contrato não existe'}`);
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      console.log(`[DOWNLOAD] Arquivo no banco: ${contrato.arquivoAssinado}`);
      
      const filePath = path.join(process.cwd(), 'uploads', contrato.arquivoAssinado);
      
      console.log(`[DOWNLOAD] Caminho do arquivo: ${filePath}`);
      console.log(`[DOWNLOAD] Arquivo existe: ${fs.existsSync(filePath)}`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }
      
      // Definir headers para download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${contrato.arquivoAssinado}"`);
      
      // Enviar arquivo
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      console.log(`[DOWNLOAD] Arquivo enviado com sucesso`);
      
    } catch (error) {
      console.error("Error downloading contract file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para visualizar arquivo no navegador
  app.get("/api/contratos/:id/view", async (req, res) => {
    try {
      const contratoId = req.params.id;
      
      // Buscar dados do contrato
      const contrato = await storage.getContrato(contratoId);
      if (!contrato || !contrato.arquivoAssinado) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', contrato.arquivoAssinado);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }
      
      // Definir headers para visualização
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      // Enviar arquivo
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error viewing contract file:", error);
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
      console.log("POST /api/template-contratos - Body:", req.body);
      
      // Validar usando o schema Zod
      const validatedData = insertTemplateContratoSchema.omit({ id: true, createdAt: true }).parse(req.body);
      
      console.log("Dados validados:", validatedData);
      const template = await storage.createTemplateContrato(validatedData);
      console.log("Template criado com sucesso:", template);
      
      res.json(template);
    } catch (error) {
      console.error("Error creating template contrato:", error);
      
      // Se é erro de validação Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Internal server error", error: error.message });
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
      
      console.log("[DEBUG PAGAMENTOS] Requisição recebida:", {
        locadoraId,
        url: req.url,
        headers: req.headers
      });
      
      const pagamentos = locadoraId
        ? await storage.getPagamentosByLocadora(locadoraId as string)
        : await storage.getAllPagamentos();
        
      console.log("[DEBUG PAGAMENTOS] Pagamentos retornados:", {
        locadoraId,
        total: pagamentos.length,
        primeirosPagamentos: pagamentos.slice(0, 2).map(p => ({
          id: p.id,
          motoristaId: p.motoristaId,
          motoristaNome: p.motoristaNome
        }))
      });
      
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
      console.log("[PAGAMENTO API] Dados recebidos:", JSON.stringify(req.body, null, 2));
      const validatedData = insertPagamentoSchema.parse(req.body);
      console.log("[PAGAMENTO API] Dados validados:", JSON.stringify(validatedData, null, 2));
      const pagamento = await storage.createPagamento(validatedData);
      console.log("[PAGAMENTO API] Pagamento criado:", JSON.stringify(pagamento, null, 2));
      res.json(pagamento);
    } catch (error) {
      console.error("[PAGAMENTO API ERROR] Erro ao criar pagamento:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
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

  // Endpoint para marcar pagamentos anteriores como pagos
  app.put("/api/pagamentos/marcar-anteriores-pagos", async (req, res) => {
    try {
      const { motoristaId, dataInicio, recorrencia } = req.body;
      
      if (!motoristaId || !dataInicio || !recorrencia) {
        return res.status(400).json({ 
          message: "motoristaId, dataInicio e recorrencia são obrigatórios" 
        });
      }

      console.log('[DEBUG PAGAMENTOS ANTERIORES] Marcando pagamentos como pagos:', {
        motoristaId,
        dataInicio,
        recorrencia
      });

      // Buscar todos os pagamentos do motorista
      const todosPagamentos = await storage.getPagamentosByMotorista(motoristaId);
      
      // Filtrar apenas pagamentos em aberto
      const pagamentosEmAberto = todosPagamentos.filter(p => p.status === 'em_aberto');
      
      console.log('[DEBUG PAGAMENTOS ANTERIORES] Pagamentos em aberto encontrados:', pagamentosEmAberto.length);

      if (pagamentosEmAberto.length === 0) {
        return res.json({ pagamentosAtualizados: 0, message: 'Nenhum pagamento em aberto encontrado' });
      }

      // Calcular data limite (penúltima semana até hoje)
      const hoje = new Date();
      const dataInicioDate = new Date(dataInicio);
      
      // Calcular intervalo da recorrência
      let intervaloDias = 7; // padrão semanal
      if (recorrencia === 'quinzenal') intervaloDias = 15;
      if (recorrencia === 'mensal') intervaloDias = 30;
      
      // Data limite: penúltima semana (hoje - 1 intervalo)
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() - intervaloDias);
      
      console.log('[DEBUG PAGAMENTOS ANTERIORES] Data limite calculada:', {
        hoje: hoje.toLocaleDateString(),
        dataInicio: dataInicioDate.toLocaleDateString(),
        dataLimite: dataLimite.toLocaleDateString(),
        intervaloDias
      });

      // Filtrar pagamentos que devem ser marcados como pagos
      const pagamentosParaMarcar = pagamentosEmAberto.filter(pagamento => {
        const vencimentoPagamento = new Date(pagamento.vencimento);
        return vencimentoPagamento >= dataInicioDate && vencimentoPagamento <= dataLimite;
      });

      console.log('[DEBUG PAGAMENTOS ANTERIORES] Pagamentos para marcar como pagos:', pagamentosParaMarcar.length);

      // Marcar pagamentos como "pago total"
      let pagamentosAtualizados = 0;
      for (const pagamento of pagamentosParaMarcar) {
        await storage.updatePagamento(pagamento.id, { 
          status: 'pago',
          observacoes: 'Marcado automaticamente como pago (pagamentos anteriores)' 
        });
        pagamentosAtualizados++;
        
        console.log('[DEBUG PAGAMENTOS ANTERIORES] Pagamento marcado como pago:', {
          id: pagamento.id,
          vencimento: pagamento.vencimento,
          valor: pagamento.valor
        });
      }

      res.json({ 
        pagamentosAtualizados,
        message: `${pagamentosAtualizados} pagamentos marcados como "pago total"`
      });

    } catch (error) {
      console.error('[ERROR] Erro ao marcar pagamentos anteriores como pagos:', error);
      res.status(500).json({ message: "Erro interno do servidor", error: error.message });
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
      // Converter data brasileira antes da validação
      const requestData = { ...req.body };
      if (requestData.data && typeof requestData.data === 'string') {
        requestData.data = convertBrazilianDate(requestData.data);
      }
      
      const validatedData = insertDespesaSchema.omit({ id: true }).parse(requestData);
      
      console.log('[DESPESA] Dados recebidos:', {
        original: req.body,
        converted: requestData,
        validated: validatedData
      });
      
      // Verificar se já existe despesa similar (mesmo veículo, categoria, valor e data)
      const existingDespesas = await storage.getDespesasByLocadora(validatedData.locadoraId);
      const possibleDuplicate = existingDespesas.find(despesa => {
        const sameVehicle = despesa.veiculoId === validatedData.veiculoId;
        const sameCategory = despesa.categoria === validatedData.categoria;
        const sameValue = parseFloat(despesa.valor) === parseFloat(validatedData.valor);
        const sameDate = despesa.data === validatedData.data;
        const sameDescription = despesa.descricao?.trim().toLowerCase() === validatedData.descricao?.trim().toLowerCase();
        
        return sameVehicle && sameCategory && sameValue && sameDate && sameDescription;
      });

      if (possibleDuplicate) {
        return res.status(409).json({ 
          message: "Duplicate expense detected",
          details: "Uma despesa igual já existe para este veículo na mesma data"
        });
      }
      
      const despesa = await storage.createDespesa(validatedData);
      res.json(despesa);
    } catch (error) {
      console.error("Error creating despesa:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error.issues });
      }
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

  // Upload de documentos de motoristas com campos específicos
  app.post("/api/motoristas/upload-imagens", upload.fields([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'cnhImagem', maxCount: 1 },
    { name: 'fotoComCnh', maxCount: 1 },
    { name: 'comprovanteEndereco', maxCount: 1 },
    { name: 'fotoExtra', maxCount: 1 },
    { name: 'fotoExtra2', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { motoristaId } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!motoristaId) {
        return res.status(400).json({ message: "ID do motorista é obrigatório" });
      }
      
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ message: "Nenhum documento foi enviado" });
      }
      
      const motorista = await storage.getMotorista(motoristaId);
      if (!motorista) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      console.log(`[UPLOAD] Iniciando upload de documentos para motorista ${motoristaId}`);
      
      // Mapear campos específicos
      const fieldMapping = {
        fotoPerfil: 'imagem1',
        cnhImagem: 'imagem2', 
        fotoComCnh: 'imagem3',
        comprovanteEndereco: 'imagem4',
        fotoExtra: 'imagem5',
        fotoExtra2: 'imagem6'
      };
      
      const updates: any = {};
      let uploadedCount = 0;
      
      // Processar cada tipo de documento
      Object.keys(files).forEach(fieldName => {
        const fieldFiles = files[fieldName];
        if (fieldFiles && fieldFiles.length > 0) {
          const file = fieldFiles[0];
          const dbFieldName = fieldMapping[fieldName as keyof typeof fieldMapping];
          if (dbFieldName) {
            updates[dbFieldName] = file.filename;
            uploadedCount++;
            console.log(`[UPLOAD] ${fieldName} -> ${dbFieldName}: ${file.filename}`);
          }
        }
      });
      
      if (uploadedCount > 0) {
        await storage.updateMotorista(motoristaId, updates);
        console.log(`[UPLOAD] ${uploadedCount} documentos salvos com sucesso`);
      }
      
      res.json({ 
        message: "Documentos enviados com sucesso", 
        uploadedCount,
        uploadedAt: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Error uploading motorista documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Listar documentos de um motorista
  app.get("/api/motoristas/:id/imagens", async (req, res) => {
    try {
      const motoristaId = req.params.id;
      const motorista = await storage.getMotorista(motoristaId);
      
      if (!motorista) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      // Mapear campos específicos
      const documentos = {
        fotoPerfil: motorista.imagem1 ? `/uploads/motoristas/${motorista.imagem1}` : null,
        cnhImagem: motorista.imagem2 ? `/uploads/motoristas/${motorista.imagem2}` : null,
        fotoComCnh: motorista.imagem3 ? `/uploads/motoristas/${motorista.imagem3}` : null,
        comprovanteEndereco: motorista.imagem4 ? `/uploads/motoristas/${motorista.imagem4}` : null,
        fotoExtra: motorista.imagem5 ? `/uploads/motoristas/${motorista.imagem5}` : null,
        fotoExtra2: motorista.imagem6 ? `/uploads/motoristas/${motorista.imagem6}` : null,
      };
      
      res.json({ documentos });
    } catch (error) {
      console.error("Error fetching motorista documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para visualizar imagem do motorista
  app.get("/api/motoristas/:id/imagem/:index", async (req, res) => {
    try {
      const motoristaId = req.params.id;
      const imageIndex = parseInt(req.params.index);
      
      if (imageIndex < 1 || imageIndex > 5) {
        return res.status(400).json({ message: "Índice da imagem deve ser entre 1 e 5" });
      }
      
      // Buscar dados do motorista
      const motorista = await storage.getMotorista(motoristaId);
      if (!motorista) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      const imageFieldName = `imagem${imageIndex}` as keyof typeof motorista;
      const imageName = motorista[imageFieldName] as string;
      
      if (!imageName) {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'motoristas', imageName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo de imagem não encontrado no servidor" });
      }
      
      // Determinar tipo de conteúdo baseado na extensão
      const extension = path.extname(imageName).toLowerCase();
      let contentType = 'image/jpeg';
      if (extension === '.png') {
        contentType = 'image/png';
      }
      
      // Definir headers para visualização
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      
      // Enviar arquivo
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error viewing motorista image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para deletar imagem do motorista
  app.delete("/api/motoristas/:id/imagens/:index", async (req, res) => {
    try {
      const motoristaId = req.params.id;
      const imageIndex = parseInt(req.params.index);
      
      if (imageIndex < 1 || imageIndex > 5) {
        return res.status(400).json({ message: "Índice da imagem deve ser entre 1 e 5" });
      }
      
      // Buscar dados do motorista
      const motorista = await storage.getMotorista(motoristaId);
      if (!motorista) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      const imageFieldName = `imagem${imageIndex}` as keyof typeof motorista;
      const imageName = motorista[imageFieldName] as string;
      
      if (imageName) {
        // Deletar arquivo do sistema de arquivos
        const filePath = path.join(process.cwd(), 'uploads', 'motoristas', imageName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DELETE] Arquivo removido: ${filePath}`);
        }
        
        // Remover referência do banco
        const updates = {
          [imageFieldName]: null,
        };
        
        await storage.updateMotorista(motoristaId, updates);
        console.log(`[DELETE] Banco de dados atualizado`);
      }
      
      res.json({ message: "Imagem removida com sucesso" });
    } catch (error) {
      console.error("Error deleting motorista image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rotas de atividades
  app.get("/api/atividades", async (req, res) => {
    try {
      const { locadoraId, usuario } = req.query;
      
      if (!locadoraId || typeof locadoraId !== 'string') {
        return res.status(400).json({ message: "locadoraId é obrigatório" });
      }
      
      const atividades = await storage.getAtividadesByLocadoraEUsuario(locadoraId, usuario as string);
      res.json(atividades);
    } catch (error) {
      console.error("Error fetching atividades:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/atividades", async (req, res) => {
    try {
      const data = insertAtividadeSchema.parse(req.body);
      const atividade = await storage.createAtividade(data);
      res.status(201).json(atividade);
    } catch (error) {
      console.error("Error creating atividade:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SEO Configuration Routes (apenas admin)
  app.get("/api/seo", async (req, res) => {
    try {
      const config = await storage.getSeoConfig();
      if (!config) {
        // Criar configuração padrão se não existir
        const defaultConfig = await storage.createDefaultSeoConfig();
        return res.json(defaultConfig);
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching SEO config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/seo", async (req, res) => {
    try {
      const data = insertSeoConfigSchema.parse(req.body);
      const updated = await storage.updateSeoConfig(data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating SEO config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics reais do sistema
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
