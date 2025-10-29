import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

interface PDFGenerationModalProps {
  visible: boolean;
  progress?: number; // 0-100, optional for indeterminate progress
}

export const PDFGenerationModal: React.FC<PDFGenerationModalProps> = ({ visible, progress }) => {
  const { theme } = useTheme();
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
      <View style={styles(theme).overlay}>
        <View
          style={styles(theme).container}
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
            color={theme.colors.primary500}
            accessible={true}
            accessibilityLabel="Indicador de progresso"
          />

          <Text style={styles(theme).title} accessibilityRole="header">
            Gerando Relatório PDF
          </Text>

          {progress !== undefined && (
            <>
              <View
                style={styles(theme).progressBarContainer}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={`Progresso: ${Math.round(progress)}%`}
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
              >
                <View
                  style={[styles(theme).progressBar, { width: `${progress}%` }]}
                  accessible={false}
                />
              </View>
              <Text
                style={styles(theme).progressText}
                accessible={true}
                accessibilityLiveRegion="polite"
                accessibilityLabel={`${Math.round(progress)} por cento concluído`}
              >
                {Math.round(progress)}%
              </Text>
            </>
          )}

          <Text style={styles(theme).message}>
            Por favor, aguarde enquanto preparamos seu relatório...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      minWidth: 280,
      maxWidth: 400,
      ...theme.shadows.lg,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary500,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary500,
      marginBottom: theme.spacing.md,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
