# FODMAP Fácil

A comprehensive React Native (Expo) mobile application for managing the FODMAP reintroduction protocol. Built with clean architecture, high accessibility standards, and full internationalization support.

## 📱 Overview

FODMAP Fácil helps users navigate the FODMAP reintroduction protocol with a scientifically-backed, user-friendly mobile experience. The app provides:

- **Guided Reintroduction Journey**: Step-by-step protocol for testing FODMAP groups
- **Food Diary**: Track meals, symptoms, and reactions in real-time
- **Progress Reports**: Visualize tolerance patterns and test results
- **Personalized Profile**: Manage preferences, language, and theme settings
- **Offline-First**: Full functionality without internet connection
- **Accessible**: WCAG 2.1 AA/AAA compliant for all users
- **Bilingual**: Portuguese and English support

## ✨ Key Features

### 🏠 Home Dashboard

- Quick access to active reintroduction tests
- Recent symptom entries
- Progress overview

### 🚶 Journey Tracking

- Visual timeline of reintroduction phases
- Protocol guidance for each FODMAP group
- Test scheduling and reminders

### 📔 Food Diary

- Log meals with FODMAP content
- Record symptoms with severity levels
- Photo attachments for meals
- Search and filter entries

### 📊 Reports & Analytics

- Tolerance patterns by FODMAP group
- Symptom trends over time
- Exportable reports for healthcare providers

### 👤 Profile Management

- Language preferences (PT/EN)
- Theme selection (Light/Dark/System)
- Account settings
- Data export and privacy controls

## 📁 Project Structure

The project follows a feature-based clean architecture with clear separation of concerns:

