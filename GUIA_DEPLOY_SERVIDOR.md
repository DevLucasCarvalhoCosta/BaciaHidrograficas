# 🚀 Guia Completo de Deploy no Servidor

## 📋 Pré-requisitos no Servidor

### 1. Software Necessário
```bash
# Node.js 18+ e npm
node --version  # deve ser v18 ou superior
npm --version

# PostgreSQL
psql --version  # deve ser v14 ou superior

# PM2 (para gerenciar processos)
npm install -g pm2
```

### 2. Configurar Banco de Dados PostgreSQL

```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE baciahidrografica;

# Criar usuário
CREATE USER seu_usuario WITH PASSWORD 'sua_senha_segura';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE baciahidrografica TO seu_usuario;

# Sair
\q
```

---

## 📦 Passo 1: Clonar e Configurar Projeto

```bash
# Clonar repositório
cd /var/www
git clone https://github.com/DevLucasCarvalhoCosta/BaciaHidrograficas.git
cd BaciaHidrograficas

# Instalar dependências do backend
cd server
npm install

# Instalar dependências do frontend
cd ../web
npm install
cd ..
```

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### Backend (.env)
```bash
cd server
nano .env
```

Adicione:
```env
# Banco de Dados
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/baciahidrografica"

# API da ANA
ANA_BASE_URL="https://api.ana.gov.br/hidrowebservice"
ANA_IDENTIFICADOR="seu_identificador_ana"
ANA_SENHA="sua_senha_ana"

# Servidor
PORT=3000
NODE_ENV=production
```

Salve (Ctrl+O, Enter, Ctrl+X)

---

## 🗄️ Passo 3: Executar Migrations do Prisma

```bash
cd server

# Gerar cliente Prisma
npx prisma generate

# Rodar migrations (criar tabelas)
npx prisma migrate deploy

# Verificar se tabelas foram criadas
npx prisma studio
# Abra http://localhost:5555 para ver o banco
```

---

## 🌊 Passo 4: Sincronizar Estações do RS

### Método 1: Via Script (Recomendado)

```bash
cd server

# Criar script de sincronização
nano sync-estacoes-rs.ts
```

Cole o conteúdo:
```typescript
import { prisma } from './src/db/prisma';
import { AnaClient } from './src/services/anaClient';

const ANA_BASE_URL = process.env.ANA_BASE_URL || 'https://api.ana.gov.br/hidrowebservice';
const ANA_IDENTIFICADOR = process.env.ANA_IDENTIFICADOR || '';
const ANA_SENHA = process.env.ANA_SENHA || '';

async function main() {
  console.log('🚀 Sincronizando estações do RS...');
  
  const anaClient = new AnaClient({ baseURL: ANA_BASE_URL });
  
  // Login
  const { token } = await anaClient.login(ANA_IDENTIFICADOR, ANA_SENHA);
  console.log('✅ Token obtido');
  
  // Buscar estações do RS
  const estacoes = await anaClient.getInventarioHidro({
    unidadefederativa: 'RS'
  });
  
  console.log(`📊 ${estacoes.length} estações encontradas`);
  
  // Salvar no banco
  let salvos = 0;
  for (const estacao of estacoes) {
    await prisma.hidroStation.upsert({
      where: { codigoestacao: estacao.codigoestacao },
      update: estacao,
      create: estacao
    });
    salvos++;
  }
  
  console.log(`✅ ${salvos} estações salvas!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

Execute:
```bash
npx tsx sync-estacoes-rs.ts
```

### Método 2: Via API (alternativo)

```bash
# Primeiro inicie o servidor
npm run dev

# Em outro terminal, execute:
curl -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
  -H "Content-Type: application/json" \
  -d '{"unidadefederativa":"RS"}'
```

---

## 📊 Passo 5: Sincronizar Dados da Estação 75650010

```bash
cd server

# Rodar script de sincronização do ano 2025
npx tsx src/scripts/sync-ano-2025.ts
```

**Aguarde:** Este processo pode levar 10-15 minutos para buscar todo o ano de 2025.

Resultado esperado:
```
✅ Sincronização concluída!
📊 Total de registros processados: ~32000
📅 Período: Todo o ano de 2025
🏷️  Estação: 75650010
```

---

## 🏗️ Passo 6: Build do Frontend

```bash
cd web

# Fazer build de produção
npm run build

# Os arquivos serão gerados em dist/
ls -la dist/
```

---

## 🚀 Passo 7: Iniciar Serviços com PM2

