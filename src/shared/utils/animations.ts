import { Animated, Easing } from 'react-native';

/**
 * Animation Utilities
 *
 * Provides reusable animation configurations and helpers.
 * All animations use native driver when possible for better performance.
 */

/**
 * Standard animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

/**
 * Standard easing functions
 */
export const EASING = {
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1),
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0.0, 1, 1),
  linear: Easing.linear,
  spring: Easing.elastic(1),
} as const;

/**
 * Fade in animation
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal,
  toValue: number = 1
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal,
  toValue: number = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Slide in from bottom animation
 */
export const slideInFromBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal,
  fromValue: number = 100
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue: 0,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Slide out to bottom animation
 */
export const slideOutToBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal,
  toValue: number = 100
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Scale animation (for success/error feedback)
 */
export const scale = (
  animatedValue: Animated.Value,
  toValue: number = 1,
  duration: number = ANIMATION_DURATION.normal
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 100,
    friction: 7,
    useNativeDriver: true,
  });
};

/**
 * Pulse animation (for attention-grabbing elements)
 */
export const pulse = (
  animatedValue: Animated.Value,
  minScale: number = 1,
  maxScale: number = 1.1,
  duration: number = ANIMATION_DURATION.slow
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration / 2,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Shake animation (for errors)
 */
export const shake = (
  animatedValue: Animated.Value,
  intensity: number = 10
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Success animation (scale + fade)
 */
export const successAnimation = (
  scaleValue: Animated.Value,
  fadeValue: Animated.Value
): Animated.CompositeAnimation => {
  scaleValue.setValue(0);
  fadeValue.setValue(0);

  return Animated.parallel([
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }),
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.easeOut,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Stagger animation for list items
 */
export const staggerAnimation = (
  animatedValues: Animated.Value[],
  staggerDelay: number = 50
): Animated.CompositeAnimation => {
  return Animated.stagger(
    staggerDelay,
    animatedValues.map((value) =>
      Animated.spring(value, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    )
  );
};

/**
 * Loading spinner rotation
 */
export const rotateAnimation = (
  animatedValue: Animated.Value,
  duration: number = 1000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Interpolate rotation value
 */
export const interpolateRotation = (
  animatedValue: Animated.Value
): Animated.AnimatedInterpolation => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

/**
 * Create a spring animation with default config
 */
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config?: Partial<Animated.SpringAnimationConfig>
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
    ...config,
  });
};

/**
 * Create a timing animation with default config
 */
export const createTimingAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config?: Partial<Animated.TimingAnimationConfig>
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration: ANIMATION_DURATION.normal,
    easing: EASING.easeInOut,
    useNativeDriver: true,
    ...config,
  });
};