```
fodmap-facil/
├── .github/
│   └── workflows/              # CI/CD pipeline configurations
│       └── ci.yml             # Automated testing and linting
├── .kiro/
│   └── specs/                 # Feature specifications and design docs
├── assets/                    # Static assets (images, icons, fonts)
│   ├── icon.png              # App icon
│   ├── splash-icon.png       # Splash screen
│   └── adaptive-icon.png     # Android adaptive icon
├── scripts/                   # Build and deployment automation
│   ├── prebuild.sh           # Pre-build checks and setup
│   ├── build-android.sh      # Android build automation
│   ├── build-ios.sh          # iOS build automation
│   └── deploy.sh             # Deployment automation
├── src/
│   ├── core/                  # Domain Layer (Business Logic)
│   │   ├── domain/           # Domain entities and interfaces
│   │   │   └── entities/     # User, ReintroductionTest, Symptom
│   │   ├── usecases/         # Use case implementations
│   │   │   └── CreateReintroductionTest.ts
│   │   └── engine/           # FODMAP protocol engine
│   │       └── ReintroductionEngine.ts
│   ├── features/              # Feature Modules
│   │   ├── auth/             # Authentication
│   │   │   ├── components/   # Auth-specific components
│   │   │   └── screens/      # SignInScreen, SignUpScreen
│   │   ├── reintroduction/   # Reintroduction tests
│   │   │   ├── components/   # Test cards, protocol guides
│   │   │   └── screens/      # ReintroductionHomeScreen
│   │   ├── journey/          # Journey tracking
│   │   │   └── screens/      # JourneyScreen
│   │   ├── diary/            # Food diary
│   │   │   └── screens/      # DiaryScreen
│   │   ├── reports/          # Reports and analytics
│   │   │   └── screens/      # ReportsScreen
│   │   └── profile/          # User profile
│   │       └── screens/      # ProfileScreen
│   ├── infrastructure/        # Infrastructure Layer
│   │   ├── api/              # External API clients
│   │   │   └── supabase.ts   # Supabase configuration
│   │   ├── database/         # Local database
│   │   │   ├── client.ts     # SQLite client
│   │   │   └── schema.ts     # Drizzle ORM schemas
│   │   └── storage/          # Storage adapters
│   ├── navigation/            # Navigation configuration
│   │   └── AppNavigator.tsx  # Stack + Tab navigation setup
│   └── shared/                # Shared Resources
│       ├── components/        # Design System
│       │   ├── atoms/        # Button, Input, Card, Text
│       │   ├── molecules/    # SymptomCard, TestCard, FormField
│       │   └── organisms/    # TestList, SymptomTracker
│       ├── fixtures/         # Test data and mocks
│       ├── hooks/            # Custom React hooks
│       │   ├── useAuth.ts
│       │   └── useReintroductionTests.ts
│       ├── i18n/             # Internationalization
│       │   ├── locales/      # Translation files (pt.json, en.json)
│       │   └── index.ts      # i18n configuration
│       ├── mocks/            # MSW mock handlers for testing
│       ├── stores/           # Zustand state management
│       │   └── appStore.ts
│       ├── theme/            # Design tokens and theming
│       │   ├── tokens.ts     # Colors, spacing, typography
│       │   ├── ThemeProvider.tsx
│       │   └── index.ts
│       └── utils/            # Utility functions
│           └── validation.ts # Zod schemas
├── .env.example               # Environment variables template
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── app.json                  # Expo configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── eas.json                  # EAS Build profiles
├── jest.config.js            # Jest testing configuration
├── jest.setup.js             # Jest setup and matchers
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### Architecture Principles

**Clean Architecture Layers:**

- **Domain Layer** (`core/`): Business logic, entities, and use cases
- **Infrastructure Layer** (`infrastructure/`): External services and data persistence
- **Presentation Layer** (`features/`, `shared/components/`): UI components and screens
- **Cross-Cutting Concerns** (`shared/`): Theme, i18n, utilities

**Design Patterns:**

- **Feature-Based Organization**: Code organized by feature for better encapsulation
- **Atomic Design**: Components structured as atoms → molecules → organisms
- **Repository Pattern**: Data access abstraction in infrastructure layer
- **Dependency Injection**: Loose coupling between layers

## 💾 Data Layer Architecture

### Offline-First Strategy

FODMAP Fácil implements an **offline-first architecture** where SQLite serves as the primary data source. This ensures the app works seamlessly without internet connectivity, providing a reliable user experience regardless of network conditions.

**Key Principles:**

- **SQLite as Source of Truth**: All data operations (read/write) go to the local SQLite database first
- **Asynchronous Sync**: Changes sync to Supabase in the background when connectivity is available
- **Optimistic Updates**: UI updates immediately while sync happens asynchronously
- **Conflict Resolution**: Last-write-wins strategy using timestamps for conflict resolution

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│                  (UI Layer)                              │
└────────────────────┬────────────────────────────────────┘
                     │ Custom Hooks (useProtocolRuns, etc.)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              TanStack Query Layer                        │
│  - Query Client (caching, refetching, invalidation)     │
│  - Query Keys (consistent naming convention)            │
│  - Optimistic Updates                                   │
└────────────────────┬────────────────────────────────────┘
                     │ Repository Methods
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Repository Layer                            │
│  - UserProfileRepository                                │
│  - ProtocolRunRepository                                │
│  - TestStepRepository                                   │
│  - SymptomEntryRepository                               │
│  - FoodItemRepository                                   │
└────────────────────┬────────────────────────────────────┘
                     │ Drizzle ORM
                     ↓
┌─────────────────────────────────────────────────────────┐
│         SQLite Database (Primary Storage)               │
│  - Offline-first local storage                          │
│  - Type-safe schema with Drizzle ORM                    │
└────────────────────┬────────────────────────────────────┘
                     │ Sync Service (Background)
                     ↓
┌─────────────────────────────────────────────────────────┐
│         Supabase (Remote Backup & Sync)                 │
│  - Cross-device synchronization                         │
│  - Cloud backup                                         │
│  - Authentication                                       │
└─────────────────────────────────────────────────────────┘
```

### Supabase Sync Strategy

**When Sync Occurs:**

