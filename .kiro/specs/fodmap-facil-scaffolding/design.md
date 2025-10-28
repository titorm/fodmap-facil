# Design Document

## Overview

The "fodmap-facil" application scaffolding establishes a production-ready Expo project with TypeScript, comprehensive tooling, and a modular architecture. The design leverages Expo SDK 54, React Native 0.81, and modern development practices including strict TypeScript, automated testing, and CI/CD pipelines.

The project already has a solid foundation with navigation, theming, i18n, and Supabase integration. This design document formalizes the existing structure and identifies areas for enhancement to meet all scaffolding requirements.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Expo Application                      │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer                                      │
│  ├─ Navigation (Stack + Tabs)                           │
│  ├─ Screens (Home, Jornada, Diário, Relatórios, Perfil)│
│  └─ Components (Atoms, Molecules, Organisms)            │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                    │
│  ├─ Hooks (useAuth, useReintroductionTests, etc.)      │
│  ├─ Stores (Zustand state management)                   │
│  └─ Engine (ReintroductionEngine)                       │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                    │
│  ├─ API (Supabase client)                               │
│  ├─ Database (SQLite with Drizzle ORM)                  │
│  └─ Storage (AsyncStorage, SecureStore)                 │
├─────────────────────────────────────────────────────────┤
│  Cross-Cutting Concerns                                  │
│  ├─ Theme System (Light/Dark mode)                      │
│  ├─ i18n (pt-BR, en)                                    │
│  ├─ Validation (Zod schemas)                            │
│  └─ Utils                                                │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Expo SDK 54 with React Native 0.81
- **Language**: TypeScript 5.9 with strict mode
- **Navigation**: React Navigation 7 (Stack + Bottom Tabs)
- **State Management**: Zustand 5.0
- **Backend**: Supabase (Auth + Database)
- **Local Database**: SQLite with Drizzle ORM
- **Internationalization**: i18next + react-i18next
- **Testing**: Jest 30 + React Native Testing Library
- **Code Quality**: ESLint 9 + Prettier 3
- **Build System**: EAS Build
- **CI/CD**: GitHub Actions

## Components and Interfaces

### 1. Project Structure

The project follows a feature-based architecture with clear separation of concerns:

```
fodmap-facil/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI pipeline configuration
├── .kiro/
│   └── specs/                        # Specification documents
├── app/                              # Expo Router file-based routing (future)
├── assets/                           # Static assets (images, fonts)
├── scripts/                          # Build and deployment scripts
├── src/
│   ├── core/                         # Core business logic
│   │   ├── domain/                   # Domain entities
│   │   ├── engine/                   # Business logic engines
│   │   └── usecases/                 # Use case implementations
│   ├── features/                     # Feature modules
│   │   ├── auth/                     # Authentication feature
│   │   ├── profile/                  # User profile feature
│   │   ├── reintroduction/           # Reintroduction tests feature
│   │   ├── journey/                  # Journey tracking (new)
│   │   ├── diary/                    # Food diary (new)
│   │   └── reports/                  # Reports and analytics (new)
│   ├── infrastructure/               # External integrations
│   │   ├── api/                      # API clients (Supabase)
│   │   ├── database/                 # Local database (SQLite)
│   │   └── storage/                  # Storage adapters
│   ├── navigation/                   # Navigation configuration
│   └── shared/                       # Shared resources
│       ├── components/               # Reusable UI components
│       │   ├── atoms/                # Basic components
│       │   ├── molecules/            # Composite components
│       │   └── organisms/            # Complex components
│       ├── fixtures/                 # Test fixtures
│       ├── hooks/                    # Custom React hooks
│       ├── i18n/                     # Internationalization
│       ├── mocks/                    # MSW mocks for testing
│       ├── stores/                   # Global state stores
│       ├── theme/                    # Design tokens and theme
│       └── utils/                    # Utility functions
├── .env.example                      # Environment variables template
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── app.json                          # Expo configuration
├── drizzle.config.ts                 # Drizzle ORM configuration
├── eas.json                          # EAS Build configuration
├── jest.config.js                    # Jest configuration
├── jest.setup.js                     # Jest setup file
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

### 2. Navigation System

The navigation system uses React Navigation with a hybrid approach:

**Stack Navigator (Root)**

- Handles authentication flow (SignIn vs Main)
- Manages modal screens and overlays
- Provides screen transitions

**Bottom Tab Navigator (Main)**

- Five tabs: Home, Jornada, Diário, Relatórios, Perfil
- Each tab contains its own stack navigator for nested navigation
- Accessibility labels for screen readers
- Custom icons and active/inactive states

**Navigation Interface**:

```typescript
// Navigation types
type RootStackParamList = {
  SignIn: undefined;
  Main: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Jornada: undefined;
  Diário: undefined;
  Relatórios: undefined;
  Perfil: undefined;
};

