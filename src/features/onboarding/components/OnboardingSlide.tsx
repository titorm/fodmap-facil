import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../../shared/theme';

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: ImageSourcePropType;
  slideNumber: number;
  totalSlides: number;
}

export function OnboardingSlide({
  title,
  description,
  illustration,
  slideNumber,
  totalSlides,
}: OnboardingSlideProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { width } = useWindowDimensions();

  return (
    <View
      style={[styles.container, { width }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description}. Slide ${slideNumber} of ${totalSlides}`}
    >
      <View style={[styles.illustrationContainer, { marginBottom: spacing.xl }]}>
        <Image
          source={illustration}
          style={styles.illustration}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel={`Illustration for ${title}`}
        />
      </View>

      <View style={[styles.contentContainer, { paddingHorizontal: spacing.lg }]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.fontSize.xxxl,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing.md,
              lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
            },
          ]}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSize.lg,
              lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: '100%',
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '80%',
    height: '100%',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
