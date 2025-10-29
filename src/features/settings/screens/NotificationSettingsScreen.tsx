import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Card } from '../../../shared/components/atoms/Card';
import { Button } from '../../../shared/components/atoms/Button';
import { useNotificationPreferencesStore } from '../../../shared/stores/notificationPreferencesStore';
import { notificationService } from '../../../services/notifications/NotificationService';
import type { TimeOfDay } from '../../../services/notifications/types';
import { PermissionRequestModal } from '../components/PermissionRequestModal';
import { QuietHoursConfig } from '../components/QuietHoursConfig';
import { useAutoSyncNotificationPreferences } from '../hooks/useNotificationPreferencesSync';
import { useTranslation } from 'react-i18next';

/**
 * NotificationSettingsScreen
 *
 * Main screen for managing notification preferences
 * Requirements: 7.1, 8.1, 8.2, 5.1
 */
export function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  // Auto-sync preferences to UserProfile in Appwrite (Requirements: 8.3, 5.1)
  const { isSyncing } = useAutoSyncNotificationPreferences();

  // State from store
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const dailyReminderEnabled = useNotificationPreferencesStore(
    (state) => state.dailyReminderEnabled
  );
  const doseReminderEnabled = useNotificationPreferencesStore((state) => state.doseReminderEnabled);
  const washoutNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.washoutNotificationsEnabled
  );
  const testStartReminderEnabled = useNotificationPreferencesStore(
    (state) => state.testStartReminderEnabled
  );
  const dailyReminderTime = useNotificationPreferencesStore((state) => state.dailyReminderTime);
  const quietHours = useNotificationPreferencesStore((state) => state.quietHours);
  const adaptiveFrequencyEnabled = useNotificationPreferencesStore(
    (state) => state.adaptiveFrequencyEnabled
  );
  const currentFrequency = useNotificationPreferencesStore((state) => state.currentFrequency);

  // Actions from store
  const setDailyReminderEnabled = useNotificationPreferencesStore(
    (state) => state.setDailyReminderEnabled
  );
  const setDoseReminderEnabled = useNotificationPreferencesStore(
    (state) => state.setDoseReminderEnabled
  );
  const setWashoutNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.setWashoutNotificationsEnabled
  );
  const setTestStartReminderEnabled = useNotificationPreferencesStore(
    (state) => state.setTestStartReminderEnabled
  );
  const setDailyReminderTime = useNotificationPreferencesStore(
    (state) => state.setDailyReminderTime
  );
  const setQuietHours = useNotificationPreferencesStore((state) => state.setQuietHours);
  const setAdaptiveFrequencyEnabled = useNotificationPreferencesStore(
    (state) => state.setAdaptiveFrequencyEnabled
  );

  // Local state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showQuietHoursConfig, setShowQuietHoursConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  // Combined loading state (local operations + sync)
  const isLoading = loading || isSyncing;

  // Check permission status on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      await notificationService.checkPermission();
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const handleRequestPermission = () => {
    setShowPermissionModal(true);
  };

  const handlePermissionGranted = async () => {
    setShowPermissionModal(false);
    // Reschedule notifications if any types are enabled
    await rescheduleNotifications();
  };

  const handlePermissionDenied = () => {
    setShowPermissionModal(false);
  };

  const handleToggleDailyReminder = async (value: boolean) => {
    setLoading(true);
    try {
      setDailyReminderEnabled(value);

      if (value && permissionStatus === 'granted') {
        // Schedule daily reminder
        await notificationService.scheduleDailyReminder();
      } else if (!value) {
        // Cancel daily reminders
        await notificationService.cancelNotificationsByType('daily_reminder');
      }
    } catch (error) {
      console.error('Error toggling daily reminder:', error);
      Alert.alert('Error', 'Failed to update daily reminder settings');
      setDailyReminderEnabled(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDoseReminder = async (value: boolean) => {
    setLoading(true);
    try {
      setDoseReminderEnabled(value);

      if (!value) {
        // Cancel all dose reminders
        await notificationService.cancelNotificationsByType('dose_reminder');
      }
      // Note: Dose reminders are scheduled when test steps are created
    } catch (error) {
      console.error('Error toggling dose reminder:', error);
      Alert.alert('Error', 'Failed to update dose reminder settings');
      setDoseReminderEnabled(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWashoutNotifications = async (value: boolean) => {
    setLoading(true);
    try {
      setWashoutNotificationsEnabled(value);

      if (!value) {
        // Cancel all washout notifications
        await notificationService.cancelNotificationsByType('washout_start');
        await notificationService.cancelNotificationsByType('washout_warning');
        await notificationService.cancelNotificationsByType('washout_end');
      }
      // Note: Washout notifications are scheduled when washout periods are created
    } catch (error) {
      console.error('Error toggling washout notifications:', error);
      Alert.alert('Error', 'Failed to update washout notification settings');
      setWashoutNotificationsEnabled(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestStartReminder = async (value: boolean) => {
    setLoading(true);
    try {
      setTestStartReminderEnabled(value);

      if (!value) {
        // Cancel all test start reminders
        await notificationService.cancelNotificationsByType('test_start');
      }
      // Note: Test start reminders are scheduled when tests become available
    } catch (error) {
      console.error('Error toggling test start reminder:', error);
      Alert.alert('Error', 'Failed to update test start reminder settings');
      setTestStartReminderEnabled(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdaptiveFrequency = async (value: boolean) => {
    setLoading(true);
    try {
      setAdaptiveFrequencyEnabled(value);

      if (value) {
        // Enable adaptive frequency and adjust immediately
        // Note: This requires user ID which we'll get from auth context
        // For now, just update the preference
      }
    } catch (error) {
      console.error('Error toggling adaptive frequency:', error);
      Alert.alert('Error', 'Failed to update adaptive frequency settings');
      setAdaptiveFrequencyEnabled(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureQuietHours = () => {
    setShowQuietHoursConfig(true);
  };

  const handleQuietHoursSaved = async () => {
    setShowQuietHoursConfig(false);
    // Reschedule notifications to respect new quiet hours
    await rescheduleNotifications();
  };

  const rescheduleNotifications = async () => {
    setLoading(true);
    try {
      // Reschedule daily reminder if enabled
      if (dailyReminderEnabled && permissionStatus === 'granted') {
        await notificationService.scheduleDailyReminder();
      }
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: TimeOfDay | null): string => {
    if (!time) return 'Not set';
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const getPermissionStatusText = (): string => {
    switch (permissionStatus) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not requested';
      default:
        return 'Unknown';
    }
  };

  const getPermissionStatusColor = (): string => {
    switch (permissionStatus) {
      case 'granted':
        return colors.success;
      case 'denied':
        return colors.error;
      case 'undetermined':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getFrequencyText = (): string => {
    switch (currentFrequency) {
      case 'full':
        return 'Full frequency';
      case 'reduced':
        return 'Reduced frequency';
      case 'minimal':
        return 'Minimal frequency';
      default:
        return 'Unknown';
    }
  };

  // Styles
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const scrollContentStyle: ViewStyle = {
    padding: spacing.md,
  };

  const sectionStyle: ViewStyle = {
    marginBottom: spacing.lg,
  };

  const sectionTitleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const sectionDescriptionStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  };

  const settingRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 64, // Ensure large touch target for accessibility
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const settingLabelStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.text,
    flex: 1,
  };

  const settingDescriptionStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const permissionStatusStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  };

  const permissionStatusTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.text,
  };

  const permissionStatusBadgeStyle: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: getPermissionStatusColor(),
  };

  const permissionStatusBadgeTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.medium,
  };

  const timeDisplayStyle: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  };

  const timeDisplayTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  };

  return (
    <View style={containerStyle}>
      <ScrollView contentContainerStyle={scrollContentStyle}>
        {/* Permission Status Section */}
        <View style={sectionStyle} accessibilityRole="header">
          <Text style={sectionTitleStyle} accessibilityRole="header">
            Permission Status
          </Text>
          <View style={permissionStatusStyle}>
            <Text style={permissionStatusTextStyle}>Notifications</Text>
            <View style={permissionStatusBadgeStyle}>
              <Text style={permissionStatusBadgeTextStyle}>{getPermissionStatusText()}</Text>
            </View>
          </View>

          {permissionStatus !== 'granted' && (
            <Button
              title={permissionStatus === 'denied' ? 'Open Settings' : 'Request Permission'}
              onPress={
                permissionStatus === 'denied'
                  ? () => notificationService.openSettings()
                  : handleRequestPermission
              }
              variant="primary"
              fullWidth
              accessibilityLabel={
                permissionStatus === 'denied'
                  ? 'Open device settings to enable notifications'
                  : 'Request notification permission'
              }
              accessibilityHint={
                permissionStatus === 'denied'
                  ? 'Opens your device settings where you can enable notifications for this app'
                  : 'Shows a system dialog to request notification permission'
              }
            />
          )}
        </View>

        {/* Notification Types Section */}
        <View style={sectionStyle} accessibilityRole="header">
          <Text style={sectionTitleStyle} accessibilityRole="header">
            Notification Types
          </Text>
          <Text style={sectionDescriptionStyle}>
            Choose which types of notifications you want to receive
          </Text>

          <Card>
            <View style={settingRowStyle}>
              <View style={{ flex: 1 }}>
                <Text style={settingLabelStyle}>Daily Symptom Reminder</Text>
                <Text style={settingDescriptionStyle}>
                  Get reminded to log your symptoms each day
                </Text>
              </View>
              <Switch
                value={dailyReminderEnabled}
                onValueChange={handleToggleDailyReminder}
                disabled={isLoading || permissionStatus !== 'granted'}
                trackColor={{ false: colors.border, true: colors.primary500 }}
                thumbColor={colors.surface}
                accessibilityLabel="Daily symptom reminder toggle"
                accessibilityHint={`Currently ${dailyReminderEnabled ? 'enabled' : 'disabled'}. Double tap to ${dailyReminderEnabled ? 'disable' : 'enable'} daily symptom reminders`}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: dailyReminderEnabled,
                  disabled: isLoading || permissionStatus !== 'granted',
                }}
              />
            </View>

            <View style={settingRowStyle}>
              <View style={{ flex: 1 }}>
                <Text style={settingLabelStyle}>Dose Reminders</Text>
                <Text style={settingDescriptionStyle}>
                  Get reminded when it's time to take your test dose
                </Text>
              </View>
              <Switch
                value={doseReminderEnabled}
                onValueChange={handleToggleDoseReminder}
                disabled={isLoading || permissionStatus !== 'granted'}
                trackColor={{ false: colors.border, true: colors.primary500 }}
                thumbColor={colors.surface}
                accessibilityLabel="Dose reminder toggle"
                accessibilityHint={`Currently ${doseReminderEnabled ? 'enabled' : 'disabled'}. Double tap to ${doseReminderEnabled ? 'disable' : 'enable'} dose reminders`}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: doseReminderEnabled,
                  disabled: isLoading || permissionStatus !== 'granted',
                }}
              />
            </View>

            <View style={settingRowStyle}>
              <View style={{ flex: 1 }}>
                <Text style={settingLabelStyle}>Washout Notifications</Text>
                <Text style={settingDescriptionStyle}>
                  Get notified about washout period start and end
                </Text>
              </View>
              <Switch
                value={washoutNotificationsEnabled}
                onValueChange={handleToggleWashoutNotifications}
                disabled={isLoading || permissionStatus !== 'granted'}
                trackColor={{ false: colors.border, true: colors.primary500 }}
                thumbColor={colors.surface}
                accessibilityLabel="Washout notifications toggle"
                accessibilityHint={`Currently ${washoutNotificationsEnabled ? 'enabled' : 'disabled'}. Double tap to ${washoutNotificationsEnabled ? 'disable' : 'enable'} washout notifications`}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: washoutNotificationsEnabled,
                  disabled: isLoading || permissionStatus !== 'granted',
                }}
              />
            </View>

            <View style={[settingRowStyle, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={settingLabelStyle}>Test Start Reminders</Text>
                <Text style={settingDescriptionStyle}>
                  Get reminded when new tests are available
                </Text>
              </View>
              <Switch
                value={testStartReminderEnabled}
                onValueChange={handleToggleTestStartReminder}
                disabled={isLoading || permissionStatus !== 'granted'}
                trackColor={{ false: colors.border, true: colors.primary500 }}
                thumbColor={colors.surface}
                accessibilityLabel="Test start reminder toggle"
                accessibilityHint={`Currently ${testStartReminderEnabled ? 'enabled' : 'disabled'}. Double tap to ${testStartReminderEnabled ? 'disable' : 'enable'} test start reminders`}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: testStartReminderEnabled,
                  disabled: isLoading || permissionStatus !== 'granted',
                }}
              />
            </View>
          </Card>
        </View>

        {/* Daily Reminder Time Section */}
        {dailyReminderEnabled && (
          <View style={sectionStyle}>
            <Text style={sectionTitleStyle}>Daily Reminder Time</Text>
            <Text style={sectionDescriptionStyle}>
              Choose when you want to receive your daily symptom reminder
            </Text>

            <Card>
              <View style={settingRowStyle}>
                <Text style={settingLabelStyle}>Reminder Time</Text>
                <View style={timeDisplayStyle}>
                  <Text style={timeDisplayTextStyle}>{formatTime(dailyReminderTime)}</Text>
                </View>
              </View>
            </Card>

            <Text style={[sectionDescriptionStyle, { marginTop: spacing.sm }]}>
              Note: Time picker will be implemented in a future update
            </Text>
          </View>
        )}

        {/* Quiet Hours Section */}
        <View style={sectionStyle}>
          <Text style={sectionTitleStyle}>Quiet Hours</Text>
          <Text style={sectionDescriptionStyle}>
            Set times when you don't want to receive notifications
          </Text>

          <Button
            title={quietHours?.enabled ? 'Configure Quiet Hours' : 'Enable Quiet Hours'}
            onPress={handleConfigureQuietHours}
            variant="outline"
            fullWidth
            accessibilityLabel={
              quietHours?.enabled ? 'Configure quiet hours settings' : 'Enable quiet hours'
            }
            accessibilityHint="Opens a dialog to set times when you don't want to receive notifications"
          />

          {quietHours?.enabled && (
            <Card style={{ marginTop: spacing.md }}>
              <View style={settingRowStyle}>
                <Text style={settingLabelStyle}>Start Time</Text>
                <View style={timeDisplayStyle}>
                  <Text style={timeDisplayTextStyle}>{formatTime(quietHours.start)}</Text>
                </View>
              </View>
              <View style={[settingRowStyle, { borderBottomWidth: 0 }]}>
                <Text style={settingLabelStyle}>End Time</Text>
                <View style={timeDisplayStyle}>
                  <Text style={timeDisplayTextStyle}>{formatTime(quietHours.end)}</Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Adaptive Frequency Section */}
        <View style={sectionStyle}>
          <Text style={sectionTitleStyle}>Adaptive Frequency</Text>
          <Text style={sectionDescriptionStyle}>
            Let the app adjust notification frequency based on your engagement
          </Text>

          <Card>
            <View style={settingRowStyle}>
              <View style={{ flex: 1 }}>
                <Text style={settingLabelStyle}>Enable Adaptive Frequency</Text>
                <Text style={settingDescriptionStyle}>
                  Reduce reminders when you're consistently engaged
                </Text>
              </View>
              <Switch
                value={adaptiveFrequencyEnabled}
                onValueChange={handleToggleAdaptiveFrequency}
                disabled={isLoading || permissionStatus !== 'granted'}
                trackColor={{ false: colors.border, true: colors.primary500 }}
                thumbColor={colors.surface}
                accessibilityLabel="Adaptive frequency toggle"
                accessibilityHint={`Currently ${adaptiveFrequencyEnabled ? 'enabled' : 'disabled'}. Double tap to ${adaptiveFrequencyEnabled ? 'disable' : 'enable'} adaptive notification frequency`}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: adaptiveFrequencyEnabled,
                  disabled: isLoading || permissionStatus !== 'granted',
                }}
              />
            </View>

            {adaptiveFrequencyEnabled && (
              <View style={[settingRowStyle, { borderBottomWidth: 0 }]}>
                <Text style={settingLabelStyle}>Current Frequency</Text>
                <View style={timeDisplayStyle}>
                  <Text style={timeDisplayTextStyle}>{getFrequencyText()}</Text>
                </View>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Permission Request Modal */}
      <PermissionRequestModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />

      {/* Quiet Hours Config Modal */}
      <QuietHoursConfig
        visible={showQuietHoursConfig}
        onClose={() => setShowQuietHoursConfig(false)}
        onSave={handleQuietHoursSaved}
      />
    </View>
  );
}
