import React, { useState } from 'react';
import { View, Text, Modal, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms/Button';
import { notificationService } from '../../../services/notifications/NotificationService';
import { useTranslation } from 'react-i18next';

interface NotificationOnboardingPromptProps {
  visible: boolean;
  onComplete: () => void;
}

/**
 * NotificationOnboardingPrompt
 *
 * Shows during onboarding to explain notification benefits and request permission
 * Requirements: 7.1
 */
export function NotificationOnboardingPrompt({
  visible,
  onComplete,
}: NotificationOnboardingPromptProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const status = await notificationService.requestPermission();

      if (status === 'granted') {
        // Permission granted, complete onboarding
        onComplete();
      } else {
        // Permission denied, but still complete onboarding
        onComplete();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // Still complete onboarding even if there's an error
      onComplete();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Styles
  const overlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  };

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  };

  const iconContainerStyle: ViewStyle = {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  };

  const descriptionStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  };

  const benefitContainerStyle: ViewStyle = {
    marginBottom: spacing.xl,
  };

  const benefitItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  };

  const benefitIconContainerStyle: ViewStyle = {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  };

  const benefitTextStyle: TextStyle = {
    flex: 1,
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    color: colors.text,
  };

  const buttonContainerStyle: ViewStyle = {
    gap: spacing.md,
  };

  const skipTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={overlayStyle}>
        <View style={containerStyle}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View style={iconContainerStyle}>
              <Ionicons name="notifications" size={40} color={colors.primary500} />
            </View>

            {/* Title */}
            <Text style={titleStyle}>
              {t('onboarding.notifications.title', 'Fique no Caminho Certo')}
            </Text>

            {/* Description */}
            <Text style={descriptionStyle}>
              {t(
                'onboarding.notifications.description',
                'Receba lembretes personalizados para ajudá-lo a manter seu protocolo FODMAP no caminho certo.'
              )}
            </Text>

            {/* Benefits */}
            <View style={benefitContainerStyle}>
              <View style={benefitItemStyle}>
                <View style={benefitIconContainerStyle}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </View>
                <Text style={benefitTextStyle}>
                  {t(
                    'onboarding.notifications.benefit1',
                    'Lembretes diários para registrar seus sintomas'
                  )}
                </Text>
              </View>

              <View style={benefitItemStyle}>
                <View style={benefitIconContainerStyle}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </View>
                <Text style={benefitTextStyle}>
                  {t(
                    'onboarding.notifications.benefit2',
                    'Alertas de dose no momento certo para seus testes'
                  )}
                </Text>
              </View>

              <View style={benefitItemStyle}>
                <View style={benefitIconContainerStyle}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </View>
                <Text style={benefitTextStyle}>
                  {t(
                    'onboarding.notifications.benefit3',
                    'Notificações de período de washout para manter você informado'
                  )}
                </Text>
              </View>

              <View style={benefitItemStyle}>
                <View style={benefitIconContainerStyle}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </View>
                <Text style={benefitTextStyle}>
                  {t(
                    'onboarding.notifications.benefit4',
                    'Frequência adaptativa que se ajusta ao seu engajamento'
                  )}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={buttonContainerStyle}>
              <Button
                title={t('onboarding.notifications.enable', 'Ativar Notificações')}
                onPress={handleEnableNotifications}
                variant="primary"
                size="large"
                fullWidth
                loading={isRequesting}
                accessibilityLabel="Enable notifications"
                accessibilityHint="Request permission to receive helpful reminders"
              />

              <Button
                title={t('onboarding.notifications.skip', 'Pular por Agora')}
                onPress={handleSkip}
                variant="ghost"
                size="large"
                fullWidth
                disabled={isRequesting}
                accessibilityLabel="Skip notification setup"
                accessibilityHint="You can enable notifications later in settings"
              />
            </View>

            <Text style={skipTextStyle}>
              {t(
                'onboarding.notifications.skipNote',
                'Você pode ativar notificações a qualquer momento nas configurações'
              )}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
