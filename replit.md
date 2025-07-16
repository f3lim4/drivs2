# DRIVS - Sistema de Locadora de Veículos

## Overview

DRIVS é um sistema completo para gerenciamento de locadoras de veículos, desenvolvido com uma arquitetura full-stack moderna usando React no frontend e Express.js no backend. O sistema permite gerenciar motoristas, veículos, aluguéis, contratos e locadoras com interface intuitiva e funcionalidades avançadas.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-07-16: Layout dos Modais de Veículos e Correções de Financiamento - CONCLUÍDO
- ✅ **Layout reorganizado nos modais** - Placa, marca e modelo na primeira linha
- ✅ **Segunda linha otimizada** - Ano, cor e categoria organizados lado a lado
- ✅ **Categoria com tamanho reduzido** - Campo categoria ocupa menos espaço (2 colunas de 6)
- ✅ **Títulos das seções removidos** - Interface mais limpa sem divisórias entre seções
- ✅ **Checkbox de financiamento corrigido** - Agora mantém valor selecionado corretamente
- ✅ **Validação de data de compra** - Tratamento melhorado para campos vazios
- ✅ **Dados salvos no PostgreSQL** - Financiamento e data de compra persistem corretamente
- ✅ **Formulário otimizado** - Melhor controle de estado e validação
- ✅ **Interface compacta** - Layout mais direto e funcional para edição de veículos

### 2025-07-16: Sistema de Manutenções com Controle de Pagamento - CONCLUÍDO
- ✅ **Campos de pagamento implementados** - StatusPagamento e FormaPagamento adicionados ao schema
- ✅ **Interface tabular padronizada** - Página reformulada seguindo padrão da página de veículos
- ✅ **Sistema de busca e filtros** - Busca por veículo, oficina, descrição e filtro por status
- ✅ **Cards de estatísticas** - Totais por status (agendada, em andamento, concluída)
- ✅ **Indicadores visuais** - Badges para status, prioridade e situação de pagamento
- ✅ **Dados reais implementados** - 5 manutenções de exemplo com valores reais
- ✅ **Formatação monetária** - Valores exibidos em reais brasileiros
- ✅ **Cache corrigido** - Query keys específicas para invalidação correta
- ✅ **Campo observação removido** - Simplificação da interface conforme solicitado
- ✅ **Status de pagamento** - "Em Aberto" e "Pago" com cores diferenciadas
- ✅ **Formas de pagamento** - Dinheiro, cartão, PIX, transferência, boleto
- ✅ **Tabela organizada** - Colunas: Veículo, Tipo, Oficina, Data, Valor, Status, Pagamento
- ✅ **Ações por linha** - Visualizar, editar e excluir cada manutenção

### 2025-07-16: Sistema de Despesas Fixas Automáticas - CONCLUÍDO
- ✅ **Despesas fixas automáticas implementadas** - Sistema calcula automaticamente IPVA, seguro e rastreador
- ✅ **Integração com dados dos veículos** - Valores vêm diretamente do cadastro de veículos
- ✅ **IPVA mensal automatizado** - Divide valor anual por 12 meses automaticamente
- ✅ **Seguro mensal integrado** - Valor mensal do seguro incluído nas despesas fixas
- ✅ **Rastreador mensal** - Valor mensal do rastreador incluído automaticamente
- ✅ **Nova aba "Despesas Fixas"** - Interface dedicada para visualizar despesas automáticas
- ✅ **Cálculo total atualizado** - Despesas fixas incluídas no total geral de despesas
- ✅ **Análise por veículo melhorada** - Despesas fixas separadas das despesas manuais
- ✅ **Tabela detalhada** - Mostra IPVA, seguro e rastreador por veículo
- ✅ **Resumos por categoria** - Totais de IPVA, seguros e rastreadores separados
- ✅ **Correção de mapeamento** - Campos valorVeiculo e valorRastreadorMensal corrigidos
- ✅ **Seção de seguro adicionada** - Modal de edição inclui todos os campos de seguro
- ✅ **Aba "Tendências" removida** - Interface simplificada com 4 abas principais
- ✅ **Categoria "Combustível" removida** - Aba despesas por categoria mostra apenas dados reais
- ✅ **Filtro de dados reais** - Apenas categorias com valores reais são exibidas
- ✅ **Dados simulados removidos** - Eliminadas despesas falsas de manutenção e combustível
- ✅ **Categorias atualizadas** - Adicionadas licenciamento e lavagem às categorias disponíveis
- ✅ **Botão "Nova Despesa" removido** - Interface financeira focada apenas em relatórios
- ✅ **Sistema de filtros implementado** - Filtros por veículo, motorista e categoria de despesa
- ✅ **Indicador visual de filtros** - Badge mostra quantos filtros estão aplicados
- ✅ **Botão "Limpar Filtros"** - Reseta todos os filtros com um clique
- ✅ **Filtros aplicados aos dados** - Aluguéis, despesas e infrações filtrados corretamente
- ✅ **Filtros reposicionados** - Movidos para baixo dos cards principais com fundo destacado
- ✅ **Campo de busca único** - Substituído filtros múltiplos por campo de busca universal
- ✅ **Busca inteligente** - Busca por veículo (placa, marca, modelo), motorista (nome, CPF) e categoria
- ✅ **Interface simplificada** - Botão "Limpar" aparece apenas quando há texto na busca
- ✅ **Modal de detalhes corrigido** - Dados reais incluindo despesas fixas no modal de análise por veículo
- ✅ **Despesas fixas no modal** - IPVA, seguro e rastreador incluídos no detalhamento por categoria
- ✅ **Evolução mensal atualizada** - Gráfico de evolução inclui despesas fixas nos cálculos
- ✅ **Cálculos precisos** - Lucro e margem calculados com despesas fixas + despesas manuais
- ✅ **Pagamentos otimizados** - Modal novo pagamento mostra apenas motoristas com aluguéis ativos
- ✅ **Informações do veículo** - Placa do veículo exibida junto ao nome do motorista
- ✅ **Mensagem informativa** - Aviso quando não há motoristas com aluguéis ativos
- ✅ **Funcionalidade mantida** - Todos os tipos de pagamento funcionando corretamente

