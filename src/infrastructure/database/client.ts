import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from '../../db/schema';
import migrations from '../../../drizzle/migrations';

// Open SQLite database
const expoDb = openDatabaseSync('fodmap.db');

// Create Drizzle instance with schema
export const db = drizzle(expoDb, { schema });

// Type export for the database instance
export type Database = typeof db;

/**
 * Initialize the database and run pending migrations
 * This function should be called once when the app starts
 *
 * @returns Promise that resolves when database is initialized and migrations are complete
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

    // Run migrations using Drizzle's migration system
    const { success, error } = await useMigrations(db, migrations);

    if (success) {
      console.log('Database initialized successfully - all migrations applied');
    } else {
      console.error('Database migration failed:', error);
      throw new Error(`Database migration failed: ${error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
