# Design Document

## Overview

The data layer for "fodmap-facil" implements an offline-first architecture using SQLite as the primary data source with Drizzle ORM for type-safe database operations. The design integrates TanStack Query for efficient data fetching, caching, and synchronization with Supabase as the remote backend. This approach ensures the application works seamlessly offline while providing automatic sync when connectivity is restored.

The data layer supports the complete FODMAP reintroduction protocol workflow with eight core entities: UserProfile, ProtocolRun, TestStep, SymptomEntry, WashoutPeriod, FoodItem, GroupResult, and NotificationSchedule. The repository pattern abstracts data access, while custom React hooks provide a declarative API for components.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│                  (UI Layer)                              │
└────────────────────┬────────────────────────────────────┘
                     │ Custom Hooks (useProtocolRuns, etc.)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              TanStack Query Layer                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Query Client (caching, refetching, invalidation)│  │
│  │  - Query Keys                                     │  │
│  │  - Cache Management                               │  │
│  │  - Optimistic Updates                             │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Repository Methods
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Repository Layer                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  UserProfileRepository                            │  │
│  │  ProtocolRunRepository                            │  │
│  │  TestStepRepository                               │  │
│  │  SymptomEntryRepository                           │  │
│  │  WashoutPeriodRepository                          │  │
│  │  FoodItemRepository                               │  │
│  │  GroupResultRepository                            │  │
│  │  NotificationScheduleRepository                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Drizzle ORM
                     ↓
```

┌─────────────────────────────────────────────────────────┐
│ SQLite Database (Primary) │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Local Storage (Offline-First) │ │
│ │ - user_profiles │ │
│ │ - protocol_runs │ │
│ │ - test_steps │ │
│ │ - symptom_entries │ │
│ │ - washout_periods │ │
│ │ - food_items │ │
│ │ - group_results │ │
│ │ - notification_schedules │ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
│ Sync Service (Future)
↓
┌─────────────────────────────────────────────────────────┐
│ Supabase (Remote Backup) │
│ - Authentication │
│ - Remote Data Persistence │
│ - Cross-Device Sync │
└─────────────────────────────────────────────────────────┘

```

### Data Flow Patterns

**Read Operations (Query)**:
1. Component calls custom hook (e.g., `useProtocolRuns()`)
2. TanStack Query checks cache for fresh data
3. If stale or missing, Query calls repository method
4. Repository uses Drizzle ORM to query SQLite
5. Data flows back through layers to component
6. TanStack Query caches result with configured staleTime

**Write Operations (Mutation)**:
1. Component calls mutation hook (e.g., `useCreateProtocolRun()`)
2. Mutation hook calls repository method
3. Repository writes to SQLite via Drizzle ORM
4. On success, mutation invalidates related queries
5. TanStack Query refetches affected data
6. Sync service queues change for Supabase (future)

**Offline-First Strategy**:
- SQLite is the source of truth
- All reads/writes go to local database first
- Sync happens asynchronously in background
- Conflict resolution handled by sync service (future)

## Components and Interfaces

### 1. Database Schema (Drizzle ORM)

