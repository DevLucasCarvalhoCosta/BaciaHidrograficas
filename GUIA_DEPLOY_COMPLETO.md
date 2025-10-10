# 🚀 Guia Completo de Deploy - Projeto ANA no Servidor UEG

## 📋 Índice
1. [Verificação Inicial](#1-verificação-inicial)
2. [Preparação do Servidor](#2-preparação-do-servidor)
3. [Configuração do GitHub](#3-configuração-do-github)
4. [Primeiro Deploy](#4-primeiro-deploy)
5. [Monitoramento](#5-monitoramento)
6. [Rollback (se necessário)](#6-rollback-se-necessário)

---

## ⚠️ IMPORTANTE: Leia Antes de Começar

Este projeto será implantado no mesmo servidor do PatrimônioUEG, mas:
- **URL diferente**: `/ana` (não afeta a raiz `/`)
- **Porta diferente**: 3001 (PatrimônioUEG usa 3000)
- **Banco diferente**: `ana_hidro` (PatrimônioUEG usa `patrimonio`)
- **Processos PM2 separados**: `ana-backend` (não afeta `patrimonio-backend`)

**O PatrimônioUEG NÃO será afetado!**

---

## 1. Verificação Inicial

### 1.1. Conectar ao Servidor
```bash
ssh -p 8740 usuario@200.137.241.42
```

### 1.2. Executar Verificações
```bash
# Criar o script de verificação
cat > ~/verificar_antes_deploy.sh << 'EOF'
#!/bin/bash
echo "════════════════════════════════════════════"
echo "🔍 VERIFICAÇÃO PRÉ-DEPLOY - $(date)"
echo "════════════════════════════════════════════"
echo ""

echo "📊 1. PROCESSOS PM2 ATUAIS"
pm2 list
echo ""

echo "🌐 2. NGINX STATUS"
sudo systemctl status nginx --no-pager | head -10
sudo nginx -t
echo ""

echo "💾 3. ESPAÇO EM DISCO"
df -h | grep -E "Filesystem|/$"
echo ""

echo "🗄️ 4. POSTGRESQL"
sudo systemctl status postgresql --no-pager | head -5
sudo -u postgres psql -c "\l" | grep -E "Name|patrimonio|ana"
echo ""

echo "🔌 5. PORTAS EM USO"
sudo ss -tlnp | grep -E ":3000|:3001|:80|:443" | grep LISTEN
echo ""

echo "📁 6. DIRETÓRIOS"
ls -la /var/www/ | grep -E "total|patrimonio|ana"
echo ""

echo "🔥 7. FIREWALL"
sudo ufw status | head -10
echo ""

echo "✅ Verificação concluída!"
echo "════════════════════════════════════════════"
EOF

chmod +x ~/verificar_antes_deploy.sh
~/verificar_antes_deploy.sh
```

### 1.3. Salvar Estado Atual
```bash
# Criar backup do estado atual
mkdir -p ~/backups/pre-ana-deploy
pm2 list > ~/backups/pre-ana-deploy/pm2-status.txt
sudo nginx -t > ~/backups/pre-ana-deploy/nginx-test.txt 2>&1
df -h > ~/backups/pre-ana-deploy/disk-space.txt
date > ~/backups/pre-ana-deploy/timestamp.txt

echo "✅ Backup do estado salvo em ~/backups/pre-ana-deploy/"
```

### 1.4. Checklist de Verificação

- [ ] PM2 mostra `patrimonio-backend` como **online**
- [ ] Nginx testa OK (`sudo nginx -t`)
- [ ] PostgreSQL está **ativo**
- [ ] Disco tem > **2GB livre**
- [ ] Porta 3001 está **livre** (não aparece na lista)
- [ ] URLs do PatrimônioUEG funcionam:
  - [ ] https://patrimonioueg.duckdns.org
  - [ ] https://patrimonioueg.duckdns.org/api
  - [ ] https://patrimonioueg.duckdns.org/n8n

**Se algum item falhar, NÃO prossiga! Resolva primeiro.**

---

## 2. Preparação do Servidor

### 2.1. Executar Setup Inicial

```bash
# Baixar o script de setup (ou criar manualmente)
cat > ~/setup-ana.sh << 'EOFSETUP'
[CONTEÚDO DO setup-ueg-server.sh]
EOFSETUP

chmod +x ~/setup-ana.sh
~/setup-ana.sh
```

O script irá:
1. ✅ Verificar Node.js, PM2, PostgreSQL, Nginx
2. 📁 Criar diretórios `/home/usuario/ana-backend` e `/var/www/ana-frontend`
3. 🗄️ Criar banco `ana_hidro`
4. ⚙️ Criar arquivo `.env`
5. 🔧 Pedir para você adicionar configuração no Nginx

### 2.2. Configurar Nginx

```bash
# 1. Backup da configuração atual
sudo cp /etc/nginx/sites-available/patrimonioueg \
       /etc/nginx/sites-available/patrimonioueg.backup

# 2. Editar o arquivo
sudo nano /etc/nginx/sites-available/patrimonioueg
```

**Adicione DENTRO do bloco `server {}`** (após as configurações existentes):

```nginx
    # ========================================
    # PROJETO ANA (NOVO)
    # ========================================
    
    # Backend ANA
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
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Frontend ANA
    location /ana {
        alias /var/www/ana-frontend/dist;
        try_files $uri $uri/ /ana/index.html;
        index index.html;
    }
```

```bash
# 3. Testar (NUNCA pule este passo!)
sudo nginx -t

# 4. Se OK, recarregar
sudo systemctl reload nginx

# 5. Verificar
sudo systemctl status nginx
```

### 2.3. Gerar Deploy Keys SSH

```bash
# 1. Gerar par de chaves SSH
ssh-keygen -t ed25519 -C "github-deploy-ana" -f ~/.ssh/github_deploy_ana

# 2. Ver chave pública (copiar para GitHub)
echo "════════════════════════════════════════════"
echo "📋 CHAVE PÚBLICA (adicionar no GitHub como Deploy Key):"
echo "════════════════════════════════════════════"
cat ~/.ssh/github_deploy_ana.pub
echo "════════════════════════════════════════════"

# 3. Ver chave privada (adicionar como Secret no GitHub)
echo ""
echo "════════════════════════════════════════════"
echo "🔐 CHAVE PRIVADA (adicionar no GitHub Secret UEG_SSH_KEY):"
echo "════════════════════════════════════════════"
cat ~/.ssh/github_deploy_ana
echo "════════════════════════════════════════════"
```

---

## 3. Configuração do GitHub

### 3.1. Adicionar Deploy Key

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/settings/keys`
2. Clique em **"Add deploy key"**
3. **Title**: `UEG Server Deploy Key`
4. **Key**: Cole a chave pública (output do comando acima)
5. ✅ Marque **"Allow write access"** (para o PM2 salvar)
6. Clique em **"Add key"**

### 3.2. Adicionar Secrets

Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions`

Adicionar os seguintes secrets:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `UEG_SSH_HOST` | `200.137.241.42` | IP do servidor |
| `UEG_SSH_PORT` | `8740` | Porta SSH |
| `UEG_SSH_USER` | `usuario` | Usuário SSH |
| `UEG_SSH_KEY` | `[chave privada completa]` | Chave privada SSH (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----`) |
| `DATABASE_URL` | `postgresql://postgres:SENHA@localhost:5432/ana_hidro` | URL do banco (substituir SENHA) |
| `ANA_BASE_URL` | `https://dadosabertos.ana.gov.br` | Base URL da API ANA |

### 3.3. Verificar Workflow

Verifique se o arquivo `.github/workflows/deploy-ueg.yml` existe no repositório.

---

## 4. Primeiro Deploy

### 4.1. Iniciar Deploy

```bash
# No seu computador local
git add .
git commit -m "feat: configuração inicial para deploy no servidor UEG"
git push origin main
```

### 4.2. Acompanhar Deploy

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/actions`
2. Clique no workflow em execução
3. Acompanhe cada etapa:
   - ✅ Pre-deployment Checks
   - ✅ Build Application
   - ✅ Deploy to UEG Server
   - ✅ Health Check

### 4.3. Monitorar no Servidor

```bash
# Em outro terminal, conectar ao servidor
ssh -p 8740 usuario@200.137.241.42

# Ver logs em tempo real
pm2 logs ana-backend --lines 50

# Ou monitorar recursos
pm2 monit
```

### 4.4. Verificar Deploy

Após o deploy concluir:

```bash
# No servidor, verificar status
pm2 list

# Verificar logs
pm2 logs ana-backend --lines 30 --nostream

# Testar URLs
curl http://localhost:3001/health
curl https://patrimonioueg.duckdns.org/api/ana/health
```

### 4.5. Testar no Navegador

Abra no navegador:

1. **Frontend**: https://patrimonioueg.duckdns.org/ana
2. **Backend Health**: https://patrimonioueg.duckdns.org/api/ana/health
3. **PatrimônioUEG** (verificar que não foi afetado):
   - https://patrimonioueg.duckdns.org
   - https://patrimonioueg.duckdns.org/api
   - https://patrimonioueg.duckdns.org/n8n

---

## 5. Monitoramento

### 5.1. Comandos Úteis

```bash
# Ver todos os processos
pm2 list

# Ver logs do ANA Backend
pm2 logs ana-backend

# Ver logs em tempo real
pm2 logs ana-backend --lines 100

# Ver recursos (CPU, memória)
pm2 monit

# Reiniciar (se necessário)
pm2 restart ana-backend

# Ver informações detalhadas
pm2 show ana-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5.2. Health Checks

```bash
# Backend health
curl https://patrimonioueg.duckdns.org/api/ana/health

# Frontend (deve retornar HTML)
curl -I https://patrimonioueg.duckdns.org/ana

# Testar API ANA (através do backend)
curl "https://patrimonioueg.duckdns.org/api/ana/inventario/list?limit=5"
```

### 5.3. Verificar Banco de Dados

```bash
# Conectar ao banco
sudo -u postgres psql -d ana_hidro

# Ver tabelas
\dt

# Ver quantidade de estações
SELECT COUNT(*) FROM "Station";
SELECT COUNT(*) FROM "HidroStation";

# Sair
\q
```

---

## 6. Rollback (se necessário)

### 6.1. Parar Aplicação ANA

```bash
# Parar backend
pm2 stop ana-backend
pm2 delete ana-backend

# Remover do autostart
pm2 save --force
```

### 6.2. Reverter Nginx

```bash
# Restaurar backup
sudo cp /etc/nginx/sites-available/patrimonioueg.backup \
       /etc/nginx/sites-available/patrimonioueg

# Testar
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

### 6.3. Limpar Banco (opcional)

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Dropar banco (CUIDADO!)
DROP DATABASE ana_hidro;

# Sair
\q
```

---

## 📊 Troubleshooting

### Problema: Backend não inicia

```bash
# Ver logs
pm2 logs ana-backend --err --lines 50

# Verificar .env
cat /home/usuario/ana-backend/.env

# Verificar porta
sudo lsof -i :3001

# Tentar iniciar manualmente
cd /home/usuario/ana-backend
node dist/index.js
```

### Problema: 502 Bad Gateway

```bash
# Verificar se backend está rodando
pm2 list

# Verificar logs do Nginx
sudo tail -n 50 /var/log/nginx/error.log

# Verificar configuração
sudo nginx -t

# Reiniciar backend
pm2 restart ana-backend
```

### Problema: Frontend não carrega

```bash
# Verificar arquivos
ls -la /var/www/ana-frontend/dist/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/ana-frontend
sudo chmod -R 755 /var/www/ana-frontend

# Verificar Nginx
sudo nginx -t
sudo tail -n 50 /var/log/nginx/error.log
```

### Problema: Banco de dados não conecta

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão
sudo -u postgres psql -d ana_hidro -c "SELECT 1;"

# Verificar .env
cat /home/usuario/ana-backend/.env | grep DATABASE_URL

# Ver logs do backend
pm2 logs ana-backend --lines 50
```

---

## ✅ Checklist Final

Após o deploy, verificar:

- [ ] `pm2 list` mostra `ana-backend` com status **online**
- [ ] `pm2 list` mostra `patrimonio-backend` com status **online** (não foi afetado)
- [ ] https://patrimonioueg.duckdns.org/ana carrega o frontend
- [ ] https://patrimonioueg.duckdns.org/api/ana/health retorna `{"status":"ok"}`
- [ ] PatrimônioUEG continua funcionando normalmente
- [ ] n8n continua funcionando: https://patrimonioueg.duckdns.org/n8n
- [ ] Nginx não mostra erros: `sudo nginx -t`
- [ ] Logs do backend não mostram erros críticos

---

## 📞 Contatos de Emergência

Se algo der errado:

1. **Parar imediatamente**: `pm2 stop ana-backend`
2. **Reverter Nginx**: Usar backup `.backup`
3. **Notificar equipe**: [seu contato]
4. **Ver logs**: `pm2 logs` e `sudo tail /var/log/nginx/error.log`

---

## 🎉 Deploy Concluído!

Se todos os checks passaram, o deploy foi bem-sucedido!

**URLs da aplicação:**
- 🌐 Frontend: https://patrimonioueg.duckdns.org/ana
- 🔌 Backend: https://patrimonioueg.duckdns.org/api/ana
- 🏥 Health: https://patrimonioueg.duckdns.org/api/ana/health

**Monitoramento:**
```bash
ssh -p 8740 usuario@200.137.241.42
pm2 logs ana-backend
pm2 monit
```
