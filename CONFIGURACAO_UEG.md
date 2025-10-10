# 🎯 Configuração do Projeto ANA para Servidor UEG

## 📋 Visão Geral

Este projeto será implantado em uma URL separada no servidor UEG, **sem interferir** no sistema PatrimônioUEG já em produção.

### 🔗 URLs Propostas
- **Frontend**: `https://patrimonioueg.duckdns.org/ana`
- **Backend API**: `https://patrimonioueg.duckdns.org/api/ana`
- **Health Check**: `https://patrimonioueg.duckdns.org/api/ana/health`

---

## 🗂️ Estrutura no Servidor

### Diretórios
```
/var/www/
├── patrimonio-frontend/          # Sistema existente (NÃO MEXER)
├── ana-frontend/                 # Novo: Frontend ANA
│   └── dist/                     # Build do Vite
│
/home/usuario/
├── patrimonio-backend/           # Sistema existente (NÃO MEXER)
└── ana-backend/                  # Novo: Backend ANA
    ├── dist/
    ├── node_modules/
    ├── prisma/
    └── .env
```

### Portas
- **PatrimônioUEG Backend**: porta 3000 (existente)
- **ANA Backend**: porta 3001 (nova)

---

## 🔧 Configurações Necessárias

### 1. Variáveis de Ambiente (.env)

#### Backend (`server/.env.production`)
```env
# Porta diferente do PatrimônioUEG
PORT=3001

# Base URL da API da ANA
ANA_BASE_URL=https://dadosabertos.ana.gov.br

# Database PostgreSQL (mesmo servidor, banco separado)
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/ana_hidro"

# Node Environment
NODE_ENV=production
```

#### Frontend (`web/.env.production`)
```env
# URL da API no servidor
VITE_API_URL=https://patrimonioueg.duckdns.org/api/ana
```

### 2. Banco de Dados

Criar banco separado para não conflitar:
```sql
-- Conectar no PostgreSQL
sudo -u postgres psql

-- Criar banco para o projeto ANA
CREATE DATABASE ana_hidro;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE ana_hidro TO postgres;

-- Sair
\q
```

### 3. Configuração PM2

Criar `ecosystem.config.js` específico:

```javascript
module.exports = {
  apps: [{
    name: 'ana-backend',
    script: './dist/index.js',
    cwd: '/home/usuario/ana-backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/usuario/logs/ana-backend-error.log',
    out_file: '/home/usuario/logs/ana-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 4. Configuração Nginx

Adicionar no arquivo existente `/etc/nginx/sites-available/patrimonioueg`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name patrimonioueg.duckdns.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name patrimonioueg.duckdns.org;

    # SSL (já configurado)
    ssl_certificate /etc/letsencrypt/live/patrimonioueg.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/patrimonioueg.duckdns.org/privkey.pem;
    
    # Configurações SSL existentes...

    # ========================================
    # PATRIMÔNIOUEG (EXISTENTE - NÃO MEXER)
    # ========================================
    
    # Backend PatrimônioUEG (porta 3000)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # n8n (EXISTENTE - NÃO MEXER)
    location /n8n {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend PatrimônioUEG (EXISTENTE - NÃO MEXER)
    location / {
        root /var/www/patrimonio-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # ========================================
    # PROJETO ANA (NOVO)
    # ========================================
    
    # Backend ANA (porta 3001)
    location /api/ana {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout maior para APIs externas
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Frontend ANA
    location /ana {
        alias /var/www/ana-frontend/dist;
        try_files $uri $uri/ /ana/index.html;
        index index.html;
        
        # CORS headers para fontes externas
        add_header Access-Control-Allow-Origin *;
    }
}
```

---

## 🚀 GitHub Actions CI/CD

### 1. Criar Deploy Keys no Servidor

```bash
# No servidor UEG
ssh -p 8740 usuario@200.137.241.42

# Gerar chave SSH específica para deploy
ssh-keygen -t ed25519 -C "github-deploy-ana" -f ~/.ssh/github_deploy_ana

# Ver chave pública (adicionar no GitHub como Deploy Key)
cat ~/.ssh/github_deploy_ana.pub

# Ver chave privada (adicionar como Secret no GitHub)
cat ~/.ssh/github_deploy_ana
```

### 2. Secrets no GitHub

Adicionar em **Settings → Secrets and variables → Actions**:

- `UEG_SSH_HOST`: `200.137.241.42`
- `UEG_SSH_PORT`: `8740`
- `UEG_SSH_USER`: `usuario`
- `UEG_SSH_KEY`: (conteúdo de `~/.ssh/github_deploy_ana`)
- `DATABASE_URL`: `postgresql://postgres:SENHA@localhost:5432/ana_hidro`
- `ANA_BASE_URL`: `https://dadosabertos.ana.gov.br`

### 3. Workflow File

Criar `.github/workflows/deploy-ueg.yml`:

