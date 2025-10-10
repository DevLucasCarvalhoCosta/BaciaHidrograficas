# 🐳 Configuração do Servidor UEG com Docker

## 📋 Visão Geral

O servidor UEG foi **completamente migrado para Docker** em 10/10/2025. Todos os 4 projetos agora rodam em containers isolados.

## 🏗️ Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX GATEWAY (nginx-gateway)            │
│              Ports: 80 (HTTP), 443 (HTTPS + SSL)            │
│                 SSL/TLS: Let's Encrypt                       │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │                 
       ┌───────┴────┐  ┌──────┴─────┐  ┌────┴──────┐  ┌──────────┐
       │ Patrimônio │  │ Dash       │  │ ANA Hidro │  │ n8n      │
       │   UEG      │  │ Estresse   │  │           │  │ Automate │
       └────────────┘  └────────────┘  └───────────┘  └──────────┘
```

### **Containers em Execução:**

| Container | Imagem | Porta | Status | Rede |
|-----------|--------|-------|--------|------|
| `nginx-gateway` | nginx:1.27-alpine | 80, 443 | ✅ Running | proxy_network |
| `ana-backend` | custom (Node.js 20) | 3001 | ✅ Healthy | ana_network |
| `ana-frontend` | nginx:1.27-alpine | 80 | ✅ Running | ana_network |
| `ana-postgres` | postgres:16-alpine | 5432 | ✅ Healthy | ana_network |
| `estresse-dash` | custom (Python 3.12) | 8050 | ✅ Healthy | estresse_network |
| `estresse-postgres` | postgres:16-alpine | 5432 | ✅ Healthy | estresse_network |
| `patrimonio-backend` | custom (Node.js 20) | 3000 | ⚠️ Unhealthy | patrimonio_network |
| `patrimonio-frontend` | nginx:1.27-alpine | 80 | ✅ Running | patrimonio_network |
| `patrimonio-postgres` | postgres:16-alpine | 5432 | ✅ Healthy | patrimonio_network |
| `n8n-automation` | n8nio/n8n:latest | 5678 | ✅ Running | n8n_network |

## 📂 Estrutura de Diretórios no Servidor

```
/home/usuario/docker-ueg-projects/
├── docker-compose.yml                # Orquestração principal
├── .env                              # Variáveis de ambiente (secrets)
├── docker/
│   └── nginx/
│       ├── nginx.conf                # Config principal do gateway
│       ├── ssl/                      # Certificados Let's Encrypt
│       └── includes/
│           ├── proxy-params.conf     # Parâmetros comuns de proxy
│           ├── app-patrimonio.conf   # Config Patrimônio
│           ├── app-estresse.conf     # Config Dash Estresse
│           ├── app-ana.conf          # Config ANA Hidro ✅ CORRIGIDO
│           └── app-n8n.conf          # Config n8n
├── server/                           # Backend ANA Hidro
│   ├── dist/                         # Build do TypeScript
│   ├── node_modules/
│   ├── prisma/
│   └── Dockerfile.production
├── web/                              # Frontend ANA Hidro
│   ├── dist/                         # Build do Vite/React
│   └── (sem Dockerfile - usa volume)
├── estresse/                         # Aplicação Dash Estresse
│   ├── app.py                        # Código Python
│   ├── requirements.txt
│   └── Dockerfile
├── patrimonio/                       # Aplicação PatrimônioUEG
│   ├── backend/
│   │   ├── dist/
│   │   └── Dockerfile
│   └── frontend/dist/
└── uploads/                          # Volumes de dados

```

## 🔧 Configuração do ANA Hidro (Exemplo Corrigido)

### **1. Backend (Node.js + TypeScript + Prisma)**

**Dockerfile:** `server/Dockerfile.production`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY prisma/ ./prisma/
RUN npx prisma generate
CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**
```yaml
ana-backend:
  build:
    context: ./server
    dockerfile: Dockerfile.production
  container_name: ana-backend
  restart: unless-stopped
  environment:
    PORT: 3001
    NODE_ENV: production
    DATABASE_URL: postgresql://...
    ANA_BASE_URL: ${ANA_BASE_URL}
  networks:
    - ana_network
    - proxy_network
  depends_on:
    ana-db:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### **2. Frontend (React + Vite servido via Nginx)**

**docker-compose.yml:**
```yaml
ana-frontend:
  image: nginx:1.27-alpine
  container_name: ana-frontend
  restart: unless-stopped
  volumes:
    - ./web/dist:/usr/share/nginx/html:ro
    - ./docker/nginx/ana-frontend.conf:/etc/nginx/conf.d/default.conf:ro
  networks:
    - ana_network
    - proxy_network
```

**nginx config:** `docker/nginx/ana-frontend.conf`
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **3. Nginx Gateway (Proxy Reverso)**

**docker/nginx/includes/app-ana.conf:**
```nginx
# Backend API
location /api/ana {
    proxy_pass http://ana-backend:3001/api/ana;
    include /etc/nginx/includes/proxy-params.conf;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
    
    # Preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}

# Frontend SPA
location /ana/ {
    proxy_pass http://ana-frontend:80/;
    include /etc/nginx/includes/proxy-params.conf;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "*" always;
}

location = /ana {
    return 301 /ana/;
}
```

