import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { tokens } from '../../theme/tokens';

/**
 * SyncStatusIndicator Component
 *
 * Displays the current sync status with pending count and last sync time.
 * Provides a button to manually trigger sync.
 *
 * Features:
 * - Shows pending operations count
 * - Displays last sync timestamp
 * - Shows sync progress indicator
 * - Allows manual sync trigger
 * - Displays sync errors
 *
 * @example
 * ```tsx
 * <View>
 *   <SyncStatusIndicator />
 *   <MainContent />
 * </View>
 * ```
 */
export function SyncStatusIndicator() {
  const { t } = useTranslation();
  const { isSyncing, pendingCount, lastSyncDate, syncError, syncNow } = useSyncStatus();

  // Don't render if nothing to show
  if (pendingCount === 0 && !isSyncing && !syncError) {
    return null;
  }

  const formatLastSync = (date: Date | null): string => {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('diary.timeAgo.justNow');
    if (diffMins < 60) return t('diary.timeAgo.minutesAgo', { count: diffMins });

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('diary.timeAgo.hoursAgo', { count: diffHours });

    const diffDays = Math.floor(diffHours / 24);
    return t('diary.timeAgo.daysAgo', { count: diffDays });
  };

  return (
    <View
      style={[
        styles.container,
        syncError && styles.containerError,
        isSyncing && styles.containerSyncing,
      ]}
      accessible={true}
      accessibilityRole="status"
      accessibilityLabel={
        isSyncing
          ? t('offline.syncPending')
          : syncError
            ? t('offline.syncError')
            : `${pendingCount} ${t('offline.dataStoredLocally')}`
      }
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color={tokens.colors.textInverse} />
            <Text style={styles.text}>{t('offline.syncPending')}</Text>
          </>
        ) : syncError ? (
          <>
            <Text style={styles.text}>⚠️ {t('offline.syncError')}</Text>
            <TouchableOpacity
              onPress={syncNow}
              style={styles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}
            >
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.text}>
              {pendingCount > 0
                ? `${pendingCount} ${t('offline.dataStoredLocally')}`
                : t('offline.syncComplete')}
            </Text>
            {lastSyncDate && (
              <Text style={styles.timestamp}>
                {t('offline.syncComplete')} {formatLastSync(lastSyncDate)}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.info,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  containerError: {
    backgroundColor: tokens.colors.error,
  },
  containerSyncing: {
    backgroundColor: tokens.colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  text: {
    color: tokens.colors.textInverse,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  timestamp: {
    color: tokens.colors.textInverse,
    fontSize: tokens.typography.fontSize.xs,
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: tokens.borderRadius.sm,
  },
  retryText: {
    color: tokens.colors.textInverse,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});
