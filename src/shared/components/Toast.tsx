import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme';
import { fadeIn, fadeOut, slideInFromBottom, slideOutToBottom } from '../utils/animations';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider Component
 *
 * Provides toast notification functionality throughout the app.
 * Displays temporary messages at the bottom of the screen.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { showToast } = useToast();
 * showToast({
 *   type: 'success',
 *   message: 'Symptom logged successfully!',
 *   duration: 3000,
 * });
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));

  const showToast = useCallback(
    (options: ToastOptions) => {
      setToast(options);

      // Animate in with smooth transitions
      Animated.parallel([fadeIn(fadeAnim), slideInFromBottom(slideAnim)]).start();

      // Auto-hide after duration
      const duration = options.duration || 3000;
      setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, slideAnim]
  );

  const hideToast = useCallback(() => {
    // Animate out with smooth transitions
    Animated.parallel([fadeOut(fadeAnim, 200), slideOutToBottom(slideAnim, 200)]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim]);

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          background: colors.success,
          text: colors.textOnPrimary,
          icon: '✓',
        };
      case 'error':
        return {
          background: colors.error,
          text: colors.textOnPrimary,
          icon: '✕',
        };
      case 'warning':
        return {
          background: colors.warning,
          text: colors.textOnPrimary,
          icon: '⚠',
        };
      case 'info':
        return {
          background: colors.info,
          text: colors.textOnPrimary,
          icon: 'ℹ',
        };
    }
  };

  const toastColors = toast ? getToastColors(toast.type) : null;

  const containerStyle: ViewStyle = {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  };

  const toastStyle: ViewStyle = {
    backgroundColor: toastColors?.background || colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
    minHeight: 56,
  };

  const iconStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    marginRight: spacing.md,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
  };

  const messageStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: toastColors?.text || colors.text,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  };

  const actionButtonStyle: ViewStyle = {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  };

  const actionTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: toastColors?.text || colors.text,
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            containerStyle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={toastStyle}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion={toast.type === 'error' ? 'assertive' : 'polite'}
            accessibilityLabel={`${toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : toast.type === 'warning' ? 'Aviso' : 'Informação'}: ${toast.message}`}
          >
            <Text style={iconStyle} accessible={false}>
              {toastColors?.icon}
            </Text>
            <View style={contentStyle}>
              <Text
                style={messageStyle}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
                accessible={true}
                accessibilityRole="text"
              >
                {toast.message}
              </Text>
            </View>
            {toast.action && (
              <TouchableOpacity
                style={actionButtonStyle}
                onPress={() => {
                  toast.action?.onPress();
                  hideToast();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={toast.action.label}
                accessibilityHint="Toque para executar a ação"
              >
                <Text style={actionTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
                  {toast.action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
