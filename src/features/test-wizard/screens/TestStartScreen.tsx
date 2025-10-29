import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms';

export interface TestStartScreenProps {
  foodItem: string;
  fodmapGroup: string;
  testSequence: number;
  onStart: () => void;
  foodImage?: ImageSourcePropType;
}

export const TestStartScreen: React.FC<TestStartScreenProps> = ({
  foodItem,
  fodmapGroup,
  testSequence,
  onStart,
  foodImage,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const portionProgression = [
    { day: 1, size: 'Small', description: '1/4 cup or equivalent' },
    { day: 2, size: 'Medium', description: '1/2 cup or equivalent' },
    { day: 3, size: 'Large', description: '1 cup or equivalent' },
  ];

  const getFodmapGroupColor = (group: string): string => {
    const groupColors: Record<string, string> = {
      oligosaccharides: colors.primary500,
      disaccharides: colors.secondary500,
      monosaccharides: colors.warning,
      polyols: colors.info,
    };
    return groupColors[group] || colors.primary500;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { padding: spacing.lg }]}
    >
      {/* Food Item Image */}
      {foodImage && (
        <View
          style={[
            styles.imageContainer,
            {
              borderRadius: borderRadius.lg,
              marginBottom: spacing.lg,
              overflow: 'hidden',
            },
          ]}
        >
          <Image
            source={foodImage}
            style={styles.foodImage}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`${foodItem} image`}
          />
        </View>
      )}

      {/* Food Item Name */}
      <Text
        style={[
          styles.foodItemName,
          {
            fontSize: typography.fontSize.xxxl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
          },
        ]}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {foodItem}
      </Text>

      {/* FODMAP Group Badge */}
      <View
        style={[
          styles.groupBadge,
          {
            backgroundColor: getFodmapGroupColor(fodmapGroup),
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignSelf: 'center',
            marginBottom: spacing.lg,
          },
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`FODMAP group: ${fodmapGroup}`}
      >
        <Text
          style={[
            styles.groupBadgeText,
            {
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.textOnPrimary,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.5}
        >
          {fodmapGroup.toUpperCase()}
        </Text>
      </View>

      {/* Test Sequence */}
      <Text
        style={[
          styles.sequenceText,
          {
            fontSize: typography.fontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
          },
        ]}
      >
        Test #{testSequence}
      </Text>

      {/* 3-Day Test Overview */}
      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.md,
          },
        ]}
      >
        <Text
          style={[
            styles.overviewTitle,
            {
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          3-Day Test Overview
        </Text>

        <Text
          style={[
            styles.overviewDescription,
            {
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
              marginBottom: spacing.lg,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          You'll consume increasing portions of {foodItem} over 3 consecutive days while monitoring
          your symptoms.
        </Text>

        {/* Portion Progression */}
        {portionProgression.map((portion, index) => (
          <View
            key={portion.day}
            style={[
              styles.portionRow,
              {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: index < portionProgression.length - 1 ? spacing.md : 0,
              },
            ]}
          >
            <View
              style={[
                styles.dayCircle,
                {
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primary100,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  {
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary700,
                  },
                ]}
              >
                {portion.day}
              </Text>
            </View>

            <View style={styles.portionInfo}>
              <Text
                style={[
                  styles.portionSize,
                  {
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text,
                  },
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                {portion.size} Portion
              </Text>
              <Text
                style={[
                  styles.portionDescription,
                  {
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                  },
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                {portion.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Instructions and Tips */}
      <View
        style={[
          styles.instructionsCard,
          {
            backgroundColor: colors.infoLight,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <Text
          style={[
            styles.instructionsTitle,
            {
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.infoDark,
              marginBottom: spacing.md,
            },
          ]}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Important Instructions
        </Text>

        <View style={styles.instructionsList}>
          {[
            'Consume the portion at the same time each day',
            'Wait 24 hours between each dose',
            'Log any symptoms immediately when they occur',
            'Continue with normal diet otherwise',
            'Avoid other high-FODMAP foods during the test',
          ].map((instruction, index) => (
            <View
              key={index}
              style={[
                styles.instructionItem,
                {
                  flexDirection: 'row',
                  marginBottom: index < 4 ? spacing.sm : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.bullet,
                  {
                    fontSize: typography.fontSize.md,
                    color: colors.infoDark,
                    marginRight: spacing.sm,
                  },
                ]}
              >
                •
              </Text>
              <Text
                style={[
                  styles.instructionText,
                  {
                    fontSize: typography.fontSize.md,
                    color: colors.infoDark,
                    flex: 1,
                    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
                  },
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                {instruction}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Start Button */}
      <Button
        title="Start Test"
        onPress={onStart}
        variant="primary"
        size="large"
        fullWidth
        accessibilityLabel={`Start testing ${foodItem}`}
        accessibilityHint="Tap to begin the 3-day food test"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  imageContainer: {
    width: '100%',
    height: 250,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodItemName: {},
  groupBadge: {},
  groupBadgeText: {},
  sequenceText: {},
  overviewCard: {},
  overviewTitle: {},
  overviewDescription: {},
  portionRow: {},
  dayCircle: {},
  dayNumber: {},
  portionInfo: {
    flex: 1,
  },
  portionSize: {},
  portionDescription: {},
  instructionsCard: {},
  instructionsTitle: {},
  instructionsList: {},
  instructionItem: {},
  bullet: {},
  instructionText: {},
});
