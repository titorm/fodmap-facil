# Índice de Documentação

Guia completo de navegação pela documentação do projeto.

## 📚 Documentação Principal

### 1. [README.md](./README.md) 📖

**O que é**: Documentação completa do projeto
**Quando usar**: Primeira leitura, referência geral
**Conteúdo**:

- Visão geral da arquitetura
- Stack tecnológica completa
- Instalação e setup
- Comandos disponíveis
- Guias de uso
- Troubleshooting

### 2. [QUICKSTART.md](./QUICKSTART.md) ⚡

**O que é**: Guia de início rápido
**Quando usar**: Quer começar em 5 minutos
**Conteúdo**:

- Setup mínimo
- Comandos essenciais
- Primeiros passos
- Troubleshooting rápido

### 3. [ARCHITECTURE.md](./ARCHITECTURE.md) 🏗️

**O que é**: Documentação de arquitetura
**Quando usar**: Entender decisões técnicas
**Conteúdo**:

- Clean Architecture
- Camadas da aplicação
- Fluxo de dados
- Padrões de design
- Estado global
- Acessibilidade
- Performance
- Segurança

### 4. [CONTRIBUTING.md](./CONTRIBUTING.md) 🤝

**O que é**: Guia de contribuição
**Quando usar**: Quer contribuir com o projeto
**Conteúdo**:

- Código de conduta
- Como contribuir
- Padrões de código
- Estrutura de commits
- Checklist de PR
- Revisão de código

### 5. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 📁

**O que é**: Estrutura do projeto
**Quando usar**: Entender organização de arquivos
**Conteúdo**:

- Árvore de diretórios
- Estatísticas
- Componentes principais
- Testes
- Dependências

### 6. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) 💡

**O que é**: Exemplos práticos de código
**Quando usar**: Implementar features
**Conteúdo**:

- Autenticação
- Testes de reintrodução
- Sintomas
- Engine FODMAP
- Design System
- i18n
- Estado global
- Validação
- Testes
- Navegação

### 7. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) 📋

**O que é**: Resumo executivo
**Quando usar**: Visão geral rápida
**Conteúdo**:

- Entregáveis
- Estatísticas
- Features implementadas
- Comandos
- Próximos passos

## 🗂️ Estrutura de Código

### Core (Domínio)

```
src/core/
├── domain/entities/
│   ├── ReintroductionTest.ts    # Entidades de teste
│   └── User.ts                  # Entidade de usuário
├── usecases/
│   └── CreateReintroductionTest.ts  # Caso de uso
└── engine/
    ├── ReintroductionEngine.ts      # Engine FODMAP
    └── __tests__/
        └── ReintroductionEngine.test.ts
```

### Features

```
src/features/
├── auth/
│   └── screens/
│       └── SignInScreen.tsx
├── reintroduction/
│   └── screens/
│       └── ReintroductionHomeScreen.tsx
└── profile/
```

### Shared

```
src/shared/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.test.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── molecules/
│       ├── TestCard.tsx
│       └── SymptomCard.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useReintroductionTests.ts
├── stores/
│   └── appStore.ts
├── theme/
│   └── tokens.ts
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       └── pt.json
├── utils/
│   └── validation.ts
├── fixtures/
│   └── reintroductionTests.ts
└── mocks/
    ├── handlers.ts
    └── server.ts
```

### Infrastructure

```
src/infrastructure/
├── api/
│   └── supabase.ts
└── database/
    ├── schema.ts
    └── client.ts
```

## 🎯 Guias por Objetivo

### Quero começar a desenvolver

1. [QUICKSTART.md](./QUICKSTART.md) - Setup rápido
2. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Exemplos de código
3. [README.md](./README.md) - Referência completa

### Quero entender a arquitetura

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada
2. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Estrutura
3. [README.md](./README.md) - Visão geral

### Quero contribuir

1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia de contribuição
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender decisões
3. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Padrões de código

