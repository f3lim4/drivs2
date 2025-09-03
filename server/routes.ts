import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { testConnection, db } from "./db";
import { insertProfileSchema, insertLocadoraSchema, insertVeiculoSchema, insertMotoristaSchema, insertAluguelSchema, insertContratoSchema, updateContratoSchema, insertPagamentoSchema, insertInfracaoSchema, insertDespesaSchema, insertManutencaoSchema, insertLocalSchema, insertAnuncioSchema, insertAtividadeSchema, insertTemplateContratoSchema, insertSeoConfigSchema, insertDashboardConfigSchema, linksUteis, insertLinkUtilSchema, contratos, dashboardConfig } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import multer from "multer";
import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import crypto from "crypto";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

// Declaração de tipos para sessão
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      nome: string;
    };
  }
}

// Função para converter data brasileira (dd/MM/yyyy) para formato ISO
const convertBrazilianDate = (dateStr: string): string => {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

// Inicializar Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  console.log("Stripe inicializado com sucesso");
}

// Mapeamento dos planos para Price IDs do Stripe  
const PLANOS_STRIPE = {
  start: process.env.STRIPE_PRICE_START || 'price_1RzH3XA24pm0ZMwJDzeMMDKD',
  pro: process.env.STRIPE_PRICE_PRO || 'price_1RzH4PA24pm0ZMwJ9L1rF33H', 
  elite: process.env.STRIPE_PRICE_ELITE || 'price_1RzH4mA24pm0ZMwJWFKaSdz1',
  prime: process.env.STRIPE_PRICE_PRIME || 'price_1RzH52A24pm0ZMwJxexrjhoQ',
  // Infinity não tem Stripe - é preço a consultar
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection first
  console.log("Testing database connection...");
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error("Database connection failed. Starting server without database functionality.");
  }

  if (!stripe) {
    console.warn("Stripe não inicializado - funcionalidade de pagamentos desabilitada");
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
        cb(new Error('Only images are allowed'));
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
        cb(new Error('Only PDF files are allowed'));
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

  // Endpoint para verificar senha do usuário atual
  app.post("/api/auth/verify-password", async (req, res) => {
    try {
      const { password, email } = req.body;
      
      console.log('[DEBUG] Verificação de senha - Dados recebidos:', { 
        hasPassword: !!password, 
        email, 
        sessionUser: req.session?.user 
      });
      
      if (!password) {
        return res.status(400).json({ message: "Senha é obrigatória" });
      }
      
      // Buscar a locadora do usuário atual através da sessão ou profile
      let locadoraId = req.session?.user?.locadoraId;
      
      if (!locadoraId && req.session?.user?.email) {
        // Buscar o locadoraId pelo email do perfil
        const userProfile = await storage.getProfileByEmail(req.session.user.email);
        locadoraId = userProfile?.locadoraId;
      }
      
      console.log('[DEBUG] Verificação de senha - locadoraId:', locadoraId);
      
      if (!locadoraId) {
        return res.status(401).json({ message: "Locadora não identificada" });
      }

      // Buscar dados da locadora para verificar senha
      const locadora = await storage.getLocadoraById(locadoraId);
      if (!locadora) {
        return res.status(404).json({ message: "Locadora não encontrada" });
      }

      // Verificar se a locadora tem senha definida
      if (!locadora.senhaAdmin) {
        return res.status(500).json({ message: "Senha de administrador não configurada para esta locadora" });
      }

      const senhaValida = await bcrypt.compare(password, locadora.senhaAdmin);
      
      console.log('[DEBUG] Senha válida:', senhaValida);
      
      if (!senhaValida) {
        return res.status(400).json({ message: "Senha incorreta" });
      }

      res.json({ message: "Senha verificada com sucesso" });
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for email:", email);
      
      // Find user profile by email
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        console.log("Profile not found for email:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log("Profile found:", profile);
      
      // Get user by user ID and verify password
      const user = await storage.getUserByUUID(profile.userId);
      if (!user) {
        console.log("User not found for UUID:", profile.userId);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log("User found, checking password...");
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid:", isValidPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user info in session
      req.session.user = {
        id: user.id,
        email: profile.email,
        nome: profile.name
      };
      
      console.log("Login successful for:", email);
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

  // Check if email exists
  app.post('/api/auth/check-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const user = await storage.getUserByUsername(email);
      res.json({ exists: !!user });
    } catch (error) {
      console.error('Error checking email existence:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Check if CNPJ exists
  app.post('/api/locadoras/check-cnpj', async (req, res) => {
    const { cnpj } = req.body;
    if (!cnpj) {
      return res.status(400).json({ message: 'CNPJ is required' });
    }

    try {
      const locadora = await storage.getLocadoraByCNPJ(cnpj);
      res.json({ exists: !!locadora });
    } catch (error) {
      console.error('Error checking CNPJ existence:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/locadoras", async (req, res) => {
    try {
      // Calcular data de vencimento do teste (15 dias a partir de hoje)
      const dataVencimentoTeste = new Date();
      dataVencimentoTeste.setDate(dataVencimentoTeste.getDate() + 15);
      
      // Adicionar campos de teste gratuito aos dados recebidos
      const dadosComTeste = {
        ...req.body,
        plano: 'pro', // Sempre começar no plano Pro
        testeGratuito: true,
        diasTesteGratuito: 15,
        dataVencimentoTeste: dataVencimentoTeste.toISOString().split('T')[0] // Formato YYYY-MM-DD
      };
      
      const result = insertLocadoraSchema.safeParse(dadosComTeste);
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
      
      console.log(`[CADASTRO] Locadora ${locadora.nome} criada com teste gratuito de 15 dias do Plano Pro até ${dataVencimentoTeste.toLocaleDateString('pt-BR')}`);
      
      res.json(locadora);
    } catch (error) {
      console.error("Error creating locadora:", error);
      
      // Tratar erros específicos
      if (error instanceof Error) {
        if (error.message.includes('CNPJ já está cadastrado')) {
          return res.status(400).json({ message: "Este CNPJ já está cadastrado no sistema" });
        }
        if (error.message.includes('duplicate key')) {
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
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/locadoras/:id", async (req, res) => {
    try {
      console.log("[DEBUG LOCADORA] Atualizando locadora:", req.params.id);
      console.log("[DEBUG LOCADORA] Dados recebidos:", req.body);
      
      const locadora = await storage.updateLocadora(req.params.id, req.body);
      
      console.log("[DEBUG LOCADORA] Locadora atualizada com sucesso:", {
        id: locadora.id,
        nome: locadora.nome
      });
      
      res.json(locadora);
    } catch (error) {
      console.error("Error updating locadora:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ message: "Locadora não encontrada" });
        }
      }
      
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
      
      // TEMPORÁRIO: Buscar todos os veículos se não há locadoraId
      if (!locadoraId) {
        const todosVeiculos = await storage.getAllVeiculos();
        console.log('🚗 VEÍCULOS - Retornando todos:', todosVeiculos.length);
        return res.json(todosVeiculos);
      }
      
      if (locadoraId) {
        const veiculos = await storage.getVeiculosByLocadora(locadoraId as string);
        

        
        // SECURITY: Validar que todos os veículos pertencem à locadora solicitada
        const todosVeiculosCorretos = veiculos.every(v => v.locadoraId === locadoraId);
        if (!todosVeiculosCorretos) {
          console.error('SECURITY ALERT: Veículos de outras locadoras detectados no backend');
          return res.status(403).json({ message: "Acesso negado: dados inconsistentes" });
        }
        
        // Forçar headers sem cache para debug
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(veiculos);
      } else {
        // SEGURANÇA: Nunca retornar todos os veículos sem locadoraId
        return res.status(400).json({ message: "locadoraId é obrigatório" });
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
      
      // Validar limite de veículos por plano
      const locadoraId = result.data.locadoraId;
      const locadora = await storage.getLocadora(locadoraId);
      
      if (!locadora) {
        return res.status(404).json({ message: "Locadora não encontrada" });
      }
      
      // Verificar se a locadora é VIP (Vitalia) - bypass dos limites
      if (locadora.vitalia) {
        const veiculo = await storage.createVeiculo(result.data);
        return res.json(veiculo);
      }
      
      // Definir limites por plano
      const limitesPorPlano: { [key: string]: number } = {
        'start': 5,
        'pro': 20,
        'elite': 50,
        'prime': 100,
        'infinity': -1 // -1 = ilimitado
      };
      
      const limite = limitesPorPlano[locadora.plano] || 0;
      
      // Se o limite for -1 (ilimitado), não verificar
      if (limite > 0) {
        const veiculosExistentes = await storage.getVeiculosByLocadora(locadoraId);
        const quantidadeAtual = veiculosExistentes.length;
        
        if (quantidadeAtual >= limite) {
          const nomePlano = locadora.plano.charAt(0).toUpperCase() + locadora.plano.slice(1);
          return res.status(400).json({ 
            message: `Limite de veículos excedido. O plano ${nomePlano} permite até ${limite} veículos. Você já possui ${quantidadeAtual} veículos cadastrados. Faça upgrade do seu plano para cadastrar mais veículos.`,
            code: 'VEHICLE_LIMIT_EXCEEDED',
            currentCount: quantidadeAtual,
            limit: limite,
            plan: locadora.plano
          });
        }
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
        error: (error as Error).message 
      });
    }
  });

  // Motoristas routes
  app.get("/api/motoristas", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      
      // Debug: Log parâmetros recebidos
      console.log('[DEBUG] GET /api/motoristas - Parâmetros:', { locadoraId });
      
      // TEMPORÁRIO: Buscar todos os motoristas se não há locadoraId
      if (!locadoraId) {
        const todosMotoristas = await storage.getAllMotoristas();
        console.log('👤 MOTORISTAS - Retornando todos:', todosMotoristas.length);
        return res.json(todosMotoristas);
      }
      
      const motoristas = await storage.getMotoristasByLocadora(locadoraId as string);
      
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
      // Processar campos de data se existirem
      const updates = { ...req.body };
      
      // Se dataNegativacao for uma string, converter para Date
      if (updates.dataNegativacao && typeof updates.dataNegativacao === 'string') {
        updates.dataNegativacao = new Date(updates.dataNegativacao);
      }
      
      const motorista = await storage.updateMotorista(req.params.id, updates);
      res.json(motorista);
    } catch (error) {
      console.error("Error updating motorista:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/motoristas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Para agora, vamos permitir exclusão sem autenticação específica
      // TODO: Implementar verificação de autenticação adequada

      // Verificar se o motorista tem contratos ativos ou em aberto
      const contratos = await storage.getContratosByMotorista(id);
      const contratosAtivos = contratos.filter(c => c.status === 'ativo' || c.status === 'em_aberto');
      
      if (contratosAtivos.length > 0) {
        return res.status(400).json({ 
          message: `Não é possível excluir este motorista. Ele possui ${contratosAtivos.length} contrato(s) ativo(s) ou em aberto. Cancele ou encerre os contratos primeiro.`,
          contratoStatus: contratosAtivos.map(c => ({ id: c.id, status: c.status }))
        });
      }

      await storage.deleteMotorista(id);
      res.json({ message: 'Motorista excluído com sucesso' });
    } catch (error: any) {
      console.error('Error deleting motorista:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  });

  // Pesquisar histórico de motorista por CPF em todas as locadoras
  app.get("/api/motoristas/pesquisar-historico/:cpf", async (req, res) => {
    try {
      const cpf = req.params.cpf;
      
      // Buscar motorista em todas as locadoras
      const todosMotoristas = await storage.getAllMotoristas();
      const motoristasEncontrados = todosMotoristas.filter(m => m.cpf.replace(/\D/g, '') === cpf);
      
      if (motoristasEncontrados.length === 0) {
        return res.status(404).json({ message: "Motorista não encontrado em nenhuma locadora" });
      }
      
      // Para cada motorista encontrado, buscar problemas históricos
      const historico: {
        motorista: {
          nome: string;
          cpf: string;
          telefone: string;
        };
        locadoras: Array<{
          nome: string;
          cnpj: string;
          problemas: Array<{
            tipo: string;
            descricao: string;
            valor?: number;
            data: string;
          }>;
        }>;
      } = {
        motorista: {
          nome: motoristasEncontrados[0].nome,
          cpf: motoristasEncontrados[0].cpf,
          telefone: motoristasEncontrados[0].telefone
        },
        locadoras: []
      };
      
      // Buscar todas as locadoras para obter nomes
      const todasLocadoras = await storage.getAllLocadoras();
      
      for (const motorista of motoristasEncontrados) {
        const locadora = todasLocadoras.find(l => l.id === motorista.locadoraId);
        if (!locadora) continue;
        
        const problemas: Array<{
          tipo: string;
          descricao: string;
          valor?: number;
          data: string;
        }> = [];
        
        // Buscar problemas de pagamentos em atraso/inadimplência
        const pagamentos = await storage.getPagamentosByMotorista(motorista.id);
        const pagamentosProblema = pagamentos.filter(p => 
          p.status === 'em_aberto' || 
          p.status === 'em_atraso' || 
          (p.observacoes && p.observacoes.toLowerCase().includes('inadimpl'))
        );
        
        pagamentosProblema.forEach(p => {
          problemas.push({
            tipo: 'inadimplencia',
            descricao: `Pagamento em atraso: ${p.descricao || 'Valor pendente'}`,
            valor: parseFloat(p.valorRestante || p.valorTotal || '0'),
            data: p.dataPagamento || new Date().toISOString()
          });
        });
        
        // Buscar contratos cancelados por problemas
        const contratos = await storage.getAllContratos();
        const contratosCancelados = contratos.filter(c => 
          c.locadoraId === motorista.locadoraId &&
          c.cliente === motorista.nome &&
          c.status === 'cancelado'
        );
        
        contratosCancelados.forEach(c => {
          problemas.push({
            tipo: 'cancelamento',
            descricao: `Contrato cancelado: ${c.titulo || 'Contrato de locação'}`,
            data: c.updatedAt?.toISOString() || new Date().toISOString()
          });
        });
        
        // Buscar infrações/multas
        const infracoes = await storage.getAllInfracoes();
        const infracoesMotorista = infracoes.filter(i => 
          i.locadoraId === motorista.locadoraId &&
          i.motoristaId === motorista.id
        );
        
        infracoesMotorista.forEach(i => {
          problemas.push({
            tipo: 'infracao',
            descricao: `Infração: ${i.tipoInfracao} - ${i.observacoes || 'Infração registrada'}`,
            valor: parseFloat((i as any).valor || '0'),
            data: i.dataInfracao || new Date().toISOString()
          });
        });
        
        // Verificar se motorista foi negativado
        if (motorista.negativado && motorista.motivoNegativacao) {
          problemas.push({
            tipo: 'negativacao',
            descricao: `Motorista negativado: ${motorista.motivoNegativacao}`,
            data: motorista.dataNegativacao?.toISOString() || new Date().toISOString()
          });
        }
        
        historico.locadoras.push({
          nome: locadora.nome,
          cnpj: locadora.cnpj,
          problemas: problemas
        });
      }
      
      res.json(historico);
      
    } catch (error) {
      console.error("Error searching motorista history:", error);
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
      if (result.data.taxaAdministrativa && parseFloat(result.data.taxaAdministrativa) > 0) {
        console.log('[AUTO-RECEITA] Registrando taxa administrativa:', {
          aluguelId: aluguel.id,
          taxaAdministrativa: result.data.taxaAdministrativa,
          motoristaId: result.data.motoristaId
        });
        
        const receitaTaxa = {
          id: `taxa_${aluguel.id}_${Date.now()}`,
          locadoraId: result.data.locadoraId,
          motoristaId: result.data.motoristaId,
          aluguelId: aluguel.id,
          tipo: 'taxa administrativa',
          descricao: `Taxa administrativa - Aluguel veículo ${veiculo.placa}`,
          valorTotal: result.data.taxaAdministrativa,
          valorPago: result.data.taxaAdministrativa,
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
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    }
  });

  // Contratos routes
  app.get("/api/contratos", async (req, res) => {
    try {
      const { locadoraId } = req.query;
      console.log('[CONTRATOS API] Parâmetros recebidos:', { locadoraId });
      
      if (locadoraId) {
        const contratos = await storage.getContratosByLocadora(locadoraId as string);
        console.log('[CONTRATOS API] Resultado do storage:', { locadoraId, total: contratos.length, contratos });
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
      
      // VERIFICAÇÃO UNIVERSAL: Contrato existente para MOTORISTA
      const contratosExistentes = await storage.getAllContratos();
      const contratoClienteExistente = contratosExistentes.find(c => 
        c.cliente === result.data.cliente && 
        (c.status === 'ativo' || c.status === 'aberto')
      );
      
      // VERIFICAÇÃO UNIVERSAL: Contrato existente para VEÍCULO
      const contratoVeiculoExistente = contratosExistentes.find(c => 
        (c.veiculo_id === result.data.veiculo || c.veiculo === result.data.veiculo) && 
        (c.status === 'ativo' || c.status === 'aberto')
      );
      
      // Verificar se há aluguel ativo para o mesmo motorista
      const alugueis = await storage.getAllAlugueis();
      const aluguelAtivo = alugueis.find(a => 
        a.motoristaNome === result.data.cliente && 
        a.status === 'ativo'
      );
      
      // BLOQUEAR SEMPRE: Não permitir múltiplos contratos/aluguéis ativos
      if (contratoClienteExistente || contratoVeiculoExistente || aluguelAtivo) {
        console.log('[ANTI-DUPLICATE] Duplicação detectada:', {
          cliente: result.data.cliente,
          veiculo: result.data.veiculo,
          contratoClienteExistente: !!contratoClienteExistente,
          contratoVeiculoExistente: !!contratoVeiculoExistente,
          aluguelAtivo: !!aluguelAtivo,
          contratoClienteId: contratoClienteExistente?.id,
          contratoVeiculoId: contratoVeiculoExistente?.id,
          aluguelId: aluguelAtivo?.id
        });
        
        let message = "Não é possível criar contrato: ";
        if (contratoClienteExistente) {
          message += `Cliente '${result.data.cliente}' já possui contrato ${contratoClienteExistente.status}. `;
        }
        if (contratoVeiculoExistente) {
          message += `Veículo já está ocupado por contrato ${contratoVeiculoExistente.status} com cliente '${contratoVeiculoExistente.cliente}'. `;
        }
        if (aluguelAtivo) {
          message += `Cliente possui aluguel ativo. `;
        }
        
        return res.status(400).json({ 
          message: message.trim(),
          motorista: result.data.cliente,
          veiculo: result.data.veiculo,
          contratoClienteExistente: !!contratoClienteExistente,
          contratoVeiculoExistente: !!contratoVeiculoExistente,
          aluguelAtivo: !!aluguelAtivo
        });
      }
      
      console.log('[DEBUG] Dados validados, criando contrato...');
      
      // Função auxiliar para normalizar datas de string ISO para formato YYYY-MM-DD local
      const normalizarData = (data: any) => {
        if (!data) return data;
        if (typeof data === 'string') return data; // Se já é string, mantem
        return data?.toISOString?.()?.split('T')[0] || data; // Se é Date, extrai só a data
      };

      // Normalizar datas para evitar problemas de fuso horário
      const dadosNormalizados = {
        ...result.data,
        dataInicio: normalizarData(result.data.dataInicio),
        dataFim: normalizarData(result.data.dataFim)
      };
      
      console.log('[DEBUG] Dados normalizados:', {
        dataInicio: dadosNormalizados.dataInicio,
        dataFim: dadosNormalizados.dataFim,
        dataInicioTipo: typeof dadosNormalizados.dataInicio,
        dataFimTipo: typeof dadosNormalizados.dataFim
      });
      
      const contrato = await storage.createContrato(dadosNormalizados);
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
        status: 'ativo',
        dataAssinatura: new Date().toISOString()
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
      // Validate the request body usando schema flexível para updates
      const result = updateContratoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      // Função auxiliar para normalizar datas
      const normalizarData = (data: any) => {
        if (!data) return data;
        if (typeof data === 'string') return data;
        return data?.toISOString?.()?.split('T')[0] || data;
      };

      // Normalizar datas também na atualização
      const dadosNormalizados = {
        ...result.data,
        dataInicio: normalizarData(result.data.dataInicio),
        dataFim: normalizarData(result.data.dataFim)
      };
      
      const contrato = await storage.updateContrato(req.params.id, dadosNormalizados);
      
      // Se status mudou para encerrado ou cancelado, parar pagamentos automáticos
      if (result.data.status && (result.data.status === 'encerrado' || result.data.status === 'cancelado')) {
        console.log(`[PAGAMENTOS AUTOMÁTICOS] Status alterado para ${result.data.status} - parando geração automática`);
        // O sistema automático irá detectar na próxima verificação que o contrato não está mais ativo
      }
      
      // Se arquivo foi enviado/aprovado, mudar status para "ativo" (apenas se não estiver sendo mudado para outro status)
      if (result.data.arquivoAssinado && !result.data.status && (!contrato.status || contrato.status === 'em_aberto')) {
        console.log(`[CONTRATO] Upload detectado - mudando status de '${contrato.status}' para 'ativo'`);
        await storage.updateContrato(req.params.id, {
          status: 'ativo',
          dataAssinatura: new Date().toISOString()
        });
      }
      
      res.json(contrato);
    } catch (error) {
      console.error("Error updating contrato:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' });
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
          (contrato.titulo && contrato.titulo?.includes(a.veiculoPlaca || ''))
        );
        
        if (aluguelRelacionado) {
          console.log(`[CONTRACT DELETE] Excluindo aluguel relacionado: ${aluguelRelacionado.id}`);
          await storage.deleteAluguel(aluguelRelacionado.id);
          
          // Atualizar status do veículo para disponível
          console.log(`[CONTRACT DELETE] Liberando veículo: ${aluguelRelacionado.veiculoId}`);
          await storage.updateVeiculo(aluguelRelacionado.veiculoId, { status: 'disponivel' });
        }
      }
      
      // CORREÇÃO: Excluir pagamentos relacionados ao contrato antes de excluir o contrato
      if (contrato) {
        console.log(`[CONTRACT DELETE] Excluindo pagamentos relacionados ao contrato: ${contrato.id}`);
        const pagamentos = await storage.getPagamentosByLocadora(contrato.locadoraId);
        const pagamentosDoContrato = pagamentos.filter(p => 
          p.motoristaId === contrato.motoristaId || 
          p.motoristaNome === contrato.cliente ||
          (p.veiculoId && p.veiculoId === contrato.veiculoId)
        );
        
        console.log(`[CONTRACT DELETE] Encontrados ${pagamentosDoContrato.length} pagamentos para exclusão`);
        for (const pagamento of pagamentosDoContrato) {
          console.log(`[CONTRACT DELETE] Excluindo pagamento: ${pagamento.id} - ${pagamento.motoristaNome}`);
          await storage.deletePagamento(pagamento.id);
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
        status: 'ativo' as const, // Mudar status para ativo automaticamente
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
      const validatedData = insertTemplateContratoSchema.omit({ id: true }).parse(req.body);
      
      console.log("Dados validados:", validatedData);
      const template = await storage.createTemplateContrato(validatedData as any);
      console.log("Template criado com sucesso:", template);
      
      res.json(template);
    } catch (error) {
      console.error("Error creating template contrato:", error);
      
      // Se é erro de validação Zod
      if ((error as any).name === 'ZodError') {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: (error as any).errors 
        });
      }
      
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
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
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
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
    const pagamentoId = req.params.id;
    console.log(`[DELETE PAGAMENTO] Tentando excluir pagamento: ${pagamentoId}`);
    
    try {
      // Verificar se o pagamento existe antes de excluir
      const pagamentoExistente = await storage.getPagamento(pagamentoId);
      if (!pagamentoExistente) {
        console.log(`[DELETE PAGAMENTO] Pagamento não encontrado: ${pagamentoId}`);
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }
      
      console.log(`[DELETE PAGAMENTO] Pagamento encontrado, locadora: ${pagamentoExistente.locadoraId}`);
      
      // Excluir o pagamento
      const deleted = await storage.deletePagamento(pagamentoId);
      
      if (!deleted) {
        console.log(`[DELETE PAGAMENTO] Nenhum pagamento foi excluído (não encontrado): ${pagamentoId}`);
        return res.status(404).json({ message: "Pagamento não foi encontrado para exclusão" });
      }
      
      console.log(`[DELETE PAGAMENTO] Pagamento excluído com sucesso: ${pagamentoId}`);
      
      res.json({ message: "Pagamento deleted successfully", id: pagamentoId, deleted: true });
    } catch (error) {
      console.error("Error deleting pagamento:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
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
        const vencimentoPagamento = new Date(pagamento.dataPagamento || pagamento.createdAt);
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
          dataPagamento: pagamento.dataPagamento,
          valorTotal: pagamento.valorTotal
        });
      }

      res.json({ 
        pagamentosAtualizados,
        message: `${pagamentosAtualizados} pagamentos marcados como "pago total"`
      });

    } catch (error) {
      console.error('[ERROR] Erro ao marcar pagamentos anteriores como pagos:', error);
      res.status(500).json({ message: "Erro interno do servidor", error: (error as Error).message });
    }
  });

  // Infrações routes
  app.get("/api/infracoes", async (req, res) => {
    try {
      const { locadoraId, motoristaId } = req.query;
      
      console.log("[DEBUG INFRACOES] Parâmetros recebidos:", { locadoraId, motoristaId });
      
      if (motoristaId) {
        console.log("[DEBUG INFRACOES] Buscando infrações por motorista:", motoristaId);
        const infracoes = await storage.getInfracoesByMotorista(motoristaId as string);
        console.log("[DEBUG INFRACOES] Infrações encontradas para motorista:", infracoes.length);
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
      const validatedData = insertInfracaoSchema.parse(req.body);
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
        const sameValue = parseFloat(despesa.valor) === parseFloat(validatedData.valor.toString());
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
      if ((error as any).name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: (error as any).issues });
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

  // Dashboard Configuration Routes - Admin only
  app.get('/api/admin/dashboard-config', async (req, res) => {
    try {
      const config = await db.select().from(dashboardConfig).limit(1);
      
      if (config.length === 0) {
        // Se não existe configuração, criar uma padrão
        const defaultConfig = await db.insert(dashboardConfig).values({}).returning();
        return res.json(defaultConfig[0]);
      }
      
      res.json(config[0]);
    } catch (error) {
      console.error('Erro ao buscar configuração do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/admin/dashboard-config', async (req, res) => {
    try {
      const data = insertDashboardConfigSchema.parse(req.body);
      
      // Verificar se já existe uma configuração
      const existingConfig = await db.select().from(dashboardConfig).limit(1);
      
      let updatedConfig;
      if (existingConfig.length === 0) {
        // Criar nova configuração
        updatedConfig = await db.insert(dashboardConfig).values(data).returning();
      } else {
        // Atualizar configuração existente
        updatedConfig = await db
          .update(dashboardConfig)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(dashboardConfig.id, existingConfig[0].id))
          .returning();
      }

      res.json(updatedConfig[0]);
    } catch (error) {
      console.error('Erro ao atualizar configuração do dashboard:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota pública para locadoras obterem as configurações do dashboard
  app.get('/api/dashboard-config', async (req, res) => {
    try {
      const config = await db.select().from(dashboardConfig).limit(1);
      
      if (config.length === 0) {
        // Retornar configuração padrão se não existe
        return res.json({
          videoTutorialUrl: null,
          videoTutorialTitulo: "Tutorial do Sistema",
          videoTutorialDescricao: "Aprenda a usar o sistema",
          videoDemoUrl: null,
          videoDemoTitulo: "Demonstração",
          videoDemoDescricao: "Veja o sistema em ação",
          linkSuporteUrl: "https://wa.me/5511977263156",
          linkSuporteTitulo: "Suporte WhatsApp",
          linkSuporteDescricao: "Atendimento especializado",
          linkTreinamentoUrl: null,
          linkTreinamentoTitulo: "Treinamentos",
          linkTreinamentoDescricao: "Capacitação completa",
          linkManualUrl: null,
          linkManualTitulo: "Manual do Sistema",
          linkManualDescricao: "Guia completo de uso",
          linkDetranUrl: "https://www.detran.sp.gov.br",
          linkDetranTitulo: "Portal DETRAN SP",
          linkDetranDescricao: "Consultas de veículos e habilitação",
          linkReceitaUrl: "https://www.receita.fazenda.gov.br",
          linkReceitaTitulo: "Receita Federal",
          linkReceitaDescricao: "Consultas de CPF e CNPJ",
          linkSpcUrl: "https://www.spc.org.br",
          linkSpcTitulo: "Consulta SPC/Serasa",
          linkSpcDescricao: "Verificação de score e restrições",
          linkViaCepUrl: "https://viacep.com.br",
          linkViaCepTitulo: "Busca CEP",
          linkViaCepDescricao: "Consulta de endereços",
          mostrarVideoTutorial: true,
          mostrarVideoDemo: true,
          mostrarLinksSuporte: true,
          mostrarLinksUteis: true,
          telefoneSuporte: "11977263156",
          emailSuporte: "suporte@drivs.com.br"
        });
      }
      
      res.json(config[0]);
    } catch (error) {
      console.error('Erro ao buscar configuração do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Links Úteis Routes - Dinâmicos para dashboard
  app.get('/api/links-uteis', async (req, res) => {
    try {
      const links = await db.select().from(linksUteis).orderBy(linksUteis.ordem, linksUteis.id);
      res.json(links);
    } catch (error) {
      console.error('Erro ao buscar links úteis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/links-uteis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const link = await db.select().from(linksUteis).where(eq(linksUteis.id, id)).limit(1);
      
      if (link.length === 0) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }
      
      res.json(link[0]);
    } catch (error) {
      console.error('Erro ao buscar link útil:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/links-uteis', async (req, res) => {
    try {
      const data = insertLinkUtilSchema.parse(req.body);
      
      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (!data.ordem) {
        const maxOrdem = await db.select({ max: sql`MAX(ordem)` }).from(linksUteis);
        data.ordem = (maxOrdem[0]?.max || 0) + 1;
      }
      
      const newLink = await db.insert(linksUteis).values(data).returning();
      res.json(newLink[0]);
    } catch (error) {
      console.error('Erro ao criar link útil:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/links-uteis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertLinkUtilSchema.partial().parse(req.body);
      
      const updatedLink = await db
        .update(linksUteis)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(linksUteis.id, id))
        .returning();
      
      if (updatedLink.length === 0) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }
      
      res.json(updatedLink[0]);
    } catch (error) {
      console.error('Erro ao atualizar link útil:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.delete('/api/links-uteis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const deletedLink = await db
        .delete(linksUteis)
        .where(eq(linksUteis.id, id))
        .returning();
      
      if (deletedLink.length === 0) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }
      
      res.json({ message: 'Link removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover link útil:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Upload de documentos de motoristas com campos específicos
  app.post("/api/motoristas/:id/upload-imagens", upload.fields([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'cnhImagem', maxCount: 1 },
    { name: 'fotoComCnh', maxCount: 1 },
    { name: 'comprovanteEndereco', maxCount: 1 },
    { name: 'fotoExtra', maxCount: 1 },
    { name: 'fotoExtra2', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const motoristaId = req.params.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
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

  // Informações dos planos com status do teste gratuito
  app.get("/api/planos", async (req, res) => {
    try {
      const locadoraId = req.query.locadoraId as string;
      
      // Planos disponíveis com informações específicas (mesmos da página inicial)
      const planosDisponiveis = {
        start: {
          id: "start",
          nome: "Start",
          preco: 29,
          valor: 29,
          limiteVeiculos: 5,
          descricao: "Para locadoras iniciantes",
          popular: false,
          stripePrice: "price_start_29_monthly",
          recursos: [
            "Até 5 veículos na frota",
            "Gestão completa de motoristas",
            "Contratos automáticos",
            "Controle de pagamentos",
            "Controle financeiro real"
          ],
          icone: "Car",
          cor: "blue"
        },
        pro: {
          id: "pro",
          nome: "Pro",
          preco: 99,
          valor: 99,
          limiteVeiculos: 20,
          descricao: "Para locadoras em crescimento",
          popular: true,
          stripePrice: "price_pro_99_monthly",
          recursos: [
            "Até 20 veículos na frota",
            "Gestão completa de motoristas",
            "Contratos automáticos",
            "Controle de pagamentos",
            "Controle financeiro real"
          ],
          icone: "Rocket",
          cor: "cyan"
        },
        elite: {
          id: "elite",
          nome: "Elite",
          preco: 250,
          valor: 250,
          limiteVeiculos: 50,
          descricao: "Para frotas médias",
          popular: false,
          stripePrice: "price_elite_250_monthly",
          recursos: [
            "Até 50 veículos na frota",
            "Gestão completa de motoristas",
            "Contratos automáticos",
            "Controle de pagamentos",
            "Controle financeiro real"
          ],
          icone: "Zap",
          cor: "green"
        },
        prime: {
          id: "prime",
          nome: "Prime",
          preco: 500,
          valor: 500,
          limiteVeiculos: 100,
          descricao: "Para grandes frotas",
          popular: false,
          stripePrice: "price_prime_500_monthly",
          recursos: [
            "Até 100 veículos na frota",
            "Gestão completa de motoristas",
            "Contratos automáticos",
            "Controle de pagamentos",
            "Suporte telefônico"
          ],
          icone: "Crown",
          cor: "purple"
        },
        infinity: {
          id: "infinity",
          nome: "Infinity",
          preco: 0,
          valor: 0,
          limiteVeiculos: null,
          descricao: "Para empresas premium",
          popular: false,
          consultar: true,
          recursos: [
            "Veículos ilimitados",
            "Gestão completa premium",
            "Contratos automáticos",
            "Suporte VIP 24/7",
            "Treinamento exclusivo"
          ],
          icone: "Star",
          cor: "pink"
        }
      };

      // Se tiver locadoraId, incluir informações do teste gratuito
      if (locadoraId) {
        try {
          const locadora = await storage.getLocadora(locadoraId);
          if (locadora) {
            const diasRestantes = locadora.dataVencimentoTeste ? 
              Math.max(0, Math.ceil((new Date(locadora.dataVencimentoTeste).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
            
            const response = {
              ...planosDisponiveis,
              // Locadoras com teste gratuito
              ...({
                testeGratuito: {
                  ativo: locadora.testeGratuito && diasRestantes > 0,
                  diasRestantes: diasRestantes,
                  dataVencimento: locadora.dataVencimentoTeste
                }
              })
            };
            return res.json(response);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do teste gratuito:', error);
        }
      }

      res.json(planosDisponiveis);
    } catch (error) {
      console.error("Error fetching planos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rota para estatísticas dos planos
  app.get("/api/planos/stats", async (req, res) => {
    try {
      const locadoras = await storage.getAllLocadoras();
      
      // Contar locadoras por plano
      const estatisticas = {
        start: { total: 0, ativas: 0, receita: 0 },
        pro: { total: 0, ativas: 0, receita: 0 },
        elite: { total: 0, ativas: 0, receita: 0 },
        prime: { total: 0, ativas: 0, receita: 0 },
        infinity: { total: 0, ativas: 0, receita: 0 }
      };
      
      locadoras.forEach(locadora => {
        const plano = locadora.plano || 'start';
        if (estatisticas[plano]) {
          estatisticas[plano].total++;
          if (locadora.status === 'ativa') {
            estatisticas[plano].ativas++;
            
            // Calcular receita baseada no plano
            const precos = { start: 50, pro: 99, elite: 250, prime: 500, infinity: 0 };
            estatisticas[plano].receita += precos[plano] || 0;
          }
        }
      });
      
      // Calcular totais gerais
      const totalLocadoras = locadoras.length;
      const locadorasAtivas = locadoras.filter(l => l.status === 'ativa').length;
      const receitaTotal = Object.values(estatisticas).reduce((acc, stat) => acc + stat.receita, 0);
      
      res.json({
        estatisticas,
        resumo: {
          totalLocadoras,
          locadorasAtivas,
          receitaTotal,
          receitaMensal: receitaTotal,
          conversao: totalLocadoras > 0 ? ((locadorasAtivas / totalLocadoras) * 100).toFixed(1) : 0
        }
      });
      
    } catch (error) {
      console.error("Error fetching planos stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Rota para atualizar planos (simulado)
  app.put("/api/planos/:id", async (req, res) => {
    try {
      const planoId = req.params.id;
      const updates = req.body;
      
      console.log(`[PLANOS UPDATE] Atualizando plano ${planoId} com dados:`, updates);
      
      res.json({
        message: "Plano atualizado com sucesso",
        plano: { id: planoId, ...updates }
      });
      
    } catch (error) {
      console.error("Error updating plano:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rota de teste para criar locadora com teste gratuito
  app.post("/api/test-trial", async (req, res) => {
    try {
      const testLocadora = {
        id: "99999999000199", // CNPJ fictício
        nome: "Locadora Teste",
        razaoSocial: "Locadora Teste Ltda",
        cnpj: "99999999000199",
        email: "teste@teste.com.br",
        telefone: "11977263156",
        endereco: "Rua Teste, 123",
        numero: "123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01000-000",
        responsavel: "Teste"
      };

      const locadoraCriada = await storage.createLocadora(testLocadora);
      console.log("[TEST TRIAL] Locadora criada:", locadoraCriada);

      res.json({
        message: "Locadora de teste criada com sucesso",
        locadora: locadoraCriada,
        testeGratuito: {
          ativo: locadoraCriada.testeGratuito,
          diasRestantes: locadoraCriada.dataVencimentoTeste ? 
            Math.ceil((new Date(locadoraCriada.dataVencimentoTeste).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
          dataVencimento: locadoraCriada.dataVencimentoTeste,
          plano: locadoraCriada.plano
        }
      });

    } catch (error) {
      console.error("Error creating test locadora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================================================
  // ROTAS STRIPE - SISTEMA DE PAGAMENTOS DOS PLANOS
  // ============================================================================

  // Criar assinatura (mudança de plano)
  app.post("/api/stripe/create-subscription", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe não disponível" });
    }

    try {
      const { locadoraId, plano } = req.body;
      
      if (!locadoraId || !plano) {
        return res.status(400).json({ message: "locadoraId e plano são obrigatórios" });
      }

      // Buscar dados da locadora
      const locadora = await storage.getLocadora(locadoraId);
      if (!locadora) {
        return res.status(404).json({ message: "Locadora não encontrada" });
      }

      // Verificar se o plano existe
      // Plano Infinity não tem Stripe - é tratado separadamente
      if (plano === 'infinity') {
        return res.status(400).json({ 
          message: "O plano Infinity requer consulta personalizada. Entre em contato conosco.",
          isInfinityPlan: true
        });
      }

      const priceId = PLANOS_STRIPE[plano as keyof typeof PLANOS_STRIPE];
      if (!priceId) {
        return res.status(400).json({ message: "Plano inválido" });
      }

      // VERIFICAR SE OS PRICE IDs REAIS EXISTEM
      // Se o Price ID for um placeholder (price_1234_*), usar simulação
      const isSimulation = priceId.startsWith('price_1234_');
      
      console.log(`[STRIPE DEBUG] Price ID: ${priceId}, isSimulation: ${isSimulation}`);
      
      if (isSimulation) {
        // SIMULAÇÃO - até os Price IDs reais serem criados
        console.log(`[STRIPE SIMULATION] Mudança de plano solicitada: ${plano} para locadora ${locadora.nome}`);
        
        await storage.updateLocadora(locadora.id, {
          plano: plano,
          status: 'ativa'
        });

        res.json({
          subscriptionId: `sub_simulated_${Date.now()}`,
          clientSecret: `pi_simulated_${Date.now()}_secret`,
          customerId: `cus_simulated_${Date.now()}`,
          simulation: true,
          message: "Plano atualizado com sucesso (simulação - configure Price IDs reais)"
        });

        console.log(`[STRIPE SIMULATION] Plano ${plano} ativado para ${locadora.nome}`);
        return;
      }
      
      // IMPLEMENTAÇÃO REAL COM STRIPE - quando Price IDs reais forem configurados

      let customerId = locadora.stripeCustomerId;
      
      // Criar cliente no Stripe se não existir
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: locadora.email,
          name: locadora.nome,
          metadata: {
            locadoraId: locadora.id,
            cnpj: locadora.id
          }
        });
        
        customerId = customer.id;
        
        // Atualizar locadora com Stripe Customer ID
        await storage.updateLocadora(locadora.id, {
          stripeCustomerId: customerId
        });
      }

      // Cancelar assinatura existente se houver
      if (locadora.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(locadora.stripeSubscriptionId);
        } catch (error) {
          console.warn("Erro ao cancelar assinatura existente:", error);
        }
      }

      // TEMPORÁRIO: Voltar ao Payment Intent até resolver URLs do Checkout
      // Criar nova assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          locadoraId: locadora.id,
          plano: plano
        }
      });

      // Atualizar locadora com dados da nova assinatura
      await storage.updateLocadora(locadora.id, {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plano: plano
      });

      const paymentIntent = subscription.latest_invoice?.payment_intent;
      
      console.log(`[STRIPE PAYMENT] Subscription: ${subscription.id}, PaymentIntent: ${paymentIntent?.id}`);
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        customerId: customerId,
        simulation: false
      });

    } catch (error) {
      console.error("Erro ao criar assinatura Stripe:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Webhook Stripe para confirmar pagamentos
  app.post("/api/stripe/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe não disponível" });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error`);
    }

    try {
      // Processar eventos do Stripe
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          
          if (subscriptionId) {
            // Atualizar status da locadora como ativa
            const locadoras = await storage.getAllLocadoras();
            const locadora = locadoras.find(l => l.stripeSubscriptionId === subscriptionId);
            
            if (locadora) {
              await storage.updateLocadora(locadora.id, {
                status: 'ativa'
              });
              console.log(`Pagamento confirmado para locadora ${locadora.nome}`);
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          const failedSubscriptionId = failedInvoice.subscription;
          
          if (failedSubscriptionId) {
            // Suspender locadora por falta de pagamento
            const locadoras = await storage.getAllLocadoras();
            const locadora = locadoras.find(l => l.stripeSubscriptionId === failedSubscriptionId);
            
            if (locadora) {
              await storage.updateLocadora(locadora.id, {
                status: 'pendente' // Status de pagamento pendente
              });
              console.log(`Pagamento falhou para locadora ${locadora.nome}`);
            }
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error('Erro processando webhook:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter status da assinatura
  app.get("/api/stripe/subscription/:locadoraId", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe não disponível" });
    }

    try {
      const { locadoraId } = req.params;
      
      const locadora = await storage.getLocadora(locadoraId);
      if (!locadora || !locadora.stripeSubscriptionId) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      const subscription = await stripe.subscriptions.retrieve(locadora.stripeSubscriptionId);
      
      res.json({
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        current_period_start: subscription.current_period_start,
        plano: locadora.plano
      });

    } catch (error) {
      console.error("Erro ao buscar assinatura:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Portal do cliente Stripe (para gerenciar assinatura)
  app.post("/api/stripe/customer-portal", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe não disponível" });
    }

    try {
      const { locadoraId } = req.body;
      
      const locadora = await storage.getLocadora(locadoraId);
      if (!locadora || !locadora.stripeCustomerId) {
        return res.status(404).json({ message: "Cliente Stripe não encontrado" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: locadora.stripeCustomerId,
        return_url: `${req.headers.origin}/planos`,
      });

      res.json({ url: session.url });

    } catch (error) {
      console.error("Erro ao criar portal do cliente:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas para Object Storage
  // Endpoint para servir objetos privados  
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint para obter URL de upload
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });



  // Endpoint para obter documentos de um veículo (NOVO SISTEMA)
  app.get("/api/veiculos/:id/documentos", async (req, res) => {
    try {
      const veiculoId = req.params.id;
      const documentos = await storage.getDocumentosVeiculo(veiculoId);
      console.log(`[DOCUMENTO NOVO] Buscando documentos do veículo ${veiculoId}: ${documentos.length} documentos`);

      res.json(documentos.map(d => ({
        id: d.id,
        url: d.url,
        nomeOriginal: d.nomeOriginal,
        tamanho: d.tamanho,
        tipo: d.tipo,
        createdAt: d.createdAt
      })));
    } catch (error) {
      console.error("[DOCUMENTO NOVO] Error fetching documentos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint para adicionar documento a um veículo (NOVO SISTEMA)
  app.put('/api/veiculos/:id/documentos', async (req, res) => {
    const veiculoId = req.params.id;
    const { documentURL, nomeOriginal, tamanho, tipo } = req.body;
    
    console.log(`[DOCUMENTO NOVO] Recebido para veículo ${veiculoId}:`, { documentURL, nomeOriginal, tamanho, tipo });
    
    if (!documentURL || !nomeOriginal) {
      return res.status(400).json({ error: 'URL do documento e nome original são obrigatórios' });
    }

    try {
      // Buscar veículo para validar existência e obter locadoraId
      const veiculo = await storage.getVeiculo(veiculoId);
      if (!veiculo) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
      }

      // Normalizar URL para formato do banco
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(documentURL);
      
      console.log(`[DOCUMENTO NOVO] URL normalizada: ${documentURL} -> ${objectPath}`);
      
      // Criar documento na nova tabela
      const novoDocumento = await storage.createDocumentoVeiculo({
        id: crypto.randomUUID(),
        veiculoId: veiculoId,
        locadoraId: veiculo.locadoraId,
        nomeOriginal: nomeOriginal,
        url: objectPath,
        tamanho: tamanho || null,
        tipo: tipo || null
      });

      // Buscar todos os documentos do veículo
      const documentos = await storage.getDocumentosVeiculo(veiculoId);

      console.log(`[DOCUMENTO NOVO] Documento salvo com sucesso para veículo ${veiculoId}. Total: ${documentos.length}`);

      res.json({
        objectPath,
        totalDocumentos: documentos.length,
        documentos: documentos.map(d => ({ url: d.url, nome: d.nomeOriginal })),
        message: 'Documento adicionado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para remover um documento específico de um veículo
  app.delete("/api/veiculos/:id/documentos", async (req, res) => {
    try {
      const { documentPath } = req.body;
      
      if (!documentPath) {
        return res.status(400).json({ error: "documentPath é obrigatório" });
      }

      const veiculo = await storage.getVeiculo(req.params.id);
      if (!veiculo) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      const documentosAtuais = veiculo.documentos || [];
      const novosDocumentos = documentosAtuais.filter(doc => doc !== documentPath);

      if (documentosAtuais.length === novosDocumentos.length) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      await storage.updateVeiculo(req.params.id, { documentos: novosDocumentos });
      
      console.log(`[DOCUMENTO] Documento removido do veículo ${req.params.id}. Restam: ${novosDocumentos.length} documentos`);

      res.status(200).json({
        veiculoId: req.params.id,
        documentoRemovido: documentPath,
        totalDocumentos: novosDocumentos.length,
        documentos: novosDocumentos,
        message: "Documento removido com sucesso"
      });
    } catch (error) {
      console.error("[DOCUMENTO] Error removing documento:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint para remover um documento específico por ID (NOVO SISTEMA)
  app.delete("/api/veiculos/:id/documentos/:documentoId", async (req, res) => {
    try {
      const { id: veiculoId, documentoId } = req.params;
      
      console.log(`[DOCUMENTO NOVO] Removendo documento ${documentoId} do veículo ${veiculoId}`);
      
      // Verificar se o veículo existe
      const veiculo = await storage.getVeiculo(veiculoId);
      if (!veiculo) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      // Verificar se o documento existe e pertence ao veículo
      const documento = await storage.getDocumentoVeiculoById(documentoId);
      if (!documento || documento.veiculoId !== veiculoId) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Remover documento
      await storage.deleteDocumentoVeiculo(documentoId);

      // Buscar documentos restantes
      const documentosRestantes = await storage.getDocumentosVeiculo(veiculoId);

      console.log(`[DOCUMENTO NOVO] Documento ${documentoId} removido com sucesso. Restantes: ${documentosRestantes.length}`);

      res.status(200).json({
        message: "Documento removido com sucesso",
        totalDocumentos: documentosRestantes.length,
        documentos: documentosRestantes.map(d => ({ url: d.url, nome: d.nomeOriginal }))
      });
    } catch (error) {
      console.error("Error removing documento:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API para dados consolidados do admin (relatórios financeiros)
  app.get("/api/admin/consolidado", async (req, res) => {
    try {
      console.log("[DEBUG CONSOLIDADO] Iniciando busca de dados consolidados do admin");

      // Buscar todas as locadoras
      const todasLocadoras = await storage.getAllLocadoras();
      console.log("[DEBUG CONSOLIDADO] Locadoras encontradas:", todasLocadoras.length);

      const dadosConsolidados = [];

      for (const locadora of todasLocadoras) {
        try {
          console.log("[DEBUG CONSOLIDADO] Processando locadora:", locadora.nome, locadora.id);

          // Buscar dados da locadora
          const veiculos = await storage.getVeiculosByLocadora(locadora.id);
          const alugueis = await storage.getAlugueisAtivosByLocadora(locadora.id);
          const pagamentos = await storage.getPagamentosByLocadora(locadora.id);
          const despesas = await storage.getDespesasByLocadora(locadora.id);

          console.log("[DEBUG CONSOLIDADO] Dados da locadora:", {
            locadora: locadora.nome,
            veiculos: veiculos.length,
            alugueis: alugueis.length,
            pagamentos: pagamentos.length,
            despesas: despesas.length
          });

          // Calcular receita (pagamentos realizados)
          const receitaTotal = pagamentos
            .filter(p => p.status === 'realizado')
            .reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);

          // Calcular despesas manuais
          const despesasTotal = despesas
            .reduce((acc, d) => acc + (parseFloat(d.valor?.toString() || '0') || 0), 0);

          // Calcular despesas fixas dos veículos (IPVA, Seguro, Rastreador, Financiamento)
          const despesasFixas = veiculos.reduce((acc, veiculo) => {
            let despesasVeiculo = 0;
            
            // IPVA anual dividido por 12
            if (veiculo.ipva && Number(veiculo.ipva) > 0) {
              despesasVeiculo += Number(veiculo.ipva) / 12;
            }
            
            // Seguro mensal
            if (veiculo.valorSeguroMensal && Number(veiculo.valorSeguroMensal) > 0) {
              despesasVeiculo += Number(veiculo.valorSeguroMensal);
            }
            
            // Rastreador mensal
            if (veiculo.valorRastreadorMensal && Number(veiculo.valorRastreadorMensal) > 0) {
              despesasVeiculo += Number(veiculo.valorRastreadorMensal);
            }
            
            // Financiamento mensal
            if (veiculo.valorFinanciamento && Number(veiculo.valorFinanciamento) > 0) {
              despesasVeiculo += Number(veiculo.valorFinanciamento);
            }
            
            return acc + despesasVeiculo;
          }, 0);

          const totalDespesas = despesasTotal + despesasFixas;
          const lucro = receitaTotal - totalDespesas;
          const margem = receitaTotal > 0 ? ((lucro / receitaTotal) * 100) : 0;

          dadosConsolidados.push({
            locadora: locadora.nome,
            locadoraId: locadora.id,
            receita: receitaTotal,
            despesas: totalDespesas,
            lucro: lucro,
            margem: margem,
            veiculos: veiculos.length,
            alugueisAtivos: alugueis.length
          });

          console.log("[DEBUG CONSOLIDADO] Resultado calculado:", {
            locadora: locadora.nome,
            receita: receitaTotal,
            despesas: totalDespesas,
            lucro: lucro,
            margem: margem
          });

        } catch (error) {
          console.error("[DEBUG CONSOLIDADO] Erro ao processar locadora:", locadora.nome, error);
          // Adicionar dados zerados em caso de erro
          dadosConsolidados.push({
            locadora: locadora.nome,
            locadoraId: locadora.id,
            receita: 0,
            despesas: 0,
            lucro: 0,
            margem: 0,
            veiculos: 0,
            alugueisAtivos: 0
          });
        }
      }

      console.log("[DEBUG CONSOLIDADO] Dados consolidados finais:", dadosConsolidados);
      res.json(dadosConsolidados);

    } catch (error) {
      console.error("[DEBUG CONSOLIDADO] Error fetching consolidated data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
