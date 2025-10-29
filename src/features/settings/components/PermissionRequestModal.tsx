import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms/Button';
import { notificationService } from '../../../services/notifications/NotificationService';
import { useTranslation } from 'react-i18next';

/**
 * PermissionRequestModal
 *
 * Modal component for requesting notification permissions with clear explanation
 * Requirements: 7.1, 7.3, 7.5
 */
export interface PermissionRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export function PermissionRequestModal({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
}: PermissionRequestModalProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const status = await notificationService.requestPermission();

      if (status === 'granted') {
        onPermissionGranted();
      } else if (status === 'denied') {
        setShowSettingsGuide(true);
        onPermissionDenied();
      } else {
        // Undetermined - user dismissed the prompt
        onClose();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setShowSettingsGuide(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await notificationService.openSettings();
      onClose();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
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

  const benefitItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  };

  const benefitIconStyle: ViewStyle = {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  };

  const benefitIconTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.bold,
  };

  const benefitTextStyle: TextStyle = {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  };

  const buttonContainerStyle: ViewStyle = {
    marginTop: spacing.lg,
    gap: spacing.md,
  };

  const settingsGuideStyle: ViewStyle = {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  };

  const settingsGuideTitleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const settingsGuideStepStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={overlayStyle} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={modalContainerStyle}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {!showSettingsGuide ? (
                <>
                  <Text style={titleStyle}>Enable Notifications</Text>

                  <Text style={descriptionStyle}>
                    Stay on track with your FODMAP reintroduction protocol by enabling
                    notifications.
                  </Text>

                  <Text style={[descriptionStyle, { fontWeight: typography.fontWeight.medium }]}>
                    Notifications help you:
                  </Text>

                  <View style={benefitItemStyle}>
                    <View style={benefitIconStyle}>
                      <Text style={benefitIconTextStyle}>✓</Text>
                    </View>
                    <Text style={benefitTextStyle}>
                      Remember to log your symptoms daily for accurate tracking
                    </Text>
                  </View>

                  <View style={benefitItemStyle}>
                    <View style={benefitIconStyle}>
                      <Text style={benefitIconTextStyle}>✓</Text>
                    </View>
                    <Text style={benefitTextStyle}>
                      Take your test doses at the right time for reliable results
                    </Text>
                  </View>

                  <View style={benefitItemStyle}>
                    <View style={benefitIconStyle}>
                      <Text style={benefitIconTextStyle}>✓</Text>
                    </View>
                    <Text style={benefitTextStyle}>Know when washout periods start and end</Text>
                  </View>

                  <View style={benefitItemStyle}>
                    <View style={benefitIconStyle}>
                      <Text style={benefitIconTextStyle}>✓</Text>
                    </View>
                    <Text style={benefitTextStyle}>
                      Stay motivated with timely reminders to continue your journey
                    </Text>
                  </View>

                  <Text style={[descriptionStyle, { marginTop: spacing.md }]}>
                    You can customize which notifications you receive and when you receive them in
                    the settings.
                  </Text>

                  <View style={buttonContainerStyle}>
                    <Button
                      title="Enable Notifications"
                      onPress={handleRequestPermission}
                      variant="primary"
                      fullWidth
                      loading={loading}
                    />
                    <Button
                      title="Maybe Later"
                      onPress={onClose}
                      variant="ghost"
                      fullWidth
                      disabled={loading}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={titleStyle}>Enable in Settings</Text>

                  <Text style={descriptionStyle}>
                    Notifications are currently disabled. To enable them, you'll need to update your
                    device settings.
                  </Text>

                  <View style={settingsGuideStyle}>
                    <Text style={settingsGuideTitleStyle}>How to enable:</Text>
                    <Text style={settingsGuideStepStyle}>1. Tap "Open Settings" below</Text>
                    <Text style={settingsGuideStepStyle}>
                      2. Find "Notifications" in the app settings
                    </Text>
                    <Text style={settingsGuideStepStyle}>
                      3. Toggle "Allow Notifications" to ON
                    </Text>
                    <Text style={settingsGuideStepStyle}>4. Return to the app</Text>
                  </View>

                  <View style={buttonContainerStyle}>
                    <Button
                      title="Open Settings"
                      onPress={handleOpenSettings}
                      variant="primary"
                      fullWidth
                    />
                    <Button title="Close" onPress={onClose} variant="ghost" fullWidth />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
