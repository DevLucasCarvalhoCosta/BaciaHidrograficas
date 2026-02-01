#!/bin/bash
set -e

# ============================================
# SCRIPT DE MIGRAÇÃO PARA DOCKER
# Executa migração completa com downtime mínimo
# ============================================

echo "🐳 ========================================"
echo "   MIGRAÇÃO PARA ARQUITETURA DOCKER"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar se está no servidor
if [ ! -f /etc/letsencrypt/live/patrimonioueg.duckdns.org/fullchain.pem ]; then
    error "Este script deve ser executado NO SERVIDOR UEG!"
    exit 1
fi

# ============================================
# FASE 1: BACKUP
# ============================================
info "FASE 1: Criando backups..."

BACKUP_DIR=~/backup-docker-migration-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR/{databases,configs,apps}

info "Backup dos bancos de dados..."
sudo -u postgres pg_dump patrimonio > $BACKUP_DIR/databases/patrimonio.sql 2>/dev/null || warn "Banco patrimonio não encontrado"
sudo -u postgres pg_dump estresse > $BACKUP_DIR/databases/estresse.sql 2>/dev/null || warn "Banco estresse não encontrado"
sudo -u postgres pg_dump ana_hidro > $BACKUP_DIR/databases/ana_hidro.sql 2>/dev/null || warn "Banco ana_hidro não encontrado"

info "Backup das aplicações..."
pm2 save || warn "PM2 não está rodando"
cp ~/.pm2/dump.pm2 $BACKUP_DIR/configs/ 2>/dev/null || true

info "Backup do Nginx..."
sudo cp /etc/nginx/sites-available/n8n-https $BACKUP_DIR/configs/

info "✅ Backups criados em: $BACKUP_DIR"

# ============================================
# FASE 2: INSTALAR DOCKER (SE NECESSÁRIO)
# ============================================
if ! command -v docker &> /dev/null; then
    info "FASE 2: Instalando Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    sudo apt install docker-compose-plugin -y
    info "✅ Docker instalado! IMPORTANTE: Execute 'newgrp docker' depois deste script"
else
    info "FASE 2: Docker já instalado ✅"
fi

# ============================================
# FASE 3: PREPARAR ESTRUTURA
# ============================================
info "FASE 3: Preparando estrutura de arquivos..."

PROJECT_DIR=~/docker-ueg-projects
mkdir -p $PROJECT_DIR/{patrimonio/{backend,frontend/dist},estresse,server,web/dist,uploads}

