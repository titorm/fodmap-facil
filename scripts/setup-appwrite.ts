#!/usr/bin/env ts-node
/**
 * Script de configuração do Appwrite
 *
 * Este script cria automaticamente:
 * - Database
 * - Tables com colunas
 * - Índices
 * - Permissões
 *
 * Uso:
 * 1. Configure as variáveis de ambiente no .env
 * 2. Execute: pnpm setup:appwrite
 */

import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || ''; // API Key com permissões de admin

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Erro: Configure as variáveis de ambiente necessárias:');
  console.error('   - EXPO_PUBLIC_APPWRITE_ENDPOINT');
  console.error('   - EXPO_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('   - APPWRITE_API_KEY (API Key com permissões de admin)');
  process.exit(1);
}

// Inicializa cliente Appwrite
const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);

interface TableColumn {
  key: string;
  type: string;
  size?: number;
  required: boolean;
  array?: boolean;
  default?: any;
}

interface TableIndex {
  key: string;
  type: string;
  attributes: string[];
  orders?: string[];
}

interface TableDefinition {
  name: string;
  id: string;
  columns: TableColumn[];
  indexes: TableIndex[];
}

// Definições das tables
const TABLES: TableDefinition[] = [
  {
    name: 'Tests',
    id: 'tests',
    columns: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'fodmapGroup', type: 'string', size: 100, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: false },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'], orders: ['ASC'] },
      { key: 'idx_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
      { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
    ],
  },
  {
    name: 'Symptoms',
    id: 'symptoms',
    columns: [
      { key: 'testId', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 100, required: true },
      { key: 'severity', type: 'integer', required: true },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'idx_testId', type: 'key', attributes: ['testId'], orders: ['ASC'] },
      { key: 'idx_timestamp', type: 'key', attributes: ['timestamp'], orders: ['DESC'] },
    ],
  },
  {
    name: 'Protocol Runs',
    id: 'protocol_runs',
    columns: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: false },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'syncStatus', type: 'string', size: 50, required: false },
      { key: 'lastSyncAttempt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'], orders: ['ASC'] },
      { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
      { key: 'idx_syncStatus', type: 'key', attributes: ['syncStatus'], orders: ['ASC'] },
    ],
  },
  {
    name: 'Test Steps',
    id: 'test_steps',
    columns: [
      { key: 'protocolRunId', type: 'string', size: 255, required: true },
      { key: 'foodItemId', type: 'string', size: 255, required: true },
      { key: 'sequenceNumber', type: 'integer', required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'scheduledDate', type: 'datetime', required: true },
      { key: 'completedDate', type: 'datetime', required: false },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'syncStatus', type: 'string', size: 50, required: false },
      { key: 'lastSyncAttempt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'idx_protocolRunId', type: 'key', attributes: ['protocolRunId'], orders: ['ASC'] },
      { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
    ],
  },
  {
    name: 'Symptom Entries',
    id: 'symptom_entries',
    columns: [
      { key: 'testStepId', type: 'string', size: 255, required: true },
      { key: 'symptomType', type: 'string', size: 100, required: true },
      { key: 'severity', type: 'integer', required: true },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'syncStatus', type: 'string', size: 50, required: false },
      { key: 'lastSyncAttempt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'idx_testStepId', type: 'key', attributes: ['testStepId'], orders: ['ASC'] },
      { key: 'idx_timestamp', type: 'key', attributes: ['timestamp'], orders: ['DESC'] },
      { key: 'idx_syncStatus', type: 'key', attributes: ['syncStatus'], orders: ['ASC'] },
    ],
  },
];

async function createDatabase() {
  console.log('📦 Criando database...');

  try {
    const database = await databases.create(ID.unique(), 'FODMAP Facil Database');
    console.log(`✅ Database criado: ${database.$id}`);
    console.log(`   Adicione ao .env: EXPO_PUBLIC_APPWRITE_DATABASE_ID=${database.$id}`);
    return database.$id;
  } catch (error: any) {
    if (error.code === 409) {
      console.log('⚠️  Database já existe, usando o existente');
      const databasesList = await databases.list();
      if (databasesList.databases.length > 0) {
        return databasesList.databases[0].$id;
      }
    }
    throw error;
  }
}

async function createCollection(databaseId: string, table: TableDefinition) {
  console.log(`\n📋 Criando table: ${table.name}...`);

  try {
    // Cria a collection
    const collection = await databases.createCollection(
      databaseId,
      table.id,
      table.name,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      true // documentSecurity habilitado
    );

    console.log(`✅ Table criada: ${collection.$id}`);

    // Cria as colunas
    for (const column of table.columns) {
      try {
        switch (column.type) {
          case 'string':
            await databases.createStringAttribute(
              databaseId,
              collection.$id,
              column.key,
              column.size || 255,
              column.required,
              column.default,
              column.array || false
            );
            break;

          case 'integer':
            await databases.createIntegerAttribute(
              databaseId,
              collection.$id,
              column.key,
              column.required,
              undefined,
              undefined,
              column.default,
              column.array || false
            );
            break;

          case 'datetime':
            await databases.createDatetimeAttribute(
              databaseId,
              collection.$id,
              column.key,
              column.required,
              column.default,
              column.array || false
            );
            break;
        }

        console.log(`   ✓ Coluna criada: ${column.key} (${column.type})`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`   ⚠️  Coluna já existe: ${column.key}`);
        } else {
          throw error;
        }
      }
    }

    // Aguarda as colunas serem criadas
    console.log('   ⏳ Aguardando colunas serem processadas...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Cria os índices
    for (const index of table.indexes) {
      try {
        await databases.createIndex(
          databaseId,
          collection.$id,
          index.key,
          index.type as any,
          index.attributes,
          index.orders
        );
        console.log(`   ✓ Índice criado: ${index.key}`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`   ⚠️  Índice já existe: ${index.key}`);
        } else {
          console.log(`   ⚠️  Erro ao criar índice ${index.key}: ${error.message}`);
        }
      }
    }

    return collection.$id;
  } catch (error: any) {
    if (error.code === 409) {
      console.log(`⚠️  Table já existe: ${table.name}`);
      return table.id;
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando configuração do Appwrite...\n');

  try {
    // Cria o database
    const databaseId = await createDatabase();

    // Cria as tables
    const tableIds: Record<string, string> = {};

    for (const table of TABLES) {
      const collectionId = await createCollection(databaseId, table);
      tableIds[table.id] = collectionId;
    }

    // Exibe resumo
    console.log('\n✅ Configuração concluída!\n');
    console.log('📝 Adicione estas variáveis ao seu arquivo .env:\n');
    console.log(`EXPO_PUBLIC_APPWRITE_DATABASE_ID=${databaseId}`);
    console.log(`EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID=${tableIds.tests}`);
    console.log(`EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID=${tableIds.symptoms}`);
    console.log(`EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID=${tableIds.protocol_runs}`);
    console.log(`EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID=${tableIds.test_steps}`);
    console.log(`EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID=${tableIds.symptom_entries}`);
    console.log('\n🎉 Pronto! Seu Appwrite está configurado.');
  } catch (error: any) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response);
    }
    process.exit(1);
  }
}

main();
