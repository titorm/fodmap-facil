# Exemplos de Uso

Guia prático com exemplos de código para usar o FODMAP Reintroduction App.

## 🔐 Autenticação

### Sign In

```typescript
import { useAuth } from '@/shared/hooks/useAuth';

function SignInExample() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Usuário autenticado, navegação automática
    }
  };

  return (
    <View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
}
```

### Sign Up

```typescript
const { signUp } = useAuth();

const handleSignUp = async () => {
  const { error } = await signUp(email, password);

  if (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Sign Out

```typescript
const { signOut } = useAuth();

const handleSignOut = async () => {
  const { error } = await signOut();

  if (error) {
    Alert.alert('Error', error.message);
  }
};
```

## 🧪 Testes de Reintrodução

### Listar Testes

```typescript
import { useReintroductionTests } from '@/shared/hooks/useReintroductionTests';

function TestsList() {
  const { user } = useAuth();
  const { data: tests, isLoading, error } = useReintroductionTests(user?.id || '');

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <FlatList
      data={tests}
      renderItem={({ item }) => <TestCard test={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Criar Teste

```typescript
import { useCreateReintroductionTest } from '@/shared/hooks/useReintroductionTests';
import { FODMAPGroup, TestPhase } from '@/core/domain/entities/ReintroductionTest';

function CreateTestExample() {
  const { user } = useAuth();
  const createTest = useCreateReintroductionTest();

  const handleCreateTest = async () => {
    try {
      await createTest.mutateAsync({
        userId: user!.id,
        fodmapGroup: FODMAPGroup.FRUCTOSE,
        phase: TestPhase.REINTRODUCTION,
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        notes: 'First test',
        startDate: new Date(),
        symptoms: [],
      });

      Alert.alert('Success', 'Test created!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return <Button title="Create Test" onPress={handleCreateTest} />;
}
```

### Atualizar Teste

```typescript
import { useUpdateReintroductionTest } from '@/shared/hooks/useReintroductionTests';

function UpdateTestExample({ testId }: { testId: string }) {
  const updateTest = useUpdateReintroductionTest();

  const handleAddNotes = async () => {
    try {
      await updateTest.mutateAsync({
        id: testId,
        updates: {
          notes: 'Updated notes',
          updatedAt: new Date(),
        },
      });

      Alert.alert('Success', 'Test updated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return <Button title="Add Notes" onPress={handleAddNotes} />;
}
```

### Deletar Teste

```typescript
import { useDeleteReintroductionTest } from '@/shared/hooks/useReintroductionTests';

function DeleteTestExample({ testId }: { testId: string }) {
  const deleteTest = useDeleteReintroductionTest();

  const handleDelete = async () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to delete this test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTest.mutateAsync(testId);
              Alert.alert('Success', 'Test deleted!');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return <Button title="Delete" onPress={handleDelete} variant="outline" />;
}
```

## 🩺 Sintomas

### Adicionar Sintoma

```typescript
import { useAddSymptom } from '@/shared/hooks/useReintroductionTests';
import { SymptomSeverity } from '@/core/domain/entities/ReintroductionTest';

function AddSymptomExample({ testId }: { testId: string }) {
  const addSymptom = useAddSymptom();
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState(SymptomSeverity.MILD);

  const handleAddSymptom = async () => {
    try {
      await addSymptom.mutateAsync({
        testId,
        type,
        severity,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Symptom added!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Input
        label="Symptom Type"
        value={type}
        onChangeText={setType}
        placeholder="e.g., bloating, cramping"
      />
      <Button title="Add Symptom" onPress={handleAddSymptom} />
    </View>
  );
}
```

## 🧠 Engine FODMAP

### Validar Protocolo

```typescript
import { ReintroductionEngine } from '@/core/engine/ReintroductionEngine';

function ValidateTestExample({ test }: { test: ReintroductionTest }) {
  const validation = ReintroductionEngine.validateTestProtocol(test);

  if (!validation.valid) {
    return (
      <View>
        <Text>Validation Errors:</Text>
        {validation.errors.map((error, index) => (
          <Text key={index} style={{ color: 'red' }}>
            • {error}
          </Text>
        ))}
      </View>
    );
  }

  return <Text style={{ color: 'green' }}>✓ Valid protocol</Text>;
}
```

### Verificar Progressão

```typescript
function CanProgressExample({ test }: { test: ReintroductionTest }) {
  const canProgress = ReintroductionEngine.canProgressToNextGroup(test);

  return (
    <View>
      {canProgress ? (
        <Text style={{ color: 'green' }}>
          ✓ You can progress to the next group
        </Text>
      ) : (
        <Text style={{ color: 'orange' }}>
          ⚠ Consider retesting or consulting a dietitian
        </Text>
      )}
    </View>
  );
}
```

### Determinar Tolerância

```typescript
function ToleranceExample({ tests }: { tests: ReintroductionTest[] }) {
  const tolerance = ReintroductionEngine.determineTolerance(tests);

  if (!tolerance) return null;

  return (
    <Card>
      <Text style={{ fontWeight: 'bold' }}>
        {tolerance.group.toUpperCase()}
      </Text>
      {tolerance.tolerated ? (
        <Text style={{ color: 'green' }}>
          ✓ Tolerated up to {tolerance.maxToleratedPortion}
        </Text>
      ) : (
        <Text style={{ color: 'red' }}>
          ✗ Not tolerated
        </Text>
      )}
    </Card>
  );
}
```

### Gerar Recomendações

```typescript
function RecommendationsExample({ tests }: { tests: ReintroductionTest[] }) {
  const recommendations = ReintroductionEngine.generateRecommendations(tests);

  return (
    <View>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
        Recommendations:
      </Text>
      {recommendations.map((rec, index) => (
        <Text key={index} style={{ marginBottom: 4 }}>
          • {rec}
        </Text>
      ))}
    </View>
  );
}
```

## 🎨 Design System

### Botões

```typescript
// Primary
<Button
  title="Start Test"
  onPress={handlePress}
  variant="primary"
/>

// Secondary
<Button
  title="Cancel"
  onPress={handlePress}
  variant="secondary"
/>

// Outline
<Button
  title="Learn More"
  onPress={handlePress}
  variant="outline"
/>

// Ghost
<Button
  title="Skip"
  onPress={handlePress}
  variant="ghost"
/>

// Tamanhos
<Button title="Small" size="small" onPress={handlePress} />
<Button title="Medium" size="medium" onPress={handlePress} />
<Button title="Large" size="large" onPress={handlePress} />

// Estados
<Button title="Disabled" disabled onPress={handlePress} />
<Button title="Loading" loading onPress={handlePress} />

// Full width
<Button title="Full Width" fullWidth onPress={handlePress} />
```

### Inputs

```typescript
// Básico
<Input
  label="Name"
  value={name}
  onChangeText={setName}
/>

// Com validação
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  required
/>

// Com helper text
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  helperText="Must be at least 8 characters"
  secureTextEntry
/>
```

### Cards

```typescript
// Básico
<Card>
  <Text>Content</Text>
</Card>

// Com elevação
<Card elevation="sm">
  <Text>Small shadow</Text>
</Card>

<Card elevation="lg">
  <Text>Large shadow</Text>
</Card>

// Clicável
<Card onPress={handlePress}>
  <Text>Tap me</Text>
</Card>
```

## 🌍 Internacionalização

### Usar Traduções

```typescript
import { useTranslation } from 'react-i18next';

function I18nExample() {
  const { t, i18n } = useTranslation();

  return (
    <View>
      <Text>{t('common.appName')}</Text>
      <Text>{t('auth.signIn')}</Text>
      <Text>{t('reintroduction.startTest')}</Text>

      <Button
        title="Switch to Portuguese"
        onPress={() => i18n.changeLanguage('pt')}
      />
    </View>
  );
}
```

### Adicionar Traduções

```typescript
// src/shared/i18n/locales/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}

// Uso
const { t } = useTranslation();
<Text>{t('myFeature.title')}</Text>
```

## 💾 Estado Global

### App Store

```typescript
import { useAppStore } from '@/shared/stores/appStore';

function AppStoreExample() {
  const currentTest = useAppStore((state) => state.currentTest);
  const setCurrentTest = useAppStore((state) => state.setCurrentTest);
  const currentPhase = useAppStore((state) => state.currentPhase);

  return (
    <View>
      <Text>Current Phase: {currentPhase}</Text>
      {currentTest && (
        <Text>Current Test: {currentTest.foodItem}</Text>
      )}
    </View>
  );
}
```

### User Preferences

```typescript
import { useUserPreferencesStore } from '@/shared/stores/appStore';

function PreferencesExample() {
  const language = useUserPreferencesStore((state) => state.language);
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage);
  const notificationsEnabled = useUserPreferencesStore(
    (state) => state.notificationsEnabled
  );

  return (
    <View>
      <Text>Language: {language}</Text>
      <Button
        title="Switch to Portuguese"
        onPress={() => setLanguage('pt')}
      />
    </View>
  );
}
```

## ✅ Validação

### Validar Formulário

```typescript
import { validate, signInSchema } from '@/shared/utils/validation';

function ValidationExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const result = validate(signInSchema, { email, password });

    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    // Dados válidos
    console.log(result.data);
  };

  return (
    <View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
```

## 🧪 Testes

### Testar Componente

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/shared/components/atoms';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPress} />
    );

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Testar Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useReintroductionTests } from '@/shared/hooks/useReintroductionTests';

describe('useReintroductionTests', () => {
  it('fetches tests successfully', async () => {
    const { result } = renderHook(() => useReintroductionTests('user-id'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

## 📱 Navegação

### Navegar Entre Telas

```typescript
import { useNavigation } from '@react-navigation/native';

function NavigationExample() {
  const navigation = useNavigation();

  return (
    <View>
      <Button
        title="Go to Test Details"
        onPress={() => navigation.navigate('TestDetails', { testId: '123' })}
      />

      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}
```

---

## 💡 Dicas

### Performance

```typescript
// Memoize componentes pesados
const MemoizedTestCard = React.memo(TestCard);

// Memoize valores calculados
const tolerance = useMemo(() => ReintroductionEngine.determineTolerance(tests), [tests]);

// Memoize callbacks
const handlePress = useCallback(() => {
  console.log('Pressed');
}, []);
```

### Acessibilidade

```typescript
// Sempre adicione labels
<Button
  title="Start"
  accessibilityLabel="Start reintroduction test"
  accessibilityHint="Tap to begin testing a FODMAP group"
/>

// Use roles corretos
<View accessibilityRole="navigation">
  {/* Navigation content */}
</View>

// Anuncie mudanças importantes
<Text accessibilityLiveRegion="polite">
  {statusMessage}
</Text>
```

### Offline-First

```typescript
// TanStack Query cuida do cache automaticamente
const { data, isLoading } = useReintroductionTests(userId);

// Dados ficam disponíveis offline
// Sincroniza automaticamente quando online
```

---

Para mais exemplos, veja os arquivos de teste e fixtures no projeto!