1. **On App Launch**: Checks for connectivity and syncs pending changes
2. **After Mutations**: Queues local changes for background sync
3. **On Network Reconnection**: Automatically syncs when connectivity is restored
4. **Periodic Background Sync**: Syncs at regular intervals when app is active

**How Sync Works:**

1. **Local Write**: User action writes to SQLite immediately
2. **Queue for Sync**: Change is marked for synchronization
3. **Background Upload**: Sync service uploads changes to Supabase when online
4. **Conflict Detection**: Compares timestamps to detect conflicts
5. **Conflict Resolution**: Applies last-write-wins strategy
6. **Bidirectional Sync**: Downloads remote changes not present locally

**Sync Flow Diagram:**

```
User Action → SQLite Write → UI Update (Immediate)
                    ↓
              Sync Queue
                    ↓
         [Network Available?]
                    ↓
              Yes → Upload to Supabase
                    ↓
              Conflict Check
                    ↓
         [Timestamp Comparison]
                    ↓
         Local Newer → Keep Local
         Remote Newer → Update Local
         Same → No Action
```

### Sync Conflict Scenarios

**Scenario 1: Same Record Modified on Multiple Devices**

- **Situation**: User edits a protocol run on Device A while offline, then edits the same record on Device B
- **Resolution**: Last-write-wins based on `updatedAt` timestamp
- **Example**:
  ```
  Device A: updatedAt = 2024-01-15 10:30:00
  Device B: updatedAt = 2024-01-15 10:35:00
  Result: Device B's changes win, Device A's changes are overwritten
  ```

**Scenario 2: Deletion Conflicts**

- **Situation**: User deletes a record on Device A while Device B modifies it offline
- **Resolution**: Deletion takes precedence (tombstone record)
- **Example**: If Device A deletes a test step and Device B updates it, the deletion wins

**Scenario 3: Network Interruption During Sync**

- **Situation**: Sync starts but network drops mid-operation
- **Resolution**: Transaction rollback, retry with exponential backoff
- **Example**: Partial upload is rolled back, queued for retry after 1s, 2s, 4s intervals

**Scenario 4: Concurrent Creation**

- **Situation**: User creates new records on multiple devices with same local ID
- **Resolution**: Server-generated UUIDs prevent ID conflicts
- **Example**: Both records are created with unique IDs, no conflict occurs

### Conflict Resolution Strategy

**Last-Write-Wins with Timestamps:**

```typescript
// Conflict resolution logic
function resolveConflict(localRecord, remoteRecord) {
  if (localRecord.updatedAt > remoteRecord.updatedAt) {
    // Local is newer, upload to server
    return { action: 'upload', record: localRecord };
  } else if (remoteRecord.updatedAt > localRecord.updatedAt) {
    // Remote is newer, update local
    return { action: 'download', record: remoteRecord };
  } else {
    // Same timestamp, no conflict
    return { action: 'none', record: localRecord };
  }
}
```

**Conflict Prevention:**

- Unique IDs generated client-side (UUID v4)
- Timestamps in UTC to avoid timezone issues
- Atomic operations to prevent partial writes
- Optimistic locking for critical operations

### Data Operations Examples

#### Create Operation

```typescript
import { useCreateProtocolRun } from '@/shared/hooks/useProtocolRuns';

function CreateProtocolButton() {
  const createMutation = useCreateProtocolRun();

  const handleCreate = async () => {
    try {
      // Writes to SQLite immediately, syncs to Supabase in background
      await createMutation.mutateAsync({
        userId: 'user-123',
        status: 'planned',
        startDate: new Date(),
        notes: 'Starting fructose reintroduction',
      });

      // UI updates immediately with optimistic data
      console.log('Protocol created successfully');
    } catch (error) {
      console.error('Failed to create protocol:', error);
    }
  };

  return (
    <Button
      onPress={handleCreate}
      loading={createMutation.isPending}
    >
      Create Protocol
    </Button>
  );
}
```

#### Read Operation

