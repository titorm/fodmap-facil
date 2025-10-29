# ✅ Checklist de Migração Appwrite

Use este checklist para garantir que a migração foi concluída com sucesso.

## 📋 Pré-Migração

- [ ] Backup do código atual
- [ ] Backup do banco de dados SQLite (se houver dados)
- [ ] Git commit de todas as alterações pendentes
- [ ] Leitura do `QUICK_START_APPWRITE.md`

## 🔧 Configuração Inicial

- [ ] Conta criada no Appwrite Cloud
- [ ] Projeto criado no Appwrite
- [ ] API Key criada com permissões de admin
- [ ] `.env` criado a partir do `.env.example`
- [ ] Variáveis básicas configuradas:
  - [ ] `EXPO_PUBLIC_APPWRITE_ENDPOINT`
  - [ ] `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
  - [ ] `APPWRITE_API_KEY`

## 🧪 Teste de Conexão

- [ ] Executado `pnpm appwrite:test`
- [ ] Conexão estabelecida com sucesso
- [ ] Permissões verificadas

## 🏗️ Criação da Estrutura

- [ ] Executado `pnpm appwrite:setup`
- [ ] Database criado
- [ ] Tables criadas:
  - [ ] Tests
  - [ ] Symptoms
  - [ ] Protocol Runs
  - [ ] Test Steps
  - [ ] Symptom Entries
- [ ] IDs copiados para o `.env`:
  - [ ] `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
  - [ ] `EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID`
  - [ ] `EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID`
  - [ ] `EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID`
  - [ ] `EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID`
  - [ ] `EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID`

## 📦 Migração de Dados (Opcional)

- [ ] Executado `pnpm appwrite:migrate` (se houver dados)
- [ ] Dados migrados com sucesso
- [ ] Verificado no console do Appwrite

## 🧹 Limpeza

- [ ] Arquivo `src/infrastructure/api/supabase.ts` removido
- [ ] Dependência `@supabase/supabase-js` removida
- [ ] Referências ao Supabase atualizadas nos comentários

## ✅ Verificação Final

- [ ] Executado `pnpm type-check` sem erros
- [ ] Executado `pnpm test` (testes passando)
- [ ] Executado `pnpm appwrite:test` novamente
- [ ] App iniciado com `pnpm start`
- [ ] Testado login/cadastro
- [ ] Testado criação de dados
- [ ] Testado leitura de dados
- [ ] Testado atualização de dados
- [ ] Testado exclusão de dados
- [ ] Testado sync offline (se aplicável)

## 📱 Testes no Dispositivo

- [ ] Testado no iOS (se aplicável)
- [ ] Testado no Android (se aplicável)
- [ ] Testado no Web (se aplicável)
- [ ] Testado modo offline
- [ ] Testado sincronização ao voltar online

## 📚 Documentação

- [ ] README atualizado (se necessário)
- [ ] Documentação de API atualizada (se necessário)
- [ ] Comentários de código revisados
- [ ] Guias de desenvolvimento atualizados

## 🚀 Deploy

- [ ] Variáveis de ambiente configuradas no ambiente de produção
- [ ] Build de produção testado
- [ ] Deploy realizado
- [ ] Testes de fumaça em produção

## 🎉 Conclusão

- [ ] Equipe notificada sobre a migração
- [ ] Documentação compartilhada
- [ ] Monitoramento configurado
- [ ] Backup do Supabase mantido (por segurança)

---

## 📝 Notas

Use este espaço para anotar observações durante a migração:

```
Data: ___/___/______
Responsável: _________________

Observações:
-
-
-

Problemas encontrados:
-
-
-

Soluções aplicadas:
-
-
-
```

---

## 🆘 Em Caso de Problemas

1. Consulte `QUICK_START_APPWRITE.md`
2. Consulte `APPWRITE_MIGRATION.md`
3. Consulte `scripts/README.md`
4. Verifique os logs de erro
5. Verifique o console do Appwrite
6. Consulte a documentação oficial do Appwrite

## 🔄 Rollback (Se Necessário)

Se precisar reverter a migração:

1. Restaure o código do commit anterior
2. Restaure o banco SQLite do backup
3. Execute `pnpm install` para restaurar dependências
4. Reinicie o app

**Importante:** Mantenha o projeto Appwrite por alguns dias antes de deletá-lo, caso precise consultar dados.
