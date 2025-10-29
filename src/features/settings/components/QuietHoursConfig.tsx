import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms/Button';
import { Card } from '../../../shared/components/atoms/Card';
import { useNotificationPreferencesStore } from '../../../shared/stores/notificationPreferencesStore';
import type {
  TimeOfDay,
  QuietHoursConfig as QuietHoursConfigType,
} from '../../../services/notifications/types';
import { useTranslation } from 'react-i18next';

/**
 * QuietHoursConfig
 *
 * Modal component for configuring quiet hours
 * Requirements: 5.1, 5.4
 */
export interface QuietHoursConfigProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function QuietHoursConfig({ visible, onClose, onSave }: QuietHoursConfigProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  // Get current quiet hours from store
  const currentQuietHours = useNotificationPreferencesStore((state) => state.quietHours);
  const setQuietHours = useNotificationPreferencesStore((state) => state.setQuietHours);

  // Local state for editing
  const [enabled, setEnabled] = useState(currentQuietHours?.enabled ?? false);
  const [startHour, setStartHour] = useState(currentQuietHours?.start.hour ?? 22);
  const [startMinute, setStartMinute] = useState(currentQuietHours?.start.minute ?? 0);
  const [endHour, setEndHour] = useState(currentQuietHours?.end.hour ?? 7);
  const [endMinute, setEndMinute] = useState(currentQuietHours?.end.minute ?? 0);
  const [allowCritical, setAllowCritical] = useState(currentQuietHours?.allowCritical ?? true);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setEnabled(currentQuietHours?.enabled ?? false);
      setStartHour(currentQuietHours?.start.hour ?? 22);
      setStartMinute(currentQuietHours?.start.minute ?? 0);
      setEndHour(currentQuietHours?.end.hour ?? 7);
      setEndMinute(currentQuietHours?.end.minute ?? 0);
      setAllowCritical(currentQuietHours?.allowCritical ?? true);
    }
  }, [visible, currentQuietHours]);

  const validateTimes = (): boolean => {
    // Convert times to minutes for comparison
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if end time is after start time
    // Note: This is a simplified validation that doesn't handle overnight periods well
    // In a production app, you'd want more sophisticated validation
    if (startMinutes >= endMinutes) {
      // Allow overnight periods (e.g., 22:00 to 07:00)
      // This is actually valid, so we'll allow it
      return true;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateTimes()) {
      Alert.alert('Invalid Time Range', 'Please ensure the end time is after the start time.');
      return;
    }

    const config: QuietHoursConfigType = {
      enabled,
      start: { hour: startHour, minute: startMinute },
      end: { hour: endHour, minute: endMinute },
      allowCritical,
    };

    setQuietHours(config);
    onSave();
  };

  const handleDisable = () => {
    setQuietHours(null);
    onClose();
  };

  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getQuietHoursDuration = (): string => {
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    let durationMinutes: number;
    if (endMinutes > startMinutes) {
      durationMinutes = endMinutes - startMinutes;
    } else {
      // Overnight period
      durationMinutes = 24 * 60 - startMinutes + endMinutes;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${minutes}m`;
  };

  const incrementHour = (current: number, setter: (value: number) => void) => {
    setter((current + 1) % 24);
  };

  const decrementHour = (current: number, setter: (value: number) => void) => {
    setter((current - 1 + 24) % 24);
  };

  const incrementMinute = (current: number, setter: (value: number) => void) => {
    setter((current + 15) % 60);
  };

  const decrementMinute = (current: number, setter: (value: number) => void) => {
    setter((current - 15 + 60) % 60);
  };

  // Styles
  const overlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  };

  const modalContainerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  };

  const descriptionStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  };

  const settingRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
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

  const timePickerContainerStyle: ViewStyle = {
    marginVertical: spacing.md,
  };

  const timePickerLabelStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const timePickerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  };

  const timeComponentStyle: ViewStyle = {
    alignItems: 'center',
  };

  const timeButtonStyle: ViewStyle = {
    width: 48, // Increased from 44 for better accessibility
    height: 48, // Increased from 44 for better accessibility
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const timeButtonTextStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.bold,
  };

  const timeValueStyle: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    marginVertical: spacing.sm,
  };

  const timeValueTextStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  };

  const timeSeparatorStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  };

  const previewStyle: ViewStyle = {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  };

  const previewTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  const previewTimeStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  };

  const buttonContainerStyle: ViewStyle = {
    marginTop: spacing.lg,
    gap: spacing.md,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={overlayStyle} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={modalContainerStyle}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={titleStyle}>Quiet Hours</Text>

              <Text style={descriptionStyle}>
                Set times when you don't want to receive notifications. Critical notifications (like
                dose reminders within 1 hour) can still be delivered if enabled.
              </Text>

              <Card>
                <View style={settingRowStyle}>
                  <View style={{ flex: 1 }}>
                    <Text style={settingLabelStyle}>Enable Quiet Hours</Text>
                    <Text style={settingDescriptionStyle}>
                      Pause notifications during specific times
                    </Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={setEnabled}
                    trackColor={{ false: colors.border, true: colors.primary500 }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Enable quiet hours toggle"
                    accessibilityHint={`Currently ${enabled ? 'enabled' : 'disabled'}. Double tap to ${enabled ? 'disable' : 'enable'} quiet hours`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: enabled }}
                  />
                </View>

                {enabled && (
                  <View style={[settingRowStyle, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={settingLabelStyle}>Allow Critical Notifications</Text>
                      <Text style={settingDescriptionStyle}>
                        Receive important dose reminders even during quiet hours
                      </Text>
                    </View>
                    <Switch
                      value={allowCritical}
                      onValueChange={setAllowCritical}
                      trackColor={{ false: colors.border, true: colors.primary500 }}
                      thumbColor={colors.surface}
                      accessibilityLabel="Allow critical notifications toggle"
                      accessibilityHint={`Currently ${allowCritical ? 'enabled' : 'disabled'}. Double tap to ${allowCritical ? 'disable' : 'enable'} critical notifications during quiet hours`}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: allowCritical }}
                    />
                  </View>
                )}
              </Card>

              {enabled && (
                <>
                  {/* Start Time Picker */}
                  <View style={timePickerContainerStyle}>
                    <Text style={timePickerLabelStyle}>Start Time</Text>
                    <View style={timePickerStyle}>
                      <View style={timeComponentStyle}>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => incrementHour(startHour, setStartHour)}
                          accessibilityRole="button"
                          accessibilityLabel="Increase start hour"
                          accessibilityHint={`Current hour is ${startHour}. Double tap to increase`}
                        >
                          <Text style={timeButtonTextStyle}>▲</Text>
                        </TouchableOpacity>
                        <View style={timeValueStyle}>
                          <Text style={timeValueTextStyle}>
                            {startHour.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => decrementHour(startHour, setStartHour)}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease start hour"
                          accessibilityHint={`Current hour is ${startHour}. Double tap to decrease`}
                        >
                          <Text style={timeButtonTextStyle}>▼</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={timeSeparatorStyle}>:</Text>

                      <View style={timeComponentStyle}>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => incrementMinute(startMinute, setStartMinute)}
                          accessibilityRole="button"
                          accessibilityLabel="Increase start minute"
                          accessibilityHint={`Current minute is ${startMinute}. Double tap to increase by 15 minutes`}
                        >
                          <Text style={timeButtonTextStyle}>▲</Text>
                        </TouchableOpacity>
                        <View style={timeValueStyle}>
                          <Text style={timeValueTextStyle}>
                            {startMinute.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => decrementMinute(startMinute, setStartMinute)}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease start minute"
                          accessibilityHint={`Current minute is ${startMinute}. Double tap to decrease by 15 minutes`}
                        >
                          <Text style={timeButtonTextStyle}>▼</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* End Time Picker */}
                  <View style={timePickerContainerStyle}>
                    <Text style={timePickerLabelStyle}>End Time</Text>
                    <View style={timePickerStyle}>
                      <View style={timeComponentStyle}>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => incrementHour(endHour, setEndHour)}
                          accessibilityRole="button"
                          accessibilityLabel="Increase end hour"
                          accessibilityHint={`Current hour is ${endHour}. Double tap to increase`}
                        >
                          <Text style={timeButtonTextStyle}>▲</Text>
                        </TouchableOpacity>
                        <View style={timeValueStyle}>
                          <Text style={timeValueTextStyle}>
                            {endHour.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => decrementHour(endHour, setEndHour)}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease end hour"
                          accessibilityHint={`Current hour is ${endHour}. Double tap to decrease`}
                        >
                          <Text style={timeButtonTextStyle}>▼</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={timeSeparatorStyle}>:</Text>

                      <View style={timeComponentStyle}>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => incrementMinute(endMinute, setEndMinute)}
                          accessibilityRole="button"
                          accessibilityLabel="Increase end minute"
                          accessibilityHint={`Current minute is ${endMinute}. Double tap to increase by 15 minutes`}
                        >
                          <Text style={timeButtonTextStyle}>▲</Text>
                        </TouchableOpacity>
                        <View style={timeValueStyle}>
                          <Text style={timeValueTextStyle}>
                            {endMinute.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={timeButtonStyle}
                          onPress={() => decrementMinute(endMinute, setEndMinute)}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease end minute"
                          accessibilityHint={`Current minute is ${endMinute}. Double tap to decrease by 15 minutes`}
                        >
                          <Text style={timeButtonTextStyle}>▼</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Preview */}
                  <View style={previewStyle}>
                    <Text style={previewTextStyle}>Quiet Hours Period</Text>
                    <Text style={previewTimeStyle}>
                      {formatTime(startHour, startMinute)} - {formatTime(endHour, endMinute)}
                    </Text>
                    <Text style={[previewTextStyle, { marginTop: spacing.xs }]}>
                      Duration: {getQuietHoursDuration()}
                    </Text>
                  </View>
                </>
              )}

              <View style={buttonContainerStyle}>
                <Button
                  title="Save"
                  onPress={handleSave}
                  variant="primary"
                  fullWidth
                  accessibilityLabel="Save quiet hours settings"
                  accessibilityHint="Saves your quiet hours configuration and closes this dialog"
                />
                {currentQuietHours?.enabled && (
                  <Button
                    title="Disable Quiet Hours"
                    onPress={handleDisable}
                    variant="outline"
                    fullWidth
                    accessibilityLabel="Disable quiet hours"
                    accessibilityHint="Turns off quiet hours completely"
                  />
                )}
                <Button
                  title="Cancel"
                  onPress={onClose}
                  variant="ghost"
                  fullWidth
                  accessibilityLabel="Cancel"
                  accessibilityHint="Closes this dialog without saving changes"
                />
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
