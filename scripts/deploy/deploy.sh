#!/bin/bash

# Script de Deploy Automático - Servidor UEG
# Execute: bash deploy.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do ANA Hidro..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="/var/www/ana-hidro"

# Verificar se está no diretório correto
if [ ! -d "$BASE_DIR" ]; then
    echo -e "${RED}❌ Diretório $BASE_DIR não encontrado!${NC}"
    exit 1
fi

cd $BASE_DIR

# 1. Atualizar código (se usando Git)
echo -e "${YELLOW}📥 Atualizando código do repositório...${NC}"
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}⚠️  Não é um repositório Git, pulando atualização...${NC}"
fi

# 2. Backend
echo -e "${YELLOW}🔧 Atualizando Backend...${NC}"
cd $BASE_DIR/server

echo "  📦 Instalando dependências..."
npm install --production

echo "  🗄️  Gerando Prisma Client..."
npx prisma generate

echo "  🗄️  Aplicando migrations..."
npx prisma migrate deploy

echo "  🔨 Compilando TypeScript..."
npm run build

echo "  🔄 Reiniciando PM2..."
pm2 restart ana-hidro-backend || pm2 start ecosystem.config.js

# 3. Frontend
echo -e "${YELLOW}🎨 Atualizando Frontend...${NC}"
cd $BASE_DIR/web

echo "  📦 Instalando dependências..."
npm install

echo "  🔨 Gerando build de produção..."
npm run build

echo "  🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# 4. Verificações
echo -e "${YELLOW}✅ Verificando serviços...${NC}"

# Verificar Backend
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Backend está respondendo${NC}"
else
    echo -e "${RED}✗ Backend não está respondendo!${NC}"
fi

# Verificar Nginx
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx está rodando${NC}"
else
    echo -e "${RED}✗ Nginx não está rodando!${NC}"
fi

# Verificar PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL está rodando${NC}"
else
    echo -e "${RED}✗ PostgreSQL não está rodando!${NC}"
fi

# Status PM2
echo ""
echo -e "${YELLOW}📊 Status PM2:${NC}"
pm2 status

echo ""
echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo ""
echo "📝 Para ver logs:"
echo "  Backend: pm2 logs ana-hidro-backend"
echo "  Nginx:   sudo tail -f /var/log/nginx/ana-hidro-access.log"
echo ""