// Each tab can have nested stacks
type HomeStackParamList = {
  HomeScreen: undefined;
  FoodDetails: { foodId: string };
};
```

### 3. Theme System

The theme system provides comprehensive design tokens with automatic light/dark mode switching:

**Design Tokens Structure**:

- **Colors**: Primary, secondary, neutral, semantic (success, warning, error), FODMAP-specific
- **Spacing**: xs (4), sm (8), md (16), lg (24), xl (32), xxl (48)
- **Typography**: Font families, sizes, line heights, weights
- **Border Radius**: sm (4), md (8), lg (12), xl (16), full (9999)
- **Shadows**: sm, md, lg with elevation for Android
- **Accessibility**: Minimum touch targets (44px WCAG AA, 48px AAA)

**Theme Provider Interface**:

```typescript
interface Theme {
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    // ... all color tokens
  };
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

// Hook for consuming theme
const { theme, toggleTheme } = useTheme();
```

**Color Scheme Detection**:

- Uses `useColorScheme()` from React Native
- Automatically switches between light and dark palettes
- Respects system preferences
- Allows manual override

### 4. Internationalization System

The i18n system uses i18next with React Native integration:

**Supported Languages**:

- Portuguese (pt-BR) - Default
- English (en) - Fallback

**Translation Structure**:

```json
{
  "onboarding": {
    "welcome": "Welcome message",
    "getStarted": "Get started button"
  },
  "tabs": {
    "home": "Home",
    "journey": "Jornada",
    "diary": "Diário",
    "reports": "Relatórios",
    "profile": "Perfil"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

**i18n Interface**:

```typescript
// Hook for translations
const { t, i18n } = useTranslation();

// Usage
<Text>{t('onboarding.welcome')}</Text>

// Change language
i18n.changeLanguage('pt');
```

### 5. Supabase Integration

The Supabase client provides authentication and database services:

**Configuration**:

- URL and anonymous key from environment variables
- AsyncStorage for session persistence
- Auto-refresh tokens enabled
- Session detection disabled for mobile

**Supabase Client Interface**:

```typescript
interface SupabaseClient {
  auth: {
    signIn: (credentials: Credentials) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
    getSession: () => Promise<Session | null>;
    onAuthStateChange: (callback: AuthCallback) => Subscription;
  };
  from: (table: string) => QueryBuilder;
}
```

### 6. Component Architecture

Components follow Atomic Design principles:

**Atoms** (Basic building blocks):

- Button, Input, Card, Text, Icon
- Fully accessible with ARIA labels
- Theme-aware styling
- Consistent API across components

**Molecules** (Composite components):

- SymptomCard, TestCard, FormField
- Combine atoms with specific logic
- Reusable across features

**Organisms** (Complex components):

- TestList, SymptomTracker, ReportChart
- Feature-specific compositions
- Manage local state and side effects

**Component Interface Pattern**:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}
```

## Data Models

### 1. User Entity

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    language: 'pt' | 'en';
    theme: 'light' | 'dark' | 'system';
  };
}
```

### 2. Reintroduction Test Entity

```typescript
interface ReintroductionTest {
  id: string;
  userId: string;
  foodName: string;
  fodmapType: 'fructose' | 'lactose' | 'fructans' | 'galactans' | 'polyols';
  status: 'planned' | 'in_progress' | 'completed';
  startDate: Date;
  endDate?: Date;
  symptoms: Symptom[];
  notes: string;
}
```

### 3. Theme Configuration

```typescript
interface ThemeConfig {
  light: ColorPalette;
  dark: ColorPalette;
  current: 'light' | 'dark' | 'system';
}

interface ColorPalette {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  // ... all color tokens
}
```

## Error Handling

### 1. Error Boundaries

React Error Boundaries catch rendering errors and display fallback UI:

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 2. API Error Handling

Standardized error handling for Supabase and network requests:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<Result<T, ApiError>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }
}
```

### 3. Validation Errors

Zod schemas provide runtime validation with detailed error messages:

```typescript
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Usage
const result = userSchema.safeParse(data);
if (!result.success) {
  // result.error.issues contains detailed validation errors
}
```

## Testing Strategy

### 1. Unit Tests

Test individual functions, hooks, and utilities in isolation:

**Coverage Targets**:

- Core business logic: 80%+
- Utilities and helpers: 90%+
- Hooks: 70%+

**Example**:

```typescript
describe('ReintroductionEngine', () => {
  it('should calculate test duration correctly', () => {
    const engine = new ReintroductionEngine();
    const duration = engine.calculateDuration(startDate, endDate);
    expect(duration).toBe(7);
  });
});
```

### 2. Component Tests

Test component rendering, interactions, and accessibility:

**Testing Library Approach**:

- Render components with necessary providers
- Query by accessibility labels and roles
- Simulate user interactions
- Assert on visible output

**Example**:

```typescript
describe('Button', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <Button onPress={onPress} accessibilityLabel="Submit">
        Submit
      </Button>
    );

    fireEvent.press(getByLabelText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Integration Tests

Test feature workflows and data flow between components:

**Scope**:

- Authentication flow
- Navigation between screens
- Data persistence and retrieval
- API integration with mocked responses (MSW)

### 4. Accessibility Testing

Ensure WCAG 2.1 AA compliance:

**Checks**:

- All interactive elements have accessibility labels
- Touch targets meet minimum size (44x44)
- Color contrast ratios meet standards
- Screen reader compatibility

## Build and Deployment

### 1. Development Workflow

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### 2. EAS Build Profiles

**Development**:

- Development client enabled
- Internal distribution
- Fast iteration

**Preview**:

- APK for Android (faster than AAB)
- Internal distribution
- Testing on real devices

**Production**:

- Auto-increment version
- Optimized builds
- Ready for store submission

### 3. CI/CD Pipeline

GitHub Actions workflow runs on every push and PR:

**Pipeline Steps**:

1. Checkout code
2. Setup Node.js and dependencies
3. Run TypeScript type checking
4. Run ESLint
5. Run Jest tests
6. Report results

**Workflow Configuration**:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
```

## Configuration Files

### 1. TypeScript Configuration

- Strict mode enabled
- Path aliases (@/_ → src/_)
- ES module interop
- JSON module resolution

### 2. ESLint Configuration

- Expo preset
- Prettier integration
- React and React Native plugins
- Custom rules for unused styles and inline styles

### 3. Prettier Configuration

- Consistent code formatting
- Integrated with ESLint
- Format on save (IDE configuration)

### 4. Jest Configuration

- Expo preset
- Transform ignore patterns for React Native modules
- Coverage collection from src/\*\*
- Setup file for testing library matchers

## Environment Variables

Required environment variables documented in .env.example:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics, Error Tracking
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_ANALYTICS_ID=
```

## Design Decisions and Rationales

### 1. React Navigation over Expo Router

**Decision**: Use React Navigation for now, with Expo Router as future migration path

**Rationale**:

- React Navigation is mature and well-documented
- Better TypeScript support currently
- Easier to implement complex navigation patterns
- Expo Router is still evolving (though promising)

### 2. Zustand for State Management

**Decision**: Use Zustand instead of Redux or Context API

**Rationale**:

- Minimal boilerplate
- Excellent TypeScript support
- No provider wrapping needed
- Easy to test
- Small bundle size

### 3. SQLite + Drizzle for Local Storage

**Decision**: Use SQLite with Drizzle ORM for offline-first data

**Rationale**:

- Offline-first capability essential for food diary
- Drizzle provides type-safe queries
- Better performance than AsyncStorage for complex data
- Sync with Supabase when online

### 4. Atomic Design for Components

**Decision**: Organize components using Atomic Design principles

**Rationale**:

- Clear component hierarchy
- Promotes reusability
- Easier to maintain design system
- Scales well with team growth

### 5. Feature-Based Architecture

**Decision**: Organize code by features rather than technical layers

**Rationale**:

- Better encapsulation
- Easier to understand feature scope
- Facilitates parallel development
- Reduces merge conflicts

### 6. Strict TypeScript Configuration

**Decision**: Enable all strict TypeScript checks

**Rationale**:

- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

## Accessibility Considerations

### 1. WCAG 2.1 AA Compliance

- Minimum touch target size: 44x44 pixels
- Color contrast ratios: 4.5:1 for text, 3:1 for UI components
- All interactive elements have accessibility labels
- Semantic HTML/React Native components

### 2. Screen Reader Support

- Proper accessibility roles
- Descriptive labels for all interactive elements
- Logical focus order
- Announcements for dynamic content changes

### 3. Keyboard Navigation

- All functionality accessible via keyboard (web)
- Logical tab order
- Visible focus indicators

## Performance Considerations

### 1. Bundle Size Optimization

- Tree shaking enabled
- Code splitting for large features
- Lazy loading for non-critical screens
- Image optimization

### 2. Rendering Performance

- React.memo for expensive components
- useMemo/useCallback for expensive computations
- FlatList for long lists with virtualization
- Avoid inline styles and functions

### 3. Network Performance

- Request caching with React Query
- Optimistic updates for better UX
- Retry logic for failed requests
- Offline queue for mutations

## Security Considerations

### 1. Environment Variables

- Never commit .env files
- Use EXPO*PUBLIC* prefix for client-safe variables
- Sensitive keys in SecureStore, not AsyncStorage

### 2. Authentication

- Secure token storage (SecureStore)
- Auto-refresh tokens
- Proper session management
- HTTPS only for API calls

### 3. Data Validation

- Validate all user input with Zod
- Sanitize data before display
- SQL injection prevention (Drizzle ORM)
- XSS prevention

## Future Enhancements

### 1. Expo Router Migration

- Migrate from React Navigation to Expo Router
- File-based routing for better DX
- Improved deep linking support

### 2. Advanced Theming

- Custom theme builder
- More color schemes (high contrast, colorblind-friendly)
- Dynamic theme switching animations

### 3. Offline Sync

- Robust conflict resolution
- Background sync
- Sync status indicators

### 4. Analytics and Monitoring

- User behavior tracking
- Error tracking (Sentry)
- Performance monitoring
- Crash reporting

### 5. Advanced Testing

- E2E tests with Detox
- Visual regression testing
- Performance testing
- Accessibility audits