```yaml
name: Deploy to UEG Server

on:
  push:
    branches:
      - main
      - production
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy ANA Project to UEG
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            server/package-lock.json
            web/package-lock.json

      # ==========================================
      # BUILD BACKEND
      # ==========================================
      - name: 📦 Install Backend Dependencies
        working-directory: ./server
        run: npm ci

      - name: 🏗️ Build Backend
        working-directory: ./server
        run: npm run build

      - name: 🔍 Generate Prisma Client
        working-directory: ./server
        run: npx prisma generate

      # ==========================================
      # BUILD FRONTEND
      # ==========================================
      - name: 📦 Install Frontend Dependencies
        working-directory: ./web
        run: npm ci

      - name: 🏗️ Build Frontend
        working-directory: ./web
        env:
          VITE_API_URL: https://patrimonioueg.duckdns.org/api/ana
        run: npm run build

      # ==========================================
      # DEPLOY TO SERVER
      # ==========================================
      - name: 🚀 Deploy to UEG Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          script_stop: true
          script: |
            set -e
            
            echo "🔍 Verificando status atual..."
            pm2 list
            
            # ==========================================
            # BACKEND DEPLOYMENT
            # ==========================================
            echo "📦 Deploying Backend..."
            
            # Criar diretórios se não existirem
            mkdir -p /home/usuario/ana-backend
            mkdir -p /home/usuario/logs
            
            cd /home/usuario/ana-backend
            
            # Backup do .env anterior (se existir)
            if [ -f .env ]; then
              cp .env .env.backup
            fi
            
            # Criar .env de produção
            cat > .env << EOF
            PORT=3001
            NODE_ENV=production
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            ANA_BASE_URL=${{ secrets.ANA_BASE_URL }}
            EOF
            
            # Parar processo PM2 (se existir)
            pm2 stop ana-backend || true
            pm2 delete ana-backend || true
            
            # Criar ecosystem config
            cat > ecosystem.config.js << 'EOFPM2'
            module.exports = {
              apps: [{
                name: 'ana-backend',
                script: './dist/index.js',
                instances: 1,
                exec_mode: 'cluster',
                env: { NODE_ENV: 'production', PORT: 3001 },
                error_file: '/home/usuario/logs/ana-backend-error.log',
                out_file: '/home/usuario/logs/ana-backend-out.log',
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
                autorestart: true
              }]
            };
            EOFPM2
            
            echo "📥 Transferindo arquivos do backend..."
            
            # ==========================================
            # FRONTEND DEPLOYMENT
            # ==========================================
            echo "📦 Deploying Frontend..."
            
            # Criar diretório
            sudo mkdir -p /var/www/ana-frontend/dist
            sudo chown -R usuario:usuario /var/www/ana-frontend
            
            echo "✅ Deploy preparado! Arquivos serão transferidos..."

      # ==========================================
      # TRANSFER FILES
      # ==========================================
      - name: 📤 Transfer Backend Files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          source: "server/dist/,server/node_modules/,server/package*.json,server/prisma/"
          target: /home/usuario/ana-backend/
          strip_components: 1
          overwrite: true

      - name: 📤 Transfer Frontend Files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          source: "web/dist/"
          target: /var/www/ana-frontend/
          strip_components: 1
          overwrite: true

      # ==========================================
      # START SERVICES
      # ==========================================
      - name: ♻️ Start Services
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          script: |
            set -e
            
            cd /home/usuario/ana-backend
            
            # Aplicar migrations do Prisma
            echo "🗄️ Aplicando migrations..."
            npx prisma db push --accept-data-loss
            
            # Iniciar backend com PM2
            echo "🚀 Iniciando backend..."
            pm2 start ecosystem.config.js
            pm2 save
            
            # Verificar status
            sleep 3
            pm2 list
            
            # Testar Nginx
            echo "🔧 Testando configuração Nginx..."
            sudo nginx -t
            
            # Recarregar Nginx
            echo "♻️ Recarregando Nginx..."
            sudo systemctl reload nginx
            
            echo "✅ Deploy concluído!"
            echo "🌐 Frontend: https://patrimonioueg.duckdns.org/ana"
            echo "🔌 Backend: https://patrimonioueg.duckdns.org/api/ana/health"

      # ==========================================
      # HEALTH CHECK
      # ==========================================
      - name: 🏥 Health Check
        run: |
          sleep 5
          echo "Verificando saúde da aplicação..."
          curl -f https://patrimonioueg.duckdns.org/api/ana/health || exit 1
          echo "✅ Aplicação está respondendo!"
```

---

## 📝 Checklist de Deploy

### Antes do primeiro deploy:
- [ ] Executar todos os comandos de verificação
- [ ] Criar banco de dados `ana_hidro`
- [ ] Adicionar configuração no Nginx
- [ ] Testar configuração: `sudo nginx -t`
- [ ] Criar secrets no GitHub
- [ ] Gerar deploy keys SSH

### No primeiro deploy:
- [ ] Push para branch `main`
- [ ] Acompanhar Actions no GitHub
- [ ] Verificar logs: `pm2 logs ana-backend`
- [ ] Testar URLs:
  - [ ] https://patrimonioueg.duckdns.org/ana
  - [ ] https://patrimonioueg.duckdns.org/api/ana/health

### Após deploy:
- [ ] Verificar que PatrimônioUEG continua funcionando
- [ ] Testar n8n: https://patrimonioueg.duckdns.org/n8n
- [ ] Verificar logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

---

## 🆘 Troubleshooting

### Backend não inicia:
```bash
pm2 logs ana-backend --lines 100
pm2 restart ana-backend
```

### Frontend não aparece:
```bash
ls -la /var/www/ana-frontend/dist/
sudo chown -R usuario:usuario /var/www/ana-frontend
```

### Nginx com erro:
```bash
sudo nginx -t
sudo tail -n 50 /var/log/nginx/error.log
```

### Porta 3001 em uso:
```bash
sudo lsof -i :3001
pm2 list
```
