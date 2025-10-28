# FODMAP Reintroduction App

App React Native (Expo) para gerenciamento do protocolo de reintrodução FODMAP, com arquitetura limpa, alta acessibilidade e internacionalização.

## 🏗️ Arquitetura

### Clean Architecture

```
src/
├── core/                    # Camada de Domínio
│   ├── domain/             # Entidades e interfaces
│   ├── usecases/           # Casos de uso
│   └── engine/             # Engine determinístico (regras FODMAP)
├── features/               # Features da aplicação
│   ├── auth/              # Autenticação
│   ├── reintroduction/    # Testes de reintrodução
│   └── profile/           # Perfil do usuário
├── shared/                # Código compartilhado
│   ├── components/        # Design System (atoms, molecules, organisms)
│   ├── hooks/            # React hooks customizados
│   ├── theme/            # Tokens de design
│   ├── i18n/             # Internacionalização
│   ├── utils/            # Utilitários
│   └── fixtures/         # Dados de teste
├── infrastructure/        # Camada de Infraestrutura
│   ├── api/              # Supabase client
│   ├── database/         # SQLite + Drizzle ORM
│   └── storage/          # Armazenamento local
└── navigation/           # Navegação (React Navigation)
```

## 🚀 Stack Tecnológica

### Core

- **Expo SDK 54** - Framework React Native
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação (Stack + Tabs)

### Estado e Dados

- **Zustand** - Gerenciamento de estado global
- **TanStack Query** - Fetch, cache e sincronização
- **Zod** - Validação de schemas

### Backend e Persistência

- **Supabase** - Auth, Postgres, Storage
- **Expo SQLite** - Banco local
- **Drizzle ORM** - ORM type-safe para SQLite

### Internacionalização

- **i18next** - Framework i18n
- **react-i18next** - Bindings React
- **expo-localization** - Detecção de locale

### Design System

- **Design Tokens** - Sistema leve sem libs pesadas
- **Atomic Design** - Atoms, Molecules, Organisms

### Qualidade

- **Jest** - Framework de testes
- **Testing Library** - Testes de componentes
- **MSW** - Mock de APIs
- **ESLint** - Linting
- **Prettier** - Formatação

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Conta Supabase (para backend)

### Setup

1. Clone o repositório:

```bash
git clone <repo-url>
cd fodmap-reintro-app
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite `.env` e adicione suas credenciais Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

4. Configure o Supabase:

Execute no SQL Editor do Supabase:

```sql
-- Tabela de usuários (já existe via Auth)

-- Tabela de testes de reintrodução
CREATE TABLE reintroduction_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fodmap_group TEXT NOT NULL,
  phase TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  food_item TEXT NOT NULL,
  portion_size TEXT NOT NULL,
  notes TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de sintomas
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES reintroduction_tests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity INTEGER NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE reintroduction_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tests"
  ON reintroduction_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
  ON reintroduction_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON reintroduction_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own symptoms"
  ON symptoms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reintroduction_tests
      WHERE reintroduction_tests.id = symptoms.test_id
      AND reintroduction_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own symptoms"
  ON symptoms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reintroduction_tests
      WHERE reintroduction_tests.id = symptoms.test_id
      AND reintroduction_tests.user_id = auth.uid()
    )
  );
```

## 🎯 Comandos

### Desenvolvimento

```bash
# Iniciar dev server
npm start

# Rodar no Android
npm run android

# Rodar no iOS
npm run ios

# Rodar na Web
npm run web
```

### Testes

```bash
# Rodar todos os testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npm run test:coverage
```

### Qualidade de Código

```bash
# Lint
npm run lint

# Lint com fix automático
npm run lint:fix

# Formatação
npm run format

# Verificar formatação
npm run format:check

# Type checking
npm run type-check
```

### Build e Deploy

```bash
# Prebuild (gera pastas nativas)
npm run prebuild

# Build Android (EAS)
npm run build:android

# Build iOS (EAS)
npm run build:ios

# Submit para stores
npm run submit:android
npm run submit:ios
```

### Database

```bash
# Gerar migrations
npm run db:generate

# Aplicar migrations
npm run db:migrate
```

## 🧪 Testes

### Estrutura de Testes

```
src/
├── core/engine/__tests__/
│   └── ReintroductionEngine.test.ts
└── shared/components/atoms/__tests__/
    └── Button.test.tsx
```

### Executar Testes

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

## ♿ Acessibilidade

### Implementações WCAG 2.1 AA/AAA

1. **Tamanhos de Toque**
   - Mínimo 44x44pt (AA)
   - Preferencial 48x48pt (AAA)

2. **Contraste de Cores**
   - Texto normal: 4.5:1
   - Texto grande: 3:1

3. **Navegação por Teclado**
   - Todos os elementos interativos acessíveis
   - Indicadores de foco visíveis

4. **Screen Readers**
   - Roles ARIA corretos
   - Labels descritivos
   - Hints contextuais

5. **Escalabilidade de Fonte**
   - Suporte a fontes do sistema
   - Layout responsivo a mudanças de tamanho

### Testando Acessibilidade

**iOS:**

- VoiceOver: Settings > Accessibility > VoiceOver
- Zoom: Settings > Accessibility > Zoom
- Larger Text: Settings > Accessibility > Display & Text Size

**Android:**

- TalkBack: Settings > Accessibility > TalkBack
- Font Size: Settings > Display > Font Size

## 🌍 Internacionalização

### Idiomas Suportados

- Inglês (en) - padrão
- Português (pt)

### Adicionar Novo Idioma

1. Crie arquivo de tradução:

```bash
src/shared/i18n/locales/es.json
```

2. Adicione ao i18n config:

```typescript
// src/shared/i18n/index.ts
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es }, // novo
};
```

### Usar Traduções

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('common.appName')}</Text>;
}
```

