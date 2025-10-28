/**
 * Example Usage: Database Seeding
 *
 * This file shows different ways to seed the database in your app.
 * Copy the relevant code to your App.tsx or development screen.
 */

import React, { useEffect, useState } from 'react';
import { View, Button, Text, Alert, StyleSheet } from 'react-native';
import { seedDatabase } from './index';
import { initDatabase } from '../../infrastructure/database/client';

/**
 * Example 1: Automatic seeding on app start (development only)
 */
export function AppWithAutoSeed() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDatabase() {
      try {
        // Initialize database first
        await initDatabase();

        // Only seed in development mode
        if (__DEV__) {
          console.log('Development mode detected - seeding database...');
          setIsSeeding(true);
          await seedDatabase();
          setIsSeeding(false);
          console.log('Database seeded successfully');
        }
      } catch (error) {
        console.error('Failed to setup database:', error);
        setSeedError(error instanceof Error ? error.message : 'Unknown error');
        setIsSeeding(false);
      }
    }

    setupDatabase();
  }, []);

  if (isSeeding) {
    return (
      <View style={styles.container}>
        <Text>Seeding database...</Text>
      </View>
    );
  }

  if (seedError) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Seed Error: {seedError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>App Ready!</Text>
    </View>
  );
}

/**
 * Example 2: Manual seeding with a button (recommended for development)
 */
export function DevelopmentScreen() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true);
      await seedDatabase();
      Alert.alert(
        'Success',
        'Database seeded successfully!\n\n' +
          '✓ 15 food items\n' +
          '✓ 2 user profiles\n' +
          '✓ 1 protocol run with 4 test steps\n' +
          '✓ 8 symptom entries'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Seed error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Development Tools</Text>
      <Button
        title={isSeeding ? 'Seeding...' : 'Seed Database'}
        onPress={handleSeedDatabase}
        disabled={isSeeding}
      />
      <Text style={styles.hint}>This will populate the database with sample data for testing</Text>
    </View>
  );
}

/**
 * Example 3: Conditional seeding (only if database is empty)
 */
export function AppWithConditionalSeed() {
  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();

        // Check if database is empty (you'd need to implement this check)
        // const isEmpty = await checkIfDatabaseIsEmpty();
        // if (isEmpty && __DEV__) {
        //   await seedDatabase();
        // }
      } catch (error) {
        console.error('Failed to setup database:', error);
      }
    }

    setupDatabase();
  }, []);

  return <View style={styles.container}>{/* Your app content */}</View>;
}

/**
 * Example 4: Seed with confirmation dialog
 */
export function DevelopmentScreenWithConfirmation() {
  const handleSeedWithConfirmation = () => {
    Alert.alert('Seed Database', 'This will add sample data to your database. Continue?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Seed',
        onPress: async () => {
          try {
            await seedDatabase();
            Alert.alert('Success', 'Database seeded successfully!');
          } catch (error) {
            Alert.alert('Error', 'Failed to seed database');
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Button title="Seed Database" onPress={handleSeedWithConfirmation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    fontSize: 14,
  },
});
