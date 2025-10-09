# 🎯 COMANDOS PARA EXECUTAR AGORA

## 📌 PASSO 1: Subir para o GitHub

### A. Criar Repositório no GitHub (Navegador)
1. Acesse: https://github.com/new
2. Nome: `ana-hidro`
3. Descrição: `Sistema de Monitoramento de Recursos Hídricos - ANA`
4. Público ou Privado (sua escolha)
5. **NÃO marque** "Add a README file"
6. Clique em "Create repository"

### B. Conectar e Enviar (PowerShell - NO SEU PC)
```powershell
cd C:\Users\KUMA\Documents\ProjetoTcc

# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/ana-hidro.git

# Renomear branch para main
git branch -M main

# Enviar código
git push -u origin main
```

**✅ Pronto! Código está no GitHub!**

---

## 📌 PASSO 2: Acessar Servidor UEG

### A. Conectar via SSH
```powershell
# Substitua com os dados reais do servidor
ssh seu_usuario@servidor.ueg.br
```

**Se der erro**, peça ao suporte:
- IP ou domínio do servidor
- Seu usuário
- Sua senha ou chave SSH

---

## 📌 PASSO 3: Preparar Servidor (NO SERVIDOR)

### A. Verificar o que está instalado
```bash
# Verificar Node.js (precisa ser >= 18)
node --version

# Verificar PostgreSQL
psql --version

# Verificar Nginx
nginx -v

# Verificar PM2
pm2 --version
```

### B. Instalar o que faltar

**Se Node.js não estiver instalado ou for < 18:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar
```

**Se PostgreSQL não estiver instalado:**
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Se Nginx não estiver instalado:**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Se PM2 não estiver instalado:**
```bash
sudo npm install -g pm2
```

---

## 📌 PASSO 4: Criar Banco de Dados (NO SERVIDOR)

```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Executar (um de cada vez):
CREATE DATABASE ana_hidro;
CREATE USER ana_user WITH ENCRYPTED PASSWORD 'SenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE ana_hidro TO ana_user;
\q

# Testar conexão
psql -U ana_user -d ana_hidro -h localhost -W
# Digite a senha: SenhaForte123!
# Se conectar, digite: \q
```

---

## 📌 PASSO 5: Clonar Projeto (NO SERVIDOR)

```bash
# Criar diretório
sudo mkdir -p /var/www/ana-hidro
sudo chown -R $USER:$USER /var/www/ana-hidro
cd /var/www/ana-hidro

# Clonar (substitua SEU_USUARIO)
git clone https://github.com/SEU_USUARIO/ana-hidro.git .

# Dar permissão aos scripts
chmod +x deploy.sh populate.sh backup.sh
```

---

## 📌 PASSO 6: Configurar Backend (NO SERVIDOR)

```bash
cd /var/www/ana-hidro/server

# Copiar e editar .env
cp .env.example .env
nano .env

# Configurar no nano:
DATABASE_URL="postgresql://ana_user:SenhaForte123!@localhost:5432/ana_hidro"
PORT=3000
NODE_ENV=production
ANA_BASE_URL="https://api.ana.gov.br/hidrowebservice"
ANA_IDENTIFICADOR="SEU_ID_ANA_AQUI"
ANA_SENHA="SUA_SENHA_ANA_AQUI"

# Salvar: Ctrl+O, Enter, Ctrl+X

# Instalar dependências
npm install --production

# Prisma
npx prisma generate
npx prisma migrate deploy

# Compilar
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Auto-start (executar e seguir instruções)
pm2 startup
```

---

## 📌 PASSO 7: Configurar Frontend (NO SERVIDOR)

```bash
cd /var/www/ana-hidro/web

# Configurar .env
cp .env.example .env
nano .env

# Adicionar (substitua pelo seu domínio ou IP):
VITE_API_BASE_URL=http://SEU_IP_OU_DOMINIO/api

# Salvar: Ctrl+O, Enter, Ctrl+X

# Instalar e buildar
npm install
npm run build
```

---

## 📌 PASSO 8: Configurar Nginx (NO SERVIDOR)

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/ana-hidro
```

**Colar este conteúdo (ajuste server_name):**
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.ueg.br;  # OU seu IP

    location / {
        root /var/www/ana-hidro/web/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

```bash
# Salvar: Ctrl+O, Enter, Ctrl+X

# Habilitar site
sudo ln -s /etc/nginx/sites-available/ana-hidro /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## 📌 PASSO 9: Popular Banco de Dados (NO SERVIDOR)

```bash
cd /var/www/ana-hidro

# Executar script
./populate.sh
```

**Isso vai sincronizar estações de vários estados. Aguarde!**

---

## 📌 PASSO 10: Testar! 🎉

### A. Testar Backend
```bash
curl http://localhost:3000/health
# Deve retornar: {"status":"ok",...}
```

### B. Verificar PM2
```bash
pm2 status
# ana-hidro-backend deve estar "online"
```

### C. Abrir no Navegador
```
http://SEU_IP_OU_DOMINIO
ou
http://SEU_DOMINIO.ueg.br
```

**Deve carregar o mapa com estações! 🗺️💧**

---

## 📌 COMANDOS ÚTEIS APÓS DEPLOY

### Ver Logs
```bash
pm2 logs ana-hidro-backend           # Logs do backend
sudo tail -f /var/log/nginx/access.log  # Logs Nginx
```

### Reiniciar Serviços
```bash
pm2 restart ana-hidro-backend
sudo systemctl reload nginx
```

### Atualizar Código (após mudanças no GitHub)
```bash
cd /var/www/ana-hidro
./deploy.sh  # Script automático!
```

### Fazer Backup
```bash
cd /var/www/ana-hidro
./backup.sh
```

---

## ❌ SE DER ERRO

### Backend não inicia
```bash
cd /var/www/ana-hidro/server
pm2 logs ana-hidro-backend  # Ver erro
npm run build               # Recompilar
pm2 restart ana-hidro-backend
```

### Frontend não carrega
```bash
cd /var/www/ana-hidro/web
npm run build
sudo systemctl reload nginx
```

### Banco não conecta
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Testar conexão
psql -U ana_user -d ana_hidro -h localhost -W
```

---

## 📝 CHECKLIST FINAL

Antes de considerar pronto:

- [ ] GitHub: Código publicado
- [ ] Servidor: Acessado via SSH
- [ ] Node.js: Versão >= 18 instalada
- [ ] PostgreSQL: Rodando e banco criado
- [ ] Nginx: Rodando e configurado
- [ ] PM2: Backend rodando
- [ ] Backend: /health responde OK
- [ ] Frontend: Build gerado em dist/
- [ ] Banco: Populado com dados
- [ ] Navegador: Aplicação carrega
- [ ] Mapa: Estações aparecem
- [ ] Filtros: Funcionam corretamente

---

## 🆘 PRECISA DE AJUDA?

**Consulte:**
- `DEPLOY_UEG.md` - Guia completo detalhado
- `DEPLOY_RAPIDO.md` - Versão resumida
- `TESTES.md` - Como testar tudo
- `COMANDOS.md` - Todos os comandos úteis

**Boa sorte! 🚀**
