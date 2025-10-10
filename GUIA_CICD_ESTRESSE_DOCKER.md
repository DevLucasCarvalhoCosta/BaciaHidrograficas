# 🎯 GUIA COMPLETO: CI/CD para Dash Estresse no Servidor Docker

## 📋 ENTENDA A SITUAÇÃO ATUAL

### **O que mudou no servidor:**
- ❌ **ANTES:** PM2 + Nginx nativo (processos nativos do Linux)
- ✅ **AGORA:** Docker Compose (tudo em containers isolados)

### **Por que o GitHub Actions falhou:**
O workflow estava tentando:
```bash
pm2 start app.py              # ❌ PM2 não existe mais
sudo systemctl reload nginx   # ❌ Nginx nativo não existe mais
```

Mas deveria fazer:
```bash
docker-compose build estresse-app      # ✅ Rebuild do container
docker-compose up -d estresse-app      # ✅ Reiniciar container
docker-compose restart nginx           # ✅ Reiniciar gateway
```

---

## 🏗️ ARQUITETURA DO SERVIDOR (ESTADO ATUAL)

```
Internet (HTTPS)
       ↓
Nginx Gateway Container (porta 80/443)
       ↓
┌──────────────┬─────────────┬──────────────┬─────────┐
│ PatrimônioUEG│ Dash Estresse│  ANA Hidro  │   n8n   │
│   (3 cont.)  │  (2 cont.)  │  (3 cont.)  │(1 cont.)│
└──────────────┴─────────────┴──────────────┴─────────┘
   containers     containers    containers   container
```

### **Containers do Dash Estresse:**

1. **estresse-dash** (aplicação Python)
   - Imagem: Custom (Python 3.12 + Gunicorn)
   - Porta interna: 8050
   - Comando: `gunicorn app:server --bind 0.0.0.0:8050 --workers 4`
   - Rede: `estresse_network` + `proxy_network`
   - Status: ✅ Healthy

2. **estresse-postgres** (banco de dados)
   - Imagem: postgres:16-alpine
   - Porta interna: 5432
   - Rede: `estresse_network`
   - Volume: `estresse_db_data`
   - Status: ✅ Healthy

---

## 📂 ESTRUTURA NO SERVIDOR

```
/home/usuario/docker-ueg-projects/
│
├── docker-compose.yml                # ← Orquestra TODOS os containers
├── .env                              # ← Segredos (DATABASE_URL, etc)
│
├── docker/
│   └── nginx/
│       ├── nginx.conf               # ← Config principal do gateway
│       ├── ssl/                     # ← Certificados Let's Encrypt
│       └── includes/
│           ├── proxy-params.conf    # ← Parâmetros comuns
│           ├── app-estresse.conf    # ← Config do Dash Estresse
│           ├── app-ana.conf         # ← Config do ANA (exemplo)
│           └── ...
│
├── estresse/                        # ← DIRETÓRIO DO DASH ESTRESSE
│   ├── app.py                       # ← Código principal
│   ├── requirements.txt             # ← Dependências Python
│   ├── Dockerfile                   # ← Como construir a imagem
│   ├── .env.example                 # ← Exemplo de variáveis
│   └── (outros arquivos .py)
│
├── server/                          # ← ANA Backend
├── web/                             # ← ANA Frontend
├── patrimonio/                      # ← PatrimônioUEG
└── uploads/                         # ← Arquivos estáticos
```

---

## 🔍 COMO FUNCIONA O DOCKER COMPOSE

### **1. Arquivo docker-compose.yml** (trecho do Dash Estresse):

