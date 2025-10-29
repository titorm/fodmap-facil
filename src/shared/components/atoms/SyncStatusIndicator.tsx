import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { useTheme } from '../../theme';

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
  const { theme } = useTheme();
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
        styles(theme).container,
        syncError && styles(theme).containerError,
        isSyncing && styles(theme).containerSyncing,
      ]}
      accessible={true}
      accessibilityLabel={
        isSyncing
          ? t('offline.syncPending')
          : syncError
            ? t('offline.syncError')
            : `${pendingCount} ${t('offline.dataStoredLocally')}`
      }
      accessibilityLiveRegion="polite"
    >
      <View style={styles(theme).content}>
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
            <Text style={styles(theme).text}>{t('offline.syncPending')}</Text>
          </>
        ) : syncError ? (
          <>
            <Text style={styles(theme).text}>⚠️ {t('offline.syncError')}</Text>
            <TouchableOpacity
              onPress={syncNow}
              style={styles(theme).retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}
            >
              <Text style={styles(theme).retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles(theme).text}>
              {pendingCount > 0
                ? `${pendingCount} ${t('offline.dataStoredLocally')}`
                : t('offline.syncComplete')}
            </Text>
            {lastSyncDate && (
              <Text style={styles(theme).timestamp}>
                {t('offline.syncComplete')} {formatLastSync(lastSyncDate)}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.info,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    containerError: {
      backgroundColor: theme.colors.error,
    },
    containerSyncing: {
      backgroundColor: theme.colors.primary500,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    text: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    timestamp: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.fontSize.xs,
      opacity: 0.8,
    },
    retryButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.sm,
    },
    retryText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
