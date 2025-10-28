# Guia de Contribuição

Obrigado por considerar contribuir com o FODMAP Reintroduction App! 🎉

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## Como Contribuir

### Reportar Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-repo/issues)
2. Se não, crie uma nova issue com:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Versão do app e dispositivo

### Sugerir Features

1. Verifique se a feature já foi sugerida
2. Crie uma issue com:
   - Descrição clara da feature
   - Motivação e casos de uso
   - Possível implementação (opcional)

### Pull Requests

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie uma branch** para sua feature/fix
4. **Faça suas alterações**
5. **Teste** suas alterações
6. **Commit** com mensagens claras
7. **Push** para seu fork
8. **Abra um Pull Request**

## Padrões de Código

### TypeScript

```typescript
// ✅ Bom
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function getUserProfile(userId: string): Promise<UserProfile> {
  // ...
}

// ❌ Ruim
function getUser(id: any): any {
  // ...
}
```

### Componentes React

```typescript
// ✅ Bom
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// ❌ Ruim
export const Button = (props: any) => {
  return <TouchableOpacity onPress={props.onPress}><Text>{props.title}</Text></TouchableOpacity>;
};
```

### Acessibilidade

```typescript
// ✅ Sempre inclua props de acessibilidade
<Button
  title="Start Test"
  onPress={handlePress}
  accessibilityLabel="Start reintroduction test"
  accessibilityHint="Tap to begin testing a FODMAP group"
/>

// ❌ Nunca ignore acessibilidade
<TouchableOpacity onPress={handlePress}>
  <Text>Start</Text>
</TouchableOpacity>
```

### Testes

```typescript
// ✅ Teste comportamento, não implementação
describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} />);
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalled();
  });
});

// ❌ Não teste detalhes de implementação
it('has correct state', () => {
  const { container } = render(<Button />);
  expect(container.firstChild.state.pressed).toBe(false);
});
```

## Estrutura de Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add symptom tracking feature
fix: resolve navigation bug on Android
docs: update README with setup instructions
style: format code with prettier
refactor: simplify ReintroductionEngine logic
test: add tests for CreateReintroductionTest
chore: update dependencies
```

### Exemplos

```bash
# Feature
git commit -m "feat: add Portuguese translations"

# Bug fix
git commit -m "fix: resolve crash when creating test without symptoms"

# Documentation
git commit -m "docs: add architecture diagram"

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: API now returns tests in array format"
```

## Checklist de PR

Antes de submeter um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (`npm test`)
- [ ] Lint passa (`npm run lint`)
- [ ] Type check passa (`npm run type-check`)
- [ ] Código está formatado (`npm run format`)
- [ ] Componentes têm props de acessibilidade
- [ ] Strings são internacionalizadas
- [ ] Documentação foi atualizada (se necessário)
- [ ] Testes foram adicionados/atualizados
- [ ] PR tem descrição clara

## Desenvolvimento Local

### Setup

```bash
# Clone
git clone https://github.com/seu-usuario/fodmap-reintro-app.git
cd fodmap-reintro-app

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o app
npm start
```

### Rodando Testes

```bash
# Todos os testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Linting e Formatação

```bash
# Lint
npm run lint

# Fix automático
npm run lint:fix

# Format
npm run format

# Verificar formatação
npm run format:check
```

## Estrutura de Branches

- `main` - Produção estável
- `develop` - Desenvolvimento ativo
- `feature/*` - Novas features
- `fix/*` - Bug fixes
- `docs/*` - Documentação
- `refactor/*` - Refatorações

### Exemplo

```bash
# Feature
git checkout -b feature/add-symptom-severity-chart

# Bug fix
git checkout -b fix/navigation-crash-android

# Docs
git checkout -b docs/update-contributing-guide
```

## Revisão de Código

### Para Revisores

- Seja construtivo e respeitoso
- Explique o "porquê" das sugestões
- Aprove quando estiver satisfeito
- Peça mudanças se necessário

### Para Autores

- Responda a todos os comentários
- Faça as mudanças solicitadas
- Agradeça o feedback
- Marque conversas como resolvidas

## Recursos

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Dúvidas?

- Abra uma [Discussion](https://github.com/seu-repo/discussions)
- Entre no nosso [Discord](https://discord.gg/seu-servidor)
- Envie um email para [email]

---

Obrigado por contribuir! 🙏
