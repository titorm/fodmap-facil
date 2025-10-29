import React from 'react';
import { View, Text, FlatList, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Card, NotificationIndicator } from '../../../shared/components/atoms';
import { useTheme } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useActiveProtocolRun } from '../../../shared/hooks/useProtocolRuns';
import { useActiveWashoutPeriod } from '../../../shared/hooks/useWashoutPeriods';
import { FODMAPGroup } from '../../../core/domain/entities/ReintroductionTest';

export const ReintroductionHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // Fetch active protocol run
  const { data: activeProtocolRun } = useActiveProtocolRun(user?.id || '');

  // Fetch active washout period if there's an active protocol run
  const { data: activeWashout } = useActiveWashoutPeriod(activeProtocolRun?.id || '');

  const fodmapGroups = [
    { id: FODMAPGroup.FRUCTOSE, name: t('reintroduction.foodGroups.fructose') },
    { id: FODMAPGroup.LACTOSE, name: t('reintroduction.foodGroups.lactose') },
    { id: FODMAPGroup.FRUCTANS, name: t('reintroduction.foodGroups.fructans') },
    { id: FODMAPGroup.GALACTANS, name: t('reintroduction.foodGroups.galactans') },
    { id: FODMAPGroup.POLYOLS, name: t('reintroduction.foodGroups.polyols') },
  ];

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  };

  const headerStyle: ViewStyle = {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  };

  const listStyle: ViewStyle = {
    padding: spacing.lg,
  };

  const cardStyle: ViewStyle = {
    marginBottom: spacing.md,
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

  const washoutCardStyle: ViewStyle = {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary100,
    borderColor: colors.primary500,
    borderWidth: 2,
  };

  const handleNavigateToWashout = () => {
    if (activeWashout && user) {
      navigation.navigate('WashoutScreen', {
        washoutPeriodId: activeWashout.id,
        userId: user.id,
      });
    }
  };

  const handleNavigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettingsScreen');
  };

  const renderFodmapCard = ({ item }: { item: (typeof fodmapGroups)[0] }) => (
    <Card
      style={cardStyle}
      onPress={() => console.log('Navigate to', item.id)}
      accessibilityLabel={`Test ${item.name}`}
      accessibilityHint="Tap to start reintroduction test"
    >
      <Text style={cardTitleStyle}>{item.name}</Text>
      <Text style={cardSubtitleStyle}>Not started</Text>
    </Card>
  );

  return (
    <View style={containerStyle}>
      <View style={headerStyle}>
        <Text style={titleStyle} accessibilityRole="header">
          {t('reintroduction.title')}
        </Text>
        <Text style={subtitleStyle}>{t('reintroduction.currentPhase')}</Text>
      </View>

      <FlatList
        data={fodmapGroups}
        renderItem={renderFodmapCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={listStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Notification Indicator - Task 11.4 */}
            <NotificationIndicator
              onPress={handleNavigateToNotificationSettings}
              showBadgeCount={true}
              style={{ marginBottom: spacing.lg }}
            />

            {activeWashout ? (
              <Card
                style={washoutCardStyle}
                onPress={handleNavigateToWashout}
                accessibilityLabel="Active washout period"
                accessibilityHint="Tap to view your washout period details"
              >
                <Text style={cardTitleStyle}>🕐 Período de Washout Ativo</Text>
                <Text style={cardSubtitleStyle}>
                  Toque para ver o cronômetro e conteúdo educacional
                </Text>
              </Card>
            ) : null}
          </>
        }
      />
    </View>
  );
};