```yaml
services:
  # ==========================================
  # DASH ESTRESSE - APLICAÇÃO
  # ==========================================
  estresse-app:
    build:
      context: ./estresse
      dockerfile: Dockerfile
    container_name: estresse-dash
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${ESTRESSE_DB_USER}:${ESTRESSE_DB_PASSWORD}@estresse-db:5432/${ESTRESSE_DB_NAME}
      PYTHONUNBUFFERED: 1
    networks:
      - estresse_network
      - proxy_network
    depends_on:
      estresse-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8050/_dash-update-component"]
      interval: 30s
      timeout: 10s
      retries: 3
    command: gunicorn app:server --bind 0.0.0.0:8050 --workers 4 --timeout 120

  # ==========================================
  # DASH ESTRESSE - BANCO DE DADOS
  # ==========================================
  estresse-db:
    image: postgres:16-alpine
    container_name: estresse-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${ESTRESSE_DB_USER}
      POSTGRES_PASSWORD: ${ESTRESSE_DB_PASSWORD}
      POSTGRES_DB: ${ESTRESSE_DB_NAME}
    volumes:
      - estresse_db_data:/var/lib/postgresql/data
    networks:
      - estresse_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${ESTRESSE_DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  estresse_network:
    driver: bridge
  proxy_network:
    driver: bridge

volumes:
  estresse_db_data:
```

### **2. Dockerfile do Dash Estresse** (`estresse/Dockerfile`):

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expor porta
EXPOSE 8050

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost:8050/_dash-update-component || exit 1

# Comando padrão (pode ser sobrescrito no docker-compose)
CMD ["gunicorn", "app:server", "--bind", "0.0.0.0:8050", "--workers", "4", "--timeout", "120"]
```

### **3. Configuração Nginx** (`docker/nginx/includes/app-estresse.conf`):

```nginx
# ============================================
# PROJETO: DASH ESTRESSE
# Isolado na rede estresse_network
# ============================================

# Aplicação Dash
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
    proxy_send_timeout 300s;
    
    # Headers CORS (se necessário)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
}

# Redirecionar /estresse para /estresse/
location = /estresse {
    return 301 /estresse/;
}
```

---

## 🚀 COMO FAZER O DEPLOY MANUAL (PASSO A PASSO)

### **1. Conectar no servidor:**
```bash
ssh -p 8740 usuario@200.137.241.42
```

### **2. Navegar para o diretório:**
```bash
cd ~/docker-ueg-projects
```

### **3. Atualizar o código:**
```bash
# Opção A: Se você fez alterações localmente
# (copiar arquivos via SCP antes)

# Opção B: Se está no Git
cd estresse
git pull origin main
cd ..
```

### **4. Reconstruir a imagem Docker:**
```bash
docker-compose build estresse-app
```

### **5. Reiniciar o container:**
```bash
docker-compose up -d estresse-app
```

### **6. Reiniciar o Nginx gateway (se mudou config):**
```bash
docker-compose restart nginx
```

### **7. Verificar logs:**
```bash
docker-compose logs -f estresse-app
```

### **8. Testar a aplicação:**
```bash
# Testar localmente no servidor
curl -I http://localhost:8050/

# Testar via gateway
curl -I https://patrimonioueg.duckdns.org/estresse/
```

---

## 🤖 GITHUB ACTIONS - WORKFLOW PARA DASH ESTRESSE

### **Crie o arquivo:** `.github/workflows/deploy-estresse.yml`

```yaml
name: Deploy Dash Estresse to UEG Server

on:
  push:
    branches:
      - main
    paths:
      - 'estresse/**'
      - '.github/workflows/deploy-estresse.yml'
  workflow_dispatch:

