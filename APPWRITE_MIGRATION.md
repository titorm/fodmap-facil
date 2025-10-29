# Migração Supabase → Appwrite (TablesDB)

## ✅ Concluído

### Dependências

- ✅ Removido `@supabase/supabase-js`
- ✅ Removido `drizzle-orm` e `drizzle-kit`
- ✅ Removido `expo-sqlite` (não mais necessário)
- ✅ Removido `better-sqlite3` (apenas para dev)
- ✅ Adicionado `react-native-appwrite`

### Configuração

- ✅ Atualizado `.env.example` com variáveis do Appwrite
- ✅ Criado cliente Appwrite em `src/infrastructure/api/appwrite.ts` usando **TablesDB**
- ✅ Removido sistema de migrations local (Drizzle)
- ✅ Migrado para sistema de migrations nativo do Appwrite

### Arquivos Migrados

- ✅ `useAuth.ts` - Migrado para Appwrite Account API
- ✅ `useReintroductionTests.ts` - Migrado para Appwrite TablesDB API
- ✅ `SyncQueue.ts` - Implementado sync com Appwrite TablesDB
- ✅ `handlers.ts` - Mocks atualizados para Appwrite API
- ✅ `OFFLINE_SUPPORT.md` - Documentação atualizada
- ✅ `src/shared/types/entities.ts` - Tipos de domínio independentes do banco

## 📋 Próximos Passos

### 1. Configurar Projeto no Appwrite

