import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { OnboardingStackParamList } from '../types/navigation';
import { Button } from '../../../shared/components/atoms/Button';
import { useTheme } from '../../../shared/theme';
import { useOnboarding } from '../hooks/useOnboarding';

type DisclaimerScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Disclaimer'>;

export function DisclaimerScreen({ navigation }: DisclaimerScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;
  const { acceptDisclaimer } = useOnboarding();
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAcceptanceToggle = () => {
    setAccepted(!accepted);
  };

  const handleContinue = async () => {
    if (!accepted) return;

    try {
      setIsSaving(true);
      await acceptDisclaimer();
      navigation.navigate('ReadinessAssessment');
    } catch (error) {
      console.error('Error accepting disclaimer:', error);
      // In a production app, show an error toast/alert
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text
          style={[
            styles.title,
            {
              fontSize: typography.fontSize.xxl,
              fontFamily: typography.fontFamily.bold,
              color: colors.text,
            },
          ]}
          accessibilityRole="header"
        >
          {t('disclaimer.title')}
        </Text>
      </View>

      {/* Scrollable disclaimer content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
        ]}
        showsVerticalScrollIndicator={true}
      >
        <Text
          style={[
            styles.disclaimerText,
            {
              fontSize: typography.fontSize.md,
              lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
              color: colors.textSecondary,
            },
          ]}
        >
          {t('disclaimer.content')}
        </Text>
      </ScrollView>

      {/* Footer with checkbox and button */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Acceptance checkbox */}
        <TouchableOpacity
          style={[styles.checkboxContainer, { marginBottom: spacing.md }]}
          onPress={handleAcceptanceToggle}
          accessible={true}
          accessibilityRole={'checkbox' as AccessibilityRole}
          accessibilityLabel={t('disclaimer.acceptLabel')}
          accessibilityHint={t('disclaimer.acceptHint')}
          accessibilityState={{ checked: accepted }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            style={[
              styles.checkbox,
              {
                width: accessibility.minTouchTarget,
                height: accessibility.minTouchTarget,
                borderRadius: borderRadius.sm,
                borderWidth: 2,
                borderColor: accepted ? colors.primary500 : colors.border,
                backgroundColor: accepted ? colors.primary500 : 'transparent',
              },
            ]}
          >
            {accepted && (
              <Text
                style={[
                  styles.checkmark,
                  {
                    color: colors.textOnPrimary,
                    fontSize: typography.fontSize.lg,
                  },
                ]}
              >
                ✓
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.checkboxLabel,
              {
                fontSize: typography.fontSize.md,
                color: colors.text,
                marginLeft: spacing.md,
              },
            ]}
          >
            {t('disclaimer.acceptLabel')}
          </Text>
        </TouchableOpacity>

        {/* Continue button */}
        <Button
          title={t('disclaimer.continue')}
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          disabled={!accepted}
          loading={isSaving}
          accessibilityLabel={t('disclaimer.continue')}
          accessibilityHint={
            accepted ? t('disclaimer.continueHint') : t('disclaimer.continueDisabledHint')
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  title: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  disclaimerText: {
    fontWeight: '400',
  },
  footer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontWeight: '500',
  },
});
