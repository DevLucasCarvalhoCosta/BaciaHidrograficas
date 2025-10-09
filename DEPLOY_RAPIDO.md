# 🚀 Guia Rápido de Deploy - Servidor UEG

## 📋 Checklist Antes de Subir

- [ ] Credenciais da ANA configuradas
- [ ] Acesso SSH ao servidor
- [ ] PostgreSQL instalado no servidor
- [ ] Node.js 18+ instalado no servidor
- [ ] Domínio configurado (opcional)

---

## 🎯 Passo a Passo Resumido

### 1️⃣ No Seu Computador

```powershell
# Navegar para o projeto
cd C:\Users\KUMA\Documents\ProjetoTcc

# Inicializar Git (se ainda não fez)
git init
git add .
git commit -m "Deploy inicial - Sistema ANA Hidro"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/ana-hidro.git
git branch -M main
git push -u origin main
```

### 2️⃣ No Servidor UEG

```bash
# Conectar via SSH
ssh usuario@servidor.ueg.br

# Criar diretório do projeto
sudo mkdir -p /var/www/ana-hidro
sudo chown -R $USER:$USER /var/www/ana-hidro
cd /var/www/ana-hidro

# Clonar repositório
git clone https://github.com/SEU_USUARIO/ana-hidro.git .

# Dar permissão aos scripts
chmod +x deploy.sh populate.sh backup.sh
```

### 3️⃣ Configurar Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Executar no psql:
CREATE DATABASE ana_hidro;
CREATE USER ana_user WITH ENCRYPTED PASSWORD 'SenhaForteAqui123!';
GRANT ALL PRIVILEGES ON DATABASE ana_hidro TO ana_user;
\q
```

### 4️⃣ Configurar Backend

```bash
cd /var/www/ana-hidro/server

# Copiar e editar .env
cp .env.example .env
nano .env

# Configurar:
DATABASE_URL="postgresql://ana_user:SenhaForteAqui123!@localhost:5432/ana_hidro"
PORT=3000
NODE_ENV=production
ANA_BASE_URL="https://api.ana.gov.br/hidrowebservice"
ANA_IDENTIFICADOR="seu_id_ana"
ANA_SENHA="sua_senha_ana"

# Instalar e configurar
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build

# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir instruções
```

### 5️⃣ Configurar Frontend

```bash
cd /var/www/ana-hidro/web

# Configurar .env
cp .env.example .env
nano .env

# Adicionar:
VITE_API_BASE_URL=https://seu-dominio.ueg.br/api
# ou
VITE_API_BASE_URL=http://IP_DO_SERVIDOR/api

# Build
npm install
npm run build
```

### 6️⃣ Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/ana-hidro

# Colar conteúdo (ver DEPLOY_UEG.md seção Nginx)

# Habilitar site
sudo ln -s /etc/nginx/sites-available/ana-hidro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7️⃣ Popular Banco de Dados

```bash
cd /var/www/ana-hidro
./populate.sh
```

---

## ⚡ Comandos Úteis no Servidor

### Status dos Serviços
```bash
pm2 status                    # Status do backend
sudo systemctl status nginx   # Status do Nginx
sudo systemctl status postgresql  # Status do PostgreSQL
```

### Ver Logs
```bash
pm2 logs ana-hidro-backend           # Logs do backend
sudo tail -f /var/log/nginx/ana-hidro-access.log  # Logs Nginx
sudo tail -f /var/log/nginx/ana-hidro-error.log   # Erros Nginx
```

### Atualizar Aplicação
```bash
cd /var/www/ana-hidro
./deploy.sh  # Script automático!
```

### Backup Manual
```bash
cd /var/www/ana-hidro
./backup.sh
```

### Restaurar Backup
```bash
# Listar backups
ls -lh /var/backups/ana-hidro/

# Restaurar
gunzip -c /var/backups/ana-hidro/backup_YYYYMMDD_HHMMSS.sql.gz | psql -U ana_user -d ana_hidro
```

---

## 🔍 Testar Aplicação

### Backend
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/ana/estacoes/hidro?unidadefederativa=GO
```

### Frontend (via navegador)
```
http://seu-dominio.ueg.br
ou
http://IP_DO_SERVIDOR
```

---

## 🆘 Solução de Problemas Rápidos

### Backend não inicia
```bash
pm2 logs ana-hidro-backend  # Ver erro
cd /var/www/ana-hidro/server
npm run build               # Recompilar
pm2 restart ana-hidro-backend
```

### Frontend não carrega
```bash
# Verificar build
ls -la /var/www/ana-hidro/web/dist/

# Recompilar se necessário
cd /var/www/ana-hidro/web
npm run build

# Verificar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Erro de conexão com banco
```bash
# Testar conexão
psql -U ana_user -d ana_hidro -h localhost -W

# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql
sudo systemctl start postgresql
```

---

## 📞 Contatos e Recursos

**Documentação Completa**: Ver arquivo `DEPLOY_UEG.md`

**Scripts Disponíveis**:
- `deploy.sh` - Deploy/atualização automática
- `populate.sh` - Popular banco com dados da ANA
- `backup.sh` - Backup do banco de dados

**Arquivos de Configuração**:
- `server/.env` - Variáveis de ambiente do backend
- `web/.env` - Variáveis de ambiente do frontend
- `server/ecosystem.config.js` - Configuração PM2
- `/etc/nginx/sites-available/ana-hidro` - Configuração Nginx

---

## ✅ Checklist Pós-Deploy

- [ ] Backend respondendo em /health
- [ ] Frontend carregando no navegador
- [ ] Mapa exibindo estações
- [ ] Filtros funcionando
- [ ] Banco populado com dados
- [ ] PM2 configurado para auto-start
- [ ] Nginx configurado e rodando
- [ ] Logs sendo gerados
- [ ] Backup automático configurado (cron)

---

**🎉 Aplicação no ar! Acesse e teste!**
