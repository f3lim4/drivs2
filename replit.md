# DRIVS - Sistema de Locadora de Veículos

## Overview
DRIVS é um sistema completo para gerenciamento de locadoras de veículos, desenvolvido com uma arquitetura full-stack moderna. Ele permite gerenciar motoristas, veículos, aluguéis, contratos, infrações e manutenções, oferecendo uma interface intuitiva e funcionalidades avançadas. O sistema visa eliminar a inadimplência, otimizar a gestão da frota e aumentar a receita de locadoras, especialmente as de pequeno e médio porte, substituindo planilhas manuais por um controle automatizado e preciso.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Migration
### 2025-08-15: Migration from Replit Agent to Standard Environment - CONCLUÍDO ✅
- ✅ **DATABASE MIGRATION COMPLETE** - Successfully migrated from Supabase to PostgreSQL with Drizzle ORM
- ✅ **SCHEMA PUSHED** - All tables created and functioning (profiles, locadoras, veiculos, motoristas, contratos, etc.)
- ✅ **AUTHENTICATION FIXED** - Admin user created with proper credentials (drivs@drivs.com.br / secret)
- ✅ **API ENDPOINTS WORKING** - All server routes functional for CRUD operations
- ✅ **REAL-TIME SYSTEMS ACTIVE** - Contract checking and payment automation running
- ✅ **SUPABASE CODE REMOVED** - Clean migration with no legacy dependencies
- ✅ **FRONTEND CONNECTED** - React interface properly communicating with Express backend
- ✅ **DATABASE CONNECTION VERIFIED** - PostgreSQL fully operational and responding

### 2025-08-18: Contract System Fixes - CONCLUÍDO ✅
- ✅ **CONTRACT UPDATE API FIXED** - Created flexible updateContratoSchema for partial updates
- ✅ **FRONTEND MODAL OPTIMIZED** - EditarContratoModal now sends only changed fields
- ✅ **ERROR HANDLING IMPROVED** - Better API error messages and debugging
- ✅ **STATUS TRANSITIONS WORKING** - All contract statuses (ativo, cancelado, encerrado) function correctly
- ✅ **DUPLICATE REQUESTS ELIMINATED** - Fixed issue causing multiple API calls
- ✅ **VALIDATION SCHEMA FIXED** - Updated schema to properly handle null values and optional fields
- ✅ **CONTRACT EDITING FULLY FUNCTIONAL** - Contract status changes now work without errors

### 2025-08-19: Driver History API Fix - CONCLUÍDO ✅
- ✅ **DRIVER NEGATIVATION HISTORY FIXED** - API pesquisar-historico now includes negativation records as problems
- ✅ **CACHE INVALIDATION CORRECTED** - React Query cache properly updates after driver status changes
- ✅ **DATABASE VERIFICATION CONFIRMED** - Negativation data correctly stored and retrieved from PostgreSQL
- ✅ **DRIVER SEARCH WORKING** - CPF search across locadoras now shows negativation as "problema" instead of "limpo"

## System Architecture
DRIVS é construído com uma arquitetura full-stack que garante escalabilidade, segurança e uma experiência de usuário fluida.

### Frontend Architecture
- **Framework**: React 18 com TypeScript, utilizando Vite para desenvolvimento e bundling.
- **UI/UX Decisions**:
    - **Design System**: Tailwind CSS com um design system customizado, focado em um visual futurista com gradientes modernos.
    - **Componentes**: Radix UI e shadcn/ui para componentes de interface, garantindo acessibilidade e consistência visual.
    - **Padronização Visual**: Cards estatísticos, tabelas e modais seguem um padrão unificado com ícones padronizados, cores dinâmicas e espaçamento otimizado.
    - **Layout Responsivo**: Otimizado para diferentes tamanhos de tela, incluindo cabeçalhos fixos e navegação adaptativa para mobile.
    - **Identidade Visual**: Ícones temáticos de veículos, logos personalizados e animações de loading coesas com o tema automotivo DRIVS.
- **State Management**: React Query (`@tanstack/react-query`) para gerenciamento de estado do servidor, incluindo caching e sincronização de dados.
- **Routing**: React Router DOM para navegação.
- **Forms**: React Hook Form com Zod para validação robusta de formulários.

