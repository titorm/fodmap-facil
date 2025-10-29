# Animations Guide

This guide covers the animation system used throughout the FODMAP Reintroduction app.

## Overview

All animations use React Native's `Animated` API with the native driver enabled for optimal performance. Animations run on the native thread, ensuring smooth 60fps performance even during JavaScript thread blocking.

## Animation Utilities

Located in `src/shared/utils/animations.ts`, these utilities provide consistent, reusable animations.

### Standard Durations

```typescript
import { ANIMATION_DURATION } from '../utils/animations';

ANIMATION_DURATION.fast; // 200ms - Quick transitions
ANIMATION_DURATION.normal; // 300ms - Standard transitions
ANIMATION_DURATION.slow; // 500ms - Deliberate transitions
```

### Easing Functions

```typescript
import { EASING } from '../utils/animations';

EASING.easeInOut; // Smooth start and end
EASING.easeOut; // Quick start, smooth end
EASING.easeIn; // Smooth start, quick end
EASING.linear; // Constant speed
EASING.spring; // Elastic bounce
```

## Common Animations

### Fade In/Out

```typescript
import { fadeIn, fadeOut } from '../utils/animations';

const fadeAnim = useRef(new Animated.Value(0)).current;

// Fade in
fadeIn(fadeAnim).start();

// Fade out
fadeOut(fadeAnim).start();

// Usage in component
<Animated.View style={{ opacity: fadeAnim }}>
  {/* Content */}
</Animated.View>
```

### Slide Animations

```typescript
import { slideInFromBottom, slideOutToBottom } from '../utils/animations';

const slideAnim = useRef(new Animated.Value(100)).current;

// Slide in from bottom
slideInFromBottom(slideAnim).start();

// Slide out to bottom
slideOutToBottom(slideAnim).start();

// Usage in component
<Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
  {/* Content */}
</Animated.View>
```

### Scale Animation

```typescript
import { scale } from '../utils/animations';

const scaleAnim = useRef(new Animated.Value(0)).current;

// Scale up
scale(scaleAnim, 1).start();

// Scale down
scale(scaleAnim, 0).start();

// Usage in component
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  {/* Content */}
</Animated.View>
```

### Success Animation

Combines scale and fade for success feedback:

```typescript
import { successAnimation } from '../utils/animations';

const scaleAnim = useRef(new Animated.Value(0)).current;
const fadeAnim = useRef(new Animated.Value(0)).current;

successAnimation(scaleAnim, fadeAnim).start();

// Usage in component
<Animated.View
  style={{
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  }}
>
  <Text>✓ Success!</Text>
</Animated.View>
```

### Shake Animation

For error feedback:

```typescript
import { shake } from '../utils/animations';

const shakeAnim = useRef(new Animated.Value(0)).current;

shake(shakeAnim).start();

// Usage in component
<Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
  {/* Content */}
</Animated.View>
```

### Pulse Animation

For attention-grabbing elements:

```typescript
import { pulse } from '../utils/animations';

const pulseAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  const animation = pulse(pulseAnim);
  animation.start();

  return () => animation.stop();
}, []);

// Usage in component
<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
  {/* Content */}
</Animated.View>
```

### Rotation Animation

For loading spinners:

```typescript
import { rotateAnimation, interpolateRotation } from '../utils/animations';

const rotateAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const animation = rotateAnimation(rotateAnim);
  animation.start();

  return () => animation.stop();
}, []);

const spin = interpolateRotation(rotateAnim);

// Usage in component
<Animated.View style={{ transform: [{ rotate: spin }] }}>
  {/* Spinner */}
</Animated.View>
```

## Animated Components

### AnimatedLoadingSpinner

Pre-built animated loading spinner:

```typescript
import { AnimatedLoadingSpinner } from '../components/atoms';

<AnimatedLoadingSpinner
  size={40}
  color={colors.primary500}
  message="Loading..."
/>
```

### Toast Notifications

Toasts use smooth slide and fade animations:

