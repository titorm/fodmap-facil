#!/usr/bin/env node

/**
 * Database Seed Script
 *
 * This script seeds the database with development data.
 * Run with: npm run db:seed
 */

import { seedDatabase } from '../src/db/seeds';
import { initDatabase } from '../src/infrastructure/database/client';

async function main() {
  try {
    console.log('🚀 Starting database seed process...\n');

    // Initialize database and run migrations first
    await initDatabase();
    console.log('');

    // Run seed functions
    await seedDatabase();
    console.log('');

    console.log('🎉 Seed process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Seed process failed:', error);
    process.exit(1);
  }
}

main();
