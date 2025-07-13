# DRIVS - Sistema de Locadora de Veículos

## Overview

DRIVS é um sistema completo para gerenciamento de locadoras de veículos, desenvolvido com uma arquitetura full-stack moderna usando React no frontend e Express.js no backend. O sistema permite gerenciar motoristas, veículos, aluguéis, contratos e locadoras com interface intuitiva e funcionalidades avançadas.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-07-13: Melhorias de Interface e Filtragem - CONCLUÍDO
- ✅ Botão "Gerar Contrato" movido para dentro do card na página de contratos
- ✅ Implementado coluna "LOCADORA" na página de veículos para admin
- ✅ Backend enriquecido com nome da locadora nos dados dos veículos
- ✅ Substituído ícone do carro pelo logo personalizado na tela de login
- ✅ Substituído ícone do carro pelo logo personalizado no menu sidebar
- ✅ Sistema de filtragem corrigido - locadoras veem apenas seus veículos
- ✅ Admin visualiza todos os veículos com identificação da locadora

### 2025-07-12: Sistema de Aluguéis Completo - CONCLUÍDO
- ✅ Configurado sistema para usar CNPJ como ID principal das locadoras
- ✅ Migrado schema do banco para suportar CNPJ como chave primária
- ✅ Atualizado backend para usar nova API em vez de Supabase
- ✅ Implementado sistema de autenticação com bcrypt
- ✅ Corrigido componentes frontend para usar nova API
- ✅ Corrigido login do admin (admin@drivs.com.br / admin123)
- ✅ Corrigido cadastro de locadoras pela interface web
- ✅ Corrigido atualização de perfil após criação de locadora
- ✅ Implementado RENAVAM como ID dos veículos
- ✅ Corrigido cadastro de veículos pela interface web
- ✅ Resolvido problema de identificação de locadora
- ✅ Corrigido problema de inputs não controlados
- ✅ Implementado sistema completo de motoristas com CPF como ID
- ✅ Corrigido exclusão de veículos para persistir no banco de dados
- ✅ Criada página de perfil da locadora com edição de dados
- ✅ Corrigido cadastro de motoristas com integração API
- ✅ Corrigido exclusão de motoristas para persistir no banco de dados
- ✅ Corrigido sistema de contratos para carregar motoristas e veículos da API
- ✅ Implementado preenchimento automático de valor semanal e caução
- ✅ Corrigido dashboard para carregar dados reais independente do perfil de usuário
- ✅ Sistema de cálculo de estatísticas em tempo real implementado
- ✅ Alertas automáticos para CNH vencida/vencendo funcionando
- ✅ Formatação monetária em reais brasileiros
- ✅ Eliminado loop infinito no useEffect do dashboard
- ✅ Criado sistema completo de aluguéis com persistência no banco
- ✅ Implementada API completa para CRUD de aluguéis
- ✅ Modal de criação de aluguéis salva dados no banco de dados
- ✅ Modal de exclusão de aluguéis remove dados do banco
- ✅ Dashboard carrega dados reais dos aluguéis
- ✅ Seção de aluguéis recentes mostra dados do banco
- ✅ Notificações e alertas funcionando com dados reais
- Status: Sistema completamente funcional com dados reais do banco PostgreSQL
- ✅ Deploy realizado com sucesso em produção
- ✅ URL pública: https://drivs-rental-control-hub-71-drivs1.replit.app
- ✅ Sistema acessível para múltiplos usuários

## System Architecture

### Frontend Architecture
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite para desenvolvimento e bundling
- **UI Library**: Radix UI + shadcn/ui para componentes
- **Styling**: Tailwind CSS com design system customizado
- **State Management**: React Query (@tanstack/react-query) para gerenciamento de estado do servidor
- **Routing**: React Router DOM para navegação
- **Forms**: React Hook Form com Zod para validação

