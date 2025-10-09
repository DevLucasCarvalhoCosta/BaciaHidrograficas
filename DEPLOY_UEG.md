# 🚀 Guia de Deploy - Servidor UEG

## 📋 Pré-requisitos no Servidor

### 1. Acesso ao Servidor
```bash
ssh usuario@servidor.ueg.br
```

### 2. Instalar Node.js 18+ (se não estiver instalado)
```bash
# Atualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # deve mostrar v18.x ou superior
npm --version
```

### 3. Instalar PostgreSQL (se não estiver instalado)
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 4. Instalar PM2 (gerenciador de processos)
```bash
sudo npm install -g pm2
```

### 5. Instalar Nginx (para servir frontend e proxy reverso)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco de Dados e Usuário
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Dentro do psql:
CREATE DATABASE ana_hidro;
CREATE USER ana_user WITH ENCRYPTED PASSWORD 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE ana_hidro TO ana_user;
\q
```

### 2. Testar Conexão
```bash
psql -h localhost -U ana_user -d ana_hidro -W
# Digite a senha quando solicitado
# Se conectar, está tudo certo!
\q
```

---

## 📦 Upload do Projeto

### Opção 1: Via Git (Recomendado)
```bash
# No servidor
cd /var/www
sudo mkdir -p ana-hidro
sudo chown -R $USER:$USER ana-hidro
cd ana-hidro

# Clonar repositório (após subir no GitHub)
git clone https://github.com/SEU_USUARIO/ProjetoTcc.git .
```

### Opção 2: Via SCP (do seu computador)
```powershell
# No seu computador (PowerShell)
cd C:\Users\KUMA\Documents\ProjetoTcc

# Comprimir projeto
tar -czf projeto.tar.gz server/ web/ package*.json

# Enviar para servidor
scp projeto.tar.gz usuario@servidor.ueg.br:/var/www/ana-hidro/

# No servidor, descompactar
ssh usuario@servidor.ueg.br
cd /var/www/ana-hidro
tar -xzf projeto.tar.gz
```

---

## ⚙️ Configuração do Backend

### 1. Instalar Dependências
```bash
cd /var/www/ana-hidro/server
npm install --production
```

### 2. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env
nano .env

# Adicionar:
DATABASE_URL="postgresql://ana_user:senha_forte_aqui@localhost:5432/ana_hidro"
PORT=3000
NODE_ENV=production
ANA_BASE_URL="https://api.ana.gov.br/hidrowebservice"
ANA_IDENTIFICADOR="seu_identificador"
ANA_SENHA="sua_senha"

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### 3. Gerar Prisma Client e Aplicar Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Compilar TypeScript
```bash
npm run build
```

### 5. Testar Backend
```bash
# Testar manualmente
npm start

# Testar endpoint
curl http://localhost:3000/health
# Deve retornar: {"status":"ok","time":"..."}

# Ctrl+C para parar
```

---

## 🌐 Configuração do Frontend

### 1. Instalar Dependências
```bash
cd /var/www/ana-hidro/web
npm install
```

### 2. Configurar Variável de Ambiente
```bash
# Criar .env
nano .env

# Adicionar (URL do seu servidor):
VITE_API_BASE_URL=https://ana-hidro.ueg.br/api

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### 3. Build de Produção
```bash
npm run build
# Isso cria a pasta dist/
```

---

## 🔧 Configuração do PM2 (Backend)

### 1. Criar arquivo de configuração PM2
```bash
cd /var/www/ana-hidro/server
nano ecosystem.config.js
```

### 2. Adicionar conteúdo:
```javascript
module.exports = {
  apps: [{
    name: 'ana-hidro-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 3. Criar pasta de logs
```bash
mkdir -p logs
```

### 4. Iniciar com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir instruções para auto-start
```

### 5. Comandos úteis PM2
```bash
pm2 status              # Ver status
pm2 logs ana-hidro-backend  # Ver logs
pm2 restart ana-hidro-backend  # Reiniciar
pm2 stop ana-hidro-backend     # Parar
pm2 delete ana-hidro-backend   # Remover
```

---

## 🌍 Configuração do Nginx

### 1. Criar configuração do site
```bash
sudo nano /etc/nginx/sites-available/ana-hidro
```

### 2. Adicionar conteúdo:
```nginx
server {
    listen 80;
    server_name ana-hidro.ueg.br;  # Substitua pelo seu domínio

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/ana-hidro/web/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (proxy reverso)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Logs
    access_log /var/log/nginx/ana-hidro-access.log;
    error_log /var/log/nginx/ana-hidro-error.log;
}
```