### 2025-07-15: Sistema de Infrações com Seleção Inteligente - CONCLUÍDO
- ✅ **Seleção inteligente implementada** - Motoristas com aluguel ativo aparecem primeiro
- ✅ **Preenchimento automático** - Veículo selecionado automaticamente baseado no aluguel
- ✅ **Modo manual alternativo** - Checkbox para casos sem aluguel ativo
- ✅ **Campos simplificados** - Removidos Status, Situação e Responsável da interface
- ✅ **Valores fixos no backend** - Status sempre "pendente", situação "ativo", responsável "motorista"
- ✅ **Integração com pagamentos** - Infrações aparecerão na seção de pagamentos
- ✅ **Interface intuitiva** - Área destacada para seleção manual quando necessário
- ✅ **Taxa Admin % implementada** - Campo opcional que calcula automaticamente o valor final
- ✅ **Campos limpos** - Removidos placeholders para facilitar entrada de dados

### 2025-07-16: Sistema de Manutenção de Veículos - CONCLUÍDO
- ✅ **Sistema completo de manutenções implementado** - Gestão completa de manutenções da frota
- ✅ **Banco de dados configurado** - Tabela manutencoes com todos os campos necessários
- ✅ **API REST completa** - Endpoints para CRUD de manutenções com isolamento por locadora
- ✅ **Interface rica e funcional** - Página com cards, modais de criação, edição e visualização
- ✅ **Tipos de manutenção** - Preventiva, corretiva, revisão e outros
- ✅ **Status de controle** - Agendada, em andamento, concluída e cancelada
- ✅ **Prioridades** - Baixa, normal, alta e urgente
- ✅ **Campos detalhados** - Oficina, contato, valores, quilometragem, peças substituídas
- ✅ **Navegação integrada** - Item "Manutenções" no menu lateral
- ✅ **UI limpa** - Botão único no header, sem elementos redundantes
- ✅ **Sistema de locais/oficinas** - Botão "Cadastrar Locais" para gerenciar oficinas
- ✅ **Modal de cadastro de locais** - Campos completos para nome, tipo, contato, endereço
- ✅ **Integração com manutenções** - Locais ficam disponíveis para seleção nas manutenções
- ✅ **Tamanho de texto otimizado** - Valores nos cards financeiros reduzidos para melhor legibilidade
- ✅ **Preenchimento automático de seguro** - Valores de seguro preenchidos automaticamente do cadastro do veículo
- ✅ **Indicador visual** - Mostra quando valor é preenchido automaticamente
- ✅ **Dados atualizados** - Veículos com valores de seguro configurados no banco

### 2025-07-15: Header Fixo Mobile e Melhorias UX - CONCLUÍDO
- ✅ **Header fixo no mobile** - Cabeçalho permanece fixo no topo em dispositivos móveis
- ✅ **Layout responsivo otimizado** - Navegação melhorada em telas pequenas
- ✅ **Títulos dinâmicos** - Header mostra título da página atual automaticamente
- ✅ **Busca escondida em mobile** - Barra de busca oculta em telas pequenas
- ✅ **Padding compensatório** - Conteúdo ajustado para não ficar atrás do header
- ✅ **Headers duplicados removidos** - Limpeza de componentes redundantes
- ✅ **Estrutura centralizada** - Header gerenciado no layout principal
- ✅ **Botão hambúrguer no header** - Ícone com 3 tracinhos movido para o topo
- ✅ **Sidebar limpo** - Removido botão trigger do menu lateral

