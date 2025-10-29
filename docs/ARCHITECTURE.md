# Arquitetura do App FODMAP Reintroduction

## Visão Geral

Este documento descreve a arquitetura do aplicativo, seguindo os princípios de Clean Architecture e SOLID.

## Camadas da Aplicação

### 1. Core (Domínio)

**Responsabilidade**: Lógica de negócio pura, independente de frameworks.

```
src/core/
├── domain/          # Entidades e interfaces
│   └── entities/    # Modelos de domínio
├── usecases/        # Casos de uso (regras de negócio)
└── engine/          # Engine determinístico FODMAP
```

**Princípios**:

- Sem dependências externas
- Lógica testável e determinística
- Entidades imutáveis quando possível

**Exemplo**:

```typescript
// Entidade pura
export interface ReintroductionTest {
  id: string;
  userId: string;
  fodmapGroup: FODMAPGroup;
  // ...
}

// Engine determinístico
export class ReintroductionEngine {
  static canProgressToNextGroup(test: ReintroductionTest): boolean {
    // Lógica pura, sem side effects
  }
}
```

### 2. Features (Aplicação)

**Responsabilidade**: Implementação de features específicas.

```
src/features/
├── auth/
│   ├── screens/     # Telas de autenticação
│   └── components/  # Componentes específicos
├── reintroduction/
│   ├── screens/     # Telas de reintrodução
│   └── components/  # Componentes específicos
└── profile/
    ├── screens/     # Telas de perfil
    └── components/  # Componentes específicos
```

**Princípios**:

- Cada feature é isolada
- Componentes reutilizáveis vão para `shared/`
- Usa casos de uso do `core/`

### 3. Shared (Compartilhado)

**Responsabilidade**: Código compartilhado entre features.

```
src/shared/
├── components/      # Design System
│   ├── atoms/      # Componentes básicos
│   ├── molecules/  # Composições simples
│   └── organisms/  # Composições complexas
├── hooks/          # React hooks customizados
├── theme/          # Tokens de design
├── i18n/           # Internacionalização
├── utils/          # Utilitários
└── fixtures/       # Dados de teste
```

**Princípios**:

- Atomic Design para componentes
- Hooks reutilizáveis
- Utilitários puros

### 4. Infrastructure (Infraestrutura)

**Responsabilidade**: Implementações técnicas e integrações.

```
src/infrastructure/
├── api/            # Cliente Supabase
├── database/       # SQLite + Drizzle
└── storage/        # Armazenamento local
```

**Princípios**:

- Implementa interfaces do domínio
- Pode ser substituída sem afetar o core
- Gerencia side effects

### 5. Navigation

**Responsabilidade**: Estrutura de navegação.

```
src/navigation/
└── AppNavigator.tsx
```

## Fluxo de Dados

### 1. Offline-First com Sincronização

```
User Action
    ↓
Component (UI)
    ↓
TanStack Query (Cache)
    ↓
SQLite (Local) ←→ Supabase (Remote)
    ↓
Zustand (State)
    ↓
Component (UI Update)
```

### 2. Autenticação

```
SignIn Screen
    ↓
useAuth Hook
    ↓
Supabase Auth
    ↓
Session Storage (AsyncStorage)
    ↓
Navigation (Redirect)
```

### 3. Teste de Reintrodução

```
Create Test Screen
    ↓
CreateReintroductionTest UseCase
    ↓
ReintroductionEngine (Validation)
    ↓
SQLite (Save Local)
    ↓
Supabase (Sync)
    ↓
TanStack Query (Invalidate Cache)
```

## Padrões de Design

### 1. Repository Pattern

```typescript
interface ReintroductionTestRepository {
  create(test: ReintroductionTest): Promise<void>;
  findById(id: string): Promise<ReintroductionTest | null>;
  findByUserId(userId: string): Promise<ReintroductionTest[]>;
  update(test: ReintroductionTest): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 2. Use Case Pattern

```typescript
class CreateReintroductionTest {
  constructor(private repository: ReintroductionTestRepository) {}

  async execute(input: CreateInput): Promise<CreateOutput> {
    // Validação
    // Lógica de negócio
    // Persistência
  }
}
```

### 3. Dependency Injection

```typescript
// Container de dependências
const container = {
  testRepository: new SupabaseTestRepository(),
  createTestUseCase: new CreateReintroductionTest(testRepository),
};
```

## Estado Global

### Zustand Stores

```typescript
// App Store - Estado global da aplicação
interface AppState {
  currentTest: ReintroductionTest | null;
  currentPhase: TestPhase;
  setCurrentTest: (test: ReintroductionTest) => void;
}