## 🧠 Engine de Reintrodução FODMAP

### Protocolo Implementado

O engine implementa o protocolo científico de reintrodução FODMAP:

1. **Fase de Eliminação** (2-6 semanas)
   - Dieta baixa em FODMAP

2. **Fase de Reintrodução** (por grupo)
   - Dia 1: Porção pequena
   - Dia 2: Porção média
   - Dia 3: Porção grande
   - Dias 4-6: Washout (retorno à dieta baixa)

3. **Fase de Personalização**
   - Incorporar alimentos tolerados

### Grupos FODMAP

- **Frutose** - Mel, manga, aspargos
- **Lactose** - Leite, iogurte, sorvete
- **Frutanos** - Trigo, alho, cebola
- **Galactanos** - Grão-de-bico, lentilhas, feijão
- **Polióis** - Abacate, cogumelos, couve-flor

### Uso do Engine

```typescript
import { ReintroductionEngine } from '@/core/engine/ReintroductionEngine';
import { FODMAPGroup } from '@/core/domain/entities/ReintroductionTest';

// Obter protocolo
const protocol = ReintroductionEngine.getProtocol(FODMAPGroup.FRUCTOSE);

// Verificar se pode progredir
const canProgress = ReintroductionEngine.canProgressToNextGroup(test);

// Determinar tolerância
const tolerance = ReintroductionEngine.determineTolerance(tests);

// Validar protocolo
const validation = ReintroductionEngine.validateTestProtocol(test);

// Gerar recomendações
const recommendations = ReintroductionEngine.generateRecommendations(allTests);
```

## 📱 Design System

### Tokens

```typescript
import { colors, spacing, typography } from '@/shared/theme';

// Cores
colors.primary500;
colors.neutral900;
colors.success;

// Espaçamento
spacing.xs; // 4
spacing.sm; // 8
spacing.md; // 16
spacing.lg; // 24

// Tipografia
typography.fontSize.md;
typography.fontWeight.bold;
```

### Componentes

#### Button

```typescript
<Button
  title="Click me"
  onPress={handlePress}
  variant="primary" // primary | secondary | outline | ghost
  size="medium"     // small | medium | large
  disabled={false}
  loading={false}
  fullWidth={false}
  accessibilityLabel="Custom label"
/>
```

#### Input

```typescript
<Input
  label="Email"
  placeholder="your@email.com"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  required
  keyboardType="email-address"
/>
```

#### Card

```typescript
<Card
  onPress={handlePress}
  elevation="md" // sm | md | lg
  accessibilityLabel="Card content"
>
  <Text>Content</Text>
</Card>
```

## 🔐 Autenticação

### Supabase Auth

```typescript
import { useAuth } from '@/shared/hooks/useAuth';

function MyComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);
    if (error) console.error(error);
  };

  return user ? <Dashboard /> : <SignIn />;
}
```

## 💾 Persistência de Dados

### SQLite Local (Offline-first)

```typescript
import { db } from '@/infrastructure/database/client';
import { reintroductionTests } from '@/infrastructure/database/schema';

// Inserir
await db.insert(reintroductionTests).values({
  userId: 'user-1',
  fodmapGroup: 'fructose',
  // ...
});

// Consultar
const tests = await db.select().from(reintroductionTests);
```

### Supabase (Sync)

```typescript
import { supabase } from '@/infrastructure/api/supabase';

// Inserir
const { data, error } = await supabase
  .from('reintroduction_tests')
  .insert({ ... });

// Consultar
const { data } = await supabase
  .from('reintroduction_tests')
  .select('*')
  .eq('user_id', userId);
```

## 📊 Estado Global

### Zustand Store

```typescript
import { create } from 'zustand';

interface AppState {
  currentTest: ReintroductionTest | null;
  setCurrentTest: (test: ReintroductionTest) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTest: null,
  setCurrentTest: (test) => set({ currentTest: test }),
}));
```

## 🔄 Data Fetching

### TanStack Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['tests', userId],
  queryFn: () => fetchTests(userId),
});

// Mutation
const mutation = useMutation({
  mutationFn: createTest,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tests'] });
  },
});
```

## 🚢 Deploy

### EAS Build

1. Instale EAS CLI:

```bash
npm install -g eas-cli
```

2. Login:

```bash
eas login
```

3. Configure o projeto:

```bash
eas build:configure
```

4. Build:

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

5. Submit:

```bash
# Android (Google Play)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```

## 📝 Fixtures e Dados de Teste

### Usar Fixtures

```typescript
import { mockReintroductionTests, mockUser } from '@/shared/fixtures/reintroductionTests';

// Em testes
const tests = mockReintroductionTests;

// Em Storybook
export const Default = {
  args: {
    tests: mockReintroductionTests,
  },
};
```

## 🐛 Troubleshooting

### Erro: "Unable to resolve module"

```bash
# Limpar cache
npm start -- --clear

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro: SQLite não funciona

```bash
# Rebuild do projeto
npx expo prebuild --clean
```

### Erro: Supabase não conecta

- Verifique `.env` com credenciais corretas
- Confirme que RLS policies estão configuradas
- Teste conexão no Supabase Dashboard

## 📚 Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Drizzle ORM](https://orm.drizzle.team/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Monash FODMAP](https://www.monashfodmap.com/)

## 📄 Licença

MIT

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/amazing`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ usando Expo e React Native
