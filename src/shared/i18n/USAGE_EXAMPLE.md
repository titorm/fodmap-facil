# i18n Usage Examples

This document demonstrates how to use the newly added translations in the application.

## Onboarding Translations

```typescript
import { useTranslation } from 'react-i18next';

function OnboardingScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('onboarding.welcome')}</Text>
      {/* Portuguese: "Bem-vindo ao FODMAP Fácil" */}
      {/* English: "Welcome to FODMAP Easy" */}

      <Button title={t('onboarding.getStarted')} />
      {/* Portuguese: "Começar" */}
      {/* English: "Get Started" */}

      <Text>{t('onboarding.features.title')}</Text>
      {/* Portuguese: "Recursos" */}
      {/* English: "Features" */}

      <Text>{t('onboarding.features.tracking')}</Text>
      <Text>{t('onboarding.features.diary')}</Text>
      <Text>{t('onboarding.features.reports')}</Text>
      <Text>{t('onboarding.features.personalized')}</Text>
    </View>
  );
}
```

## Tab Navigation Labels

```typescript
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{ title: t('tabs.journey') }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{ title: t('tabs.diary') }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: t('tabs.reports') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}
```

## Common Action Labels

```typescript
import { useTranslation } from 'react-i18next';

function FormComponent() {
  const { t } = useTranslation();

  return (
    <View>
      <Button title={t('common.save')} onPress={handleSave} />
      <Button title={t('common.cancel')} onPress={handleCancel} />
      <Button title={t('common.edit')} onPress={handleEdit} />
      <Button title={t('common.delete')} onPress={handleDelete} />
    </View>
  );
}
```

## Language Switching

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { i18n } = useTranslation();

  const switchToPortuguese = () => {
    i18n.changeLanguage('pt');
  };

  const switchToEnglish = () => {
    i18n.changeLanguage('en');
  };

  return (
    <View>
      <Button title="Português" onPress={switchToPortuguese} />
      <Button title="English" onPress={switchToEnglish} />
      <Text>Current language: {i18n.language}</Text>
    </View>
  );
}
```

## Available Translation Keys

### Onboarding

- `onboarding.welcome`
- `onboarding.getStarted`
- `onboarding.features.title`
- `onboarding.features.tracking`
- `onboarding.features.diary`
- `onboarding.features.reports`
- `onboarding.features.personalized`

### Tabs

- `tabs.home`
- `tabs.journey`
- `tabs.diary`
- `tabs.reports`
- `tabs.profile`

### Common Actions

- `common.save`
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.back`
- `common.next`
- `common.done`

## Supported Languages

- **Portuguese (pt)**: Default language
- **English (en)**: Fallback language

The app automatically detects the device language on startup and uses it if supported, otherwise falls back to English.