```

**File**: `src/db/schema.ts`

All entity schemas are defined using Drizzle ORM's SQLite dialect with proper types and constraints.

**UserProfile Schema**:

```typescript
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  languagePreference: text('language_preference').notNull().default('pt'),
  themePreference: text('theme_preference').notNull().default('system'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**ProtocolRun Schema**:

```typescript
export const protocolRuns = sqliteTable('protocol_runs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userProfiles.id),
  status: text('status').notNull(), // 'planned' | 'active' | 'paused' | 'completed'
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**TestStep Schema**:

```typescript
export const testSteps = sqliteTable('test_steps', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  foodItemId: text('food_item_id')
    .notNull()
    .references(() => foodItems.id),
  sequenceNumber: integer('sequence_number').notNull(),
  status: text('status').notNull(), // 'pending' | 'in_progress' | 'completed' | 'skipped'
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**SymptomEntry Schema**:

```typescript
export const symptomEntries = sqliteTable('symptom_entries', {
  id: text('id').primaryKey(),
  testStepId: text('test_step_id')
    .notNull()
    .references(() => testSteps.id),
  symptomType: text('symptom_type').notNull(), // 'bloating' | 'pain' | 'gas' | 'diarrhea' | 'constipation'
  severity: integer('severity').notNull(), // 1-10 scale
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**WashoutPeriod Schema**:

```typescript
export const washoutPeriods = sqliteTable('washout_periods', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull(), // 'pending' | 'active' | 'completed'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**FoodItem Schema**:

```typescript
export const foodItems = sqliteTable('food_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  fodmapGroup: text('fodmap_group').notNull(), // 'oligosaccharides' | 'disaccharides' | 'monosaccharides' | 'polyols'
  fodmapType: text('fodmap_type').notNull(), // 'fructans' | 'GOS' | 'lactose' | 'fructose' | 'sorbitol' | 'mannitol'
  servingSize: text('serving_size').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**GroupResult Schema**:

```typescript
export const groupResults = sqliteTable('group_results', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  fodmapGroup: text('fodmap_group').notNull(),
  toleranceLevel: text('tolerance_level').notNull(), // 'high' | 'moderate' | 'low' | 'none'
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**NotificationSchedule Schema**:

```typescript
export const notificationSchedules = sqliteTable('notification_schedules', {
  id: text('id').primaryKey(),
  testStepId: text('test_step_id')
    .notNull()
    .references(() => testSteps.id),
  notificationType: text('notification_type').notNull(), // 'reminder' | 'symptom_check' | 'washout_start' | 'washout_end'
  scheduledTime: integer('scheduled_time', { mode: 'timestamp' }).notNull(),
  sentStatus: integer('sent_status', { mode: 'boolean' }).notNull().default(false),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Relations**:

```typescript
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  protocolRuns: many(protocolRuns),
}));

export const protocolRunsRelations = relations(protocolRuns, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [protocolRuns.userId],
    references: [userProfiles.id],
  }),
  testSteps: many(testSteps),
  washoutPeriods: many(washoutPeriods),
  groupResults: many(groupResults),
}));

export const testStepsRelations = relations(testSteps, ({ one, many }) => ({
  protocolRun: one(protocolRuns, {
    fields: [testSteps.protocolRunId],
    references: [protocolRuns.id],
  }),
  foodItem: one(foodItems, {
    fields: [testSteps.foodItemId],
    references: [foodItems.id],
  }),
  symptomEntries: many(symptomEntries),
  notificationSchedules: many(notificationSchedules),
}));
```

### 2. Database Migrations

**File**: `src/db/migrations/0000_initial.sql`

Drizzle Kit generates SQL migrations from schema definitions. The initial migration creates all tables with proper constraints and indexes.

**Migration Strategy**:

- Migrations are versioned and sequential (0000, 0001, 0002, etc.)
- Each migration is idempotent (can be run multiple times safely)
- Drizzle tracks applied migrations in a metadata table
- Rollback support for development (not production)

**Index Strategy**:

```sql
-- User lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Protocol queries
CREATE INDEX idx_protocol_runs_user_id ON protocol_runs(user_id);
CREATE INDEX idx_protocol_runs_status ON protocol_runs(status);

-- Test step queries
CREATE INDEX idx_test_steps_protocol_run_id ON test_steps(protocol_run_id);
CREATE INDEX idx_test_steps_status ON test_steps(status);

-- Symptom queries
CREATE INDEX idx_symptom_entries_test_step_id ON symptom_entries(test_step_id);
CREATE INDEX idx_symptom_entries_timestamp ON symptom_entries(timestamp);
CREATE INDEX idx_symptom_entries_test_step_timestamp ON symptom_entries(test_step_id, timestamp);

-- Notification queries
CREATE INDEX idx_notification_schedules_scheduled_time ON notification_schedules(scheduled_time);
CREATE INDEX idx_notification_schedules_sent_status ON notification_schedules(sent_status);
```

### 3. Repository Layer

**File Structure**:

```
src/services/repositories/
├── BaseRepository.ts
├── UserProfileRepository.ts
├── ProtocolRunRepository.ts
├── TestStepRepository.ts
├── SymptomEntryRepository.ts
├── WashoutPeriodRepository.ts
├── FoodItemRepository.ts
├── GroupResultRepository.ts
├── NotificationScheduleRepository.ts
└── index.ts
```

**BaseRepository Pattern**:

```typescript
export abstract class BaseRepository<T> {
  constructor(protected db: DrizzleDB) {}

