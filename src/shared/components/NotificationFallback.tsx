/**
 * Notification Fallback Components
 *
 * Provides graceful degradation when notifications are disabled
 * Requirements: 7.3
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { NotificationService } from '../../services/notifications/NotificationService';

/**
 * In-app alert banner shown when notifications are disabled
 * Requirements: 7.3
 */
export const NotificationDisabledAlert: React.FC<{
  onEnablePress?: () => void;
}> = ({ onEnablePress }) => {
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);

  if (permissionStatus === 'granted') {
    return null;
  }

  const handleEnablePress = async () => {
    if (permissionStatus === 'undetermined') {
      // Request permission
      const service = NotificationService.getInstance();
      await service.requestPermission();
    } else {
      // Open settings
      const service = NotificationService.getInstance();
      await service.openSettings();
    }

    onEnablePress?.();
  };

  return (
    <View style={styles.alertContainer}>
      <View style={styles.alertContent}>
        <Text style={styles.alertIcon}>🔔</Text>
        <View style={styles.alertTextContainer}>
          <Text style={styles.alertTitle}>Notifications Disabled</Text>
          <Text style={styles.alertMessage}>
            Enable notifications to receive reminders for symptom logging, doses, and protocol
            milestones.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.alertButton} onPress={handleEnablePress}>
        <Text style={styles.alertButtonText}>
          {permissionStatus === 'undetermined' ? 'Enable' : 'Open Settings'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Badge indicator for pending actions
 * Requirements: 7.3
 */
export const PendingActionBadge: React.FC<{
  count: number;
  type: 'symptom' | 'dose' | 'test';
}> = ({ count, type }) => {
  if (count === 0) {
    return null;
  }

  const getLabel = () => {
    switch (type) {
      case 'symptom':
        return 'Log Symptoms';
      case 'dose':
        return 'Take Dose';
      case 'test':
        return 'Start Test';
      default:
        return 'Action Required';
    }
  };

  return (
    <View style={styles.badgeContainer}>
      <View style={styles.badge}>
        <Text style={styles.badgeCount}>{count}</Text>
      </View>
      <Text style={styles.badgeLabel}>{getLabel()}</Text>
    </View>
  );
};

/**
 * Manual reminder card shown in dashboard when notifications are disabled
 * Requirements: 7.3
 */
export const ManualReminderCard: React.FC<{
  title: string;
  description: string;
  actionLabel: string;
  onActionPress: () => void;
  icon?: string;
}> = ({ title, description, actionLabel, onActionPress, icon = '📋' }) => {
  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderIcon}>{icon}</Text>
        <View style={styles.reminderTextContainer}>
          <Text style={styles.reminderTitle}>{title}</Text>
          <Text style={styles.reminderDescription}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.reminderButton} onPress={onActionPress}>
        <Text style={styles.reminderButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Dashboard widget showing pending actions when notifications are disabled
 * Requirements: 7.3
 */
export const PendingActionsWidget: React.FC<{
  pendingSymptomLogs: number;
  pendingDoses: number;
  pendingTests: number;
  onSymptomLogPress: () => void;
  onDosePress: () => void;
  onTestPress: () => void;
}> = ({
  pendingSymptomLogs,
  pendingDoses,
  pendingTests,
  onSymptomLogPress,
  onDosePress,
  onTestPress,
}) => {
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);

  // Only show if notifications are disabled and there are pending actions
  const totalPending = pendingSymptomLogs + pendingDoses + pendingTests;
  if (permissionStatus === 'granted' || totalPending === 0) {
    return null;
  }

  return (
    <View style={styles.widgetContainer}>
      <Text style={styles.widgetTitle}>Pending Actions</Text>
      <Text style={styles.widgetSubtitle}>
        You have {totalPending} pending {totalPending === 1 ? 'action' : 'actions'}
      </Text>

      <View style={styles.widgetActions}>
        {pendingSymptomLogs > 0 && (
          <ManualReminderCard
            title="Log Symptoms"
            description={`${pendingSymptomLogs} ${pendingSymptomLogs === 1 ? 'day' : 'days'} without symptom logs`}
            actionLabel="Log Now"
            onActionPress={onSymptomLogPress}
            icon="📝"
          />
        )}

        {pendingDoses > 0 && (
          <ManualReminderCard
            title="Take Dose"
            description={`${pendingDoses} ${pendingDoses === 1 ? 'dose' : 'doses'} scheduled`}
            actionLabel="View Doses"
            onActionPress={onDosePress}
            icon="💊"
          />
        )}

        {pendingTests > 0 && (
          <ManualReminderCard
            title="Start Test"
            description={`${pendingTests} ${pendingTests === 1 ? 'test' : 'tests'} ready to start`}
            actionLabel="View Tests"
            onActionPress={onTestPress}
            icon="🧪"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Alert styles
  alertContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#856404',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Badge styles
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeLabel: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 4,
  },

  // Reminder card styles
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  reminderButton: {
    backgroundColor: '#007BFF',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  reminderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Widget styles
  widgetContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  widgetSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  widgetActions: {
    gap: 12,
  },
});