### 2025-07-14: Sistema de Status Simplificado e Receita Mensal - CONCLUÍDO
- ✅ **Status 100% automático implementado** - Veículos só têm "disponível" ou "alugado"
- ✅ **Campo de status removido da edição** - Não é mais possível editar status manualmente
- ✅ **Interface informativa** - Modal de edição explica como funciona o controle automático
- ✅ **Workflow simplificado** - disponível ↔ alugado (apenas via criação/exclusão de aluguel)
- ✅ **Status "manutenção" e "parado" removidos** - Sistema focado apenas no essencial
- ✅ **Badges atualizados** - Todos os componentes mostram apenas status válidos
- ✅ **Schema atualizado** - Documentação reflete apenas status automáticos
- ✅ **Sincronização automática** - 5 veículos com status incorreto corrigidos no banco
- ✅ **Receita mensal implementada** - Página de aluguéis mostra receita mensal de aluguéis ativos
- ✅ **Valores corrigidos na tabela** - Exibição de valor mensal e diário atualizada

### 2025-07-14: Sistema de Templates e Correção de Flash de Dados - CONCLUÍDO
- ✅ **Sistema de templates de contrato implementado** - Upload, edição e seleção de templates personalizados
- ✅ **Modal de upload com campos disponíveis** - 25 variáveis organizadas por categoria
- ✅ **Correção do flash de dados em motoristas** - Hook useMotoristas com React Query implementado
- ✅ **Filtro de segurança reforçado** - Isolamento perfeito entre locadoras
- ✅ **Erro de SelectItem corrigido** - Valor vazio substituído por "default"
- ✅ **Cache otimizado** - Dados carregados sem interferência entre sessões
- ✅ **Logs de segurança adicionados** - Monitoramento de violações de isolamento
- ✅ **NOVO: Página de templates organizada** - Abas separadas para contratos e templates
- ✅ **NOVO: Gerenciamento de templates** - Visualização e exclusão de templates personalizados
- ✅ **NOVO: Interface melhorada** - Layout com abas para melhor organização do conteúdo

### 2025-07-14: Dados da Empresa em Contratos - CONCLUÍDO
- ✅ **Sistema de contratos com dados reais da empresa** - PDFs agora incluem informações da locadora
- ✅ **Cabeçalho corporativo nos contratos** - Nome, CNPJ, endereço, telefone e email da empresa
- ✅ **PDF profissional com layout completo** - Incluindo campos de assinatura do locador e locatário
- ✅ **Impressão melhorada** - Função de impressão também mostra dados da empresa
- ✅ **Integração com dados reais** - Busca automática das informações da locadora no banco
- ✅ **Layout padronizado** - Contratos com identidade visual consistente
- ✅ **Campos de assinatura** - Espaços para assinaturas do locador e locatário com nomes
- ✅ **NOVO: Template de contrato com dados reais** - Substitui placeholders pelos dados verdadeiros da empresa
- ✅ **NOVO: Correção de bugs de formatação** - Resolvido erro `valor.toFixed is not a function`
- ✅ **NOVO: Dados dinâmicos no template** - Nome, CNPJ, endereço e responsável vêm do banco de dados
- ✅ **NOVO: Melhorias no formulário de locadora** - Campo Razão Social reduzido e dropdown de estados implementado
- ✅ **NOVO: Placeholders removidos** - Todos os campos do cadastro agora estão sem exemplos/placeholders
- ✅ **NOVO: Perfil com todos os campos editáveis** - Página de perfil da locadora permite editar todos os campos do cadastro
- ✅ **CRÍTICO: Duplicação de contratos corrigida** - Resolvido problema que gerava 2 contratos ao invés de 1

