import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import './pagamentos-automaticos'; // Inicializar sistema de pagamentos automáticos
import { iniciarVerificacaoPeriodicaContratos } from './contract-status-checker';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configurar sessões
const isProduction = app.get("env") === "production" || process.env.REPLIT_DEPLOYMENT === "1";

// ✅ CONFIGURAR TRUST PROXY - essencial para cookies seguros atrás de proxy (Replit)
app.set('trust proxy', 1);

// 🔒 SESSION FIX DEFINITIVO - Solução validada pelo arquiteto
console.log('🔐 APLICANDO SOLUÇÃO DEFINITIVA para loop infinito...');

// Verificar se está em produção
const isProduction = app.get("env") === "production" || process.env.REPLIT_DEPLOYMENT === "1";

app.use(session({
  secret: process.env.SESSION_SECRET || 'drivs-secret-fix-2024',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid', // 🔒 VOLTANDO para nome original para sobrescrever cookie antigo
  cookie: {
    secure: isProduction, // ✅ true apenas em produção
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Inicializar sistemas automáticos
    console.log('[SISTEMA] Iniciando sistemas automáticos...');
    iniciarVerificacaoPeriodicaContratos();
    console.log('[SISTEMA] Sistemas iniciados com sucesso');
  });
})();
