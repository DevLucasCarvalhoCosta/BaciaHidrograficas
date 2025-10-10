# 🔍 Verificação do Servidor UEG - ANTES de Deploy

## ⚠️ IMPORTANTE: Execute estes comandos ANTES de qualquer deploy

### 1. Conectar ao Servidor
```bash
ssh -p 8740 usuario@200.137.241.42
```

---

## 📋 Comandos de Verificação Completa

### 🔹 1. Verificar Serviços Ativos
```bash
# Ver todos os processos PM2 rodando (PatrimônioUEG)
pm2 list

# Ver status detalhado
pm2 status

# Ver recursos utilizados
pm2 monit
```

### 🔹 2. Verificar Nginx
```bash
# Status do Nginx
sudo systemctl status nginx

# Testar configuração (NUNCA pule este passo)
sudo nginx -t

# Ver sites habilitados
ls -la /etc/nginx/sites-enabled/

# Ver configuração do PatrimônioUEG
cat /etc/nginx/sites-available/patrimonioueg

# Ver últimos logs
sudo tail -n 50 /var/log/nginx/access.log
sudo tail -n 50 /var/log/nginx/error.log
```

### 🔹 3. Verificar Portas em Uso
```bash
# Ver todas as portas ocupadas
sudo netstat -tlnp | grep LISTEN

# Ou usar ss (mais moderno)
sudo ss -tlnp | grep LISTEN

# Verificar portas específicas do PatrimônioUEG
sudo lsof -i :3000  # Backend original
sudo lsof -i :80
sudo lsof -i :443
```

### 🔹 4. Verificar PostgreSQL
```bash
# Status do PostgreSQL
sudo systemctl status postgresql

# Ver bancos existentes
sudo -u postgres psql -c "\l"

# Ver conexões ativas
sudo -u postgres psql -c "SELECT pid, usename, application_name, client_addr, state FROM pg_stat_activity WHERE datname = 'patrimonio';"
```

### 🔹 5. Verificar Espaço em Disco
```bash
# Ver espaço disponível
df -h

# Ver uso por diretório
du -sh /var/www/*
du -sh /home/usuario/*
```

### 🔹 6. Verificar Diretórios do PatrimônioUEG
```bash
# Listar estrutura atual
ls -la /var/www/
tree -L 2 /var/www/  # se disponível

# Ver proprietários e permissões
ls -la /var/www/patrimonio-frontend/
ls -la /home/usuario/  # onde deve estar o backend
```

### 🔹 7. Verificar Firewall
```bash
# Status do UFW
sudo ufw status verbose

# Ver regras detalhadas
sudo ufw status numbered
```

### 🔹 8. Verificar Logs de Sistema
```bash
# Logs gerais do sistema
sudo journalctl -xe --since "1 hour ago"

# Logs do Nginx específicos
sudo tail -n 100 /var/log/nginx/error.log | grep -i "error\|warn"
```

### 🔹 9. Verificar Node.js e NPM
```bash
# Versões instaladas
node --version
npm --version

# Localização do Node
which node
which npm

# Verificar NVM (se instalado)
nvm list
```

### 🔹 10. Verificar n8n
```bash
# Ver se n8n está rodando no PM2
pm2 list | grep n8n

# Ver logs do n8n
pm2 logs n8n --lines 50
```

---

## 📊 Script de Verificação Completa

Crie e execute este script para ter um relatório completo:

```bash
# Criar o script
cat > ~/verificar_servidor.sh << 'EOF'
#!/bin/bash
echo "======================================"
echo "🔍 RELATÓRIO DE VERIFICAÇÃO DO SERVIDOR"
echo "Data: $(date)"
echo "======================================"
echo ""

echo "📌 1. PROCESSOS PM2"
pm2 list
echo ""

echo "📌 2. NGINX STATUS"
sudo systemctl status nginx --no-pager | head -20
echo ""

echo "📌 3. PORTAS EM USO"
sudo ss -tlnp | grep LISTEN
echo ""

echo "📌 4. POSTGRESQL"
sudo systemctl status postgresql --no-pager | head -10
echo ""

echo "📌 5. ESPAÇO EM DISCO"
df -h
echo ""

echo "📌 6. MEMÓRIA"
free -h
echo ""

echo "📌 7. DIRETÓRIOS WEB"
ls -la /var/www/
echo ""

echo "📌 8. FIREWALL"
sudo ufw status verbose
echo ""

echo "======================================"
echo "✅ Verificação concluída!"
echo "======================================"
EOF

# Dar permissão de execução
chmod +x ~/verificar_servidor.sh

# Executar
~/verificar_servidor.sh
```

---

## 🎯 Análise: O que procurar

### ✅ Sinais de que está TUDO OK:
- PM2 mostra todos os processos com status "online"
- Nginx responde com "active (running)"
- `nginx -t` retorna "test is successful"
- PostgreSQL está ativo
- Portas 80, 443, 3000 (ou outra do backend) estão ocupadas
- Espaço em disco > 20% livre
- Sem erros nos últimos logs do Nginx

### ⚠️ Sinais de ATENÇÃO:
- Processo PM2 com status "errored" ou "stopped"
- Nginx com erros de configuração
- Portas duplicadas
- Disco com < 10% livre
- Erros 502/503/504 nos logs do Nginx
- Muitas conexões abertas no PostgreSQL

---

## 📝 Checklist ANTES do Deploy

- [ ] Todos os processos PM2 estão online
- [ ] Nginx está funcionando sem erros
- [ ] Teste de configuração do Nginx passou (`nginx -t`)
- [ ] PostgreSQL está ativo
- [ ] Tem pelo menos 2GB de espaço livre
- [ ] Backup do banco está atualizado
- [ ] URLs do PatrimônioUEG estão respondendo:
  - [ ] https://patrimonioueg.duckdns.org
  - [ ] https://patrimonioueg.duckdns.org/api
  - [ ] https://patrimonioueg.duckdns.org/n8n

---

## 🚨 Em Caso de Problemas

### Se o PM2 mostrar processos com erro:
```bash
# Ver logs do processo específico
pm2 logs patrimonio-backend --lines 100

# Reiniciar processo
pm2 restart patrimonio-backend

# Deletar e recriar (último recurso)
pm2 delete patrimonio-backend
pm2 start ecosystem.config.js
```

### Se o Nginx tiver erro:
```bash
# NÃO recarregue sem testar
sudo nginx -t

# Se o teste passar, aí sim:
sudo systemctl reload nginx

# Se não passar, revisar configuração
sudo nano /etc/nginx/sites-available/patrimonioueg
```

### Se PostgreSQL não responder:
```bash
# Verificar status
sudo systemctl status postgresql

# Reiniciar (CUIDADO!)
sudo systemctl restart postgresql

# Ver logs
sudo tail -n 100 /var/log/postgresql/postgresql-*.log
```

---

## ✅ Após Verificação

Salve o output de `pm2 list` e `sudo nginx -t` antes de fazer qualquer mudança!

```bash
# Criar snapshot do estado atual
pm2 list > ~/pm2-status-antes-deploy.txt
sudo nginx -t > ~/nginx-test-antes-deploy.txt 2>&1
df -h > ~/disk-antes-deploy.txt
```

**NÃO PROSSIGA COM O DEPLOY SE HOUVER ERROS CRÍTICOS!**
