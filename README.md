# DRIVS - Sistema de Gestão para Locadoras

Sistema completo para gestão de locadoras de veículos, desenvolvido com React, TypeScript e Tailwind CSS.

## 🚗 Sobre o DRIVS

O DRIVS é um sistema web moderno e intuitivo criado especificamente para locadoras de veículos gerenciarem seus negócios de forma eficiente. Com interface amigável e funcionalidades completas, permite o controle total da operação.

## ✨ Funcionalidades Principais

### 📊 Dashboard
- Visão geral das estatísticas principais
- Cards informativos com dados em tempo real
- Alertas e notificações importantes
- Indicadores de desempenho

### 👥 Gestão de Motoristas
- Cadastro completo de motoristas
- Controle de CNH e vencimentos
- Busca e filtros avançados
- Status de atividade

### 🚙 Gestão de Veículos
- Controle da frota completa
- Status de disponibilidade
- Informações detalhadas (modelo, placa, valores)
- Categorização por tipo

### 📋 Gestão de Aluguéis
- Contratos de locação ativos
- Controle de períodos e valores
- Status de aluguéis
- Histórico completo

### 📄 Gestão de Contratos
- Templates personalizáveis
- Geração automática de contratos
- Upload de modelos próprios
- Campos dinâmicos

## 🛠️ Tecnologias Utilizadas

- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **React Router** - Navegação
- **Vite** - Build tool

## 🎨 Design System

O DRIVS utiliza um design system próprio baseado em:
- **Cor principal**: Azul característico (#4B7BF5)
- **Paleta semântica**: Cores para status e ações
- **Gradientes**: Para cards de estatísticas
- **Tipografia**: Hierarquia clara e legível
- **Componentes**: Reutilizáveis e consistentes

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── dashboard/       # Componentes específicos do dashboard
│   ├── layout/         # Layout e navegação
│   └── ui/             # Componentes de interface
├── data/               # Dados simulados e API calls
├── pages/              # Páginas principais
├── types/              # Definições TypeScript
├── utils/              # Utilitários e formatadores
└── styles/             # Estilos globais
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone <seu-repositorio>

# Entre no diretório
cd drivs-sistema

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

O sistema estará disponível em `http://localhost:8080`

## 📱 Responsividade

O DRIVS é totalmente responsivo e funciona perfeitamente em:
- 💻 Desktops
- 📱 Tablets
- 📱 Smartphones

## 🔧 Funcionalidades Técnicas

### Arquitetura
- **Componentização**: Componentes pequenos e reutilizáveis
- **Separação de responsabilidades**: Lógica separada da apresentação
- **Type Safety**: TypeScript em toda a aplicação
- **Performance**: Otimizações para carregamento rápido

### Estado e Dados
- **Mock Data**: Dados simulados para demonstração
- **API Ready**: Estrutura preparada para integração com backend
- **Loading States**: Estados de carregamento em todas as operações
- **Error Handling**: Tratamento de erros consistente

### Estilização
- **Design System**: Tokens de design centralizados
- **Tema Customizado**: Cores e estilos próprios do DRIVS
- **Animações**: Transições suaves e microinterações
- **Acessibilidade**: Componentes acessíveis por padrão

## 📊 Dados Simulados

O sistema inclui dados de exemplo para demonstração:
- 3 motoristas cadastrados
- 3 veículos na frota
- 1 aluguel ativo
- Estatísticas do dashboard
- Alertas e notificações

## 🔮 Próximos Passos

### Versão 2.0 (Planejada)
- [ ] Integração com banco de dados
- [ ] Sistema de autenticação
- [ ] Relatórios em PDF
- [ ] Notificações por email/SMS
- [ ] App mobile
- [ ] Dashboard de receitas
- [ ] Integração com sistemas de pagamento

### Melhorias Técnicas
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] CI/CD pipeline
- [ ] Monitoramento de performance
- [ ] PWA (Progressive Web App)

## 🤝 Contribuição

Este é um projeto em desenvolvimento ativo. Sugestões e melhorias são bem-vindas!

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**DRIVS v1.0** - Sistema de Gestão para Locadoras
Desenvolvido com ❤️ para simplificar a gestão de locadoras de veículos.