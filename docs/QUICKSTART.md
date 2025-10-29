# Quick Start Guide

Guia rápido para começar a desenvolver no FODMAP Reintroduction App.

## ⚡ Setup em 5 Minutos

### 1. Pré-requisitos

```bash
# Verifique versões
node --version  # v18+
npm --version   # v9+
```

### 2. Clone e Instale

```bash
# Clone
git clone <repo-url>
cd fodmap-reintro-app

# Instale
npm install
```

### 3. Configure Supabase

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie URL e Anon Key
4. Configure ambiente:

```bash
cp .env.example .env
```

Edite `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Configure Database

No Supabase SQL Editor, execute:

```sql
-- Tabela de testes
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

-- Tabela de sintomas
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES reintroduction_tests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity INTEGER NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE reintroduction_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tests"
  ON reintroduction_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
  ON reintroduction_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
```

### 5. Rode o App

```bash
npm start
```

Escolha plataforma:

- `i` - iOS Simulator
- `a` - Android Emulator
- `w` - Web Browser

## 🎯 Comandos Essenciais

```bash
# Desenvolvimento
npm start              # Inicia dev server
npm run android        # Roda no Android
npm run ios            # Roda no iOS
npm run web            # Roda na web

# Testes
npm test               # Roda testes
npm run test:watch     # Modo watch
npm run test:coverage  # Com coverage

# Qualidade
npm run lint           # Lint
npm run format         # Format
npm run type-check     # Type check
```

## 📱 Testando no Dispositivo

### iOS (Mac apenas)

1. Instale Xcode
2. Abra iOS Simulator
3. `npm run ios`

### Android

1. Instale Android Studio
2. Configure AVD (Android Virtual Device)
3. Inicie emulador
4. `npm run android`

### Dispositivo Físico

1. Instale Expo Go:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Escaneie QR code do terminal

## 🧪 Testando Features

### Autenticação

1. Crie usuário no Supabase Dashboard
2. Ou use signup no app
3. Faça login

### Criar Teste

```typescript
// No app
1. Faça login
2. Navegue para "Tests"
3. Clique "Start Test"
4. Selecione grupo FODMAP
5. Preencha detalhes
6. Salve
```

### Adicionar Sintoma

```typescript
1. Abra um teste
2. Clique "Add Symptom"
3. Selecione tipo e severidade
4. Adicione notas (opcional)
5. Salve
```

## 🔧 Troubleshooting

### Erro: "Unable to resolve module"

```bash
npm start -- --clear
```

### Erro: Metro bundler não inicia

```bash
# Mate processos na porta 8081
npx kill-port 8081

# Reinicie
npm start
```

### Erro: Supabase não conecta

1. Verifique `.env`
2. Confirme credenciais no Supabase Dashboard
3. Teste conexão:

```typescript
// No console do navegador
const { data, error } = await supabase.auth.getSession();
console.log(data, error);
```

### Erro: SQLite não funciona

```bash
# Limpe e rebuilde
rm -rf node_modules
npm install
npx expo prebuild --clean
```

## 📚 Próximos Passos

1. **Leia a documentação**
   - [README.md](./README.md) - Visão geral
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - Como contribuir

2. **Explore o código**
   - `src/core/engine/` - Lógica FODMAP
   - `src/features/` - Features do app
   - `src/shared/components/` - Design system

3. **Rode os testes**

   ```bash
   npm test
   ```

4. **Faça sua primeira contribuição**
   - Escolha uma issue
   - Crie uma branch
   - Faça suas mudanças
   - Abra um PR

## 🎓 Recursos de Aprendizado

### React Native

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Testing

- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Jest](https://jestjs.io/docs/getting-started)

### Supabase

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

### FODMAP

- [Monash University](https://www.monashfodmap.com/)
- [FODMAP Protocol](https://www.monashfodmap.com/blog/how-do-i-rechallenge-fodmaps/)

## 💡 Dicas

### VS Code Extensions

Instale para melhor experiência:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Atalhos Úteis

```bash
# Limpar cache
npm start -- --clear

# Resetar Metro
r (no terminal do Expo)

# Abrir DevTools
d (no terminal do Expo)

# Reload app
Cmd+R (iOS) / RR (Android)

# Debug menu
Cmd+D (iOS) / Cmd+M (Android)
```

### Debug

```typescript
// Console logs
console.log('Debug:', data);

// React DevTools
// Instale: npm install -g react-devtools
// Execute: react-devtools

// Flipper (avançado)
// https://fbflipper.com/
```

## 🚀 Deploy

### Desenvolvimento

```bash
# Build de desenvolvimento
eas build --profile development --platform android
```

### Produção

```bash
# Configure EAS
eas build:configure

# Build
eas build --profile production --platform all

# Submit
eas submit --platform android
eas submit --platform ios
```

## ❓ Precisa de Ajuda?

- 📖 [Documentação completa](./README.md)
- 💬 [Discussions](https://github.com/seu-repo/discussions)
- 🐛 [Report bugs](https://github.com/seu-repo/issues)
- 📧 Email: [email]

---

Pronto para começar! 🎉