### Backend Architecture
- **Framework**: Express.js com TypeScript, rodando em Node.js.
- **Database**: PostgreSQL (via Neon serverless) com Drizzle ORM para operações type-safe.
- **Session Management**: `connect-pg-simple` para sessões persistentes baseadas em PostgreSQL.
- **Microservices**: Sistema de notificações em tempo real, checagem de status de contratos, e sistema de pagamentos automáticos operam de forma integrada.
- **Segurança**: Isolamento rigoroso de dados entre locadoras, com validações em múltiplas camadas (backend, frontend, cache) para prevenir vazamentos.
- **Monitoramento**: Dashboard administrativo com métricas em tempo real sobre o status do sistema, desempenho e dados das locadoras.

### Core System Features
- **Gestão de Motoristas**: Cadastro, validação (CPF, CNH, idade) e gerenciamento de documentos com uploads específicos (foto de perfil, CNH, comprovante de endereço). Fotos de perfil dinâmicas e ícones.
- **Gestão de Veículos**: Cadastro detalhado (placa, marca, modelo, ano, cor, categoria), status automático (disponível/alugado), cálculo automático de despesas fixas (IPVA, seguro, rastreador, financiamento). Cores de ícones dinâmicos baseadas na cor do veículo.
- **Gestão de Aluguéis e Contratos**:
    - Criação de contratos com motoristas e veículos disponíveis.
    - Pagamentos recorrentes automáticos (semanal, quinzenal, mensal) com lógica retroativa.
    - 4 status de contratos (em aberto, ativo, cancelado, encerrado) com transições automáticas.
    - Geração de contratos profissionais em PDF com dados reais da locadora e cliente, e campos para assinatura.
    - Sistema de upload de contratos assinados em PDF.
    - Contratos renováveis e com tempo mínimo.
- **Gestão Financeira e Relatórios**:
    - Dashboard financeiro com receita total, despesas totais, lucro líquido e margem de lucro.
    - Relatórios detalhados por veículo e motorista, incluindo lucratividade.
    - Consolidação de despesas (fixas, manuais, manutenções) por categoria e forma de pagamento.
    - Evolução mensal de receita e despesas.
    - Sistema de loading completo com feedback visual.
- **Manutenção de Frota**:
    - Agendamento e registro de manutenções (preventiva, corretiva, revisão) com detalhes de oficina, valores e peças.
    - Alertas automáticos por quilometragem e data próxima de manutenção.
    - Integração de custos de manutenção nos relatórios financeiros.
- **Gestão de Infrações**:
    - Cadastro de infrações com seleção inteligente de motorista/veículo e cálculo de taxas administrativas.
    - Notificações automáticas para multas com vencimento próximo.
- **Sistema de Notificações**:
    - Notificações em tempo real (atualização a cada 30 segundos) para CNHs vencidas/vencendo, multas pendentes, pagamentos em aberto, e anúncios críticos do sistema.
    - Badge dinâmico no cabeçalho e dropdown de notificações com prioridade e cores.
- **Sistema de Anúncios**: Exibição de anúncios críticos (warning, error) no dashboard das locadoras e no sistema de notificações, com cores e traduções por tipo.
- **Testes e Validações**: Validações avançadas de dados (CPF, CNH, datas), e verificação de integridade para evitar dados inconsistentes.
- **Paginação e Ordenação**: Implementadas em todas as tabelas e listas para melhor usabilidade e performance.

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives e shadcn/ui.
- **Icons**: Lucide React.
- **Date Handling**: `date-fns` para manipulação de datas.
- **PDF Generation**: `jsPDF` para geração de documentos.

### Backend Dependencies
- **Database Connection**: `@neondatabase/serverless` para conexão com PostgreSQL.
- **ORM**: `drizzle-orm` para operações de banco de dados.
- **Session Management**: `connect-pg-simple` para sessões persistentes.
- **WebSockets**: `ws` para comunicação em tempo real.
- **Autenticação**: `bcrypt` para hash de senhas.
- **Validação**: `zod` para validação de esquemas de dados.

### Other Integrations
- **API ViaCEP**: Para busca automática de endereço por CEP.
- **Recharts**: Para visualização de dados em gráficos (onde aplicável).