## 🔄 Como Adaptar para Dash Estresse

### **Estrutura Atual do Estresse:**

```yaml
estresse-app:
  build:
    context: ./estresse
    dockerfile: Dockerfile
  container_name: estresse-dash
  restart: unless-stopped
  environment:
    DATABASE_URL: postgresql://...
    PYTHONUNBUFFERED: 1
  networks:
    - estresse_network
    - proxy_network
  command: gunicorn app:server --bind 0.0.0.0:8050 --workers 4
```

### **Configuração Nginx para Estresse:**

**docker/nginx/includes/app-estresse.conf:**
```nginx
# Dash Estresse Application
location /estresse/ {
    proxy_pass http://estresse-dash:8050/;
    include /etc/nginx/includes/proxy-params.conf;
    
    # WebSocket para Dash callbacks
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Timeouts longos para Dash
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

location = /estresse {
    return 301 /estresse/;
}
```

## 📋 Checklist para CI/CD do Dash Estresse

### **1. Estrutura de Arquivos Necessária:**
```
estresse/
├── app.py                    # ✅ Código principal
├── requirements.txt          # ✅ Dependências Python
├── Dockerfile                # ✅ Build do container
├── .env.example              # ⚠️ Criar se não existir
└── README.md                 # ⚠️ Documentação
```

### **2. Dockerfile do Estresse:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema (se necessário)
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Criar usuário não-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost:8050/_dash-update-component || exit 1

# Comando de inicialização
CMD ["gunicorn", "app:server", "--bind", "0.0.0.0:8050", "--workers", "4", "--timeout", "120"]
```

### **3. Workflow GitHub Actions para Estresse:**

**Estrutura do Deploy:**
```yaml
jobs:
  build:
    steps:
      # 1. Checkout do código
      # 2. Instalar Python 3.12
      # 3. Instalar dependências: pip install -r requirements.txt
      # 4. (Opcional) Testes: pytest
      # 5. Upload dos arquivos

  deploy:
    steps:
      # 1. Download dos arquivos
      # 2. SCP para servidor: ~/docker-ueg-projects/estresse/
      # 3. SSH: docker-compose build estresse-app
      # 4. SSH: docker-compose up -d estresse-app
      # 5. SSH: docker-compose restart nginx
      # 6. Verificar logs: docker-compose logs estresse-app
```

### **4. Comandos de Deploy Manual:**

```bash
# No servidor via SSH
cd ~/docker-ueg-projects

# Rebuild do container
docker-compose build estresse-app

# Reiniciar o container
docker-compose up -d estresse-app

# Verificar logs
docker-compose logs -f estresse-app

# Verificar status
docker-compose ps | grep estresse

# Testar aplicação
curl -I https://patrimonioueg.duckdns.org/estresse/
```

## 🚨 Problemas Comuns e Soluções

### **1. Container não inicia:**
```bash
# Ver logs detalhados
docker-compose logs --tail=100 estresse-app

# Verificar se porta está em uso
docker-compose ps | grep 8050

# Rebuild forçado
docker-compose build --no-cache estresse-app
```

### **2. Erro CORS:**
- ✅ Adicionar headers CORS no `app-estresse.conf`
- ✅ Reiniciar nginx: `docker-compose restart nginx`

### **3. Erro de conexão com banco:**
- ✅ Verificar `DATABASE_URL` no `.env`
- ✅ Verificar se `estresse-postgres` está healthy
- ✅ Testar conexão: `docker exec estresse-postgres pg_isready`

### **4. Arquivos não atualizados:**
- ✅ Verificar se SCP copiou os arquivos
- ✅ Rebuild do container: `docker-compose build estresse-app`
- ✅ Recreate forçado: `docker-compose up -d --force-recreate estresse-app`

## 📊 Monitoramento

```bash
# Ver todos os containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f estresse-app

# Recursos utilizados
docker stats estresse-dash

# Saúde do banco
docker exec estresse-postgres pg_isready

# Testar endpoint
curl https://patrimonioueg.duckdns.org/estresse/
```

## 🔐 Variáveis de Ambiente

**Arquivo `.env` no servidor:**
```env
# Dash Estresse
ESTRESSE_DB_USER=estresse_user
ESTRESSE_DB_PASSWORD=<senha-segura>
ESTRESSE_DB_NAME=estresse_db

# Outras apps...
```

## 📝 Observações Importantes

1. **PM2 NÃO É MAIS USADO** - Tudo roda via Docker
2. **Nginx nativo NÃO É MAIS USADO** - Nginx gateway em container
3. **Arquivos devem ser copiados para `~/docker-ueg-projects/`**
4. **Sempre usar `docker-compose` para gerenciar serviços**
5. **Headers CORS devem estar no nginx gateway, não na aplicação**

## 🎯 Próximos Passos para Estresse

1. ✅ Verificar se `Dockerfile` está correto
2. ✅ Criar workflow GitHub Actions adaptado do ANA
3. ✅ Testar deploy manual primeiro
4. ✅ Configurar secrets no GitHub
5. ✅ Fazer push e verificar CI/CD automático

---

**Última atualização:** 10/10/2025
**Status:** ANA Hidro ✅ Funcionando | Dash Estresse ⏳ Aguardando CI/CD
