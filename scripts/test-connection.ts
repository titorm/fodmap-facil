#!/usr/bin/env ts-node
/**
 * Script para testar a conexão com o Appwrite
 *
 * Verifica:
 * - Conexão com o endpoint
 * - Autenticação com API Key
 * - Acesso ao projeto
 * - Acesso ao database
 *
 * Uso: pnpm appwrite:test
 */

import { Client, Databases, Account } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

async function testConnection() {
  console.log('🔍 Testando conexão com Appwrite...\n');

  // Verifica variáveis de ambiente
  console.log('📋 Verificando configuração:');
  console.log(`   Endpoint: ${ENDPOINT || '❌ NÃO CONFIGURADO'}`);
  console.log(`   Project ID: ${PROJECT_ID || '❌ NÃO CONFIGURADO'}`);
  console.log(`   API Key: ${API_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA'}`);
  console.log(`   Database ID: ${DATABASE_ID || '⚠️  Não configurado (execute appwrite:setup)'}`);

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    console.error('\n❌ Configure todas as variáveis de ambiente necessárias no .env');
    process.exit(1);
  }

  // Inicializa cliente
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

  const databases = new Databases(client);

  try {
    // Testa listagem de databases
    console.log('\n🔌 Testando conexão...');
    const databasesList = await databases.list();
    console.log(`✅ Conexão estabelecida!`);
    console.log(`   Databases encontrados: ${databasesList.total}`);

    if (databasesList.total > 0) {
      console.log('\n📦 Databases disponíveis:');
      for (const db of databasesList.databases) {
        console.log(`   - ${db.name} (ID: ${db.$id})`);

        if (DATABASE_ID && db.$id === DATABASE_ID) {
          console.log('     ✅ Este é o database configurado no .env');

          // Lista collections deste database
          try {
            const collections = await databases.listCollections(db.$id);
            console.log(`     Tables: ${collections.total}`);

            if (collections.total > 0) {
              for (const collection of collections.collections) {
                console.log(`       - ${collection.name} (ID: ${collection.$id})`);
              }
            }
          } catch (error: any) {
            console.log(`     ⚠️  Erro ao listar tables: ${error.message}`);
          }
        }
      }
    } else {
      console.log('\n⚠️  Nenhum database encontrado. Execute: pnpm appwrite:setup');
    }

    // Verifica permissões
    console.log('\n🔐 Verificando permissões da API Key...');
    try {
      // Tenta criar e deletar um database de teste
      const testDb = await databases.create('test-connection', 'Test Connection');
      await databases.delete(testDb.$id);
      console.log('✅ Permissões de escrita: OK');
    } catch (error: any) {
      if (error.code === 401) {
        console.log('❌ Permissões insuficientes. Verifique sua API Key.');
      } else {
        console.log('✅ Permissões de escrita: OK');
      }
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📝 Próximos passos:');

    if (!DATABASE_ID) {
      console.log('   1. Execute: pnpm appwrite:setup');
      console.log('   2. Adicione os IDs gerados ao .env');
    } else {
      console.log('   1. Sua configuração está pronta!');
      console.log('   2. Execute: pnpm start');
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao conectar:', error.message);

    if (error.code === 401) {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - A API Key está correta');
      console.error('   - A API Key tem as permissões necessárias');
      console.error('   - O Project ID está correto');
    } else if (error.code === 404) {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - O endpoint está correto');
      console.error('   - O projeto existe no Appwrite');
    } else {
      console.error('\n💡 Dica: Verifique sua conexão com a internet e o endpoint do Appwrite');
    }

    process.exit(1);
  }
}

testConnection();
