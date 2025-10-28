import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';

export function DiaryScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Diário</Text>
      <Text style={subtitleStyle}>Registre suas refeições e sintomas diários</Text>
    </View>
  );
}