```typescript
import { useProtocolRuns } from '@/shared/hooks/useProtocolRuns';

function ProtocolList({ userId }) {
  // Reads from SQLite, uses TanStack Query cache
  const { data: protocolRuns, isLoading, error, refetch } = useProtocolRuns(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <FlatList
      data={protocolRuns}
      renderItem={({ item }) => <ProtocolCard protocol={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

#### Update Operation

```typescript
import { useUpdateProtocolRun } from '@/shared/hooks/useProtocolRuns';

function ProtocolEditor({ protocolId }) {
  const updateMutation = useUpdateProtocolRun();

  const handleUpdate = async (updates) => {
    try {
      // Optimistic update: UI updates immediately
      await updateMutation.mutateAsync({
        id: protocolId,
        data: {
          status: 'active',
          notes: 'Updated notes',
          updatedAt: new Date(), // Timestamp for conflict resolution
        },
      });

      console.log('Protocol updated successfully');
    } catch (error) {
      // Rollback happens automatically on error
      console.error('Failed to update protocol:', error);
    }
  };

  return (
    <Form onSubmit={handleUpdate}>
      {/* Form fields */}
    </Form>
  );
}
```

#### Delete Operation

```typescript
import { useDeleteProtocolRun } from '@/shared/hooks/useProtocolRuns';

function DeleteProtocolButton({ protocolId }) {
  const deleteMutation = useDeleteProtocolRun();

  const handleDelete = async () => {
    try {
      // Soft delete in SQLite, syncs to Supabase
      await deleteMutation.mutateAsync(protocolId);

      // Cache automatically invalidated
      console.log('Protocol deleted successfully');
    } catch (error) {
      console.error('Failed to delete protocol:', error);
    }
  };

  return (
    <Button
      onPress={handleDelete}
      variant="destructive"
      loading={deleteMutation.isPending}
    >
      Delete Protocol
    </Button>
  );
}
```

#### Batch Operations

```typescript
import { useCreateSymptomEntries } from '@/shared/hooks/useSymptomEntries';

function BulkSymptomLogger({ testStepId }) {
  const createMutation = useCreateSymptomEntries();

  const handleBulkCreate = async (symptoms) => {
    try {
      // Batch insert for better performance
      await createMutation.mutateAsync({
        testStepId,
        entries: [
          { symptomType: 'bloating', severity: 7, timestamp: new Date() },
          { symptomType: 'pain', severity: 5, timestamp: new Date() },
          { symptomType: 'gas', severity: 6, timestamp: new Date() },
        ],
      });

      console.log('Symptoms logged successfully');
    } catch (error) {
      console.error('Failed to log symptoms:', error);
    }
  };

  return <SymptomForm onSubmit={handleBulkCreate} />;
}
```

### Query Key Naming Conventions

TanStack Query uses a consistent query key factory pattern for cache management:

```typescript
// Query key structure: [entity, ...identifiers]
export const queryKeys = {
  // User profiles
  userProfiles: {
    all: ['userProfiles'] as const,
    byId: (id: string) => ['userProfiles', id] as const,
    byEmail: (email: string) => ['userProfiles', 'email', email] as const,
  },

  // Protocol runs
  protocolRuns: {
    all: ['protocolRuns'] as const,
    byId: (id: string) => ['protocolRuns', id] as const,
    byUserId: (userId: string) => ['protocolRuns', 'user', userId] as const,
    active: (userId: string) => ['protocolRuns', 'active', userId] as const,
  },

  // Test steps
  testSteps: {
    all: ['testSteps'] as const,
    byId: (id: string) => ['testSteps', id] as const,
    byProtocolRunId: (protocolRunId: string) =>
      ['testSteps', 'protocolRun', protocolRunId] as const,
    byStatus: (status: string) => ['testSteps', 'status', status] as const,
  },

  // Symptom entries
  symptomEntries: {
    all: ['symptomEntries'] as const,
    byId: (id: string) => ['symptomEntries', id] as const,
    byTestStepId: (testStepId: string) => ['symptomEntries', 'testStep', testStepId] as const,
    byDateRange: (testStepId: string, start: Date, end: Date) =>
      [
        'symptomEntries',
        'testStep',
        testStepId,
        'range',
        start.toISOString(),
        end.toISOString(),
      ] as const,
  },

  // Food items
  foodItems: {
    all: ['foodItems'] as const,
    byId: (id: string) => ['foodItems', id] as const,
    byFodmapGroup: (group: string) => ['foodItems', 'group', group] as const,
  },
};
```

**Usage in Hooks:**

```typescript
// Query hook
export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byUserId(userId),
    queryFn: () => protocolRunRepository.findByUserId(userId),
    enabled: !!userId,
  });
}

