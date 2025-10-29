import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { rotateAnimation, interpolateRotation } from '../../utils/animations';

export interface AnimatedLoadingSpinnerProps {
  size?: number;
  color?: string;
  message?: string;
}

/**
 * AnimatedLoadingSpinner Component
 *
 * Displays a smooth rotating loading spinner with optional message.
 * Uses native driver for optimal performance.
 *
 * @param size - Size of the spinner in pixels
 * @param color - Color of the spinner
 * @param message - Optional loading message
 *
 * @example
 * ```tsx
 * <AnimatedLoadingSpinner size={40} message="Loading..." />
 * ```
 */
export function AnimatedLoadingSpinner({ size = 40, color, message }: AnimatedLoadingSpinnerProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = rotateAnimation(spinValue);
    animation.start();

    return () => {
      animation.stop();
    };
  }, [spinValue]);

  const spin = interpolateRotation(spinValue);

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
  };

  const spinnerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: color || colors.primary500,
    borderRightColor: color || colors.primary500,
  };

  const messageStyle: TextStyle = {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[spinnerStyle, { transform: [{ rotate: spin }] }]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={message || 'Loading'}
      />
      {message && (
        <Animated.Text style={messageStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
          {message}
        </Animated.Text>
      )}
    </View>
  );
}