### Backend Architecture
- **Framework**: Express.js com TypeScript
- **Runtime**: Node.js com suporte a ES modules
- **Database**: PostgreSQL com Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: connect-pg-simple para sessões baseadas em PostgreSQL
- **Development**: TSX para execução de TypeScript

### Data Storage Solutions
- **Primary Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM para type-safe database operations
- **Schema**: Compartilhado entre frontend e backend através da pasta `shared/`
- **Migrations**: Gerenciadas pelo Drizzle Kit
- **In-memory Storage**: Implementação de fallback para desenvolvimento

## Key Components

### 1. Database Schema
- **Users Table**: Gerenciamento de usuários do sistema
- **Validation**: Zod schemas para validação de dados
- **Type Safety**: TypeScript types gerados automaticamente pelo Drizzle

### 2. Authentication System
- **Custom Auth Hook**: `useAuth` para gerenciamento de estado de autenticação
- **Auth Guard**: Proteção de rotas com `AuthGuard` component
- **User Types**: Suporte a diferentes tipos de usuário (admin, locadora)

### 3. Core Business Modules
- **Motoristas**: Cadastro e gerenciamento de motoristas
- **Veículos**: Gestão da frota de veículos
- **Aluguéis**: Controle de locações ativas
- **Contratos**: Geração e gerenciamento de contratos
- **Locadoras**: Administração de locadoras (apenas admin)

### 4. UI Components
- **Layout System**: Sidebar responsiva com navegação
- **Form Components**: Modais padronizados para CRUD operations
- **Dashboard**: Cards estatísticos e overview do sistema
- **Design System**: Cores e estilos customizados baseados na identidade DRIVS

## Data Flow

### 1. Client-Server Communication
- **API Routes**: Todas as rotas da API prefixadas com `/api`
- **HTTP Client**: Integração com React Query para cache e sincronização
- **Real-time Updates**: Preparado para WebSocket integration

### 2. Database Operations
- **Storage Interface**: Interface abstrata para operações CRUD
- **Memory Storage**: Implementação em memória para desenvolvimento
- **Database Storage**: Implementação PostgreSQL para produção

### 3. Form Handling
- **Validation**: Zod schemas compartilhados entre frontend e backend
- **Form State**: React Hook Form para gerenciamento de formulários
- **Error Handling**: Tratamento padronizado de erros

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives para acessibilidade
- **Icons**: Lucide React para ícones consistentes
- **Date Handling**: date-fns para manipulação de datas
- **PDF Generation**: jsPDF para geração de contratos

### Backend Dependencies
- **Database**: @neondatabase/serverless para conexão PostgreSQL
- **ORM**: drizzle-orm para operações type-safe
- **Session**: connect-pg-simple para sessões persistentes
- **WebSocket**: ws para WebSocket support

### Development Dependencies
- **Build Tools**: Vite, esbuild para bundling
- **TypeScript**: Configuração strict para type safety
- **Development**: Replit-specific plugins para ambiente de desenvolvimento

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite HMR para desenvolvimento rápido
- **TypeScript**: Compilação em tempo real
- **Database**: Neon serverless para desenvolvimento

### Production Build
- **Frontend**: Vite build para otimização
- **Backend**: esbuild para bundling do servidor
- **Static Files**: Servidos pelo Express em produção

### Environment Configuration
- **Database URL**: Configuração via variáveis de ambiente
- **Session Management**: PostgreSQL-based sessions
- **Asset Serving**: Configuração para servir assets estáticos

### Replit Integration
- **Error Overlay**: Runtime error modal para desenvolvimento
- **Cartographer**: Mapeamento de dependências (desenvolvimento)
- **Dev Banner**: Banner de desenvolvimento para ambiente externo

## Project Structure

```
/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Utility functions
├── server/           # Backend Express application
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database storage layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client and server
│   └── schema.ts     # Database schema and validation
└── migrations/       # Database migrations
```

O sistema está preparado para escalar com funcionalidades adicionais como autenticação avançada, notificações em tempo real, e integração com serviços de pagamento.