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
# Desenvolvimento (com Doppler)
npm run dev          # Inicia servidor com variáveis do Doppler
npm run dev:local    # Inicia servidor sem Doppler (fallback)

# Build (com Doppler)
npm run build        # Gera build de produção com Doppler
npm run build:local  # Gera build sem Doppler (fallback)
npm run preview      # Preview do build com Doppler
npm run preview:local # Preview sem Doppler (fallback)

# Qualidade de Código
npm run lint         # Executa ESLint
npm run check        # Verifica tipos TypeScript

# Utilitários do Doppler
npm run doppler:setup   # Configurar projeto Doppler
npm run doppler:secrets # Listar credenciais configuradas
```

## 🎨 Temas

O projeto suporta tema claro e escuro:

- **Light Mode**: Tema padrão com cores claras
- **Dark Mode**: Tema escuro para reduzir fadiga visual

Alternância automática baseada na preferência do sistema ou manual via interface.

## 🔧 Configuração

### 🔐 Gerenciamento de Segredos com Doppler

Este projeto usa o **Doppler** para gerenciamento seguro de variáveis de ambiente e credenciais. O Doppler oferece:

- 🔒 **Segurança**: Credenciais criptografadas e nunca expostas em arquivos
- 🌍 **Multi-ambiente**: Configurações separadas para dev, staging e produção
- 👥 **Colaboração**: Compartilhamento seguro entre equipes
- 📝 **Auditoria**: Histórico completo de mudanças

#### Instalação do Doppler CLI

```bash
# macOS
brew install dopplerhq/cli/doppler

# Linux/WSL
curl -Ls https://cli.doppler.com/install.sh | sh

# Windows
scoop install doppler
```

#### Configuração Inicial

1. **Autentique-se no Doppler**:
```bash
doppler login
```

2. **Configure o projeto** (já configurado para `hub-automation`):
```bash
doppler setup --project hub-automation --config dev
```

3. **Verifique as credenciais configuradas**:
```bash
npm run doppler:secrets
# ou
doppler secrets
```

#### Credenciais Configuradas

O projeto possui as seguintes credenciais configuradas no Doppler:

- `LOGIN_USERNAME`: Nome de usuário para autenticação
- `LOGIN_EMAIL`: E-mail para autenticação
- `LOGIN_PASSWORD`: Senha para autenticação
- `DOPPLER_PROJECT`: Projeto atual (hub-automation)
- `DOPPLER_ENVIRONMENT`: Ambiente atual (dev)
- `DOPPLER_CONFIG`: Configuração atual (dev)

#### Scripts com Doppler

Os scripts do projeto foram configurados para usar o Doppler automaticamente:

```bash
# Scripts com Doppler (recomendado)
npm run dev          # doppler run -- vite
npm run build        # doppler run -- tsc -b && doppler run -- vite build
npm run preview      # doppler run -- vite preview

# Scripts locais (fallback)
npm run dev:local    # vite (sem Doppler)
npm run build:local  # tsc -b && vite build (sem Doppler)
npm run preview:local # vite preview (sem Doppler)

# Utilitários do Doppler
npm run doppler:setup   # Configurar projeto Doppler
npm run doppler:secrets # Listar todas as credenciais
```

#### Adicionando Novas Credenciais

```bash
# Adicionar nova credencial
doppler secrets set NOVA_CREDENCIAL valor_da_credencial

# Adicionar credencial com caracteres especiais
doppler secrets set API_KEY 'sk-1234567890abcdef'

# Verificar se foi adicionada
doppler secrets
```

#### Ambientes

O projeto suporta múltiplos ambientes:

- **dev**: Desenvolvimento local
- **stg**: Staging/Homologação
- **prd**: Produção

```bash
# Trocar para staging
doppler setup --project hub-automation --config stg

# Trocar para produção
doppler setup --project hub-automation --config prd

# Voltar para desenvolvimento
doppler setup --project hub-automation --config dev
```

#### Uso no Código

As variáveis do Doppler são acessíveis via `process.env`:

```typescript
// Exemplo de uso das credenciais
const loginCredentials = {
  username: process.env.LOGIN_USERNAME,
  email: process.env.LOGIN_EMAIL,
  password: process.env.LOGIN_PASSWORD
};

// Sempre verificar se a variável existe
if (!process.env.LOGIN_USERNAME) {
  throw new Error('LOGIN_USERNAME não configurado no Doppler');
}
```

#### Troubleshooting

**Problema**: Comando `doppler` não encontrado
```bash
# Verifique se o Doppler está instalado
doppler --version

# Se não estiver, instale novamente
brew install dopplerhq/cli/doppler
```

**Problema**: Credenciais não carregadas
```bash
# Verifique se está no projeto correto
doppler configure get

# Reconfigure se necessário
npm run doppler:setup
```

**Problema**: Acesso negado
```bash
# Faça login novamente
doppler login

# Verifique suas permissões no projeto
doppler me
```

### 🎨 Personalização do Tema

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