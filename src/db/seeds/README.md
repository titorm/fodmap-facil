# Database Seeding

This directory contains seed data for development and testing.

## Usage

### Option 1: Call from App Code (Development)

Add this to your `App.tsx` or main entry point during development:

```typescript
import { seedDatabase } from './src/db/seeds';
import { initDatabase } from './src/infrastructure/database/client';

// In your app initialization
useEffect(() => {
  async function setupDatabase() {
    await initDatabase();

    // Only seed in development
    if (__DEV__) {
      await seedDatabase();
    }
  }

  setupDatabase();
}, []);
```

### Option 2: Create a Development Menu Button

Add a button in your development/debug screen:

```typescript
import { seedDatabase } from './src/db/seeds';

function DevelopmentScreen() {
  const handleSeed = async () => {
    try {
      await seedDatabase();
      Alert.alert('Success', 'Database seeded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to seed database');
      console.error(error);
    }
  };

  return (
    <View>
      <Button title="Seed Database" onPress={handleSeed} />
    </View>
  );
}
```

### Option 3: Conditional Seeding (Only if Empty)

Use helper functions to check before seeding:

```typescript
import { seedDatabase } from './src/db/seeds';
import { isDatabaseEmpty, hasSeedData } from './src/db/seeds/helpers';

async function setupDatabase() {
  await initDatabase();

  // Only seed if database is empty
  if (await isDatabaseEmpty()) {
    await seedDatabase();
  }

  // Or check if seed data specifically exists
  if (!(await hasSeedData())) {
    await seedDatabase();
  }
}
```

### Option 4: Use React Native Debugger Console

In the React Native debugger console:

```javascript
import('./src/db/seeds').then(({ seedDatabase }) => seedDatabase());
```

## What Gets Seeded

The seed function populates the database with:

- **15 Food Items**: Covering all FODMAP groups (oligosaccharides, disaccharides, monosaccharides, polyols)
- **2 User Profiles**: Test users (Maria Silva and João Santos)
- **1 Protocol Run**: Active protocol with 4 test steps in various states
- **8 Symptom Entries**: Sample symptom data for completed and in-progress test steps

## Seed Data Details

### Food Items (15 items)

- **Oligosaccharides - Fructans**: Wheat bread, Garlic, Onion
- **Oligosaccharides - GOS**: Chickpeas, Lentils
- **Disaccharides - Lactose**: Milk, Yogurt, Ice cream
- **Monosaccharides - Fructose**: Honey, Mango, Apple
- **Polyols - Sorbitol**: Avocado, Blackberries
- **Polyols - Mannitol**: Mushrooms, Cauliflower

### User Profiles (2 users)

- Maria Silva (maria.silva@example.com) - Portuguese, Light theme
- João Santos (joao.santos@example.com) - Portuguese, Dark theme

### Protocol Run (1 active protocol)

- User: Maria Silva
- Status: Active
- Started: 7 days ago
- Test Steps:
  1. Wheat bread (Completed) - with symptom data
  2. Garlic (In Progress) - with symptom data
  3. Chickpeas (Pending)
  4. Milk (Pending)

### Symptom Entries (8 entries)

- 4 symptoms for wheat bread test (bloating, gas, pain)
- 4 symptoms for garlic test (bloating, gas, pain)
- Severity ranges from 2-6 on a 1-10 scale

## Helper Functions

The `helpers.ts` file provides utility functions for working with seed data:

### `isDatabaseEmpty()`

Checks if the database has no food items or users:

```typescript
import { isDatabaseEmpty } from './src/db/seeds/helpers';

if (await isDatabaseEmpty()) {
  console.log('Database is empty');
}
```

### `hasSeedData()`

Checks if seed data exists (looks for IDs starting with 'food-', 'user-', etc.):

```typescript
import { hasSeedData } from './src/db/seeds/helpers';

if (await hasSeedData()) {
  console.log('Seed data already exists');
}
```

### `getDatabaseStats()`

Returns counts of all entities in the database:

```typescript
import { getDatabaseStats } from './src/db/seeds/helpers';

const stats = await getDatabaseStats();
console.log('Database stats:', stats);
// Output: { foodItems: 15, userProfiles: 2, protocolRuns: 1, testSteps: 4, symptomEntries: 8 }
```

## Notes

- The seed function is idempotent - it will fail if data with the same IDs already exists
- To re-seed, you need to clear the database first
- Seed data uses fixed IDs (e.g., 'user-1', 'food-1') for consistency
- All timestamps are relative to the current date/time when seeding occurs
- Use helper functions to check database state before seeding
