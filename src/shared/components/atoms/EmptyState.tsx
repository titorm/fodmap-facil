import React from 'react';
import { View, Text, Image, ImageSourcePropType, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';

export interface EmptyStateProps {
  illustration: ImageSourcePropType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  };

  const illustrationStyle: ViewStyle = {
    width: 200,
    height: 200,
    marginBottom: spacing.xl,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  };

  const descriptionStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
  };

  const emptyStateAccessibilityLabel =
    accessibilityLabel ||
    `${title}. ${description}${actionLabel ? `. ${actionLabel} button available.` : ''}`;

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={emptyStateAccessibilityLabel}
      testID={testID}
    >
      <Image
        source={illustration}
        style={illustrationStyle}
        resizeMode="contain"
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={`${title} illustration`}
      />

      <Text
        style={titleStyle}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {title}
      </Text>

      <Text
        style={descriptionStyle}
        accessibilityRole="text"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {description}
      </Text>

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="large"
          accessibilityHint="Tap to get started"
        />
      )}
    </View>
  );
};
