# Estrutura do Projeto

## 📁 Visão Geral

```
fodmap-reintro-app/
├── src/                          # Código fonte
│   ├── core/                     # Camada de Domínio (Clean Architecture)
│   │   ├── domain/              # Entidades e interfaces
│   │   │   └── entities/        # Modelos de domínio
│   │   │       ├── ReintroductionTest.ts
│   │   │       └── User.ts
│   │   ├── usecases/            # Casos de uso
│   │   │   └── CreateReintroductionTest.ts
│   │   └── engine/              # Engine determinístico FODMAP
│   │       ├── ReintroductionEngine.ts
│   │       └── __tests__/
│   │           └── ReintroductionEngine.test.ts
│   │
│   ├── features/                # Features da aplicação
│   │   ├── auth/               # Autenticação
│   │   │   ├── screens/
│   │   │   │   └── SignInScreen.tsx
│   │   │   └── components/
│   │   ├── reintroduction/     # Testes de reintrodução
│   │   │   ├── screens/
│   │   │   │   └── ReintroductionHomeScreen.tsx
│   │   │   └── components/
│   │   └── profile/            # Perfil do usuário
│   │       ├── screens/
│   │       └── components/
│   │
│   ├── shared/                 # Código compartilhado
│   │   ├── components/         # Design System
│   │   │   ├── atoms/         # Componentes básicos
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── molecules/     # Composições simples
│   │   │   │   ├── TestCard.tsx
│   │   │   │   ├── SymptomCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── organisms/     # Composições complexas
│   │   ├── hooks/             # React hooks customizados
│   │   │   ├── useAuth.ts
│   │   │   └── useReintroductionTests.ts
│   │   ├── stores/            # Zustand stores
│   │   │   └── appStore.ts
│   │   ├── theme/             # Tokens de design
│   │   │   ├── tokens.ts
│   │   │   └── index.ts
│   │   ├── i18n/              # Internacionalização
│   │   │   ├── index.ts
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       └── pt.json
│   │   ├── utils/             # Utilitários
│   │   │   └── validation.ts
│   │   ├── fixtures/          # Dados de teste
│   │   │   └── reintroductionTests.ts
│   │   └── mocks/             # MSW mocks
│   │       ├── handlers.ts
│   │       └── server.ts
│   │
│   ├── infrastructure/         # Camada de Infraestrutura
│   │   ├── api/               # Cliente Supabase
│   │   │   └── supabase.ts
│   │   ├── database/          # SQLite + Drizzle
│   │   │   ├── schema.ts
│   │   │   └── client.ts
│   │   └── storage/           # Armazenamento local
│   │
│   └── navigation/            # Navegação
│       └── AppNavigator.tsx
│
├── assets/                     # Assets estáticos
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
├── App.tsx                     # Componente raiz
├── app.json                    # Configuração Expo
├── eas.json                    # Configuração EAS Build
├── package.json                # Dependências e scripts
├── tsconfig.json               # Configuração TypeScript
├── jest.config.js              # Configuração Jest
├── jest.setup.js               # Setup de testes
├── drizzle.config.ts           # Configuração Drizzle ORM
├── .eslintrc.js                # Configuração ESLint
├── .prettierrc                 # Configuração Prettier
├── .gitignore                  # Git ignore
├── .env.example                # Exemplo de variáveis de ambiente
│
├── README.md                   # Documentação principal
├── QUICKSTART.md               # Guia de início rápido
├── ARCHITECTURE.md             # Documentação de arquitetura
├── CONTRIBUTING.md             # Guia de contribuição
└── PROJECT_STRUCTURE.md        # Este arquivo
```

## 📊 Estatísticas

### Arquivos Criados

- **Core (Domínio)**: 5 arquivos
  - 2 entidades
  - 1 caso de uso
  - 1 engine + testes

- **Features**: 2 screens
  - Auth: SignInScreen
  - Reintroduction: ReintroductionHomeScreen

- **Shared**: 20+ arquivos
  - 3 atoms (Button, Input, Card)
  - 2 molecules (TestCard, SymptomCard)
  - 2 hooks (useAuth, useReintroductionTests)
  - 3 stores (app, preferences, sync)
  - Theme tokens
  - i18n (en, pt)
  - Validação (Zod)
  - Fixtures
  - MSW mocks

- **Infrastructure**: 3 arquivos
  - Supabase client
  - SQLite schema
  - Database client

- **Navigation**: 1 arquivo
  - AppNavigator

