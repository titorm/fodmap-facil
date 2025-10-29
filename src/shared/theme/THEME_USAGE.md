# Guia de Uso do Sistema de Tema

## Visão Geral

O projeto usa um sistema de tema centralizado que suporta modo claro e escuro. **Sempre use o hook `useTheme()` para acessar os tokens de design**.

## ✅ Uso Correto

### 1. Importar o hook useTheme

```typescript
import { useTheme } from '../../shared/theme';
```

### 2. Usar o hook no componente

```typescript
export function MyComponent() {
  const { theme } = useTheme();

  return (
    <View style={styles(theme).container}>
      <Text style={styles(theme).text}>Hello</Text>
    </View>
  );
}
```

### 3. Criar estilos como função

```typescript
const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.regular,
    },
  });
```

## ❌ Uso Incorreto

### NÃO importe tokens diretamente

```typescript
// ❌ ERRADO
import { tokens } from '../../theme/tokens';
import { lightColors, spacing } from '../../theme/tokens';

// ✅ CORRETO
import { useTheme } from '../../theme';
```

### NÃO use StyleSheet.create diretamente

```typescript
// ❌ ERRADO
const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background,
  },
});

// ✅ CORRETO
const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
    },
  });
```

## Tokens Disponíveis

### Colors

- `theme.colors.background` - Cor de fundo principal
- `theme.colors.text` - Cor de texto principal
- `theme.colors.primary500` - Cor primária
- `theme.colors.error` - Cor de erro
- `theme.colors.success` - Cor de sucesso
- `theme.colors.warning` - Cor de aviso
- E muitos outros...

### Spacing

- `theme.spacing.xs` - 4px
- `theme.spacing.sm` - 8px
- `theme.spacing.md` - 16px
- `theme.spacing.lg` - 24px
- `theme.spacing.xl` - 32px
- `theme.spacing.xxl` - 48px

### Typography

- `theme.typography.fontSize.xs` - 12
- `theme.typography.fontSize.sm` - 14
- `theme.typography.fontSize.md` - 16
- `theme.typography.fontWeight.regular` - '400'
- `theme.typography.fontWeight.bold` - '700'

### Border Radius

- `theme.borderRadius.sm` - 4
- `theme.borderRadius.md` - 8
- `theme.borderRadius.lg` - 12
- `theme.borderRadius.full` - 9999

### Shadows

- `theme.shadows.sm` - Sombra pequena
- `theme.shadows.md` - Sombra média
- `theme.shadows.lg` - Sombra grande

## Exemplo Completo

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme';

export function ExampleComponent() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={styles(theme).container}>
      <Text style={styles(theme).title}>
        Modo: {isDark ? 'Escuro' : 'Claro'}
      </Text>
      <TouchableOpacity
        style={styles(theme).button}
        onPress={toggleTheme}
      >
        <Text style={styles(theme).buttonText}>
          Alternar Tema
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    button: {
      backgroundColor: theme.colors.primary500,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.md,
    },
    buttonText: {
      color: theme.colors.textOnPrimary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      textAlign: 'center',
    },
  });
```

## Benefícios

1. **Suporte automático a tema claro/escuro** - Os componentes se adaptam automaticamente
2. **Type-safe** - TypeScript garante que você use tokens válidos
3. **Consistência** - Todos os componentes usam os mesmos valores
4. **Manutenibilidade** - Mudanças no tema afetam todo o app automaticamente