  protected handleError(error: unknown, operation: string): never {
    console.error(`${operation} failed:`, error);
    throw new Error(`Database operation failed: ${operation}`);
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected now(): Date {
    return new Date();
  }
}
```

**UserProfileRepository Interface**:

```typescript
export class UserProfileRepository extends BaseRepository<UserProfile> {
  async create(data: CreateUserProfileInput): Promise<UserProfile>;
  async findById(id: string): Promise<UserProfile | null>;
  async findByEmail(email: string): Promise<UserProfile | null>;
  async update(id: string, data: UpdateUserProfileInput): Promise<UserProfile>;
  async delete(id: string): Promise<void>;
}
```

**ProtocolRunRepository Interface**:

```typescript
export class ProtocolRunRepository extends BaseRepository<ProtocolRun> {
  async create(data: CreateProtocolRunInput): Promise<ProtocolRun>;
  async findById(id: string): Promise<ProtocolRun | null>;
  async findByUserId(userId: string): Promise<ProtocolRun[]>;
  async findActive(userId: string): Promise<ProtocolRun | null>;
  async update(id: string, data: UpdateProtocolRunInput): Promise<ProtocolRun>;
  async delete(id: string): Promise<void>;
}
```

**TestStepRepository Interface**:

```typescript
export class TestStepRepository extends BaseRepository<TestStep> {
  async create(data: CreateTestStepInput): Promise<TestStep>;
  async findById(id: string): Promise<TestStep | null>;
  async findByProtocolRunId(protocolRunId: string): Promise<TestStep[]>;
  async findByStatus(status: TestStepStatus): Promise<TestStep[]>;
  async update(id: string, data: UpdateTestStepInput): Promise<TestStep>;
  async delete(id: string): Promise<void>;
}
```

**SymptomEntryRepository Interface**:

```typescript
export class SymptomEntryRepository extends BaseRepository<SymptomEntry> {
  async create(data: CreateSymptomEntryInput): Promise<SymptomEntry>;
  async findById(id: string): Promise<SymptomEntry | null>;
  async findByTestStepId(testStepId: string): Promise<SymptomEntry[]>;
  async findByDateRange(
    testStepId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SymptomEntry[]>;
  async delete(id: string): Promise<void>;
}
```

**FoodItemRepository Interface**:

```typescript
export class FoodItemRepository extends BaseRepository<FoodItem> {
  async create(data: CreateFoodItemInput): Promise<FoodItem>;
  async findById(id: string): Promise<FoodItem | null>;
  async findByFodmapGroup(group: FodmapGroup): Promise<FoodItem[]>;
  async findAll(): Promise<FoodItem[]>;
  async update(id: string, data: UpdateFoodItemInput): Promise<FoodItem>;
  async delete(id: string): Promise<void>;
}
```

### 4. TanStack Query Configuration

**File**: `src/lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

**Query Key Factory Pattern**:

```typescript
export const queryKeys = {
  userProfiles: {
    all: ['userProfiles'] as const,
    byId: (id: string) => [...queryKeys.userProfiles.all, id] as const,
    byEmail: (email: string) => [...queryKeys.userProfiles.all, 'email', email] as const,
  },
  protocolRuns: {
    all: ['protocolRuns'] as const,
    byId: (id: string) => [...queryKeys.protocolRuns.all, id] as const,
    byUserId: (userId: string) => [...queryKeys.protocolRuns.all, 'user', userId] as const,
    active: (userId: string) => [...queryKeys.protocolRuns.all, 'active', userId] as const,
  },
  testSteps: {
    all: ['testSteps'] as const,
    byId: (id: string) => [...queryKeys.testSteps.all, id] as const,
    byProtocolRunId: (protocolRunId: string) =>
      [...queryKeys.testSteps.all, 'protocolRun', protocolRunId] as const,
    byStatus: (status: string) => [...queryKeys.testSteps.all, 'status', status] as const,
  },
  symptomEntries: {
    all: ['symptomEntries'] as const,
    byId: (id: string) => [...queryKeys.symptomEntries.all, id] as const,
    byTestStepId: (testStepId: string) =>
      [...queryKeys.symptomEntries.all, 'testStep', testStepId] as const,
  },
  foodItems: {
    all: ['foodItems'] as const,
    byId: (id: string) => [...queryKeys.foodItems.all, id] as const,
    byFodmapGroup: (group: string) => [...queryKeys.foodItems.all, 'group', group] as const,
  },
};
```

**Provider Setup**:

```typescript
// App.tsx or index.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Rest of app */}
    </QueryClientProvider>
  );
}
```

### 5. Custom React Hooks

**File Structure**:

```
src/shared/hooks/
├── useUserProfile.ts
├── useProtocolRuns.ts
├── useTestSteps.ts
├── useSymptomEntries.ts
├── useFoodItems.ts
└── index.ts
```

**Query Hook Pattern**:

```typescript
// useProtocolRuns.ts
export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byUserId(userId),
    queryFn: () => protocolRunRepository.findByUserId(userId),
    enabled: !!userId,
  });
}

export function useProtocolRun(id: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byId(id),
    queryFn: () => protocolRunRepository.findById(id),
    enabled: !!id,
  });
}

export function useActiveProtocolRun(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.active(userId),
    queryFn: () => protocolRunRepository.findActive(userId),
    enabled: !!userId,
  });
}
```

**Mutation Hook Pattern**:

```typescript
// useProtocolRuns.ts (continued)
export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProtocolRunInput) => protocolRunRepository.create(data),
    onSuccess: (newProtocolRun) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.byUserId(newProtocolRun.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.active(newProtocolRun.userId),
      });
    },
  });
}

export function useUpdateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProtocolRunInput }) =>
      protocolRunRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.protocolRuns.byId(id) });

      // Snapshot previous value
      const previousProtocolRun = queryClient.getQueryData(queryKeys.protocolRuns.byId(id));

      // Optimistically update
      queryClient.setQueryData(queryKeys.protocolRuns.byId(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousProtocolRun };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProtocolRun) {
        queryClient.setQueryData(queryKeys.protocolRuns.byId(id), context.previousProtocolRun);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.byId(id) });
    },
  });
}

export function useDeleteProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => protocolRunRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.all });
    },
  });
}
```

**Hook Usage in Components**:

```typescript
function ProtocolRunScreen({ userId }: { userId: string }) {
  const { data: protocolRuns, isLoading, error } = useProtocolRuns(userId);
  const createMutation = useCreateProtocolRun();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        userId,
        status: 'planned',
        startDate: new Date(),
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create protocol run:', error);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <View>
      {protocolRuns?.map(run => <ProtocolRunCard key={run.id} run={run} />)}
      <Button onPress={handleCreate} loading={createMutation.isPending}>
        Create New Protocol
      </Button>
    </View>
  );
}
```

### 6. Seed Data and Fixtures

**File**: `src/db/seeds/index.ts`

```typescript
import { db } from '../client';
import { foodItems, userProfiles, protocolRuns, testSteps } from '../schema';

export async function seedDatabase() {
  console.log('Seeding database...');

  // Seed food items
  await seedFoodItems();

  // Seed test users
  await seedUsers();

  // Seed sample protocol run
  await seedProtocolRun();

  console.log('Database seeded successfully');
}

async function seedFoodItems() {
  const items = [
    // Oligosaccharides - Fructans
    {
      id: 'food-1',
      name: 'Wheat bread (1 slice)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'fructans',
      servingSize: '1 slice (35g)',
      description: 'Common wheat bread for fructan testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'food-2',
      name: 'Garlic (1 clove)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'fructans',
      servingSize: '1 clove (3g)',
      description: 'Fresh garlic for fructan testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Oligosaccharides - GOS
    {
      id: 'food-3',
      name: 'Chickpeas (1/4 cup)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'GOS',
      servingSize: '1/4 cup (40g)',
      description: 'Canned chickpeas for GOS testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Disaccharides - Lactose
    {
      id: 'food-4',
      name: 'Milk (1/2 cup)',
      fodmapGroup: 'disaccharides',
      fodmapType: 'lactose',
      servingSize: '1/2 cup (125ml)',
      description: "Cow's milk for lactose testing",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'food-5',
      name: 'Yogurt (1/2 cup)',
      fodmapGroup: 'disaccharides',
      fodmapType: 'lactose',
      servingSize: '1/2 cup (125g)',
      description: 'Plain yogurt for lactose testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Monosaccharides - Fructose
    {
      id: 'food-6',
      name: 'Honey (1 tbsp)',
      fodmapGroup: 'monosaccharides',
      fodmapType: 'fructose',
      servingSize: '1 tablespoon (20g)',
      description: 'Pure honey for fructose testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'food-7',
      name: 'Mango (1/2 cup)',
      fodmapGroup: 'monosaccharides',
      fodmapType: 'fructose',
      servingSize: '1/2 cup (80g)',
      description: 'Fresh mango for fructose testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Polyols - Sorbitol
    {
      id: 'food-8',
      name: 'Avocado (1/4 fruit)',
      fodmapGroup: 'polyols',
      fodmapType: 'sorbitol',
      servingSize: '1/4 avocado (40g)',
      description: 'Fresh avocado for sorbitol testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Polyols - Mannitol
    {
      id: 'food-9',
      name: 'Mushrooms (1/2 cup)',
      fodmapGroup: 'polyols',
      fodmapType: 'mannitol',
      servingSize: '1/2 cup (35g)',
      description: 'Button mushrooms for mannitol testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'food-10',
      name: 'Cauliflower (1/2 cup)',
      fodmapGroup: 'polyols',
      fodmapType: 'mannitol',
      servingSize: '1/2 cup (50g)',
      description: 'Fresh cauliflower for mannitol testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(foodItems).values(items);
  console.log(`Seeded ${items.length} food items`);
}
```

**Fixture Functions** (`src/shared/fixtures/dataFixtures.ts`):

```typescript
export function createMockUserProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: `user-${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    languagePreference: 'pt',
    themePreference: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockProtocolRun(overrides?: Partial<ProtocolRun>): ProtocolRun {
  return {
    id: `protocol-${Date.now()}`,
    userId: 'user-1',
    status: 'planned',
    startDate: new Date(),
    endDate: null,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockTestStep(overrides?: Partial<TestStep>): TestStep {
  return {
    id: `step-${Date.now()}`,
    protocolRunId: 'protocol-1',
    foodItemId: 'food-1',
    sequenceNumber: 1,
    status: 'pending',
    scheduledDate: new Date(),
    completedDate: null,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockSymptomEntry(overrides?: Partial<SymptomEntry>): SymptomEntry {
  return {
    id: `symptom-${Date.now()}`,
    testStepId: 'step-1',
    symptomType: 'bloating',
    severity: 5,
    timestamp: new Date(),
    notes: '',
    createdAt: new Date(),
    ...overrides,
  };
}
```

## Data Models

### TypeScript Types

All types are inferred from Drizzle schemas and exported for use throughout the application:

```typescript
// Inferred from schema
export type UserProfile = typeof userProfiles.$inferSelect;
export type CreateUserProfileInput = typeof userProfiles.$inferInsert;
export type UpdateUserProfileInput = Partial<Omit<CreateUserProfileInput, 'id' | 'createdAt'>>;

export type ProtocolRun = typeof protocolRuns.$inferSelect;
export type CreateProtocolRunInput = typeof protocolRuns.$inferInsert;
export type UpdateProtocolRunInput = Partial<Omit<CreateProtocolRunInput, 'id' | 'createdAt'>>;

export type TestStep = typeof testSteps.$inferSelect;
export type CreateTestStepInput = typeof testSteps.$inferInsert;
export type UpdateTestStepInput = Partial<Omit<CreateTestStepInput, 'id' | 'createdAt'>>;

export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type CreateSymptomEntryInput = typeof symptomEntries.$inferInsert;

export type FoodItem = typeof foodItems.$inferSelect;
export type CreateFoodItemInput = typeof foodItems.$inferInsert;
export type UpdateFoodItemInput = Partial<Omit<CreateFoodItemInput, 'id' | 'createdAt'>>;

// Enums
export type ProtocolRunStatus = 'planned' | 'active' | 'paused' | 'completed';
export type TestStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SymptomType = 'bloating' | 'pain' | 'gas' | 'diarrhea' | 'constipation';
export type FodmapGroup = 'oligosaccharides' | 'disaccharides' | 'monosaccharides' | 'polyols';
export type FodmapType = 'fructans' | 'GOS' | 'lactose' | 'fructose' | 'sorbitol' | 'mannitol';
export type ToleranceLevel = 'high' | 'moderate' | 'low' | 'none';
export type NotificationType = 'reminder' | 'symptom_check' | 'washout_start' | 'washout_end';
```

## Error Handling

### Repository Error Handling

All repository methods implement consistent error handling:

```typescript
class ProtocolRunRepository extends BaseRepository<ProtocolRun> {
  async findById(id: string): Promise<ProtocolRun | null> {
    try {
      const result = await this.db
        .select()
        .from(protocolRuns)
        .where(eq(protocolRuns.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async create(data: CreateProtocolRunInput): Promise<ProtocolRun> {
    try {
      const newProtocolRun = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(protocolRuns).values(newProtocolRun);
      return newProtocolRun as ProtocolRun;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }
}
```

### Query Error Handling

TanStack Query provides built-in error handling with retry logic:

```typescript
function ProtocolRunScreen() {
  const { data, error, isError, refetch } = useProtocolRuns(userId);

  if (isError) {
    return (
      <ErrorView
        message="Failed to load protocol runs"
        error={error}
        onRetry={refetch}
      />
    );
  }

  // ... rest of component
}
```

### Mutation Error Handling

```typescript
function CreateProtocolButton() {
  const createMutation = useCreateProtocolRun();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(data);
      showSuccessToast('Protocol created successfully');
    } catch (error) {
      showErrorToast('Failed to create protocol');
      console.error(error);
    }
  };

  return (
    <Button
      onPress={handleCreate}
      loading={createMutation.isPending}
      disabled={createMutation.isPending}
    >
      Create Protocol
    </Button>
  );
}
```

## Testing Strategy

### 1. Repository Unit Tests

Test all CRUD operations with mocked database:

```typescript
// __tests__/ProtocolRunRepository.test.ts
import { ProtocolRunRepository } from '../ProtocolRunRepository';
import { createMockProtocolRun } from '../../fixtures/dataFixtures';

describe('ProtocolRunRepository', () => {
  let repository: ProtocolRunRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    repository = new ProtocolRunRepository(mockDb);
  });

  describe('create', () => {
    it('should create a new protocol run', async () => {
      const input = {
        userId: 'user-1',
        status: 'planned' as const,
        startDate: new Date(),
        notes: 'Test protocol',
      };

      const result = await repository.create(input);

      expect(result).toMatchObject(input);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return protocol run when found', async () => {
      const mockProtocolRun = createMockProtocolRun();
      mockDb.limit.mockResolvedValue([mockProtocolRun]);

      const result = await repository.findById('protocol-1');

      expect(result).toEqual(mockProtocolRun);
    });

    it('should return null when not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw error when database operation fails', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('protocol-1')).rejects.toThrow();
    });
  });
});
```

### 2. Hook Integration Tests

Test hooks with React Testing Library and mock repositories:

```typescript
// __tests__/useProtocolRuns.test.tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProtocolRuns, useCreateProtocolRun } from '../useProtocolRuns';
import * as repository from '../../services/repositories/ProtocolRunRepository';

jest.mock('../../services/repositories/ProtocolRunRepository');

describe('useProtocolRuns', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch protocol runs for user', async () => {
    const mockProtocolRuns = [
      createMockProtocolRun({ id: 'protocol-1' }),
      createMockProtocolRun({ id: 'protocol-2' }),
    ];

    jest.spyOn(repository, 'findByUserId').mockResolvedValue(mockProtocolRuns);

    const { result } = renderHook(() => useProtocolRuns('user-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProtocolRuns);
  });

  it('should handle errors', async () => {
    jest.spyOn(repository, 'findByUserId').mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useProtocolRuns('user-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateProtocolRun', () => {
  it('should create protocol run and invalidate cache', async () => {
    const mockProtocolRun = createMockProtocolRun();
    jest.spyOn(repository, 'create').mockResolvedValue(mockProtocolRun);

    const { result } = renderHook(() => useCreateProtocolRun(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        status: 'planned',
        startDate: new Date(),
        notes: '',
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockProtocolRun);
  });
});
```

### 3. Coverage Goals

- Repository methods: 80%+ coverage
- Custom hooks: 70%+ coverage
- Error handling paths: 100% coverage
- Critical business logic: 90%+ coverage

## Offline-First Strategy

### Architecture Overview

The offline-first strategy ensures the application works seamlessly without network connectivity:

1. **SQLite as Source of Truth**: All data operations read/write to local SQLite database first
2. **Immediate UI Updates**: Users see changes instantly without waiting for network
3. **Background Sync**: Changes sync to Supabase when connectivity is available
4. **Conflict Resolution**: Last-write-wins strategy with timestamp-based resolution (future)

### Sync Strategy

**When Sync Occurs**:

- App startup (if online)
- App returns to foreground (if online)
- After successful mutations (if online)
- Periodic background sync (every 5 minutes if online)

**Sync Flow**:

```
1. Check network connectivity
2. If offline, queue changes locally
3. If online:
   a. Push local changes to Supabase
   b. Pull remote changes from Supabase
   c. Resolve conflicts (if any)
   d. Update local database
   e. Invalidate affected queries
```

### Conflict Resolution (Future Implementation)

**Conflict Scenarios**:

1. **Same record modified on multiple devices**: Last-write-wins based on `updatedAt` timestamp
2. **Record deleted on one device, modified on another**: Deletion takes precedence
3. **Concurrent creation with same ID**: Use UUID v4 to prevent ID collisions

**Conflict Resolution Strategy**:

```typescript
interface SyncConflict {
  localRecord: any;
  remoteRecord: any;
  conflictType: 'update' | 'delete' | 'create';
}

function resolveConflict(conflict: SyncConflict): any {
  switch (conflict.conflictType) {
    case 'update':
      // Last-write-wins
      return conflict.localRecord.updatedAt > conflict.remoteRecord.updatedAt
        ? conflict.localRecord
        : conflict.remoteRecord;

    case 'delete':
      // Deletion always wins
      return null;

    case 'create':
      // Should not happen with UUID v4
      throw new Error('ID collision detected');
  }
}
```

### Sync Status Tracking

Add sync metadata to track synchronization state:

```typescript
// Future enhancement to schema
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  syncStatus: text('sync_status').notNull(), // 'pending' | 'synced' | 'conflict'
  retryCount: integer('retry_count').default(0),
});
```

## Performance Considerations

### 1. Query Optimization

**Indexed Queries**:

- All foreign key columns have indexes
- Frequently filtered columns (status, timestamp) have indexes
- Composite indexes for common query patterns

**Query Patterns**:

```typescript
// Good: Uses index on protocol_run_id
const testSteps = await db
  .select()
  .from(testSteps)
  .where(eq(testSteps.protocolRunId, protocolRunId));

// Good: Uses composite index on test_step_id + timestamp
const symptoms = await db
  .select()
  .from(symptomEntries)
  .where(
    and(
      eq(symptomEntries.testStepId, testStepId),
      between(symptomEntries.timestamp, startDate, endDate)
    )
  );
```

### 2. Cache Strategy

**TanStack Query Cache Configuration**:

- `staleTime: 5 minutes` - Data considered fresh for 5 minutes
- `gcTime: 10 minutes` - Inactive queries garbage collected after 10 minutes
- `refetchOnWindowFocus: true` - Refetch when app returns to foreground
- `refetchOnReconnect: true` - Refetch when network reconnects

**Cache Invalidation Strategy**:

- Invalidate specific queries after mutations
- Invalidate related queries (e.g., invalidate protocol runs when test step changes)
- Use query key hierarchy for efficient invalidation

### 3. Memory Management

**Pagination for Large Lists**:

```typescript
export function useProtocolRunsPaginated(userId: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: [...queryKeys.protocolRuns.byUserId(userId), page, pageSize],
    queryFn: () => protocolRunRepository.findByUserIdPaginated(userId, page, pageSize),
  });
}
```

**Lazy Loading Relations**:

```typescript
// Don't load all relations by default
const protocolRun = await repository.findById(id);

// Load relations only when needed
const testSteps = await testStepRepository.findByProtocolRunId(id);
```

## Security Considerations

### 1. Data Validation

Use Zod schemas for runtime validation:

```typescript
import { z } from 'zod';

export const createProtocolRunSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['planned', 'active', 'paused', 'completed']),
  startDate: z.date(),
  endDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const createSymptomEntrySchema = z.object({
  testStepId: z.string().uuid(),
  symptomType: z.enum(['bloating', 'pain', 'gas', 'diarrhea', 'constipation']),
  severity: z.number().int().min(1).max(10),
  timestamp: z.date(),
  notes: z.string().max(500).optional(),
});
```

### 2. SQL Injection Prevention

Drizzle ORM uses parameterized queries automatically:

```typescript
// Safe - Drizzle uses parameterized queries
const user = await db.select().from(userProfiles).where(eq(userProfiles.email, userEmail));

// Never do this - raw SQL without parameters
// const user = await db.execute(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### 3. Data Encryption

Sensitive data should be encrypted at rest:

```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive tokens in SecureStore, not SQLite
await SecureStore.setItemAsync('auth_token', token);

// SQLite data is encrypted by device encryption (iOS/Android)
// Additional encryption can be added with SQLCipher if needed
```

## Design Decisions and Rationales

### 1. SQLite over AsyncStorage

**Decision**: Use SQLite with Drizzle ORM instead of AsyncStorage

**Rationale**:

- Better performance for complex queries and large datasets
- Relational data with foreign keys and joins
- ACID transactions for data consistency
- Type-safe queries with Drizzle ORM
- Easier migration to Supabase (both use SQL)

### 2. TanStack Query over Redux

**Decision**: Use TanStack Query for server state management

**Rationale**:

- Built-in caching and refetching logic
- Automatic background updates
- Optimistic updates support
- Less boilerplate than Redux
- Better separation of server state vs UI state
- Excellent TypeScript support

### 3. Repository Pattern

**Decision**: Implement repository pattern for data access

**Rationale**:

- Abstracts database implementation details
- Easier to test with mocked repositories
- Consistent API across all entities
- Easier to swap database implementations
- Encapsulates business logic related to data access

### 4. Offline-First Architecture

**Decision**: SQLite as primary data source with async Supabase sync

**Rationale**:

- Better user experience (no loading spinners)
- Works without network connectivity
- Faster perceived performance
- Reduces server load
- Essential for health tracking app (users need access anytime)

### 5. Timestamp-Based Conflict Resolution

**Decision**: Use last-write-wins with timestamps for conflicts

**Rationale**:

- Simple to implement and understand
- Works well for single-user scenarios
- Acceptable for health tracking data (user controls all devices)
- Can be enhanced with CRDTs if needed in future

### 6. Query Key Factory Pattern

**Decision**: Use factory functions for query keys

**Rationale**:

- Type-safe query keys
- Consistent naming convention
- Easier to invalidate related queries
- Better autocomplete in IDE
- Prevents typos in query keys

## Future Enhancements

### 1. Real-Time Sync with Supabase Realtime

Implement real-time updates using Supabase subscriptions:

```typescript
// Future implementation
export function useRealtimeProtocolRuns(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('protocol_runs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'protocol_runs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate queries on remote changes
          queryClient.invalidateQueries({
            queryKey: queryKeys.protocolRuns.byUserId(userId),
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return useProtocolRuns(userId);
}
```

### 2. Advanced Conflict Resolution

Implement operational transformation or CRDTs for complex conflict scenarios:

```typescript
// Future: CRDT-based conflict resolution
interface CRDTOperation {
  type: 'insert' | 'update' | 'delete';
  timestamp: number;
  userId: string;
  entityId: string;
  changes: Record<string, any>;
}

function mergeCRDTOperations(local: CRDTOperation[], remote: CRDTOperation[]): any {
  // Implement CRDT merge logic
}
```

### 3. Data Export and Backup

Allow users to export their data:

```typescript
export async function exportUserData(userId: string): Promise<Blob> {
  const protocolRuns = await protocolRunRepository.findByUserId(userId);
  const testSteps = await Promise.all(
    protocolRuns.map((run) => testStepRepository.findByProtocolRunId(run.id))
  );
  const symptoms = await Promise.all(
    testSteps.flat().map((step) => symptomEntryRepository.findByTestStepId(step.id))
  );

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    protocolRuns,
    testSteps: testSteps.flat(),
    symptoms: symptoms.flat(),
  };

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
}
```

### 4. Query Performance Monitoring

Add performance monitoring for slow queries:

```typescript
// Future: Query performance tracking
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        const duration = Date.now() - query.state.dataUpdatedAt;
        if (duration > 1000) {
          console.warn(`Slow query detected: ${query.queryKey}`, duration);
          // Send to analytics
        }
      },
    },
  },
});
```

### 5. Incremental Sync

Implement incremental sync to reduce bandwidth:

```typescript
// Future: Only sync changes since last sync
interface SyncState {
  lastSyncTimestamp: Date;
  pendingChanges: Change[];
}

async function incrementalSync(lastSyncTimestamp: Date) {
  // Only fetch records updated after lastSyncTimestamp
  const changes = await supabase
    .from('protocol_runs')
    .select('*')
    .gt('updated_at', lastSyncTimestamp.toISOString());

  // Apply changes to local database
  await applyRemoteChanges(changes.data);
}
```

### 6. Database Compression

Implement database compression for older data:

```typescript
// Future: Archive old protocol runs
async function archiveOldProtocolRuns(olderThan: Date) {
  const oldRuns = await db.select().from(protocolRuns).where(lt(protocolRuns.endDate, olderThan));

  // Compress and move to archive table
  await db.insert(archivedProtocolRuns).values(
    oldRuns.map((run) => ({
      ...run,
      archivedAt: new Date(),
    }))
  );

  // Delete from main table
  await db.delete(protocolRuns).where(lt(protocolRuns.endDate, olderThan));
}
```

## Documentation Requirements

The README.md should include:

1. **Offline-First Architecture Overview**
   - Explanation of SQLite as primary data source
   - Sync strategy with Supabase
   - Benefits of offline-first approach

2. **Data Layer Usage Guide**
   - How to use repositories
   - How to use custom hooks
   - Query key conventions
   - Mutation patterns with optimistic updates

3. **Sync Conflict Scenarios**
   - Common conflict scenarios
   - Current resolution strategy (last-write-wins)
   - Future enhancements (CRDTs, operational transformation)

4. **Code Examples**
   - Creating entities
   - Querying data
   - Updating with optimistic updates
   - Handling errors

5. **Testing Guide**
   - How to write repository tests
   - How to test hooks
   - Mocking strategies

6. **Performance Best Practices**
   - Query optimization tips
   - Cache configuration
   - When to use pagination
   - Memory management

7. **Migration Guide**
   - How to create new migrations
   - How to apply migrations
   - Rollback strategies (development only)

## Conclusion

This data layer design provides a robust, type-safe, and performant foundation for the FODMAP reintroduction protocol application. The offline-first architecture ensures excellent user experience regardless of network connectivity, while TanStack Query provides efficient caching and synchronization. The repository pattern abstracts data access complexity, making the codebase maintainable and testable.

The design is extensible and allows for future enhancements such as real-time sync, advanced conflict resolution, and data export capabilities without requiring major architectural changes.
