# Scripts de Migração Appwrite

Este diretório contém scripts para facilitar a configuração e migração para o Appwrite.

## 📋 Pré-requisitos

1. **Conta no Appwrite**
   - Crie uma conta em [Appwrite Cloud](https://cloud.appwrite.io) ou configure uma instância self-hosted
   - Crie um novo projeto

2. **API Key**
   - No console do Appwrite, vá em **Settings** → **API Keys**
   - Crie uma nova API Key com as seguintes permissões:
     - `databases.read`
     - `databases.write`
     - `collections.read`
     - `collections.write`
     - `attributes.read`
     - `attributes.write`
     - `indexes.read`
     - `indexes.write`
     - `documents.read`
     - `documents.write`

3. **Variáveis de Ambiente**
   - Copie `.env.example` para `.env`
   - Configure as seguintes variáveis:
     ```bash
     EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
     EXPO_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id
     APPWRITE_API_KEY=sua_api_key_com_permissoes_admin
     ```

## 🚀 Scripts Disponíveis

### 1. Setup Appwrite (`appwrite:setup`)

Cria automaticamente a estrutura do banco de dados no Appwrite.

**O que faz:**

- Cria o database
- Cria todas as tables necessárias
- Adiciona colunas com tipos corretos
- Cria índices para otimização
- Configura permissões

**Como usar:**

```bash
pnpm appwrite:setup
```

**Saída esperada:**

```
🚀 Iniciando configuração do Appwrite...

📦 Criando database...
✅ Database criado: 6789abc...

📋 Criando table: Tests...
✅ Table criada: tests
   ✓ Coluna criada: userId (string)
   ✓ Coluna criada: fodmapGroup (string)
   ...
   ✓ Índice criado: idx_userId

✅ Configuração concluída!

📝 Adicione estas variáveis ao seu arquivo .env:

EXPO_PUBLIC_APPWRITE_DATABASE_ID=6789abc...
EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID=tests
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID=symptoms
...
```

**Após executar:**

1. Copie os IDs gerados
2. Adicione-os ao seu arquivo `.env`
3. Reinicie o app

### 2. Migrar Dados (`appwrite:migrate`)

Migra dados existentes do SQLite local para o Appwrite.

**O que faz:**

- Lê dados do banco SQLite local
- Converte formatos de data
- Envia para o Appwrite mantendo IDs originais
- Exibe progresso e estatísticas

**Como usar:**

```bash
pnpm appwrite:migrate
```

**Pré-requisitos:**

- Ter executado `appwrite:setup` primeiro
- Ter configurado todos os IDs no `.env`
- Ter um banco SQLite com dados (`fodmap.db`)

**Saída esperada:**

```
🚀 Iniciando migração de dados...

📂 Abrindo banco SQLite: ./fodmap.db

📦 Migrando protocol_runs...
   Encontrados 15 registros
   Progresso: 15/15
   ✅ Concluído: 15 sucesso, 0 já existentes, 0 falhas

📦 Migrando test_steps...
   Encontrados 45 registros
   Progresso: 45/45
   ✅ Concluído: 45 sucesso, 0 já existentes, 0 falhas

✅ Migração concluída!

📊 Estatísticas:
   Total de registros: 60
   ✅ Migrados com sucesso: 60
   ⚠️  Já existentes: 0
   ❌ Falhas: 0
```

## 📁 Estrutura das Tables

### Tests

- `userId` - ID do usuário
- `fodmapGroup` - Grupo FODMAP sendo testado
- `status` - Status do teste
- `startDate` - Data de início
- `endDate` - Data de término (opcional)
- `notes` - Notas (opcional)
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### Symptoms

- `testId` - ID do teste relacionado
- `type` - Tipo de sintoma
- `severity` - Severidade (0-10)
- `notes` - Notas (opcional)
- `timestamp` - Momento do sintoma
- `createdAt` - Data de criação

### Protocol Runs

- `userId` - ID do usuário
- `status` - Status da execução
- `startDate` - Data de início
- `endDate` - Data de término (opcional)
- `notes` - Notas (opcional)
- `syncStatus` - Status de sincronização
- `lastSyncAttempt` - Última tentativa de sync
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### Test Steps

- `protocolRunId` - ID da execução do protocolo
- `foodItemId` - ID do alimento
- `sequenceNumber` - Número da sequência
- `status` - Status do passo
- `scheduledDate` - Data agendada
- `completedDate` - Data de conclusão (opcional)
- `notes` - Notas (opcional)
- `syncStatus` - Status de sincronização
- `lastSyncAttempt` - Última tentativa de sync
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### Symptom Entries

- `testStepId` - ID do passo de teste
- `symptomType` - Tipo de sintoma
- `severity` - Severidade (0-10)
- `timestamp` - Momento do sintoma
- `notes` - Notas (opcional)
- `syncStatus` - Status de sincronização
- `lastSyncAttempt` - Última tentativa de sync
- `createdAt` - Data de criação

## 🔧 Troubleshooting

### Erro: "Configure as variáveis de ambiente necessárias"

**Solução:** Verifique se todas as variáveis estão configuradas no `.env`:

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`

### Erro: "Database já existe"

**Solução:** O script detecta databases existentes e os reutiliza. Isso é normal.

### Erro: "Coluna já existe"

**Solução:** O script pula colunas que já existem. Isso é normal se você executar o script múltiplas vezes.

### Erro: "Permission denied"

**Solução:** Verifique se sua API Key tem todas as permissões necessárias listadas nos pré-requisitos.

### Erro ao migrar dados: "Collection ID não configurado"

**Solução:** Execute `appwrite:setup` primeiro e adicione todos os IDs gerados ao `.env`.

## 📚 Recursos

- [Documentação Appwrite](https://appwrite.io/docs)
- [Node Appwrite SDK](https://appwrite.io/docs/sdks#server)
- [Guia de Migração](../APPWRITE_MIGRATION.md)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de erro detalhados
2. Confirme que todas as variáveis de ambiente estão corretas
3. Verifique as permissões da API Key no console do Appwrite
4. Consulte a documentação do Appwrite