### Quero implementar uma feature

1. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Exemplos práticos
2. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Onde colocar
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Como estruturar

### Quero fazer deploy

1. [README.md](./README.md) - Seção Deploy
2. [QUICKSTART.md](./QUICKSTART.md) - Setup EAS
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Pipeline CI/CD

## 🔍 Busca Rápida

### Autenticação

- Setup: [README.md](./README.md#autenticação)
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#autenticação)
- Hook: `src/shared/hooks/useAuth.ts`

### Testes de Reintrodução

- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#testes-de-reintrodução)
- Hook: `src/shared/hooks/useReintroductionTests.ts`
- Entidade: `src/core/domain/entities/ReintroductionTest.ts`

### Engine FODMAP

- Documentação: [README.md](./README.md#engine-de-reintrodução-fodmap)
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#engine-fodmap)
- Código: `src/core/engine/ReintroductionEngine.ts`
- Testes: `src/core/engine/__tests__/ReintroductionEngine.test.ts`

### Design System

- Tokens: `src/shared/theme/tokens.ts`
- Componentes: `src/shared/components/`
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#design-system)
- Stories: `src/shared/components/atoms/*.stories.tsx`

### Internacionalização

- Setup: [README.md](./README.md#internacionalização)
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#internacionalização)
- Config: `src/shared/i18n/index.ts`
- Traduções: `src/shared/i18n/locales/`

### Estado Global

- Stores: `src/shared/stores/appStore.ts`
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#estado-global)
- Arquitetura: [ARCHITECTURE.md](./ARCHITECTURE.md#estado-global)

### Testes

- Config: `jest.config.js`, `jest.setup.js`
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#testes)
- Mocks: `src/shared/mocks/`
- Fixtures: `src/shared/fixtures/`

### Validação

- Schemas: `src/shared/utils/validation.ts`
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#validação)

### Acessibilidade

- Tokens: `src/shared/theme/tokens.ts`
- Guia: [README.md](./README.md#acessibilidade)
- Arquitetura: [ARCHITECTURE.md](./ARCHITECTURE.md#acessibilidade)
- Exemplos: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#acessibilidade)

## 📊 Estatísticas do Projeto

- **Total de arquivos**: 48+
- **Linhas de código**: ~3000
- **Documentação**: 7 arquivos markdown
- **Componentes**: 5 (3 atoms, 2 molecules)
- **Hooks**: 2 principais
- **Stores**: 3 Zustand stores
- **Testes**: 2 suites (expandível)
- **Idiomas**: 2 (en, pt)

## 🚀 Comandos Rápidos

```bash
# Desenvolvimento
npm start              # Dev server
npm run android        # Android
npm run ios            # iOS

# Testes
npm test               # Rodar testes
npm run test:watch     # Watch mode

# Qualidade
npm run lint           # Lint
npm run format         # Format
npm run type-check     # Type check

# Build
npm run build:android  # Build Android
npm run build:ios      # Build iOS
```

## 🆘 Precisa de Ajuda?

### Problemas Técnicos

1. [README.md](./README.md#troubleshooting) - Troubleshooting
2. [QUICKSTART.md](./QUICKSTART.md#troubleshooting) - Problemas comuns
3. [Issues](https://github.com/seu-repo/issues) - Reportar bug

### Dúvidas sobre Código

1. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Exemplos práticos
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Decisões técnicas
3. [Discussions](https://github.com/seu-repo/discussions) - Perguntar

### Contribuir

1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia completo
2. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Estrutura
3. [Pull Requests](https://github.com/seu-repo/pulls) - Contribuir

## 📞 Contato

- 📧 Email: [email]
- 💬 Discord: [link]
- 🐦 Twitter: [link]
- 📱 Issues: [link]

---

**Última atualização**: Outubro 2025
**Versão**: 1.0.0
**Status**: ✅ Pronto para desenvolvimento
