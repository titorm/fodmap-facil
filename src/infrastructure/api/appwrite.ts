import { Client, Account, TablesDB, ID, Query } from 'react-native-appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

// Initialize Appwrite client
const client = new Client();

client.setEndpoint(endpoint).setProject(projectId);

// Export services
export const account = new Account(client);
export const tablesDB = new TablesDB(client);

// Export database and table IDs
export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
export const TABLES = {
  USER_PROFILES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_USER_PROFILES_ID || '',
  PROTOCOL_RUNS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID || '',
  TEST_STEPS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID || '',
  SYMPTOM_ENTRIES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID || '',
  WASHOUT_PERIODS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_WASHOUT_PERIODS_ID || '',
  FOOD_ITEMS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_FOOD_ITEMS_ID || '',
  GROUP_RESULTS: process.env.EXPO_PUBLIC_APPWRITE_TABLE_GROUP_RESULTS_ID || '',
  NOTIFICATION_SCHEDULES: process.env.EXPO_PUBLIC_APPWRITE_TABLE_NOTIFICATION_SCHEDULES_ID || '',
} as const;

// Helper to generate unique IDs and queries
export { ID, Query };

export default client;
