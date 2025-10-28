import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import * as schema from './schema';

const expoDb = openDatabaseSync('fodmap.db');

export const db = drizzle(expoDb, { schema });

/**
 * Inicializa o banco de dados local
 */
export async function initDatabase() {
  // As tabelas são criadas automaticamente pelo Drizzle
  // Aqui você pode adicionar migrações se necessário
  console.log('Database initialized');
}
