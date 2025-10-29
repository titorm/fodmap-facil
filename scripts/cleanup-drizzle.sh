#!/bin/bash

# Script para remover completamente o Drizzle e SQLite local
# Execute com: bash scripts/cleanup-drizzle.sh

echo "🧹 Iniciando limpeza do Drizzle e SQLite local..."
echo ""

# Confirmar com usuário
read -p "⚠️  Isso vai remover todos os repositórios locais e database client. Continuar? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Operação cancelada"
    exit 1
fi

echo ""
echo "📦 Removendo repositórios locais..."
rm -rf src/services/repositories

echo "🗄️  Removendo cliente de database local..."
rm -rf src/infrastructure/database

echo "🔄 Removendo SyncQueue antigo..."
rm -f src/services/SyncQueue.ts

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Reinstalar dependências: pnpm install"
echo "   2. Atualizar imports nos hooks (de db/schema para shared/types/entities)"
echo "   3. Verificar tipos: pnpm type-check"
echo "   4. Testar: pnpm test"
echo ""
