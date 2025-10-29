import React from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { useTheme } from '../../../shared/theme';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  // Announce progress changes to screen readers
  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Slide ${current + 1} of ${total}`);
  }, [current, total]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progress indicator`}
      accessibilityValue={{
        min: 0,
        max: total - 1,
        now: current,
        text: `Slide ${current + 1} of ${total}`,
      }}
    >
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? colors.primary500 : colors.border,
                marginHorizontal: spacing.xs,
                width: isActive ? 24 : 8,
              },
            ]}
            accessible={false}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
