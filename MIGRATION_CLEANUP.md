# Limpeza da Migração Drizzle → Appwrite

## ✅ Concluído

- ✅ Removido `drizzle-orm` e `drizzle-kit` do package.json
- ✅ Removido `expo-sqlite` do package.json
- ✅ Removido `better-sqlite3` do package.json (dev)
- ✅ Removido pasta `src/db/` com schema do Drizzle
- ✅ Removido pasta `drizzle/` com migrations
- ✅ Removido `drizzle.config.ts`
- ✅ Removido script `migrate-data.ts`
- ✅ Criado `src/shared/types/entities.ts` com tipos de domínio
- ✅ Atualizado documentação em `APPWRITE_MIGRATION.md`

## 🔄 Próximos Passos

### 1. Remover Repositórios Locais (SQLite)

Os seguintes arquivos usam Drizzle e SQLite local e devem ser removidos ou refatorados:

#### Repositórios a Remover

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
└── __tests__/
    ├── UserProfileRepository.test.ts
    ├── ProtocolRunRepository.test.ts
    ├── TestStepRepository.test.ts
    ├── SymptomEntryRepository.test.ts
    ├── FoodItemRepository.test.ts
    └── WashoutPeriodRepository.test.ts
```

#### Cliente de Database Local

```
src/infrastructure/database/
├── client.ts (usa drizzle + expo-sqlite)
└── schema.ts (schema duplicado)
```

### 2. Atualizar SyncQueue

O arquivo `src/services/SyncQueue.ts` precisa ser refatorado:

- Remove imports do Drizzle
- Remove referências ao banco SQLite local
- Mantém apenas a lógica de sincronização com Appwrite

### 3. Atualizar Hooks

Os seguintes hooks precisam ser atualizados para usar Appwrite diretamente:

```
src/shared/hooks/
├── useUserProfile.ts
├── useProtocolRuns.ts
├── useTestSteps.ts
├── useSymptomEntries.ts
├── useSymptomLogger.ts
├── useFoodItems.ts
└── useWashoutPeriods.ts
```

**Mudança:** Ao invés de usar repositórios locais, devem usar o cliente Appwrite diretamente.

### 4. Atualizar Features

Arquivos que importam tipos do schema antigo:

```
src/features/
├── washout/
│   ├── services/NotificationService.ts
│   ├── hooks/useWashout.ts
│   └── components/WashoutCountdown.tsx
├── test-wizard/
│   └── hooks/useTestWizard.ts
├── diary/
│   ├── screens/DiaryScreen.tsx
│   └── components/
│       ├── SymptomTypeSelector.tsx
│       └── SymptomEntryCard.tsx
```

**Mudança:** Atualizar imports de `../../db/schema` para `../../shared/types/entities`

## 🎯 Estratégia Recomendada

### Opção 1: Remoção Completa (Recomendado)

Se você já está usando Appwrite para tudo:

1. Remover toda a pasta `src/services/repositories/`
2. Remover `src/infrastructure/database/`
3. Atualizar hooks para usar Appwrite diretamente
4. Atualizar imports de tipos

### Opção 2: Manter Temporariamente

Se ainda precisa de suporte offline com SQLite:

1. Manter repositórios mas remover dependência do Drizzle
2. Usar SQLite nativo do React Native
3. Implementar queries SQL manualmente

## 📝 Comandos para Limpeza

```bash
# Remover repositórios locais
rm -rf src/services/repositories

# Remover cliente de database local
rm -rf src/infrastructure/database

# Reinstalar dependências sem Drizzle
pnpm install
```

## 🔍 Buscar e Substituir

Para atualizar imports de tipos em todos os arquivos:

```bash
# Buscar arquivos que importam do schema antigo
grep -r "from.*db/schema" src/

# Substituir imports (fazer manualmente ou com script)
# De: from '../../db/schema'
# Para: from '../../shared/types/entities'
```

## ⚠️ Atenção

Antes de remover os repositórios, certifique-se de que:

1. ✅ Todos os dados importantes foram migrados para Appwrite
2. ✅ Os hooks estão funcionando com Appwrite
3. ✅ Não há dependências críticas no código de produção
4. ✅ Testes foram atualizados ou removidos

## 🚀 Após a Limpeza

Execute para verificar se tudo está funcionando:

```bash
# Verificar tipos
pnpm type-check

# Rodar testes
pnpm test

# Testar conexão Appwrite
pnpm appwrite:test
```
