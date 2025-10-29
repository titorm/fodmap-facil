import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Card } from '../../../shared/components/atoms/Card';
import type {
  NotificationHistoryEntry,
  NotificationType,
  NotificationAction,
} from '../../../services/notifications/types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

/**
 * NotificationHistoryCard Component
 *
 * Displays a single notification history entry with icon, title, body, timestamp,
 * and action status. Supports tap to navigate to related entity.
 *
 * Requirements: 10.2, 10.3
 */

export interface NotificationHistoryCardProps {
  entry: NotificationHistoryEntry;
  onPress?: () => void;
}

export function NotificationHistoryCard({ entry, onPress }: NotificationHistoryCardProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'daily_reminder':
        return 'calendar-outline';
      case 'dose_reminder':
        return 'nutrition-outline';
      case 'washout_start':
      case 'washout_warning':
      case 'washout_end':
        return 'time-outline';
      case 'test_start':
        return 'flask-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Get icon color based on notification type
  const getIconColor = (type: NotificationType): string => {
    switch (type) {
      case 'daily_reminder':
        return colors.primary500;
      case 'dose_reminder':
        return colors.success;
      case 'washout_start':
      case 'washout_warning':
      case 'washout_end':
        return colors.warning;
      case 'test_start':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  // Get action status text
  const getActionStatusText = (action: NotificationAction | null): string => {
    if (!action) return t('notifications.history.notActioned');

    switch (action) {
      case 'opened':
        return t('notifications.history.opened');
      case 'dismissed':
        return t('notifications.history.dismissed');
      case 'dose_marked_taken':
        return t('notifications.history.doseMarkedTaken');
      case 'symptom_logged':
        return t('notifications.history.symptomLogged');
      case 'snoozed':
        return t('notifications.history.snoozed');
      default:
        return t('notifications.history.actioned');
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Styles
  const containerStyle: ViewStyle = {
    marginBottom: spacing.md,
  };

  const contentStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
  };

  const iconContainerStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  };

  const textContainerStyle: ViewStyle = {
    flex: 1,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const bodyStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  };

  const metaContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  };

  const timestampStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  };

  const actionBadgeStyle: ViewStyle = {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    backgroundColor: entry.action ? colors.successLight : colors.backgroundSecondary,
  };

  const actionBadgeTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: entry.action ? colors.successDark : colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  };

  const deliveryStatusStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  };

  const deliveryStatusTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: entry.deliveredTime ? colors.success : colors.textTertiary,
  };

  // Build accessibility label
  const accessibilityLabel = `${entry.title}. ${entry.body}. ${formatTimestamp(entry.scheduledTime)}. ${getActionStatusText(entry.action)}`;
  const accessibilityHint = entry.relatedEntityId
    ? 'Double tap to view related content'
    : undefined;

  return (
    <View style={containerStyle}>
      <Card
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <View style={contentStyle}>
          {/* Icon */}
          <View style={iconContainerStyle}>
            <Ionicons
              name={getNotificationIcon(entry.notificationType)}
              size={20}
              color={getIconColor(entry.notificationType)}
            />
          </View>

          {/* Content */}
          <View style={textContainerStyle}>
            {/* Title */}
            <Text style={titleStyle} numberOfLines={2}>
              {entry.title}
            </Text>

            {/* Body */}
            <Text style={bodyStyle} numberOfLines={3}>
              {entry.body}
            </Text>

            {/* Meta information */}
            <View style={metaContainerStyle}>
              {/* Timestamp */}
              <Text style={timestampStyle}>{formatTimestamp(entry.scheduledTime)}</Text>

              {/* Delivery status */}
              {entry.deliveredTime && (
                <View style={deliveryStatusStyle}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  <Text style={deliveryStatusTextStyle}>
                    {t('notifications.history.delivered')}
                  </Text>
                </View>
              )}

              {/* Action status badge */}
              <View style={actionBadgeStyle}>
                <Text style={actionBadgeTextStyle}>{getActionStatusText(entry.action)}</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}