```typescript
import { useToast } from '../components/Toast';

const { showToast } = useToast();

showToast({
  type: 'success',
  message: 'Symptom logged successfully!',
  duration: 3000,
});
```

## Screen Transitions

### Modal Presentation

Modals use slide-from-bottom animation:

```typescript
// In navigation configuration
<Stack.Screen
  name="TestWizardFlow"
  component={TestWizardFlow}
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
```

### Tab Transitions

Tab navigation uses fade transitions for smooth switching.

## Best Practices

### 1. Always Use Native Driver

```typescript
// ✅ Good
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Runs on native thread
}).start();

// ❌ Bad
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // Runs on JS thread
}).start();
```

### 2. Cleanup Animations

```typescript
useEffect(() => {
  const animation = pulse(pulseAnim);
  animation.start();

  // Always cleanup
  return () => {
    animation.stop();
  };
}, []);
```

### 3. Use Transform and Opacity

These properties are GPU-accelerated:

```typescript
// ✅ Good - GPU accelerated
transform: [{ translateY: slideAnim }];
opacity: fadeAnim;

// ❌ Bad - Layout recalculation
top: slideAnim;
height: heightAnim;
```

### 4. Combine Animations

Use `Animated.parallel()` for simultaneous animations:

```typescript
Animated.parallel([fadeIn(fadeAnim), slideInFromBottom(slideAnim)]).start();
```

Use `Animated.sequence()` for sequential animations:

```typescript
Animated.sequence([scale(scaleAnim, 1.2), scale(scaleAnim, 1)]).start();
```

### 5. Stagger List Items

For smooth list entry animations:

```typescript
import { staggerAnimation } from '../utils/animations';

const animValues = items.map(() => new Animated.Value(0));

staggerAnimation(animValues, 50).start();
```

## Animation Timing

### User Interactions

- Button press feedback: 100-200ms
- Modal open/close: 300ms
- Screen transitions: 300-400ms

### Feedback

- Success/Error: 300-500ms
- Loading states: Continuous
- Attention-grabbing: 500-1000ms loop

### Micro-interactions

- Hover effects: 150ms
- Focus states: 200ms
- Toggle switches: 200ms

## Performance Tips

1. **Limit Concurrent Animations**: Too many simultaneous animations can cause frame drops
2. **Use `removeClippedSubviews`**: For animated lists
3. **Avoid Layout Animations**: Stick to transform and opacity
4. **Test on Real Devices**: Emulators don't reflect real performance
5. **Profile with React DevTools**: Identify animation bottlenecks

## Accessibility

### Reduced Motion

Respect user's motion preferences:

```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Conditionally apply animations
if (!reduceMotion) {
  fadeIn(fadeAnim).start();
} else {
  fadeAnim.setValue(1); // Instant
}
```

### Screen Reader Announcements

Announce state changes:

```typescript
<Animated.View
  accessible={true}
  accessibilityLiveRegion="polite"
  accessibilityLabel="Loading complete"
>
  {/* Content */}
</Animated.View>
```

## Examples

### Success Feedback

```typescript
const SuccessFeedback = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    successAnimation(scaleAnim, fadeAnim).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Text style={{ fontSize: 48 }}>✓</Text>
      <Text>Success!</Text>
    </Animated.View>
  );
};
```

### Loading Indicator

```typescript
const LoadingIndicator = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = rotateAnimation(rotateAnim);
    animation.start();
    return () => animation.stop();
  }, []);

  const spin = interpolateRotation(rotateAnim);

  return (
    <Animated.View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: colors.primary500,
        transform: [{ rotate: spin }],
      }}
    />
  );
};
```

### Slide-in Card

```typescript
const SlideInCard = ({ children }) => {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      slideInFromBottom(slideAnim),
      fadeIn(fadeAnim),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};
```

## Resources

- [React Native Animated API](https://reactnative.dev/docs/animated)
- [Animation Performance](https://reactnative.dev/docs/performance#animations)
- [Easing Functions](https://easings.net/)
- [Material Design Motion](https://material.io/design/motion)