1. Acesse [Appwrite Cloud](https://cloud.appwrite.io) ou sua instância self-hosted
2. Crie um novo projeto
3. Anote o **Project ID**
4. Crie uma **API Key** com permissões de admin:
   - Vá em Settings → API Keys
   - Crie uma nova key com todas as permissões de databases, collections, attributes, indexes e documents

### 2. Criar Database e Tables (TablesDB)

**RECOMENDADO:** Use o script automatizado `pnpm appwrite:setup` que cria toda a estrutura automaticamente.

Ou, se preferir criar manualmente no console do Appwrite:

#### Database

1. Vá em **Databases** → **Create Database**
2. Anote o **Database ID**

#### Tables Necessárias

O script `setup-appwrite.ts` cria automaticamente as seguintes tables com suas colunas, índices e permissões:

1. **user_profiles** - Perfis de usuário
2. **protocol_runs** - Execuções de protocolo
3. **test_steps** - Passos de teste
4. **symptom_entries** - Entradas de sintomas
5. **washout_periods** - Períodos de washout
6. **food_items** - Itens alimentares FODMAP
7. **group_results** - Resultados por grupo FODMAP
8. **notification_schedules** - Agendamento de notificações

Consulte `scripts/setup-appwrite.ts` para ver a estrutura completa de cada table.

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Configuração básica
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id
APPWRITE_API_KEY=sua_api_key_com_permissoes_admin

# IDs serão gerados automaticamente pelo script de setup
EXPO_PUBLIC_APPWRITE_DATABASE_ID=
EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID=
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID=
EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID=
EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID=
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID=
```

### 4. Executar Scripts de Setup

#### 4.1. Testar Conexão

```bash
pnpm appwrite:test
```

Este comando verifica se sua configuração está correta.

#### 4.2. Criar Estrutura do Database

```bash
pnpm appwrite:setup
```

Este comando cria automaticamente:

- Database
- Todas as tables (8 tables)
- Colunas com tipos corretos
- Índices para performance
- Permissões de segurança

Após executar, copie os IDs gerados e adicione ao seu `.env`.

### 5. Verificar Instalação

Execute novamente o teste:

```bash
pnpm appwrite:test
```

Se tudo estiver correto, você verá:

```
✅ Teste concluído com sucesso!
📝 Próximos passos:
   1. Sua configuração está pronta!
   2. Execute: pnpm start
```

### 4. Verificações Finais

Todos os arquivos principais foram migrados! Verifique:

#### Opcional

- `src/shared/hooks/useSymptomLogger.ts` - Verificar se comentários sobre sync estão corretos
- Specs e documentação em `.kiro/specs/` - Atualizar referências ao Supabase se necessário

## 🛠️ Scripts Disponíveis

### `pnpm appwrite:test`

Testa a conexão com o Appwrite e verifica a configuração.

### `pnpm appwrite:setup`

Cria automaticamente toda a estrutura do database (recomendado).

Consulte `scripts/README.md` para documentação detalhada dos scripts.

## 🗄️ Sistema de Migrations

Este projeto usa o **sistema de migrations nativo do Appwrite** ao invés de ferramentas externas como Drizzle.

### Vantagens

- ✅ Sem dependências extras (drizzle-orm, drizzle-kit, expo-sqlite)
- ✅ Migrations gerenciadas diretamente no Appwrite Cloud
- ✅ Versionamento automático de schema
- ✅ Rollback nativo
- ✅ Sincronização automática entre ambientes

### Como Funciona

1. **Desenvolvimento**: Use o script `setup-appwrite.ts` para criar/atualizar schema
2. **Produção**: Appwrite gerencia automaticamente as migrations
3. **Versionamento**: Cada mudança no schema é versionada pelo Appwrite
4. **Rollback**: Use o console do Appwrite para reverter mudanças se necessário

### Fazendo Mudanças no Schema

Para adicionar/modificar tables ou colunas:

1. Edite o arquivo `scripts/setup-appwrite.ts`
2. Execute `pnpm appwrite:setup`
3. O script detecta mudanças e aplica apenas o necessário
4. Commit as mudanças no script para versionamento no Git

## 📚 Diferenças Principais

#### Autenticação

**Supabase:**

```typescript
await supabase.auth.signInWithPassword({ email, password });
```

**Appwrite:**

```typescript
await account.createEmailPasswordSession(email, password);
```

#### Queries (TablesDB)

**Supabase:**

```typescript
await supabase.from('table').select('*').eq('field', value);
```

**Appwrite TablesDB:**

```typescript
const { rows } = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: TABLE_ID,
  queries: [Query.equal('field', [value])],
});
```

#### CRUD Operations

**Create:**

```typescript
await tablesDB.createRow({
  databaseId: DATABASE_ID,
  tableId: TABLE_ID,
  rowId: ID.unique(),
  data: { field: 'value' },
});
```

**Update:**

```typescript
await tablesDB.updateRow({
  databaseId: DATABASE_ID,
  tableId: TABLE_ID,
  rowId: 'row-id',
  data: { field: 'new-value' },
});
```

**Delete:**

```typescript
await tablesDB.deleteRow({
  databaseId: DATABASE_ID,
  tableId: TABLE_ID,
  rowId: 'row-id',
});
```

#### Realtime (se necessário no futuro)

**Supabase:**

```typescript
supabase.channel('table').on('postgres_changes', ...)
```

**Appwrite TablesDB:**

```typescript
client.subscribe('databases.[DATABASE_ID].tables.[TABLE_ID].rows', (response) => {
  console.log('Row changed:', response);
});
```

## 🔧 Comandos Úteis

```bash
# Instalar dependências
pnpm install

# Verificar tipos
pnpm type-check

# Rodar testes
pnpm test

# Iniciar app
pnpm start
```

## 📚 Recursos

- [Appwrite Docs](https://appwrite.io/docs)
- [React Native Appwrite SDK](https://appwrite.io/docs/sdks#client)
- [Appwrite TablesDB](https://appwrite.io/docs/products/databases/tables)
- [Appwrite Auth](https://appwrite.io/docs/products/auth)

## 💡 Notas Importantes

### TablesDB vs Databases

Este projeto usa **TablesDB** ao invés de Databases porque:

- TablesDB usa assinaturas com `{}` (ex: `createRow({ databaseId, tableId, rowId, data })`)
- Databases usa parâmetros posicionais (ex: `createDocument(databaseId, collectionId, documentId, data)`)
- TablesDB é mais explícito e menos propenso a erros

### Query Syntax

Queries no Appwrite usam arrays:

```typescript
Query.equal('field', [value]); // Note o array!
Query.orderDesc('createdAt');
```

### ID Generation

Use `ID.unique()` para gerar IDs únicos automaticamente.