jobs:
  # ==========================================
  # BUILD E TESTE
  # ==========================================
  build:
    runs-on: ubuntu-latest
    name: 🏗️ Build and Test
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🐍 Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: estresse/requirements.txt

      - name: 📦 Install Dependencies
        working-directory: ./estresse
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: ✅ Lint Code (opcional)
        working-directory: ./estresse
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true

      - name: 🧪 Run Tests (se existir)
        working-directory: ./estresse
        run: |
          if [ -f "test_app.py" ]; then
            pip install pytest
            pytest
          else
            echo "Nenhum teste encontrado, pulando..."
          fi

      - name: 📤 Upload Application Files
        uses: actions/upload-artifact@v4
        with:
          name: estresse-app
          path: estresse/
          retention-days: 1

  # ==========================================
  # DEPLOY NO SERVIDOR DOCKER
  # ==========================================
  deploy:
    runs-on: ubuntu-latest
    needs: build
    name: 🚀 Deploy to Docker
    
    steps:
      - name: 📥 Download Application Files
        uses: actions/download-artifact@v4
        with:
          name: estresse-app
          path: ./estresse/

      - name: 📤 Transfer Files to Server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          source: "estresse/*"
          target: /home/usuario/docker-ueg-projects/
          overwrite: true

      - name: 🐳 Rebuild and Restart Docker Container
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          script_stop: true
          script: |
            set -e
            
            echo "🐳 Navegando para diretório Docker..."
            cd ~/docker-ueg-projects
            
            echo "🔨 Reconstruindo imagem do Dash Estresse..."
            docker-compose build estresse-app
            
            echo "🔄 Reiniciando container..."
            docker-compose up -d estresse-app
            
            echo "⏳ Aguardando inicialização..."
            sleep 10
            
            echo "📊 Status do container:"
            docker-compose ps | grep estresse
            
            echo "📋 Últimas linhas do log:"
            docker-compose logs --tail=20 estresse-app
            
            echo "🏥 Testando aplicação..."
            docker exec estresse-dash wget -qO- http://localhost:8050/ || echo "⚠️ Aplicação não respondeu ainda"
            
            echo "♻️ Reiniciando Nginx gateway..."
            docker-compose restart nginx
            
            echo "✅ Deploy concluído!"

      - name: ✅ Verify Deployment
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.UEG_SSH_HOST }}
          port: ${{ secrets.UEG_SSH_PORT }}
          username: ${{ secrets.UEG_SSH_USER }}
          key: ${{ secrets.UEG_SSH_KEY }}
          script: |
            echo "🔍 Verificando deployment..."
            cd ~/docker-ueg-projects
            
            echo "📊 Status dos containers:"
            docker-compose ps | grep estresse
            
            echo "📋 Logs recentes:"
            docker-compose logs --tail=30 estresse-app
            
            echo "✅ Verificação concluída!"

  # ==========================================
  # HEALTH CHECK
  # ==========================================
  health-check:
    runs-on: ubuntu-latest
    needs: deploy
    name: 🏥 Health Check
    
    steps:
      - name: ⏳ Wait for application to start
        run: sleep 15

      - name: 🌐 Check Application Availability
        run: |
          echo "🔍 Verificando Dash Estresse..."
          status_code=$(curl -o /dev/null -s -w "%{http_code}" https://patrimonioueg.duckdns.org/estresse/)
          
          echo "Status HTTP: $status_code"
          
          if [ "$status_code" -eq 200 ]; then
            echo "✅ Dash Estresse está acessível!"
          else
            echo "❌ Dash Estresse retornou status: $status_code"
            exit 1
          fi

      - name: 🎉 Deployment Success
        run: |
          echo "════════════════════════════════════════════"
          echo "✅ DEPLOY DO DASH ESTRESSE CONCLUÍDO!"
          echo "════════════════════════════════════════════"
          echo ""
          echo "🌐 URL da aplicação:"
          echo "   https://patrimonioueg.duckdns.org/estresse/"
          echo ""
          echo "📊 Para monitorar:"
          echo "   ssh -p 8740 usuario@200.137.241.42"
          echo "   cd ~/docker-ueg-projects"
          echo "   docker-compose logs -f estresse-app"
          echo ""
          echo "════════════════════════════════════════════"
```

---

## 🔐 SECRETS DO GITHUB

Configure estes secrets no repositório GitHub:
- Settings → Secrets and variables → Actions → New repository secret

```
UEG_SSH_HOST = 200.137.241.42
UEG_SSH_PORT = 8740
UEG_SSH_USER = usuario
UEG_SSH_KEY = <chave privada SSH completa>
```

---

## 🐛 TROUBLESHOOTING

### **Container não inicia:**
```bash
# Ver logs completos
docker-compose logs --tail=100 estresse-app

# Ver status
docker-compose ps

# Rebuild sem cache
docker-compose build --no-cache estresse-app

# Recreate forçado
docker-compose up -d --force-recreate estresse-app
```

### **Erro ao conectar no banco:**
```bash
# Verificar se postgres está healthy
docker-compose ps | grep estresse-postgres

# Testar conexão
docker exec estresse-postgres pg_isready -U estresse_user

# Ver logs do banco
docker-compose logs estresse-db
```

### **Nginx não está roteando:**
```bash
# Verificar configuração
docker exec nginx-gateway cat /etc/nginx/nginx.conf | grep estresse

# Testar configuração
docker exec nginx-gateway nginx -t

# Reiniciar nginx
docker-compose restart nginx

# Ver logs do nginx
docker-compose logs nginx | grep estresse
```

### **Aplicação retorna 502 Bad Gateway:**
```bash
# 1. Verificar se container está rodando
docker-compose ps | grep estresse-dash

# 2. Verificar se porta 8050 está aberta
docker exec nginx-gateway wget -qO- http://estresse-dash:8050/

# 3. Verificar logs da aplicação
docker-compose logs --tail=50 estresse-app
```

---

## 📊 COMANDOS ÚTEIS

```bash
# Ver todos os containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f estresse-app

# Entrar no container
docker exec -it estresse-dash bash

# Recursos utilizados
docker stats estresse-dash

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Limpar volumes (⚠️ CUIDADO: apaga dados)
docker-compose down -v
```

---

## ✅ CHECKLIST PARA CORRIGIR O ESTRESSE

- [ ] 1. Verificar se `estresse/Dockerfile` existe e está correto
- [ ] 2. Verificar se `estresse/requirements.txt` está atualizado
- [ ] 3. Verificar `docker/nginx/includes/app-estresse.conf`
- [ ] 4. Criar `.github/workflows/deploy-estresse.yml`
- [ ] 5. Configurar secrets no GitHub (SSH_HOST, SSH_PORT, SSH_USER, SSH_KEY)
- [ ] 6. Fazer teste manual de deploy via SSH
- [ ] 7. Fazer push e verificar GitHub Actions
- [ ] 8. Verificar logs: `docker-compose logs -f estresse-app`
- [ ] 9. Testar URL: https://patrimonioueg.duckdns.org/estresse/
- [ ] 10. Documentar mudanças no README do estresse

---

## 📚 DIFERENÇAS: PM2 vs DOCKER

| Aspecto | PM2 (Antigo) | Docker (Atual) |
|---------|-------------|----------------|
| **Como iniciar** | `pm2 start app.py` | `docker-compose up -d estresse-app` |
| **Como parar** | `pm2 stop estresse` | `docker-compose stop estresse-app` |
| **Ver logs** | `pm2 logs estresse` | `docker-compose logs -f estresse-app` |
| **Ver status** | `pm2 list` | `docker-compose ps` |
| **Reiniciar** | `pm2 restart estresse` | `docker-compose restart estresse-app` |
| **Isolamento** | ❌ Processos compartilham SO | ✅ Containers isolados |
| **Banco de dados** | PostgreSQL nativo | PostgreSQL em container |
| **Nginx** | Nginx nativo | Nginx gateway em container |
| **Rollback** | Manual | `docker-compose down && git checkout old-commit && docker-compose up -d` |

---

**🎯 RESUMO EXECUTIVO:**

1. **O servidor mudou de PM2 para Docker** - todos os projetos rodam em containers
2. **Dash Estresse já está dockerizado** - containers `estresse-dash` e `estresse-postgres` rodando
3. **GitHub Actions precisa ser atualizado** - usar `docker-compose` em vez de `pm2`
4. **Nginx é um container gateway** - faz proxy reverso para todos os projetos
5. **Deploy = copiar arquivos + rebuild + restart** - tudo via `docker-compose`

---

**Data:** 10/10/2025  
**Status:** Dash Estresse rodando em Docker, CI/CD precisa ser adaptado