info "Copiando arquivos..."
# Frontend ANA
if [ -d /var/www/ana-frontend/dist ]; then
    cp -r /var/www/ana-frontend/dist/* $PROJECT_DIR/web/dist/
fi

# Backend ANA
if [ -d ~/ana-backend ]; then
    cp -r ~/ana-backend/* $PROJECT_DIR/server/
fi

# Uploads PatrimônioUEG
if [ -d /var/lib/patrimonio-uploads ]; then
    cp -r /var/lib/patrimonio-uploads/* $PROJECT_DIR/uploads/
fi

info "✅ Estrutura preparada"

# ============================================
# FASE 4: AGUARDAR ARQUIVOS DO GITHUB
# ============================================
warn "FASE 4: AÇÃO NECESSÁRIA!"
echo ""
echo "Agora você precisa:"
echo "1. Fazer COMMIT e PUSH dos arquivos Docker criados"
echo "2. No servidor, executar: cd $PROJECT_DIR && git clone SEU_REPO ."
echo ""
echo "Arquivos necessários:"
echo "  - docker-compose.production.yml"
echo "  - docker/nginx/* (todos os arquivos)"
echo "  - server/Dockerfile.production"
echo "  - .env.production (renomeie para .env e configure senhas)"
echo ""
read -p "Pressione ENTER quando os arquivos estiverem no servidor..."

# Verificar se arquivos existem
if [ ! -f "$PROJECT_DIR/docker-compose.production.yml" ]; then
    error "docker-compose.production.yml não encontrado!"
    error "Execute: cd $PROJECT_DIR && git clone SEU_REPOSITORIO ."
    exit 1
fi

# ============================================
# FASE 5: CONFIGURAR .env
# ============================================
info "FASE 5: Configurando variáveis de ambiente..."

if [ ! -f "$PROJECT_DIR/.env" ]; then
    warn "Arquivo .env não encontrado!"
    echo ""
    echo "Crie o arquivo .env com:"
    cat << 'EOF'
# Senhas dos bancos (gere senhas fortes com: openssl rand -base64 24)
PATRIMONIO_DB_PASSWORD=<GERE_SENHA_FORTE>
ESTRESSE_DB_PASSWORD=<GERE_SENHA_FORTE>
ANA_DB_PASSWORD=<GERE_SENHA_FORTE>
N8N_ENCRYPTION_KEY=<EXECUTE: openssl rand -base64 32>

# IMPORTANTE: Nunca commite este arquivo!
EOF
    read -p "Pressione ENTER após criar o .env..."
fi

# ============================================
# FASE 6: MIGRAR BANCOS DE DADOS
# ============================================
info "FASE 6: Migrando bancos de dados..."

cd $PROJECT_DIR

# Subir apenas os containers de banco
info "Iniciando containers de banco de dados..."
docker compose -f docker-compose.production.yml up -d patrimonio-db estresse-db ana-db

info "Aguardando bancos ficarem prontos (30s)..."
sleep 30

# Restaurar dados
info "Restaurando banco patrimonio..."
docker compose exec -T patrimonio-db psql -U patrimonio_user -d patrimonio < $BACKUP_DIR/databases/patrimonio.sql 2>/dev/null || warn "Falha ao restaurar patrimonio"

info "Restaurando banco estresse..."
docker compose exec -T estresse-db psql -U estresse_user -d estresse < $BACKUP_DIR/databases/estresse.sql 2>/dev/null || warn "Falha ao restaurar estresse"

info "Restaurando banco ana_hidro..."
docker compose exec -T ana-db psql -U ana_user -d ana_hidro < $BACKUP_DIR/databases/ana_hidro.sql 2>/dev/null || warn "Falha ao restaurar ana_hidro"

info "✅ Bancos de dados migrados"

# ============================================
# FASE 7: BUILD DAS IMAGENS
# ============================================
info "FASE 7: Construindo imagens Docker..."

docker compose -f docker-compose.production.yml build

info "✅ Imagens construídas"

# ============================================
# FASE 8: TESTE SEM DOWNTIME
# ============================================
info "FASE 8: Testando containers..."

# Subir todos os serviços exceto nginx
docker compose -f docker-compose.production.yml up -d \
    patrimonio-backend patrimonio-frontend \
    estresse-app \
    ana-backend ana-frontend

info "Aguardando serviços iniciarem (20s)..."
sleep 20

# Verificar saúde
docker compose ps

info "Testando backends..."
docker compose exec ana-backend wget -q -O- http://localhost:3001/health || warn "ANA backend não respondeu"

warn "Verifique os logs antes de continuar:"
echo "docker compose logs -f --tail=50"
read -p "Os serviços estão OK? Pressione ENTER para continuar ou CTRL+C para cancelar..."

# ============================================
# FASE 9: CUTOVER (DOWNTIME ~2min)
# ============================================
warn "FASE 9: CUTOVER - Haverá downtime!"
read -p "Continuar com a migração final? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Migração cancelada. Para reverter:"
    echo "  docker compose down"
    echo "  pm2 resurrect"
    echo "  sudo systemctl start nginx"
    exit 1
fi

info "Parando serviços antigos..."

# Parar PM2
pm2 stop all 2>/dev/null || true
pm2 save

# Parar Nginx antigo
sudo systemctl stop nginx

info "Iniciando Nginx containerizado..."
docker compose -f docker-compose.production.yml up -d nginx

info "Aguardando Nginx (10s)..."
sleep 10

# ============================================
# FASE 10: VERIFICAÇÃO
# ============================================
info "FASE 10: Verificando migração..."

docker compose ps

echo ""
info "Testando URLs..."
curl -k -s https://localhost/health && info "✅ Nginx OK" || error "❌ Nginx falhou"
curl -k -s https://localhost/api/ana/health && info "✅ ANA API OK" || warn "⚠️ ANA API não respondeu"

echo ""
echo "🎉 ========================================"
echo "   MIGRAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Testar as URLs no navegador:"
echo "   https://patrimonioueg.duckdns.org"
echo "   https://patrimonioueg.duckdns.org/estresse"
echo "   https://patrimonioueg.duckdns.org/ana"
echo "   https://patrimonioueg.duckdns.org/n8n"
echo ""
echo "2. Monitorar logs:"
echo "   cd $PROJECT_DIR"
echo "   docker compose logs -f"
echo ""
echo "3. Se tudo OK, desabilitar serviços antigos:"
echo "   pm2 delete all"
echo "   sudo systemctl disable nginx"
echo "   # sudo systemctl disable postgresql  (só se não usar mais)"
echo ""
echo "4. Backups estão em: $BACKUP_DIR"
echo ""
echo "🔄 Se precisar reverter:"
echo "   cd $PROJECT_DIR"
echo "   docker compose down"
echo "   pm2 resurrect"
echo "   sudo systemctl start nginx"
echo ""