// User Store - Estado do usuário
interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  updateProfile: (profile: UserProfile) => void;
}
```

## Cache e Sincronização

### TanStack Query

```typescript
// Query Keys
const queryKeys = {
  tests: ['tests'],
  testsByUser: (userId: string) => ['tests', userId],
  test: (id: string) => ['tests', id],
};

// Queries
const useTests = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.testsByUser(userId),
    queryFn: () => fetchTests(userId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Mutations
const useCreateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests });
    },
  });
};
```

## Acessibilidade

### Implementação WCAG 2.1

1. **Semântica**

```typescript
<Button
  accessibilityRole="button"
  accessibilityLabel="Start test"
  accessibilityHint="Tap to begin reintroduction test"
  accessibilityState={{ disabled: false }}
/>
```

2. **Navegação por Teclado**

```typescript
<View
  accessible={true}
  accessibilityRole="navigation"
>
  {/* Conteúdo navegável */}
</View>
```

3. **Contraste e Tamanhos**

```typescript
// Tokens garantem conformidade
const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget, // 44pt
    backgroundColor: colors.primary500, // Contraste 4.5:1
  },
});
```

## Internacionalização

### Estrutura i18n

```typescript
// Namespace por feature
{
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up"
  },
  "reintroduction": {
    "title": "FODMAP Reintroduction",
    "startTest": "Start Test"
  }
}

// Uso
const { t } = useTranslation();
<Text>{t('auth.signIn')}</Text>
```

## Testes

### Estratégia de Testes

1. **Unit Tests** - Core/Engine

```typescript
describe('ReintroductionEngine', () => {
  it('should validate protocol correctly', () => {
    const result = ReintroductionEngine.validateTestProtocol(test);
    expect(result.valid).toBe(true);
  });
});
```

2. **Component Tests** - UI

```typescript
describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} />);
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

3. **Integration Tests** - Features

```typescript
describe('SignIn Flow', () => {
  it('should sign in user successfully', async () => {
    // Mock Supabase
    // Render SignIn screen
    // Fill form
    // Submit
    // Assert navigation
  });
});
```

## Performance

### Otimizações

1. **Memoização**

```typescript
const MemoizedComponent = React.memo(Component);

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

2. **Lazy Loading**

```typescript
const LazyScreen = React.lazy(() => import('./Screen'));
```

3. **Virtualized Lists**

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

## Segurança

### Boas Práticas

1. **Variáveis de Ambiente**

```typescript
// Nunca commitar .env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

2. **Row Level Security (RLS)**

```sql
-- Supabase RLS
CREATE POLICY "Users can only view own tests"
  ON reintroduction_tests FOR SELECT
  USING (auth.uid() = user_id);
```

3. **Validação de Entrada**

```typescript
import { z } from 'zod';

const testSchema = z.object({
  foodItem: z.string().min(1).max(100),
  portionSize: z.string().min(1),
  dayNumber: z.number().int().positive(),
});
```

## Deploy

### Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

### EAS Build

```bash
# Development
eas build --profile development --platform android

# Production
eas build --profile production --platform all
```

## Monitoramento

### Logging

```typescript
// Structured logging
logger.info('Test created', {
  testId: test.id,
  userId: test.userId,
  fodmapGroup: test.fodmapGroup,
});
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/react-native';

Sentry.captureException(error, {
  tags: { feature: 'reintroduction' },
  extra: { testId: test.id },
});
```

## Evolução da Arquitetura

### Próximos Passos

1. **Notificações Push** - Lembretes de testes
2. **Analytics** - Tracking de uso
3. **Exportação de Dados** - PDF/CSV
4. **Integração com Wearables** - Apple Health, Google Fit
5. **Machine Learning** - Predição de tolerância

---

Esta arquitetura foi projetada para ser:

- **Escalável**: Fácil adicionar novas features
- **Testável**: Lógica isolada e determinística
- **Manutenível**: Separação clara de responsabilidades
- **Acessível**: WCAG 2.1 AA/AAA compliance
- **Internacional**: Suporte multi-idioma desde o início
