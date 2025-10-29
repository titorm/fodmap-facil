# Performance Optimizations

This document outlines the performance optimizations implemented throughout the application.

## Component Memoization

### React.memo

Components that render frequently or with expensive computations are wrapped with `React.memo`:

- **SymptomEntryCard**: Memoized with custom comparison function to prevent unnecessary re-renders when list items haven't changed
- **OnboardingSlide**: Prevents re-renders during swipe navigation
- **DoseCard**: Optimized for test wizard screens

### useCallback

Event handlers and callbacks are memoized to maintain referential equality:

```typescript
// DiaryScreen.tsx
const handleDelete = useCallback(async (id: string) => {
  await deleteMutation.mutateAsync(id);
}, [deleteMutation]);

const renderItem = useCallback(({ item }: { item: SymptomEntry }) => (
  <SymptomEntryCard entry={item} onDelete={() => handleDelete(item.id)} />
), [handleDelete]);
```

### useMemo

Expensive computations are memoized:

```typescript
// DiaryScreen.tsx
const groupedSymptoms = useMemo(() => {
  // Group symptoms by date
  const groups: Record<string, SymptomEntry[]> = {};
  // ... grouping logic
  return groups;
}, [filteredSymptoms]);
```

## List Virtualization

### SectionList Optimization

The DiaryScreen uses optimized SectionList configuration:

```typescript
<SectionList
  sections={groupedSymptoms}
  keyExtractor={keyExtractor}
  renderItem={renderItem}
  renderSectionHeader={renderSectionHeader}
  ItemSeparatorComponent={ItemSeparator}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

**Key optimizations:**

- `removeClippedSubviews`: Unmounts components outside viewport
- `maxToRenderPerBatch`: Limits items rendered per batch
- `windowSize`: Controls viewport multiplier
- `initialNumToRender`: Reduces initial render time
- Memoized renderers prevent unnecessary re-renders

### FlatList Optimization

Similar optimizations applied to FlatList components:

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout} // For fixed-height items
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Image Optimization

### Image Loading

- Use appropriate image sizes for different screen densities
- Implement lazy loading for images outside viewport
- Use `resizeMode="cover"` or `resizeMode="contain"` appropriately
- Cache images using React Native's built-in caching

```typescript
<Image
  source={foodImage}
  style={styles.foodImage}
  resizeMode="cover"
  // React Native automatically caches images
/>
```

### Future Improvements

- Implement progressive image loading
- Use WebP format for better compression
- Add image placeholders during loading

## State Management

### Local State Optimization

- Use local state for UI-only concerns
- Lift state only when necessary
- Avoid prop drilling with context

### Query Optimization

React Query (TanStack Query) optimizations:

```typescript
// Stale time prevents unnecessary refetches
const { data } = useSymptomEntries(testStepId, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

## Animation Performance

### Use Native Driver

Always use native driver for animations when possible:

```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Runs on native thread
}).start();
```

### Avoid Layout Animations

Layout animations can be expensive. Use transform and opacity instead:

```typescript
// Good: Uses transform (GPU-accelerated)
transform: [{ translateY: slideAnim }];

// Avoid: Uses layout properties
top: slideAnim;
```

## Bundle Size Optimization

### Code Splitting

- Lazy load screens not needed at startup
- Use dynamic imports for large dependencies
- Split by route/feature

### Tree Shaking

- Import only what you need from libraries
- Use named imports instead of default imports when possible

```typescript
// Good
import { Button } from './components/atoms';

// Avoid
import * as Components from './components/atoms';
```

## Database Optimization

### SQLite Queries

- Use indexes on frequently queried columns
- Batch operations when possible
- Use transactions for multiple writes

```typescript
// Batch inserts
await db.transaction(async (tx) => {
  for (const symptom of symptoms) {
    await tx.executeSql(insertQuery, [symptom.id, symptom.type]);
  }
});
```

### Query Optimization

- Fetch only needed columns
- Use pagination for large datasets
- Implement proper indexes

## Network Optimization

### Request Batching

- Batch multiple API calls when possible
- Use GraphQL for flexible data fetching
- Implement request deduplication

### Caching Strategy

- Cache API responses with React Query
- Implement optimistic updates
- Use stale-while-revalidate pattern

## Memory Management

### Cleanup

Always cleanup subscriptions and listeners:

```typescript
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);

  return () => {
    subscription.remove();
  };
}, []);
```

### Avoid Memory Leaks

- Clear timers and intervals
- Remove event listeners
- Cancel pending promises on unmount

## Monitoring

### Performance Metrics

Track key metrics:

- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- List scroll performance
- Animation frame rate

### Tools

- React DevTools Profiler
- Flipper for React Native
- Performance Monitor in dev mode

## Best Practices

1. **Measure First**: Profile before optimizing
2. **Optimize Bottlenecks**: Focus on slow parts
3. **Test on Real Devices**: Emulators don't reflect real performance
4. **Monitor Bundle Size**: Keep app size reasonable
5. **Use Production Builds**: Test performance in production mode

## Future Optimizations

- [ ] Implement code splitting for routes
- [ ] Add progressive image loading
- [ ] Optimize font loading
- [ ] Implement service worker for web
- [ ] Add performance monitoring service
- [ ] Optimize animation performance
- [ ] Implement virtual scrolling for very long lists