### Backend
```bash
cd server

# Iniciar com PM2
pm2 start npm --name "bacia-api" -- run start

# Verificar
pm2 status
pm2 logs bacia-api
```

### Frontend (Nginx)

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar site
sudo nano /etc/nginx/sites-available/bacia
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # ou IP do servidor
    
    # Frontend
    location / {
        root /var/www/BaciaHidrograficas/web/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative:
```bash
sudo ln -s /etc/nginx/sites-available/bacia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ Passo 8: Verificar Funcionamento

### 1. Testar Backend
```bash
curl http://localhost:3000/api/ana/estacoes/hidro?uf=RS&tamanho=5
```

### 2. Testar Frontend
Abra navegador: `http://seu-ip-servidor`

### 3. Verificar PM2
```bash
pm2 status
pm2 logs bacia-api --lines 50
```

---

## 🔄 Passo 9: Automatizar Atualizações (Opcional)

### Script de Atualização Diária
```bash
nano ~/atualizar-dados.sh
```

Cole:
```bash
#!/bin/bash
cd /var/www/BaciaHidrograficas/server
npx tsx src/scripts/sync-ano-2025.ts
```

Torne executável:
```bash
chmod +x ~/atualizar-dados.sh
```

Agende no crontab:
```bash
crontab -e

# Adicionar linha (executa todo dia às 3h da manhã):
0 3 * * * /home/seu_usuario/atualizar-dados.sh >> /var/log/bacia-sync.log 2>&1
```

---

## 📝 Passo 10: Configurar PM2 para Iniciar Automaticamente

```bash
# Salvar configuração atual
pm2 save

# Configurar inicialização automática
pm2 startup

# Copie e execute o comando que aparecer
```

---

## 🔍 Comandos Úteis

### Gerenciar PM2
```bash
pm2 list              # Listar processos
pm2 restart bacia-api # Reiniciar
pm2 stop bacia-api    # Parar
pm2 logs bacia-api    # Ver logs
pm2 monit             # Monitorar recursos
```

### Ver Logs
```bash
# Backend
pm2 logs bacia-api --lines 100

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Atualizar Código
```bash
cd /var/www/BaciaHidrograficas
git pull

# Backend
cd server
npm install
pm2 restart bacia-api

# Frontend
cd ../web
npm install
npm run build
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart postgresql

# Testar conexão
psql -U seu_usuario -d baciahidrografica -h localhost
```

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo
sudo lsof -i :3000

# Matar processo
kill -9 PID
```

### Frontend mostra página em branco
```bash
# Verificar build
cd web
npm run build

# Verificar permissões
sudo chown -R www-data:www-data dist/

# Reiniciar Nginx
sudo systemctl restart nginx
```

### API retorna 502 Bad Gateway
```bash
# Verificar se backend está rodando
pm2 status

# Reiniciar backend
pm2 restart bacia-api

# Ver logs de erro
pm2 logs bacia-api --err
```

---

## 📊 Verificação Final

Execute esses comandos para confirmar que tudo está funcionando:

```bash
# 1. Banco de dados tem estações
psql -U seu_usuario -d baciahidrografica -c "SELECT COUNT(*) FROM \"HidroStation\" WHERE \"UF_Estacao\" = 'RS';"
# Deve retornar ~450

# 2. Banco de dados tem dados telemetricos
psql -U seu_usuario -d baciahidrografica -c "SELECT COUNT(*) FROM \"SerieTelemetrica\" WHERE codigoestacao = '75650010';"
# Deve retornar ~32000

# 3. API responde
curl http://localhost:3000/api/ana/estacoes/hidro?uf=RS | jq '.pagination.total'
# Deve retornar 450

# 4. Frontend acessível
curl -I http://localhost
# Deve retornar HTTP/1.1 200 OK
```

---

## 🎯 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado
- [ ] Migrations executadas
- [ ] Estações do RS sincronizadas (~450)
- [ ] Dados da estação 75650010 sincronizados (~32000 registros)
- [ ] Backend rodando com PM2
- [ ] Frontend buildado
- [ ] Nginx configurado e rodando
- [ ] PM2 configurado para auto-start
- [ ] Crontab para atualizações diárias (opcional)

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs:**
   - Backend: `pm2 logs bacia-api`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`

2. **Verificar status:**
   - `pm2 status`
   - `sudo systemctl status nginx`
   - `sudo systemctl status postgresql`

3. **Reiniciar tudo:**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   sudo systemctl restart postgresql
   ```

---

**✨ Agora seu sistema de Bacias Hidrográficas está rodando em produção!**
