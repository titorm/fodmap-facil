import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../../shared/components/atoms';
import { useTheme } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';

export const SignInScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  };

  const scrollContentStyle: ViewStyle = {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  };

  const headerStyle: ViewStyle = {
    alignItems: 'center',
    marginBottom: spacing.xl,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary700,
    marginBottom: spacing.sm,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  };

  const formStyle: ViewStyle = {
    width: '100%',
  };

  return (
    <KeyboardAvoidingView
      style={containerStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={scrollContentStyle} keyboardShouldPersistTaps="handled">
        <View style={headerStyle}>
          <Text style={titleStyle} accessibilityRole="header">
            {t('common.appName')}
          </Text>
          <Text style={subtitleStyle}>{t('auth.signIn')}</Text>
        </View>

        <View style={formStyle}>
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            required
            testID="email-input"
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            error={errors.password}
            required
            testID="password-input"
          />

          <Button
            title={t('auth.signIn')}
            onPress={handleSignIn}
            loading={loading}
            fullWidth
            testID="signin-button"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