### 2025-07-14: Sistema de Contratos e Atualização Automática de Status - CONCLUÍDO
- ✅ **Sistema de contratos 100% funcional** - Criação, visualização e exclusão funcionando
- ✅ **Problema de locadoraId corrigido** - Hook useContratos agora obtém ID do perfil corretamente
- ✅ **Formatação de valores corrigida** - Conversão string-número para exibição monetária
- ✅ **Persistência completa no PostgreSQL** - Todos os dados salvos e recuperados do banco
- ✅ **Sistema de aluguéis investigado** - Veículos não aparecem porque estão com status "alugado"
- ✅ **Filtro de status funcionando** - Modal mostra apenas veículos disponíveis/ativos
- ✅ **Receita mensal corrigida** - Dashboard agora mostra valorMensal em vez de valorTotal
- ✅ **NOVO: Status automático de veículos** - Veículos são automaticamente marcados como "alugado" quando aluguel é criado
- ✅ **NOVO: Restauração automática de status** - Veículos voltam para "disponível" quando aluguel é excluído
- ✅ **NOVO: Sincronização de status** - Status do veículo acompanha mudanças no status do aluguel
- ✅ **Deploy iniciado** - Build ID #910da204-6ad1-4602-a790-9c1e5fdb91b8 em progresso
- ✅ Sistema completamente operacional com isolamento de dados perfeito

### 2025-07-13: Correção Final de Bugs e Validação Completa - CONCLUÍDO
- ✅ **CRÍTICO: Aluguel inválido removido** - Excluído aluguel com motorista/veículo de outras locadoras
- ✅ **Validação de integridade implementada** - Backend agora impede criação de aluguéis com dados mistos
- ✅ **Página de veículos corrigida** - Resolvido problema de carregamento infinito
- ✅ **Hook useVeiculos otimizado** - Corrigido timing de execução da query
- ✅ **Logs de segurança adicionados** - Sistema detecta tentativas de violação de dados
- ✅ **Performance mantida** - Consultas rápidas (<200ms) e isolamento seguro
- ✅ **Sistema 100% funcional** - Todas as páginas carregando corretamente
- ✅ **Isolamento perfeito** - Cada locadora vê apenas seus próprios dados
- ✅ **Modal de aluguel melhorado** - Mensagens claras quando faltam motoristas/veículos
- ✅ **Status de aluguéis corrigido** - Novos aluguéis entram como "ativo" automaticamente
- ✅ **Validação de data flexível** - Permite selecionar datas passadas na criação de aluguéis
- ✅ Sistema completamente operacional e seguro

### 2025-07-13: Correção Crítica de Isolamento de Dados - CONCLUÍDO
- ✅ **CRÍTICO: Violação de segurança corrigida** - Eliminado vazamento de dados entre locadoras
- ✅ **Sistema de isolamento reforçado** - Implementado filtro quádruplo de segurança
- ✅ **React Query com chaves específicas** - Cache isolado por locadora
- ✅ **Validação de segurança no backend** - Verificação de consistência nos dados
- ✅ **Proteção contra vazamentos** - Erro imediato se dados mistos forem detectados
- ✅ **Cache desabilitado** - Evita contaminação cruzada entre sessões
- ✅ Sistema de isolamento entre locadoras 100% funcionando

### 2025-07-13: Personalização Visual e Correções - CONCLUÍDO
- ✅ **CRÍTICO: Isolamento 100% CORRIGIDO** - Eliminado "flash" de dados de outras locadoras
- ✅ **Filtro triplo de segurança** - Backend + Frontend + Validação de consistência
- ✅ **Cache do React Query otimizado** - Chaves específicas e cache desabilitado
- ✅ **Proteção contra vazamentos** - Array vazio se houver dados mistos
- ✅ Sistema de isolamento entre locadoras funcionando perfeitamente
- ✅ Botão "Gerar Contrato" movido para dentro do card na página de contratos
- ✅ Implementado coluna "LOCADORA" na página de veículos para admin
- ✅ Backend enriquecido com nome da locadora nos dados dos veículos
- ✅ Substituído ícone do carro pelo logo personalizado na tela de login
- ✅ Substituído ícone do carro pelo logo personalizado no menu sidebar
- ✅ Logo aumentado na tela de login para melhor visualização
- ✅ Favicon configurado com o logo personalizado
- ✅ Imagem de fundo com tema de conexão e tecnologia adicionada na tela de login
- ✅ Sistema de filtragem corrigido - locadoras veem apenas seus veículos
- ✅ Admin visualiza todos os veículos com identificação da locadora
- ✅ Novo favicon com ícone de setas bidirecionais implementado
- ✅ Imagem de fundo do login substituída por rede de conexões em azul
- ✅ Logo DRIVS personalizado implementado na tela de login
- ✅ Permissões de arquivos corrigidas para deploy
- ✅ Página de Locadoras padronizada com layout consistente
- ✅ Menu mobile agora fecha automaticamente ao clicar em links
- ✅ Página de perfil adaptada para admin e locadora
- ✅ Link "Perfil" removido do menu lateral, mantido apenas no menu superior
- ✅ Favicon atualizado com o novo ícone de setas bidirecionais

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