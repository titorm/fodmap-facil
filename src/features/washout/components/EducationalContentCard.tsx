import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ViewStyle,
  TextStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Card } from '../../../shared/components/atoms';
import { useTheme } from '../../../shared/theme';
import { ANIMATION_DURATION, EASING } from '../../../shared/utils/animations';
import type {
  EducationalContent,
  ContentCategory,
  DifficultyLevel,
} from '../../../content/education/types';

export interface EducationalContentCardProps {
  content: EducationalContent;
  onExpand: (contentId: string) => void;
  onView: (contentId: string) => void;
  onComplete: (contentId: string, timeSpent: number) => void;
}

interface CategoryInfo {
  label: string;
  icon: string;
  color: string;
}

interface DifficultyInfo {
  label: string;
  color: string;
}

/**
 * EducationalContentCard Component
 *
 * Displays educational content with collapsible/expandable functionality.
 * Tracks user interactions for telemetry (view, expand, complete).
 *
 * Features:
 * - Collapsible/expandable content with smooth animation
 * - Category badges and difficulty level indicators
 * - Estimated read time display
 * - Scroll tracking to detect content completion
 * - Telemetry event triggers (onView after 3s, onExpand on tap, onComplete on scroll to end)
 * - Full accessibility support
 *
 * @param content - The educational content to display
 * @param onExpand - Callback when content is expanded
 * @param onView - Callback when content is viewed for 3+ seconds
 * @param onComplete - Callback when user scrolls to end of content
 */
export const EducationalContentCard: React.FC<EducationalContentCardProps> = ({
  content,
  onExpand,
  onView,
  onComplete,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const [isExpanded, setIsExpanded] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const expandAnimation = useRef(new Animated.Value(0)).current;
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeRef = useRef<number>(0);

  // Category information mapping
  const categoryInfo: Record<ContentCategory, CategoryInfo> = {
    'social-tips': { label: 'Social Tips', icon: '👥', color: colors.primary500 },
    recipes: { label: 'Recipes', icon: '🍽️', color: colors.success },
    'fodmap-guidance': { label: 'FODMAP Guidance', icon: '📚', color: colors.info },
    'anxiety-support': { label: 'Anxiety Support', icon: '💚', color: colors.secondary500 },
  };

  // Difficulty level information
  const difficultyInfo: Record<DifficultyLevel, DifficultyInfo> = {
    beginner: { label: 'Beginner', color: colors.success },
    intermediate: { label: 'Intermediate', color: colors.warning },
    advanced: { label: 'Advanced', color: colors.error },
  };

  const category = categoryInfo[content.category];
  const difficulty = difficultyInfo[content.difficultyLevel];

  // Track view after 3 seconds
  useEffect(() => {
    if (!hasViewed) {
      viewTimerRef.current = setTimeout(() => {
        setHasViewed(true);
        onView(content.id);
      }, 3000);
    }

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [content.id, hasViewed, onView]);

  // Animate expand/collapse
  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.easeInOut,
      useNativeDriver: false, // Cannot use native driver for height animation
    }).start();
  }, [isExpanded, expandAnimation]);

  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    if (newExpandedState) {
      expandTimeRef.current = Date.now();
      onExpand(content.id);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hasCompleted || !isExpanded) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const contentHeight = contentSize.height;

    // Consider complete when scrolled to within 20px of bottom
    const isAtBottom = scrollPosition >= contentHeight - 20;

    if (isAtBottom) {
      setHasCompleted(true);
      const timeSpent = Math.floor((Date.now() - expandTimeRef.current) / 1000);
      onComplete(content.id, timeSpent);
    }
  };

  // Styles
  const containerStyle: ViewStyle = {
    marginBottom: spacing.md,
  };

  const headerStyle: ViewStyle = {
    marginBottom: spacing.sm,
  };

  const titleRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  };

  const titleStyle: TextStyle = {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginRight: spacing.sm,
  };

  const expandIconStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  };

  const badgesRowStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  };

  const badgeStyle = (backgroundColor: string): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor,
  });

  const badgeIconStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    marginRight: spacing.xs / 2,
  };

  const badgeTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textOnPrimary,
  };

  const metaRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  };

  const metaTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  };

  const summaryStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginTop: spacing.sm,
  };

  const contentContainerStyle: ViewStyle = {
    overflow: 'hidden',
  };

  const contentScrollStyle: ViewStyle = {
    maxHeight: 400,
    paddingTop: spacing.sm,
  };

  const contentTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  };

  const maxHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const opacity = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={containerStyle}>
      <Card
        onPress={handleToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${content.title}. ${category.label}. ${difficulty.label} difficulty. ${content.estimatedReadTimeMinutes} minute read. ${isExpanded ? 'Expanded' : 'Collapsed'}. Tap to ${isExpanded ? 'collapse' : 'expand'}.`}
        accessibilityHint={isExpanded ? 'Collapse to hide content' : 'Expand to read full content'}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={headerStyle}>
          {/* Title and Expand Icon */}
          <View style={titleRowStyle}>
            <Text
              style={titleStyle}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {content.title}
            </Text>
            <Text style={expandIconStyle} allowFontScaling={false}>
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>

          {/* Category and Difficulty Badges */}
          <View style={badgesRowStyle}>
            <View style={badgeStyle(category.color)}>
              <Text style={badgeIconStyle}>{category.icon}</Text>
              <Text style={badgeTextStyle} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
                {category.label}
              </Text>
            </View>

            <View style={badgeStyle(difficulty.color)}>
              <Text style={badgeTextStyle} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
                {difficulty.label}
              </Text>
            </View>
          </View>

          {/* Meta Information */}
          <View style={metaRowStyle}>
            <Text style={metaTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
              ⏱️ {content.estimatedReadTimeMinutes} min read
            </Text>
            {content.author && (
              <Text style={metaTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
                ✍️ {content.author}
              </Text>
            )}
          </View>

          {/* Summary (when collapsed) */}
          {!isExpanded && (
            <Text style={summaryStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
              {content.summary}
            </Text>
          )}
        </View>

        {/* Expandable Content */}
        <Animated.View
          style={[
            contentContainerStyle,
            {
              maxHeight,
              opacity,
            },
          ]}
        >
          <ScrollView
            style={contentScrollStyle}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            accessible={true}
            accessibilityLabel="Content scroll view"
            accessibilityHint="Scroll to read full content"
          >
            <Text
              style={contentTextStyle}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
              accessible={true}
              accessibilityRole="text"
            >
              {content.content}
            </Text>
          </ScrollView>
        </Animated.View>
      </Card>
    </View>
  );
};
