import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { notificationHistoryRepository } from '../../../services/notifications/NotificationHistoryRepository';
import { NotificationHistoryCard } from '../components/NotificationHistoryCard';
import { EmptyState } from '../../../shared/components/atoms/EmptyState';
import type {
  NotificationHistoryEntry,
  NotificationType,
} from '../../../services/notifications/types';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

/**
 * NotificationHistoryScreen
 *
 * Displays a list of notifications from the past 30 days with filtering
 * by notification type and pull-to-refresh functionality.
 *
 * Requirements: 10.2, 10.4
 */

type FilterType = 'all' | NotificationType;

export function NotificationHistoryScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();

  // State
  const [notifications, setNotifications] = useState<NotificationHistoryEntry[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationHistoryEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Apply filter when notifications or filter changes
  useEffect(() => {
    applyFilter();
  }, [notifications, selectedFilter]);

  /**
   * Load notifications from the past 30 days
   */
  const loadNotifications = async () => {
    if (!user) return;

    try {
      setError(null);

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch notifications
      const entries = await notificationHistoryRepository.list(
        {
          userId: user.id,
          startDate: thirtyDaysAgo,
        },
        100 // Limit to 100 most recent
      );

      setNotifications(entries);
    } catch (err) {
      console.error('Error loading notification history:', err);
      setError(t('notifications.history.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  /**
   * Apply filter to notifications
   */
  const applyFilter = () => {
    if (selectedFilter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter((n) => n.notificationType === selectedFilter));
    }
  };

  /**
   * Handle filter selection
   */
  const handleFilterSelect = (filter: FilterType) => {
    setSelectedFilter(filter);
  };

  /**
   * Handle notification card press - navigate to related entity
   * Requirements: 10.3
   */
  const handleNotificationPress = (entry: NotificationHistoryEntry) => {
    // Navigate based on related entity type
    if (entry.relatedEntityType && entry.relatedEntityId) {
      switch (entry.relatedEntityType) {
        case 'test_step':
          // Navigate to test wizard
          navigation.navigate(
            'TestWizardFlow' as never,
            {
              testStepId: entry.relatedEntityId,
            } as never
          );
          break;
        case 'washout':
          // Navigate to washout screen
          navigation.navigate(
            'WashoutScreen' as never,
            {
              washoutPeriodId: entry.relatedEntityId,
              userId: user?.id,
            } as never
          );
          break;
        case 'symptom_entry':
          // Navigate to diary
          navigation.navigate(
            'Main' as never,
            {
              screen: 'Diário',
            } as never
          );
          break;
        default:
          // No specific navigation
          break;
      }
    }
  };

  /**
   * Get filter label
   */
  const getFilterLabel = (filter: FilterType): string => {
    switch (filter) {
      case 'all':
        return t('notifications.history.filterAll');
      case 'daily_reminder':
        return t('notifications.history.filterDailyReminder');
      case 'dose_reminder':
        return t('notifications.history.filterDoseReminder');
      case 'washout_start':
      case 'washout_warning':
      case 'washout_end':
        return t('notifications.history.filterWashout');
      case 'test_start':
        return t('notifications.history.filterTestStart');
      default:
        return filter;
    }
  };

  // Filter options
  const filterOptions: FilterType[] = [
    'all',
    'daily_reminder',
    'dose_reminder',
    'washout_start',
    'test_start',
  ];

  // Styles
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const headerStyle: ViewStyle = {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  };

  const filterContainerStyle: ViewStyle = {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  };

  const filterButtonStyle = (isSelected: boolean): ViewStyle => ({
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: isSelected ? colors.primary500 : colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: isSelected ? colors.primary500 : colors.border,
  });

  const filterButtonTextStyle = (isSelected: boolean): TextStyle => ({
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: isSelected ? colors.textOnPrimary : colors.text,
  });

  const listContentStyle: ViewStyle = {
    padding: spacing.md,
  };

  const loadingContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  };

  const loadingTextStyle: TextStyle = {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  };

  const errorContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  };

  const errorTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  };

  const errorDescriptionStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  };

  const retryButtonStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary500,
    borderRadius: borderRadius.md,
  };

  const retryButtonTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textOnPrimary,
  };

  // Render loading state
  if (loading) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text style={titleStyle}>{t('notifications.history.title')}</Text>
        </View>
        <View style={loadingContainerStyle}>
          <ActivityIndicator size="large" color={colors.primary500} />
          <Text style={loadingTextStyle}>{t('notifications.history.loading')}</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text style={titleStyle}>{t('notifications.history.title')}</Text>
        </View>
        <View style={errorContainerStyle}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={errorTextStyle}>{error}</Text>
          <Text style={errorDescriptionStyle}>
            {t('notifications.history.errorLoadingDescription')}
          </Text>
          <TouchableOpacity style={retryButtonStyle} onPress={loadNotifications}>
            <Text style={retryButtonTextStyle}>{t('notifications.history.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Header with filters */}
      <View style={headerStyle}>
        <Text style={titleStyle}>{t('notifications.history.title')}</Text>
        <Text style={subtitleStyle}>{t('notifications.history.last30Days')}</Text>

        {/* Filter buttons */}
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={filterContainerStyle}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={filterButtonStyle(selectedFilter === item)}
              onPress={() => handleFilterSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${getFilterLabel(item)}`}
              accessibilityState={{ selected: selectedFilter === item }}
            >
              <Text style={filterButtonTextStyle(selectedFilter === item)}>
                {getFilterLabel(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Notification list */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={listContentStyle}
        renderItem={({ item }) => (
          <NotificationHistoryCard entry={item} onPress={() => handleNotificationPress(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title={t('notifications.history.emptyTitle')}
            description={t('notifications.history.emptyDescription')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary500}
            colors={[colors.primary500]}
          />
        }
        accessibilityLabel="Notification history list"
        accessibilityHint={t('notifications.history.pullToRefresh')}
      />
    </View>
  );
}