### 3. Habilitar site
```bash
sudo ln -s /etc/nginx/sites-available/ana-hidro /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

---

## 🔒 Configuração SSL (HTTPS) - Opcional mas Recomendado

### Usando Let's Encrypt (Certbot)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d ana-hidro.ueg.br

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

---

## 📊 Popular o Banco de Dados

### 1. Sincronizar Estações de Goiás
```bash
# Fazer login na API ANA e pegar token
curl -X POST http://localhost:3000/api/ana/login \
  -H "Content-Type: application/json" \
  -d '{"identificador":"SEU_ID","senha":"SUA_SENHA"}'

# Copie o token retornado

# Sincronizar estações HIDRO de GO
curl -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_AQUI","unidadefederativa":"GO"}'
```

### 2. Script de População Automática
Criar arquivo: `/var/www/ana-hidro/server/scripts/populate.sh`

```bash
#!/bin/bash

# Obter token
TOKEN=$(curl -s -X POST http://localhost:3000/api/ana/login \
  -H "Content-Type: application/json" \
  -d "{\"identificador\":\"$ANA_IDENTIFICADOR\",\"senha\":\"$ANA_SENHA\"}" \
  | jq -r '.token')

echo "Token obtido: $TOKEN"

# Lista de UFs para sincronizar
UFS=("GO" "SP" "RJ" "MG" "BA" "PR" "SC" "RS")

for UF in "${UFS[@]}"
do
  echo "Sincronizando $UF..."
  curl -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\",\"unidadefederativa\":\"$UF\"}"
  echo ""
  sleep 2  # Aguardar 2 segundos entre requisições
done

echo "População concluída!"
```

```bash
# Dar permissão de execução
chmod +x /var/www/ana-hidro/server/scripts/populate.sh

# Executar
./scripts/populate.sh
```

---

## 🔍 Verificação Final

### 1. Testar Backend
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/ana/estacoes/hidro?unidadefederativa=GO
```

### 2. Testar Nginx
```bash
curl http://ana-hidro.ueg.br/health
curl http://ana-hidro.ueg.br
```

### 3. Abrir no Navegador
```
http://ana-hidro.ueg.br
ou
https://ana-hidro.ueg.br (se configurou SSL)
```

---

## 📝 Manutenção e Atualizações

### Atualizar Código
```bash
cd /var/www/ana-hidro

# Se usando Git
git pull origin main

# Backend
cd server
npm install
npm run build
pm2 restart ana-hidro-backend

# Frontend
cd ../web
npm install
npm run build
sudo systemctl reload nginx
```

### Ver Logs
```bash
# Logs do Backend (PM2)
pm2 logs ana-hidro-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/ana-hidro-access.log
sudo tail -f /var/log/nginx/ana-hidro-error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Backup do Banco de Dados
```bash
# Criar backup
pg_dump -U ana_user -d ana_hidro > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U ana_user -d ana_hidro < backup_20251009.sql
```

---

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
pm2 logs ana-hidro-backend

# Verificar se porta está em uso
sudo netstat -tlnp | grep :3000

# Reiniciar
pm2 restart ana-hidro-backend
```

### Frontend não carrega
```bash
# Verificar build existe
ls -la /var/www/ana-hidro/web/dist/

# Testar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar permissões
sudo chown -R www-data:www-data /var/www/ana-hidro/web/dist/
```

### Banco de dados lento
```bash
# Criar índices (se necessário)
psql -U ana_user -d ana_hidro

CREATE INDEX idx_hidro_uf ON "HidroStation"("UF_Estacao");
CREATE INDEX idx_hidro_tipo ON "HidroStation"("Tipo_Estacao");
```

---

## 📊 Monitoramento

### Configurar Monitoramento PM2
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Status do Sistema
```bash
# CPU e Memória
htop

# Espaço em disco
df -h

# Status dos serviços
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status
```

---

## ✅ Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado e populado
- [ ] Backend compilado e rodando via PM2
- [ ] Frontend buildado em /web/dist
- [ ] Nginx configurado e rodando
- [ ] SSL configurado (se aplicável)
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] Domínio apontando para servidor
- [ ] Logs sendo gerados corretamente
- [ ] Backup automatizado configurado

---

**🎉 Deploy concluído! Seu projeto está no ar!**

URL: http://ana-hidro.ueg.br (ou seu domínio)