// Mutation hook with cache invalidation
export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => protocolRunRepository.create(data),
    onSuccess: (newProtocolRun) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.byUserId(newProtocolRun.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.active(newProtocolRun.userId),
      });
    },
  });
}
```

**Key Naming Best Practices:**

1. **Hierarchical Structure**: Start with entity name, add identifiers progressively
2. **Const Assertions**: Use `as const` for type safety and autocomplete
3. **Descriptive Names**: Use clear, semantic names (e.g., `byUserId` not `user`)
4. **Consistent Patterns**: Follow same structure across all entities
5. **Granular Invalidation**: Structure keys to allow targeted cache invalidation

**Cache Invalidation Examples:**

```typescript
// Invalidate all protocol runs
queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.all });

// Invalidate specific user's protocol runs
queryClient.invalidateQueries({
  queryKey: queryKeys.protocolRuns.byUserId('user-123'),
});

// Invalidate active protocol run only
queryClient.invalidateQueries({
  queryKey: queryKeys.protocolRuns.active('user-123'),
});

// Invalidate all queries starting with 'protocolRuns'
queryClient.invalidateQueries({
  queryKey: ['protocolRuns'],
  exact: false,
});
```

### TanStack Query Configuration

The Query Client is configured with sensible defaults for offline-first behavior:

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
      retry: 3, // Retry failed queries 3 times
      retryDelay: (
        attemptIndex // Exponential backoff
      ) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});
```

**Configuration Rationale:**

- **staleTime (5 min)**: Balances data freshness with performance
- **gcTime (10 min)**: Keeps inactive data cached for quick navigation
- **retry (3)**: Handles transient network failures
- **exponential backoff**: Prevents server overload during outages
- **refetch flags**: Ensures data freshness when app regains focus

### Repository Pattern

All data access goes through repository classes that encapsulate database operations:

```typescript
// Example: ProtocolRunRepository
export class ProtocolRunRepository extends BaseRepository<ProtocolRun> {
  async create(data: CreateProtocolRunInput): Promise<ProtocolRun> {
    const newProtocolRun = {
      ...data,
      id: this.generateId(),
      createdAt: this.now(),
      updatedAt: this.now(),
    };

    await this.db.insert(protocolRuns).values(newProtocolRun);
    return newProtocolRun as ProtocolRun;
  }

  async findByUserId(userId: string): Promise<ProtocolRun[]> {
    return await this.db
      .select()
      .from(protocolRuns)
      .where(eq(protocolRuns.userId, userId))
      .orderBy(desc(protocolRuns.createdAt));
  }

  async update(id: string, data: UpdateProtocolRunInput): Promise<ProtocolRun> {
    const updates = {
      ...data,
      updatedAt: this.now(), // Critical for conflict resolution
    };

    await this.db.update(protocolRuns).set(updates).where(eq(protocolRuns.id, id));

    return await this.findById(id);
  }
}
```

### Performance Optimizations

**Database Indexes:**

