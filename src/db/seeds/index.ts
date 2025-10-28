import { db } from '../../infrastructure/database/client';
import {
  foodItems,
  userProfiles,
  protocolRuns,
  testSteps,
  symptomEntries,
  type FodmapGroup,
  type FodmapType,
  type ProtocolRunStatus,
  type TestStepStatus,
  type SymptomType,
} from '../schema';

/**
 * Main seed function that populates the database with development data
 */
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed in order of dependencies
    await seedFoodItems();
    await seedUsers();
    await seedProtocolRun();
    await seedSymptomEntries();

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Seed food items covering all FODMAP groups
 */
async function seedFoodItems(): Promise<void> {
  console.log('  📦 Seeding food items...');

  const now = new Date();

  const items: Array<{
    id: string;
    name: string;
    fodmapGroup: FodmapGroup;
    fodmapType: FodmapType;
    servingSize: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [
    // Oligosaccharides - Fructans
    {
      id: 'food-1',
      name: 'Wheat bread (1 slice)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'fructans',
      servingSize: '1 slice (35g)',
      description: 'Common wheat bread for fructan testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-2',
      name: 'Garlic (1 clove)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'fructans',
      servingSize: '1 clove (3g)',
      description: 'Fresh garlic for fructan testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-3',
      name: 'Onion (1/4 medium)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'fructans',
      servingSize: '1/4 medium onion (30g)',
      description: 'Yellow onion for fructan testing',
      createdAt: now,
      updatedAt: now,
    },
    // Oligosaccharides - GOS
    {
      id: 'food-4',
      name: 'Chickpeas (1/4 cup)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'GOS',
      servingSize: '1/4 cup (40g)',
      description: 'Canned chickpeas for GOS testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-5',
      name: 'Lentils (1/4 cup)',
      fodmapGroup: 'oligosaccharides',
      fodmapType: 'GOS',
      servingSize: '1/4 cup (50g)',
      description: 'Cooked lentils for GOS testing',
      createdAt: now,
      updatedAt: now,
    },
    // Disaccharides - Lactose
    {
      id: 'food-6',
      name: 'Milk (1/2 cup)',
      fodmapGroup: 'disaccharides',
      fodmapType: 'lactose',
      servingSize: '1/2 cup (125ml)',
      description: "Cow's milk for lactose testing",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-7',
      name: 'Yogurt (1/2 cup)',
      fodmapGroup: 'disaccharides',
      fodmapType: 'lactose',
      servingSize: '1/2 cup (125g)',
      description: 'Plain yogurt for lactose testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-8',
      name: 'Ice cream (1/2 cup)',
      fodmapGroup: 'disaccharides',
      fodmapType: 'lactose',
      servingSize: '1/2 cup (65g)',
      description: 'Regular ice cream for lactose testing',
      createdAt: now,
      updatedAt: now,
    },
    // Monosaccharides - Fructose
    {
      id: 'food-9',
      name: 'Honey (1 tbsp)',
      fodmapGroup: 'monosaccharides',
      fodmapType: 'fructose',
      servingSize: '1 tablespoon (20g)',
      description: 'Pure honey for fructose testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-10',
      name: 'Mango (1/2 cup)',
      fodmapGroup: 'monosaccharides',
      fodmapType: 'fructose',
      servingSize: '1/2 cup (80g)',
      description: 'Fresh mango for fructose testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-11',
      name: 'Apple (1 medium)',
      fodmapGroup: 'monosaccharides',
      fodmapType: 'fructose',
      servingSize: '1 medium apple (150g)',
      description: 'Fresh apple for fructose testing',
      createdAt: now,
      updatedAt: now,
    },
    // Polyols - Sorbitol
    {
      id: 'food-12',
      name: 'Avocado (1/4 fruit)',
      fodmapGroup: 'polyols',
      fodmapType: 'sorbitol',
      servingSize: '1/4 avocado (40g)',
      description: 'Fresh avocado for sorbitol testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-13',
      name: 'Blackberries (1/4 cup)',
      fodmapGroup: 'polyols',
      fodmapType: 'sorbitol',
      servingSize: '1/4 cup (35g)',
      description: 'Fresh blackberries for sorbitol testing',
      createdAt: now,
      updatedAt: now,
    },
    // Polyols - Mannitol
    {
      id: 'food-14',
      name: 'Mushrooms (1/2 cup)',
      fodmapGroup: 'polyols',
      fodmapType: 'mannitol',
      servingSize: '1/2 cup (35g)',
      description: 'Button mushrooms for mannitol testing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'food-15',
      name: 'Cauliflower (1/2 cup)',
      fodmapGroup: 'polyols',
      fodmapType: 'mannitol',
      servingSize: '1/2 cup (50g)',
      description: 'Fresh cauliflower for mannitol testing',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.insert(foodItems).values(items);
  console.log(`    ✓ Seeded ${items.length} food items`);
}

/**
 * Seed test user profiles
 */
async function seedUsers(): Promise<void> {
  console.log('  👤 Seeding user profiles...');

  const now = new Date();

  const users = [
    {
      id: 'user-1',
      email: 'maria.silva@example.com',
      name: 'Maria Silva',
      languagePreference: 'pt',
      themePreference: 'light',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-2',
      email: 'joao.santos@example.com',
      name: 'João Santos',
      languagePreference: 'pt',
      themePreference: 'dark',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.insert(userProfiles).values(users);
  console.log(`    ✓ Seeded ${users.length} user profiles`);
}

/**
 * Seed sample protocol run with test steps
 */
async function seedProtocolRun(): Promise<void> {
  console.log('  🔬 Seeding protocol run and test steps...');

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7); // Started 7 days ago

  // Create protocol run
  const protocolRun = {
    id: 'protocol-1',
    userId: 'user-1',
    status: 'active' as ProtocolRunStatus,
    startDate,
    endDate: null,
    notes: 'First FODMAP reintroduction protocol - testing oligosaccharides group',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(protocolRuns).values(protocolRun);
  console.log('    ✓ Seeded 1 protocol run');

  // Create test steps for the protocol run
  const testStepsData = [
    {
      id: 'step-1',
      protocolRunId: 'protocol-1',
      foodItemId: 'food-1', // Wheat bread
      sequenceNumber: 1,
      status: 'completed' as TestStepStatus,
      scheduledDate: new Date(startDate.getTime() + 0 * 24 * 60 * 60 * 1000), // Day 0
      completedDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Day 3
      notes: 'Completed wheat bread test - mild symptoms observed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'step-2',
      protocolRunId: 'protocol-1',
      foodItemId: 'food-2', // Garlic
      sequenceNumber: 2,
      status: 'in_progress' as TestStepStatus,
      scheduledDate: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000), // Day 4
      completedDate: null,
      notes: 'Currently testing garlic',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'step-3',
      protocolRunId: 'protocol-1',
      foodItemId: 'food-4', // Chickpeas
      sequenceNumber: 3,
      status: 'pending' as TestStepStatus,
      scheduledDate: new Date(startDate.getTime() + 8 * 24 * 60 * 60 * 1000), // Day 8
      completedDate: null,
      notes: 'Scheduled for next week',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'step-4',
      protocolRunId: 'protocol-1',
      foodItemId: 'food-6', // Milk
      sequenceNumber: 4,
      status: 'pending' as TestStepStatus,
      scheduledDate: new Date(startDate.getTime() + 12 * 24 * 60 * 60 * 1000), // Day 12
      completedDate: null,
      notes: 'Lactose test scheduled',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.insert(testSteps).values(testStepsData);
  console.log(`    ✓ Seeded ${testStepsData.length} test steps`);
}

/**
 * Seed sample symptom entries
 */
async function seedSymptomEntries(): Promise<void> {
  console.log('  📊 Seeding symptom entries...');

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);

  const symptoms: Array<{
    id: string;
    testStepId: string;
    symptomType: SymptomType;
    severity: number;
    timestamp: Date;
    notes: string;
    createdAt: Date;
  }> = [
    // Symptoms for step-1 (wheat bread - completed)
    {
      id: 'symptom-1',
      testStepId: 'step-1',
      symptomType: 'bloating',
      severity: 3,
      timestamp: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Day 1, 2 hours after
      notes: 'Mild bloating after eating wheat bread',
      createdAt: now,
    },
    {
      id: 'symptom-2',
      testStepId: 'step-1',
      symptomType: 'gas',
      severity: 4,
      timestamp: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Day 1, 4 hours after
      notes: 'Increased gas production',
      createdAt: now,
    },
    {
      id: 'symptom-3',
      testStepId: 'step-1',
      symptomType: 'bloating',
      severity: 2,
      timestamp: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Day 2, 2 hours after
      notes: 'Symptoms improving on day 2',
      createdAt: now,
    },
    {
      id: 'symptom-4',
      testStepId: 'step-1',
      symptomType: 'pain',
      severity: 2,
      timestamp: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day 2, 3 hours after
      notes: 'Mild abdominal discomfort',
      createdAt: now,
    },
    // Symptoms for step-2 (garlic - in progress)
    {
      id: 'symptom-5',
      testStepId: 'step-2',
      symptomType: 'bloating',
      severity: 5,
      timestamp: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // Day 5, 1 hour after
      notes: 'Moderate bloating after garlic consumption',
      createdAt: now,
    },
    {
      id: 'symptom-6',
      testStepId: 'step-2',
      symptomType: 'gas',
      severity: 6,
      timestamp: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day 5, 3 hours after
      notes: 'Significant gas and discomfort',
      createdAt: now,
    },
    {
      id: 'symptom-7',
      testStepId: 'step-2',
      symptomType: 'pain',
      severity: 4,
      timestamp: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // Day 5, 5 hours after
      notes: 'Abdominal cramping',
      createdAt: now,
    },
    {
      id: 'symptom-8',
      testStepId: 'step-2',
      symptomType: 'bloating',
      severity: 4,
      timestamp: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Day 6, 2 hours after
      notes: 'Still experiencing bloating on day 2',
      createdAt: now,
    },
  ];

  await db.insert(symptomEntries).values(symptoms);
  console.log(`    ✓ Seeded ${symptoms.length} symptom entries`);
}
