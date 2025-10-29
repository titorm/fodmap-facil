import React from 'react';
import { View, Text, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useActiveProtocolRun } from '../../../shared/hooks/useProtocolRuns';
import { useActiveWashoutPeriod } from '../../../shared/hooks/useWashoutPeriods';
import { Card } from '../../../shared/components/atoms/Card';
import { LoadingSpinner } from '../../../shared/components/atoms/LoadingSpinner';

export function JourneyScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // Fetch active protocol run
  const { data: activeProtocolRun, isLoading: isLoadingProtocol } = useActiveProtocolRun(
    user?.id || ''
  );

  // Fetch active washout period if there's an active protocol run
  const { data: activeWashout, isLoading: isLoadingWashout } = useActiveWashoutPeriod(
    activeProtocolRun?.id || ''
  );

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing.xl,
  };

  const cardTitleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const cardSubtitleStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const handleNavigateToWashout = () => {
    if (activeWashout && user) {
      navigation.navigate('WashoutScreen', {
        washoutPeriodId: activeWashout.id,
        userId: user.id,
      });
    }
  };

  const isLoading = isLoadingProtocol || isLoadingWashout;

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Jornada</Text>
      <Text style={subtitleStyle}>Acompanhe sua jornada de reintrodução FODMAP</Text>

      {isLoading ? (
        <LoadingSpinner size="large" />
      ) : activeWashout ? (
        <Card
          onPress={handleNavigateToWashout}
          accessibilityLabel="Active washout period"
          accessibilityHint="Tap to view your washout period details"
        >
          <Text style={cardTitleStyle}>Período de Washout Ativo</Text>
          <Text style={cardSubtitleStyle}>Toque para ver o cronômetro e conteúdo educacional</Text>
        </Card>
      ) : null}
    </View>
  );
}
