import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useSymptomLogger } from '../../../shared/hooks/useSymptomLogger';
import { useToast } from '../../../shared/components/Toast';
import { successHaptic, errorHaptic } from '../../../shared/utils/haptics';
import { successAnimation } from '../../../shared/utils/animations';
import { SymptomTypeSelector, ExtendedSymptomType } from './SymptomTypeSelector';
import { SymptomSlider } from './SymptomSlider';
import { Button } from '../../../shared/components/atoms';

export interface QuickSymptomEntryModalProps {
  visible: boolean;
  onClose: () => void;
  testStepId?: string;
}

/**
 * QuickSymptomEntryModal Component
 *
 * Fast symptom logging modal with 3-tap maximum flow.
 * Integrates with useSymptomLogger hook for offline-first data persistence.
 *
 * Flow:
 * 1. Tap: Select symptom type
 * 2. Tap: Adjust severity slider
 * 3. Tap: Save (optional notes can be added)
 *
 * Features:
 * - Large touch targets for symptom types
 * - Visual severity slider with haptic feedback
 * - Optional notes field (collapsed by default)
 * - Auto-timestamp
 * - Success animation on save
 * - Offline support
 *
 * @param visible - Whether the modal is visible
 * @param onClose - Callback when modal is closed
 * @param testStepId - Optional test step ID to associate symptoms with
 *
 * @example
 * ```tsx
 * <QuickSymptomEntryModal
 *   visible={isModalVisible}
 *   onClose={() => setIsModalVisible(false)}
 *   testStepId={currentTestStepId}
 * />
 * ```
 */
export function QuickSymptomEntryModal({
  visible,
  onClose,
  testStepId,
}: QuickSymptomEntryModalProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { logSymptom, isLogging } = useSymptomLogger(testStepId);
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ExtendedSymptomType | undefined>();
  const [severity, setSeverity] = useState<number>(1); // Default to mild
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values for success state
  const successScale = useRef(new Animated.Value(0)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  // Trigger success animation when showSuccess changes
  useEffect(() => {
    if (showSuccess) {
      successAnimation(successScale, successFade).start();
    }
  }, [showSuccess, successScale, successFade]);

  const handleClose = () => {
    // Reset state
    setSelectedType(undefined);
    setSeverity(1);
    setNotes('');
    setShowNotes(false);
    setShowSuccess(false);

    // Reset animation values
    successScale.setValue(0);
    successFade.setValue(0);

    onClose();
  };

  const handleSave = async () => {
    if (!selectedType) return;

    try {
      await logSymptom({
        testStepId,
        symptomType: selectedType,
        severity: severity as 0 | 1 | 2 | 3,
        notes: notes.trim() || undefined,
      });

      // Trigger success haptic feedback
      successHaptic();

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to log symptom:', error);

      // Trigger error haptic feedback
      errorHaptic();

      showToast({
        type: 'error',
        message: 'Failed to save symptom. Will retry when online.',
        duration: 3000,
      });
    }
  };

  const canSave = selectedType !== undefined && !isLogging && !showSuccess;

  // Styles
  const overlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  };

  const modalContainerStyle: ViewStyle = {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  };

  const closeButtonStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    color: colors.interactive,
  };

  const contentStyle: ViewStyle = {
    padding: spacing.lg,
  };

  const sectionStyle: ViewStyle = {
    marginBottom: spacing.xl,
  };

  const sectionTitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  };

  const notesToggleStyle: ViewStyle = {
    marginTop: spacing.md,
  };

  const notesInputStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 80,
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginTop: spacing.md,
  };

  const footerStyle: ViewStyle = {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };

  const successContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  };

  const successIconStyle: TextStyle = {
    fontSize: 64,
    marginBottom: spacing.md,
  };

  const successTextStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={overlayStyle}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <View style={modalContainerStyle}>
          {/* Header */}
          <View style={headerStyle}>
            <Text
              style={titleStyle}
              accessibilityRole="header"
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              Log Symptom
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Close symptom entry modal"
            >
              <Text style={closeButtonStyle}>✕</Text>
            </TouchableOpacity>
          </View>

          {showSuccess ? (
            /* Success State with Animation */
            <Animated.View
              style={[
                successContainerStyle,
                {
                  opacity: successFade,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <Text style={successIconStyle}>✓</Text>
              <Text
                style={successTextStyle}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                Symptom Logged!
              </Text>
            </Animated.View>
          ) : (
            /* Entry Form */
            <ScrollView style={contentStyle}>
              {/* Step 1: Select Symptom Type */}
              <View style={sectionStyle}>
                <Text
                  style={sectionTitleStyle}
                  accessibilityRole="header"
                  allowFontScaling={true}
                  maxFontSizeMultiplier={2}
                >
                  What are you experiencing?
                </Text>
                <SymptomTypeSelector selectedType={selectedType} onSelect={setSelectedType} />
              </View>

              {/* Step 2: Select Severity (shown after type is selected) */}
              {selectedType && (
                <View style={sectionStyle}>
                  <Text
                    style={sectionTitleStyle}
                    accessibilityRole="header"
                    allowFontScaling={true}
                    maxFontSizeMultiplier={2}
                  >
                    How severe is it?
                  </Text>
                  <SymptomSlider value={severity} onChange={setSeverity} />
                </View>
              )}

              {/* Optional: Add Notes */}
              {selectedType && (
                <View style={sectionStyle}>
                  {!showNotes ? (
                    <View style={notesToggleStyle}>
                      <Button
                        title="Add Notes (Optional)"
                        onPress={() => setShowNotes(true)}
                        variant="outline"
                        size="small"
                      />
                    </View>
                  ) : (
                    <>
                      <Text
                        style={sectionTitleStyle}
                        accessibilityRole="header"
                        allowFontScaling={true}
                        maxFontSizeMultiplier={2}
                      >
                        Notes (Optional)
                      </Text>
                      <TextInput
                        style={notesInputStyle}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add any additional details..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        accessible={true}
                        accessibilityLabel="Symptom notes"
                        accessibilityHint="Add optional notes about your symptom"
                        allowFontScaling={true}
                        maxFontSizeMultiplier={2}
                      />
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer with Save Button */}
          {!showSuccess && (
            <View style={footerStyle}>
              {isLogging ? (
                <View style={{ alignItems: 'center', padding: spacing.md }}>
                  <ActivityIndicator size="large" color={colors.primary500} />
                </View>
              ) : (
                <Button
                  title="Save Symptom"
                  onPress={handleSave}
                  disabled={!canSave}
                  fullWidth
                  accessibilityLabel="Save symptom"
                  accessibilityHint="Save the symptom entry"
                />
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
