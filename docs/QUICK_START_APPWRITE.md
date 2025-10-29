# 🚀 Guia Rápido - Appwrite

Siga estes passos para configurar o Appwrite em 5 minutos.

## 1️⃣ Criar Conta e Projeto

1. Acesse [Appwrite Cloud](https://cloud.appwrite.io)
2. Crie uma conta (ou faça login)
3. Clique em **Create Project**
4. Dê um nome ao projeto (ex: "FODMAP Facil")
5. Copie o **Project ID**

## 2️⃣ Criar API Key

1. No seu projeto, vá em **Settings** → **API Keys**
2. Clique em **Create API Key**
3. Nome: "Migration Script"
4. Expiration: Never (ou escolha uma data)
5. Selecione **todas** as permissões de:
   - Databases
   - Collections
   - Attributes
   - Indexes
   - Documents
6. Clique em **Create**
7. Copie a API Key (você não poderá vê-la novamente!)

## 3️⃣ Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Edite o `.env` e adicione:
   ```bash
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=seu_project_id_aqui
   APPWRITE_API_KEY=sua_api_key_aqui
   ```

## 4️⃣ Testar Conexão

```bash
pnpm appwrite:test
```

Você deve ver:

```
✅ Conexão estabelecida!
```

## 5️⃣ Criar Database e Tables

```bash
pnpm appwrite:setup
```

Este comando cria automaticamente:

- ✅ Database
- ✅ 5 Tables (Tests, Symptoms, Protocol Runs, Test Steps, Symptom Entries)
- ✅ Todas as colunas
- ✅ Índices
- ✅ Permissões

Ao final, você verá algo como:

```
✅ Configuração concluída!

📝 Adicione estas variáveis ao seu arquivo .env:

EXPO_PUBLIC_APPWRITE_DATABASE_ID=6789abc...
EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID=tests
...
```

## 6️⃣ Atualizar .env

Copie os IDs gerados e adicione ao seu `.env`:

```bash
EXPO_PUBLIC_APPWRITE_DATABASE_ID=6789abc...
EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID=tests
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID=symptoms
EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID=protocol_runs
EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID=test_steps
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID=symptom_entries
```

## 7️⃣ Iniciar o App

```bash
pnpm start
```

## ✅ Pronto!

Seu app agora está conectado ao Appwrite!

---

## 🔄 Migrar Dados Existentes (Opcional)

Se você tem dados no SQLite local:

```bash
pnpm appwrite:migrate
```

---

## 🆘 Problemas?

### Erro: "Configure as variáveis de ambiente"

- Verifique se o `.env` existe e está preenchido corretamente

### Erro: "Permission denied"

- Verifique se a API Key tem todas as permissões necessárias

### Erro: "Database já existe"

- Normal! O script detecta e reutiliza databases existentes

### Outros problemas

- Consulte `APPWRITE_MIGRATION.md` para documentação completa
- Consulte `scripts/README.md` para detalhes dos scripts

---

## 📚 Próximos Passos

- [Documentação Completa de Migração](./APPWRITE_MIGRATION.md)
- [Documentação dos Scripts](./scripts/README.md)
- [Documentação Appwrite](https://appwrite.io/docs)
