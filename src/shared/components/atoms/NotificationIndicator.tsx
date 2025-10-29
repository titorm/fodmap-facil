import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { notificationService } from '../../../services/notifications/NotificationService';
import { useNotificationPreferencesStore } from '../../stores/notificationPreferencesStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationIndicatorProps {
  /**
   * Callback when the indicator is pressed
   */
  onPress?: () => void;

  /**
   * Whether to show the badge count
   */
  showBadgeCount?: boolean;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * NotificationIndicator Component
 *
 * Shows notification status and pending actions count.
 * Displays alerts when notifications are disabled.
 *
 * Features:
 * - Badge count for pending actions
 * - Alert when notifications are disabled
 * - Sync status indicator
 * - Tap to open notification settings
 *
 * Requirements: 7.3
 *
 * @example
 * ```tsx
 * <NotificationIndicator
 *   onPress={() => navigation.navigate('NotificationSettings')}
 *   showBadgeCount={true}
 * />
 * ```
 */
export function NotificationIndicator({
  onPress,
  showBadgeCount = true,
  style,
}: NotificationIndicatorProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch pending actions count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const userId = await AsyncStorage.getItem('@auth:userId');
        if (!userId) return;

        // Get scheduled notifications
        const scheduled = await notificationService.getScheduledNotifications();

        // Count notifications that haven't been actioned yet
        const pending = scheduled.filter((n) => {
          // Consider dose reminders and daily reminders as pending actions
          return n.notificationType === 'dose_reminder' || n.notificationType === 'daily_reminder';
        });

        setPendingCount(pending.length);
      } catch (error) {
        console.error('Error fetching pending notification count:', error);
      }
    };

    fetchPendingCount();

    // Refresh count every minute
    const interval = setInterval(fetchPendingCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // Check sync status
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        // Check if there are any pending sync operations
        const syncStatus = await AsyncStorage.getItem('@notifications:syncStatus');
        setIsSyncing(syncStatus === 'syncing');
      } catch (error) {
        console.error('Error checking sync status:', error);
      }
    };

    checkSyncStatus();

    // Check sync status every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Don't show anything if notifications are granted and no pending actions
  if (permissionStatus === 'granted' && pendingCount === 0 && !isSyncing) {
    return null;
  }

  // Styles
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: permissionStatus === 'denied' ? colors.error100 : colors.warning100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...style,
  };

  const iconContainerStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: permissionStatus === 'denied' ? colors.error500 : colors.warning500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  };

  const iconStyle: TextStyle = {
    fontSize: 20,
    color: colors.white,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: permissionStatus === 'denied' ? colors.error700 : colors.warning700,
    marginBottom: spacing.xs,
  };

  const messageStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: permissionStatus === 'denied' ? colors.error600 : colors.warning600,
  };

  const badgeStyle: ViewStyle = {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  };

  const badgeTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  };

  const syncIndicatorStyle: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info500,
    marginLeft: spacing.sm,
  };

  // Render notification disabled alert
  if (permissionStatus === 'denied') {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Notifications disabled"
        accessibilityHint="Tap to enable notifications in settings"
      >
        <View style={iconContainerStyle}>
          <Text style={iconStyle}>🔕</Text>
        </View>
        <View style={contentStyle}>
          <Text style={titleStyle}>Notifications Disabled</Text>
          <Text style={messageStyle}>
            Enable notifications to receive reminders for your protocol
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Render pending actions indicator
  if (showBadgeCount && pendingCount > 0) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${pendingCount} pending actions`}
        accessibilityHint="Tap to view pending actions"
      >
        <View style={iconContainerStyle}>
          <Text style={iconStyle}>🔔</Text>
        </View>
        <View style={contentStyle}>
          <Text style={titleStyle}>Pending Actions</Text>
          <Text style={messageStyle}>
            You have {pendingCount} upcoming {pendingCount === 1 ? 'reminder' : 'reminders'}
          </Text>
        </View>
        {showBadgeCount && (
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>{pendingCount}</Text>
          </View>
        )}
        {isSyncing && <View style={syncIndicatorStyle} />}
      </TouchableOpacity>
    );
  }

  // Render sync status indicator
  if (isSyncing) {
    return (
      <View style={containerStyle}>
        <View style={iconContainerStyle}>
          <Text style={iconStyle}>🔄</Text>
        </View>
        <View style={contentStyle}>
          <Text style={titleStyle}>Syncing Notifications</Text>
          <Text style={messageStyle}>Your notification preferences are being synced</Text>
        </View>
        <View style={syncIndicatorStyle} />
      </View>
    );
  }

  return null;
}
