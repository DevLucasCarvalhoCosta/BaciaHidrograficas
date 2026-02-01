#!/bin/bash

# Script de Backup do Banco de Dados
# Cria backup diário do PostgreSQL

set -e

# Configurações
BACKUP_DIR="/var/backups/ana-hidro"
DB_NAME="ana_hidro"
DB_USER="ana_user"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DATE}.sql"
RETENTION_DAYS=7  # Manter backups dos últimos 7 dias

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🗄️ Iniciando backup do banco de dados...${NC}"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Realizar backup
echo "  📦 Criando backup..."
pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Comprimir backup
echo "  🗜️ Comprimindo..."
gzip $BACKUP_FILE

BACKUP_FILE="${BACKUP_FILE}.gz"

# Verificar tamanho
SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo -e "${GREEN}  ✓ Backup criado: $BACKUP_FILE ($SIZE)${NC}"

# Limpar backups antigos
echo "  🧹 Removendo backups antigos (> $RETENTION_DAYS dias)..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Listar backups existentes
echo ""
echo "📋 Backups disponíveis:"
ls -lh $BACKUP_DIR/backup_*.sql.gz | tail -5

echo ""
echo -e "${GREEN}✅ Backup concluído!${NC}"
echo ""
echo "Para restaurar:"
echo "  gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME"
echo ""
