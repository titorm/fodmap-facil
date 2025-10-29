import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { tokens } from '../../theme/tokens';

/**
 * OfflineIndicator Component
 *
 * Displays a banner at the top of the screen when the device is offline.
 * Automatically shows/hides based on network connectivity status.
 *
 * Features:
 * - Real-time network status monitoring
 * - Accessible with proper labels
 * - Internationalized text
 * - Non-intrusive banner design
 *
 * @example
 * ```tsx
 * <View>
 *   <OfflineIndicator />
 *   <MainContent />
 * </View>
 * ```
 */
export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();

  // Don't render anything if connected
  if (isConnected) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={t('offline.indicator')}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{t('offline.indicator')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.warning,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: tokens.colors.textInverse,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
});
