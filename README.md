# Hub Automation

Um sistema moderno de automação empresarial construído com React, TypeScript e Tailwind CSS, focado em componentes reutilizáveis e arquitetura escalável.

## 🚀 Características

- **Arquitetura Componentizada**: Sistema de componentes reutilizáveis e modulares
- **TypeScript**: Tipagem estática para maior segurança e produtividade
- **Design System**: Componentes consistentes com tema dark/light
- **Responsivo**: Interface adaptável para desktop, tablet e mobile
- **Performance**: Otimizado com Vite e React 18
- **Automação Inteligente**: Componentes específicos para workflows de automação

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Roteamento**: React Router DOM
- **Ícones**: Lucide React
- **Linting**: ESLint
- **Formatação**: Prettier (configurado)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/hub-automation.git
cd hub-automation
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

4. Abra o navegador em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
hub-automation/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (Button, Input, Card, etc.)
│   │   ├── layout/         # Componentes de layout (Header, Sidebar, etc.)
│   │   └── automation/     # Componentes específicos de automação
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Hooks customizados
│   ├── contexts/           # Contextos React
│   ├── utils/              # Funções utilitárias
│   ├── types/              # Definições de tipos TypeScript
│   └── styles/             # Estilos globais
├── public/                 # Arquivos estáticos
└── docs/                   # Documentação
```

## 🎨 Sistema de Design

### Componentes UI Base

- **Button**: Botões com variantes (primary, secondary, outline, ghost)
- **Input**: Campos de entrada com validação
- **Card**: Containers para conteúdo
- **Modal**: Diálogos e overlays
- **Badge**: Indicadores de status
- **Alert**: Mensagens de feedback

### Componentes de Layout

- **Header**: Cabeçalho com navegação
- **Sidebar**: Menu lateral responsivo
- **Footer**: Rodapé da aplicação
- **Layout**: Container principal

### Componentes de Automação

- **AutomationCard**: Cards para workflows
- **StatusIndicator**: Indicadores de status
- **MetricsCard**: Cartões de métricas
- **ProgressBar**: Barras de progresso

## 🎯 Funcionalidades

### Dashboard
- Visão geral de automações
- Métricas em tempo real
- Gráficos e indicadores

### Automações
- Listagem de workflows
- Criação e edição
- Monitoramento de execução

### Configurações
- Preferências do usuário
- Configurações do sistema
- Gerenciamento de temas

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run preview      # Preview do build

# Qualidade de Código
npm run lint         # Executa ESLint
npm run lint:fix     # Corrige problemas do ESLint
npm run type-check   # Verifica tipos TypeScript
```

## 🎨 Temas

O projeto suporta tema claro e escuro:

- **Light Mode**: Tema padrão com cores claras
- **Dark Mode**: Tema escuro para reduzir fadiga visual

Alternância automática baseada na preferência do sistema ou manual via interface.

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Hub Automation
```

### Personalização do Tema

Edite o arquivo `tailwind.config.js` para personalizar cores, fontes e espaçamentos:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Suas cores personalizadas
        }
      }
    }
  }
}
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🧪 Testes

```bash
# Executar testes
npm run test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📚 Documentação

- [Guia de Componentes](./docs/components.md)
- [Padrões de Código](./docs/coding-standards.md)
- [Guia de Contribuição](./docs/contributing.md)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Principal**: [Seu Nome]
- **Design System**: [Nome do Designer]
- **QA**: [Nome do QA]

## 🆘 Suporte

Para suporte, envie um email para suporte@hubautomation.com ou abra uma issue no GitHub.

---

**Hub Automation** - Automatizando o futuro, um componente por vez. 🚀