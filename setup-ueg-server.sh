#!/bin/bash

# Script de Setup Inicial no Servidor UEG
# Execute este script APENAS na primeira vez

set -e

echo "════════════════════════════════════════════"
echo "🚀 Setup Inicial - Projeto ANA"
echo "════════════════════════════════════════════"
echo ""

# ==========================================
# 1. VERIFICAR REQUISITOS
# ==========================================
echo "🔍 Verificando requisitos..."

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js instalado: $NODE_VERSION"
else
    echo "❌ Node.js não encontrado!"
    exit 1
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 instalado"
else
    echo "❌ PM2 não encontrado!"
    exit 1
fi

# Verificar PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL instalado"
else
    echo "❌ PostgreSQL não encontrado!"
    exit 1
fi

# Verificar Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx instalado"
else
    echo "❌ Nginx não encontrado!"
    exit 1
fi

echo ""

# ==========================================
# 2. CRIAR ESTRUTURA DE DIRETÓRIOS
# ==========================================
echo "📁 Criando estrutura de diretórios..."

# Backend
mkdir -p /home/usuario/ana-backend
mkdir -p /home/usuario/logs

# Frontend
sudo mkdir -p /var/www/ana-frontend
sudo chown -R usuario:usuario /var/www/ana-frontend

echo "✅ Diretórios criados!"
echo ""

# ==========================================
# 3. CRIAR BANCO DE DADOS
# ==========================================
echo "🗄️ Configurando banco de dados..."

# Pedir senha do PostgreSQL
read -sp "Digite a senha do usuário postgres: " DB_PASSWORD
echo ""

# Criar banco
sudo -u postgres psql << EOF
-- Criar banco se não existir
SELECT 'CREATE DATABASE ana_hidro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ana_hidro')\gexec

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE ana_hidro TO postgres;
EOF

echo "✅ Banco de dados 'ana_hidro' criado/verificado!"
echo ""

# ==========================================
# 4. CRIAR ARQUIVO .ENV
# ==========================================
echo "⚙️ Criando arquivo .env..."

cat > /home/usuario/ana-backend/.env << EOF
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost:5432/ana_hidro"
ANA_BASE_URL=https://dadosabertos.ana.gov.br
ANA_REQUEST_TIMEOUT=60000
EOF

chmod 600 /home/usuario/ana-backend/.env

echo "✅ Arquivo .env criado!"
echo ""

# ==========================================
# 5. CONFIGURAR NGINX
# ==========================================
echo "🔧 Configurando Nginx..."

# Backup da configuração atual
sudo cp /etc/nginx/sites-available/patrimonioueg \
     /etc/nginx/sites-available/patrimonioueg.backup.$(date +%Y%m%d-%H%M%S)

echo "💾 Backup da configuração do Nginx criado!"
echo ""
echo "⚠️  ATENÇÃO: Configuração do Nginx"
echo "    Você precisa adicionar manualmente a configuração do projeto ANA"
echo "    ao arquivo: /etc/nginx/sites-available/patrimonioueg"
echo ""
echo "    Veja o arquivo 'nginx-ana-config.conf' para referência"
echo ""
read -p "Pressione ENTER após adicionar a configuração no Nginx..."

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx OK!"
    echo "♻️  Recarregando Nginx..."
    sudo systemctl reload nginx
else
    echo "❌ Erro na configuração do Nginx!"
    echo "    Revise o arquivo /etc/nginx/sites-available/patrimonioueg"
    exit 1
fi

echo ""

# ==========================================
# 6. CONFIGURAR FIREWALL (se necessário)
# ==========================================
echo "🔥 Verificando firewall..."

if sudo ufw status | grep -q "Status: active"; then
    echo "✅ UFW está ativo"
    echo "ℹ️  Porta 3001 será acessada apenas localmente via Nginx"
else
    echo "ℹ️  UFW não está ativo"
fi

echo ""

# ==========================================
# 7. VERIFICAÇÃO FINAL
# ==========================================
echo "🔍 Verificação final..."
echo ""
echo "📊 Status dos serviços:"
echo "  - PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "  - Nginx: $(sudo systemctl is-active nginx)"
echo "  - PM2 (processos): $(pm2 list | grep -c online || echo '0') online"
echo ""
echo "📁 Estrutura criada:"
ls -la /home/usuario/ana-backend/ 2>/dev/null | head -5
echo ""
ls -la /var/www/ana-frontend/ 2>/dev/null | head -5
echo ""

# ==========================================
# 8. PRÓXIMOS PASSOS
# ==========================================
echo "════════════════════════════════════════════"
echo "✅ Setup inicial concluído!"
echo "════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configurar secrets no GitHub:"
echo "   - UEG_SSH_HOST: 200.137.241.42"
echo "   - UEG_SSH_PORT: 8740"
echo "   - UEG_SSH_USER: usuario"
echo "   - UEG_SSH_KEY: (chave SSH privada)"
echo "   - DATABASE_URL: postgresql://postgres:***@localhost:5432/ana_hidro"
echo "   - ANA_BASE_URL: https://dadosabertos.ana.gov.br"
echo ""
echo "2. Fazer push para branch main/production para iniciar deploy"
echo ""
echo "3. Acompanhar logs:"
echo "   pm2 logs ana-backend"
echo ""
echo "4. Testar URLs:"
echo "   https://patrimonioueg.duckdns.org/ana"
echo "   https://patrimonioueg.duckdns.org/api/ana/health"
echo ""
echo "════════════════════════════════════════════"