```sql
-- Frequently queried columns
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_protocol_runs_user_id ON protocol_runs(user_id);
CREATE INDEX idx_test_steps_protocol_run_id ON test_steps(protocol_run_id);
CREATE INDEX idx_symptom_entries_test_step_id ON symptom_entries(test_step_id);

-- Composite index for date range queries
CREATE INDEX idx_symptom_entries_test_step_timestamp
  ON symptom_entries(test_step_id, timestamp);
```

**Query Optimization:**

- Use indexes for WHERE clauses
- Limit result sets with pagination
- Select only needed columns
- Use batch operations for multiple inserts

**Cache Optimization:**

- Prefetch related data
- Implement optimistic updates
- Use stale-while-revalidate pattern
- Invalidate cache strategically

### Future Enhancements

**Planned Improvements:**

1. **Incremental Sync**: Only sync changed records, not full datasets
2. **Conflict UI**: Show users when conflicts occur and let them choose resolution
3. **Offline Queue**: Visual indicator of pending sync operations
4. **Selective Sync**: Allow users to choose what data syncs to cloud
5. **Compression**: Compress data before upload to reduce bandwidth
6. **Delta Sync**: Track and sync only field-level changes
7. **Multi-Device Notifications**: Notify other devices when data changes

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

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Expo CLI** (will be installed with dependencies)
- **Git** for version control
- **Supabase Account** for backend services ([Sign up](https://supabase.com/))

For mobile development:

- **iOS**: macOS with Xcode 14+ and iOS Simulator
- **Android**: Android Studio with Android SDK and emulator
- **Physical Device**: Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/fodmap-facil.git
cd fodmap-facil
```

2. **Install dependencies:**

Using npm:

```bash
npm install
```

Using pnpm (recommended):

```bash
pnpm install
```

3. **Configure environment variables:**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics and Error Tracking
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_ANALYTICS_ID=
```

**Getting Supabase Credentials:**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select existing one
3. Navigate to Settings → API
4. Copy the Project URL and anon/public key

5. **Set up Supabase database:**

Run the following SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reintroduction Tests Table
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

-- Symptoms Table
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES reintroduction_tests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 10),
  notes TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reintroduction_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reintroduction_tests
CREATE POLICY "Users can view own tests"
  ON reintroduction_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
  ON reintroduction_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON reintroduction_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON reintroduction_tests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for symptoms
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

CREATE POLICY "Users can update own symptoms"
  ON symptoms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reintroduction_tests
      WHERE reintroduction_tests.id = symptoms.test_id
      AND reintroduction_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own symptoms"
  ON symptoms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reintroduction_tests
      WHERE reintroduction_tests.id = symptoms.test_id
      AND reintroduction_tests.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_reintroduction_tests_user_id ON reintroduction_tests(user_id);
CREATE INDEX idx_symptoms_test_id ON symptoms(test_id);
CREATE INDEX idx_symptoms_timestamp ON symptoms(timestamp);
```

5. **Start the development server:**

```bash
npm start
```

This will open the Expo DevTools in your browser. From here you can:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your physical device

## 💻 Development Commands

### Running the App

Start the development server and run on different platforms:

```bash
# Start Expo development server
npm start

# Run on iOS Simulator (macOS only)
npm run ios

# Run on Android Emulator
npm run android

# Run in web browser
npm run web
```

**Development Tips:**

- Press `r` in terminal to reload the app
- Press `m` to toggle menu
- Shake device to open developer menu on physical devices
- Use `--clear` flag to clear cache: `npm start -- --clear`

### Testing

Run tests to ensure code quality and functionality:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage Targets:**

- Core business logic: 80%+
- Utilities and helpers: 90%+
- React hooks: 70%+
- Components: 60%+

### Code Quality

Maintain code quality with linting, formatting, and type checking:

```bash
# Run ESLint to check for code issues
npm run lint

# Run ESLint and automatically fix issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check

# Run TypeScript type checking
npm run type-check
```

**Pre-commit Checklist:**

1. `npm run type-check` - No TypeScript errors
2. `npm run lint` - No ESLint errors
3. `npm run format:check` - Code is formatted
4. `npm test` - All tests pass

### Database Management

Manage local SQLite database with Drizzle ORM:

```bash
# Generate migration files from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

## 📦 Building the App

### EAS Build Setup

1. **Install EAS CLI globally:**

```bash
npm install -g eas-cli
```

2. **Login to your Expo account:**

```bash
eas login
```

3. **Configure EAS Build (if not already configured):**

```bash
eas build:configure
```

This creates/updates `eas.json` with build profiles.

### Build Profiles

The project includes three build profiles in `eas.json`:

**Development:**

- Development client with debugging enabled
- Fast iteration for testing
- Internal distribution only

**Preview:**

- Production-like build for testing
- APK for Android (faster than AAB)
- Ad-hoc distribution for iOS
- Test on real devices before store submission

**Production:**

- Optimized builds for app stores
- Auto-increment version numbers
- Code signing for distribution
- Ready for Google Play and App Store

### Building for Android

```bash
# Development build
eas build --platform android --profile development

# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Google Play)
eas build --platform android --profile production

# Or use the npm script
npm run build:android
```

**Android Build Notes:**

- Development builds require Expo Go or development client
- Preview builds generate APK files for easy distribution
- Production builds generate AAB (Android App Bundle) for Play Store
- First build may take 15-20 minutes; subsequent builds are faster

### Building for iOS

```bash
# Development build
eas build --platform ios --profile development

# Preview build (Ad-hoc distribution)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production

# Or use the npm script
npm run build:ios
```

**iOS Build Notes:**

- Requires Apple Developer account ($99/year)
- Must configure provisioning profiles and certificates
- Development builds require development provisioning profile
- Production builds require distribution certificate
- First build may take 20-30 minutes

### Build Automation Scripts

The project includes helper scripts in the `scripts/` directory:

```bash
# Run pre-build checks and setup
./scripts/prebuild.sh

# Automated Android build with error handling
./scripts/build-android.sh

# Automated iOS build with error handling
./scripts/build-ios.sh

# Deployment automation
./scripts/deploy.sh
```

Make scripts executable if needed:

```bash
chmod +x scripts/*.sh
```

## 🚀 Deployment

### Submitting to App Stores

After building production versions, submit to app stores:

**Google Play Store:**

```bash
# Submit Android build
eas submit --platform android

# Or use npm script
npm run submit:android
```

**Requirements:**

- Google Play Developer account ($25 one-time fee)
- Production AAB build
- App listing details (screenshots, description, etc.)
- Privacy policy URL

**Apple App Store:**

```bash
# Submit iOS build
eas submit --platform ios

# Or use npm script
npm run submit:ios
```

**Requirements:**

- Apple Developer account ($99/year)
- Production IPA build
- App Store Connect listing
- App icons and screenshots
- Privacy policy and terms

### Deployment Workflow

1. **Prepare Release:**
   - Update version in `app.json`
   - Update changelog
   - Run all tests: `npm test`
   - Check types: `npm run type-check`
   - Lint code: `npm run lint`

2. **Build:**
   - Android: `npm run build:android`
   - iOS: `npm run build:ios`
   - Wait for builds to complete (check EAS dashboard)

3. **Test Builds:**
   - Download and install preview builds
   - Test on real devices
   - Verify all features work correctly

4. **Submit:**
   - Android: `npm run submit:android`
   - iOS: `npm run submit:ios`
   - Fill in store listing details
   - Submit for review

5. **Monitor:**
   - Check submission status in store dashboards
   - Respond to review feedback if needed
   - Monitor crash reports and user feedback

### Over-The-Air (OTA) Updates

For JavaScript-only changes (no native code), use OTA updates:

```bash
# Publish update to production channel
eas update --branch production --message "Bug fixes and improvements"

# Publish to preview channel
eas update --branch preview --message "Testing new features"
```

**OTA Update Notes:**

- Only updates JavaScript bundle, not native code
- Users get updates automatically on next app launch
- Much faster than full app store submission
- Cannot update native dependencies or configuration

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

### Common Issues and Solutions

#### "Unable to resolve module" Error

This usually indicates a caching issue or missing dependency.

**Solution:**

```bash
# Clear Metro bundler cache
npm start -- --clear

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

#### Metro Bundler Won't Start

**Solution:**

```bash
# Kill any processes using port 8081
lsof -ti:8081 | xargs kill -9

# Or on Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Restart Metro
npm start
```

#### SQLite Database Not Working

**Solution:**

```bash
# Rebuild native modules
npx expo prebuild --clean

# For iOS, also reinstall pods
cd ios && pod install && cd ..

# Restart development server
npm start
```

#### Supabase Connection Issues

**Symptoms:** Authentication fails, data doesn't sync, API errors

**Solution:**

1. Verify `.env` file has correct credentials:
   ```bash
   cat .env
   ```
2. Check Supabase project status in dashboard
3. Verify RLS policies are configured correctly
4. Test connection in Supabase SQL Editor:
   ```sql
   SELECT * FROM reintroduction_tests LIMIT 1;
   ```
5. Check network connectivity
6. Verify API URL doesn't have trailing slash

#### TypeScript Errors After Update

**Solution:**

```bash
# Regenerate TypeScript types
npm run type-check

# Clear TypeScript cache
rm -rf node_modules/.cache

# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"
```

#### iOS Build Fails

**Common causes and solutions:**

1. **CocoaPods issues:**

   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

2. **Xcode version mismatch:**
   - Ensure Xcode 14+ is installed
   - Run: `sudo xcode-select --switch /Applications/Xcode.app`

3. **Provisioning profile issues:**
   - Check Apple Developer account status
   - Regenerate certificates in EAS dashboard
   - Run: `eas credentials`

#### Android Build Fails

**Common causes and solutions:**

1. **Gradle issues:**

   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Java version mismatch:**
   - Ensure Java 11 or 17 is installed
   - Check: `java -version`

3. **SDK/NDK issues:**
   - Update Android Studio
   - Install required SDK versions via SDK Manager

#### App Crashes on Startup

**Solution:**

1. Check error logs:

   ```bash
   # iOS
   npx react-native log-ios

   # Android
   npx react-native log-android
   ```

2. Clear app data:
   - iOS: Delete app and reinstall
   - Android: Settings → Apps → FODMAP Fácil → Clear Data

3. Check for missing environment variables

4. Verify Supabase configuration

#### Tests Failing

**Solution:**

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.test.ts
```

#### Expo Go App Shows Error

**Solution:**

1. Ensure Expo Go app is up to date
2. Check that device and computer are on same network
3. Try connecting via tunnel:
   ```bash
   npm start -- --tunnel
   ```
4. Restart Expo Go app

#### Performance Issues

**Solution:**

1. Enable Hermes engine (already enabled in `app.json`)
2. Check for memory leaks with React DevTools
3. Optimize images (use WebP format)
4. Reduce bundle size:
   ```bash
   npx react-native-bundle-visualizer
   ```

#### Environment Variables Not Loading

**Solution:**

1. Ensure `.env` file exists in root directory
2. Restart development server after changing `.env`
3. Verify variable names start with `EXPO_PUBLIC_`
4. Check for typos in variable names

### Getting Help

If you're still experiencing issues:

1. **Check Expo Documentation:** [docs.expo.dev](https://docs.expo.dev/)
2. **Search Expo Forums:** [forums.expo.dev](https://forums.expo.dev/)
3. **GitHub Issues:** Check existing issues or create a new one
4. **Supabase Support:** [supabase.com/support](https://supabase.com/support)
5. **Stack Overflow:** Tag questions with `expo`, `react-native`, `supabase`

### Debug Mode

Enable additional logging for troubleshooting:

```bash
# Enable verbose logging
EXPO_DEBUG=true npm start

# Enable React Native debugging
npm start -- --dev-client
```

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
