import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { lightColors, spacing, borderRadius, shadows } from '../theme/tokens';

interface PDFGenerationModalProps {
  visible: boolean;
  progress?: number; // 0-100, optional for indeterminate progress
}

export const PDFGenerationModal: React.FC<PDFGenerationModalProps> = ({ visible, progress }) => {
  const progressText =
    progress !== undefined ? `${Math.round(progress)}% concluído` : 'em andamento';
  const accessibilityLabel = `Gerando relatório PDF, ${progressText}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View
          style={styles.container}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: progress !== undefined ? Math.round(progress) : undefined,
          }}
        >
          <ActivityIndicator
            size="large"
            color={lightColors.primary500}
            accessible={true}
            accessibilityLabel="Indicador de progresso"
          />

          <Text style={styles.title} accessibilityRole="header">
            Gerando Relatório PDF
          </Text>

          {progress !== undefined && (
            <>
              <View
                style={styles.progressBarContainer}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={`Progresso: ${Math.round(progress)}%`}
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
              >
                <View style={[styles.progressBar, { width: `${progress}%` }]} accessible={false} />
              </View>
              <Text
                style={styles.progressText}
                accessible={true}
                accessibilityLiveRegion="polite"
                accessibilityLabel={`${Math.round(progress)} por cento concluído`}
              >
                {Math.round(progress)}%
              </Text>
            </>
          )}

          <Text style={styles.message}>
            Por favor, aguarde enquanto preparamos seu relatório...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 400,
    ...shadows.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: lightColors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: lightColors.primary500,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: lightColors.primary500,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
