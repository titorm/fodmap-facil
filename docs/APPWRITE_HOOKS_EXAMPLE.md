# Exemplo: Refatorando Hooks para Appwrite

## Antes (com Drizzle + SQLite)

```typescript
// src/shared/hooks/useProtocolRuns.ts (ANTIGO)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtocolRunRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type { ProtocolRun, CreateProtocolRunInput, UpdateProtocolRunInput } from '../../db/schema';

const repository = new ProtocolRunRepository(db);

export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: ['protocolRuns', userId],
    queryFn: () => repository.findByUserId(userId),
  });
}

export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProtocolRunInput) => repository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolRuns'] });
    },
  });
}
```

## Depois (com Appwrite)

```typescript
// src/shared/hooks/useProtocolRuns.ts (NOVO)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesDB, DATABASE_ID, TABLES } from '../../infrastructure/api/appwrite';
import { Query, ID } from 'react-native-appwrite';
import type {
  ProtocolRun,
  CreateProtocolRunInput,
  UpdateProtocolRunInput,
} from '../types/entities';

export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: ['protocolRuns', userId],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [Query.equal('userId', [userId]), Query.orderDesc('createdAt')],
      });

      // Converter timestamps para Date objects
      return rows.map((row) => ({
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as ProtocolRun[];
    },
  });
}

export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProtocolRunInput) => {
      const { id, ...rest } = data;

      // Converter Date objects para ISO strings
      const rowData = {
        ...rest,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
        lastSyncAttempt: data.lastSyncAttempt?.toISOString(),
      };

      return await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id || ID.unique(),
        data: rowData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolRuns'] });
    },
  });
}

export function useUpdateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProtocolRunInput }) => {
      // Converter Date objects para ISO strings
      const rowData: any = { ...data };
      if (data.endDate) rowData.endDate = data.endDate.toISOString();
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();
      if (data.lastSyncAttempt) rowData.lastSyncAttempt = data.lastSyncAttempt.toISOString();

      return await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id,
        data: rowData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolRuns'] });
    },
  });
}

export function useDeleteProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolRuns'] });
    },
  });
}
```

## Diferenças Principais

### 1. Imports

**Antes:**

```typescript
import { ProtocolRunRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type { ProtocolRun } from '../../db/schema';
```

**Depois:**

```typescript
import { tablesDB, DATABASE_ID, TABLES } from '../../infrastructure/api/appwrite';
import { Query, ID } from 'react-native-appwrite';
import type { ProtocolRun } from '../types/entities';
```

### 2. Queries

**Antes (Drizzle):**

```typescript
repository.findByUserId(userId);
```

**Depois (Appwrite):**

```typescript
const { rows } = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: TABLES.PROTOCOL_RUNS,
  queries: [Query.equal('userId', [userId]), Query.orderDesc('createdAt')],
});
```

### 3. Conversão de Datas

Appwrite armazena datas como ISO strings, então você precisa converter:

**Ao buscar:**

```typescript
return rows.map((row) => ({
  ...row,
  startDate: new Date(row.startDate),
  createdAt: new Date(row.createdAt),
}));
```

**Ao criar/atualizar:**

```typescript
const rowData = {
  ...data,
  startDate: data.startDate.toISOString(),
  createdAt: data.createdAt.toISOString(),
};
```

### 4. IDs

**Antes (Drizzle):**

```typescript
// ID gerado automaticamente ou passado
repository.create(data);
```

**Depois (Appwrite):**

```typescript
// ID deve ser explicitamente fornecido
tablesDB.createRow({
  rowId: id || ID.unique(),
  data: rowData,
});
```

## Queries Comuns do Appwrite

```typescript
// Igual
Query.equal('field', [value]);

// Diferente
Query.notEqual('field', [value]);

// Maior que
Query.greaterThan('field', value);

// Menor que
Query.lessThan('field', value);

// Entre
Query.between('field', min, max);

// Contém (para arrays)
Query.contains('field', [value]);

// Busca de texto
Query.search('field', 'search term');

// Ordenação
Query.orderAsc('field');
Query.orderDesc('field');

// Limite e offset
Query.limit(10);
Query.offset(20);

// Selecionar campos específicos
Query.select(['field1', 'field2']);
```

## Exemplo Completo: useSymptomEntries

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesDB, DATABASE_ID, TABLES } from '../../infrastructure/api/appwrite';
import { Query, ID } from 'react-native-appwrite';
import type { SymptomEntry, CreateSymptomEntryInput } from '../types/entities';

export function useSymptomEntries(testStepId: string) {
  return useQuery({
    queryKey: ['symptomEntries', testStepId],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [Query.equal('testStepId', [testStepId]), Query.orderDesc('timestamp')],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
      })) as SymptomEntry[];
    },
  });
}

export function useCreateSymptomEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSymptomEntryInput) => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        timestamp: data.timestamp.toISOString(),
        createdAt: data.createdAt.toISOString(),
      };

      return await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        rowId: id || ID.unique(),
        data: rowData,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['symptomEntries', variables.testStepId],
      });
    },
  });
}

export function useSymptomEntriesByDateRange(testStepId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['symptomEntries', testStepId, startDate, endDate],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [
          Query.equal('testStepId', [testStepId]),
          Query.greaterThanEqual('timestamp', startDate.toISOString()),
          Query.lessThanEqual('timestamp', endDate.toISOString()),
          Query.orderDesc('timestamp'),
        ],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
      })) as SymptomEntry[];
    },
  });
}
```

## Constantes Recomendadas

Adicione ao arquivo `src/infrastructure/api/appwrite.ts`:

```typescript
export const TABLES = {
  USER_PROFILES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_USER_PROFILES_ID || '',
  PROTOCOL_RUNS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID || '',
  TEST_STEPS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID || '',
  SYMPTOM_ENTRIES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID || '',
  WASHOUT_PERIODS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_WASHOUT_PERIODS_ID || '',
  FOOD_ITEMS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_FOOD_ITEMS_ID || '',
  GROUP_RESULTS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_GROUP_RESULTS_ID || '',
  NOTIFICATION_SCHEDULES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_NOTIFICATION_SCHEDULES_ID || '',
} as const;
```

## Benefícios da Migração

1. ✅ **Menos código**: Sem camada de repositório
2. ✅ **Mais simples**: Queries diretas no Appwrite
3. ✅ **Sync automático**: Appwrite gerencia sincronização
4. ✅ **Realtime**: Fácil adicionar subscriptions
5. ✅ **Menos dependências**: Sem Drizzle, sem SQLite
6. ✅ **Cloud-first**: Dados sempre disponíveis