- **Configuração**: 10+ arquivos
  - TypeScript, Jest, ESLint, Prettier
  - Expo, EAS, Drizzle
  - Git, Env

- **Documentação**: 5 arquivos
  - README.md (completo)
  - QUICKSTART.md
  - ARCHITECTURE.md
  - CONTRIBUTING.md
  - PROJECT_STRUCTURE.md

## 🎯 Componentes Principais

### Core Layer

#### ReintroductionEngine

```typescript
// Engine determinístico com lógica FODMAP
-getProtocol() -
  canProgressToNextGroup() -
  determineTolerance() -
  validateTestProtocol() -
  generateRecommendations();
```

#### Entidades

```typescript
// Modelos de domínio
- ReintroductionTest
- User
- Symptom
- FODMAPGroup (enum)
- TestPhase (enum)
- SymptomSeverity (enum)
```

### Features Layer

#### Auth

- SignInScreen (com validação)
- useAuth hook

#### Reintroduction

- ReintroductionHomeScreen
- TestCard component
- SymptomCard component

### Shared Layer

#### Design System

```
atoms/
  - Button (primary, secondary, outline, ghost)
  - Input (com validação e acessibilidade)
  - Card (com elevação)

molecules/
  - TestCard (exibe teste com status)
  - SymptomCard (exibe sintoma com severidade)
```

#### Hooks

```typescript
-useAuth() - // Autenticação
  useReintroductionTests() - // Queries
  useCreateReintroductionTest() - // Mutation
  useUpdateReintroductionTest() - // Mutation
  useDeleteReintroductionTest(); // Mutation
```

#### Stores

```typescript
-useAppStore - // Estado global
  useUserPreferencesStore - // Preferências
  useSyncStore; // Sincronização offline
```

## 🧪 Testes

### Cobertura

```
src/
├── core/engine/__tests__/
│   └── ReintroductionEngine.test.ts ✅
└── shared/components/atoms/__tests__/
    └── Button.test.tsx ✅
```

### Fixtures

```typescript
// Dados de teste prontos
-mockReintroductionTests - mockUser - mockSymptoms;
```

### MSW Mocks

```typescript
// Handlers para API
- Auth (sign in, sign up, sign out)
- Tests (CRUD)
- Symptoms (CRUD)
```

## 🌍 Internacionalização

### Idiomas Suportados

- **Inglês (en)** - Padrão
- **Português (pt)** - Completo

### Namespaces

```json
{
  "common": { ... },
  "auth": { ... },
  "reintroduction": { ... },
  "profile": { ... }
}
```

## 🎨 Design System

### Tokens

```typescript
// Cores
colors.primary500;
colors.neutral900;
colors.success;
colors.error;

// Espaçamento
spacing.xs; // 4
spacing.sm; // 8
spacing.md; // 16
spacing.lg; // 24

// Tipografia
typography.fontSize.md;
typography.fontWeight.bold;

// Acessibilidade
accessibility.minTouchTarget; // 44pt
```

## 📦 Dependências Principais

### Produção

- expo ~54.0
- react 19.1.0
- react-native 0.81.5
- @react-navigation/\* 7.x
- @supabase/supabase-js 2.x
- @tanstack/react-query 5.x
- zustand 5.x
- drizzle-orm 0.44.x
- i18next 25.x
- zod 3.x

### Desenvolvimento

- typescript 5.9
- jest 30.x
- @testing-library/react-native 13.x
- msw 2.x
- eslint 9.x
- prettier 3.x
- drizzle-kit 0.31.x

## 🚀 Scripts NPM

```json
{
  "start": "expo start",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
  "type-check": "tsc --noEmit",
  "build:android": "eas build --platform android",
  "build:ios": "eas build --platform ios"
}
```

## 📝 Próximos Passos

### Features Planejadas

- [ ] Onboarding flow
- [ ] Notificações push
- [ ] Exportação de dados (PDF/CSV)
- [ ] Gráficos de progresso
- [ ] Integração com wearables
- [ ] Machine learning para predições

### Melhorias Técnicas

- [ ] E2E tests (Detox)
- [ ] Performance monitoring (Sentry)
- [ ] Analytics (Amplitude/Mixpanel)
- [ ] CI/CD pipeline
- [ ] Storybook completo
- [ ] Documentação de API

## 🔗 Links Úteis

- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Monash FODMAP](https://www.monashfodmap.com/)

---

**Total de Arquivos**: 50+
**Linhas de Código**: 3000+
**Cobertura de Testes**: Em progresso
**Documentação**: Completa

Projeto pronto para desenvolvimento! 🚀
