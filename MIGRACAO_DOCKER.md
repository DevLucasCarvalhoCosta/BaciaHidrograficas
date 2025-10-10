# 🐳 GUIA DE MIGRAÇÃO PARA DOCKER

## 📋 VISÃO GERAL

Esta migração transforma a arquitetura atual de múltiplos serviços rodando diretamente no servidor para uma **arquitetura containerizada e isolada**.

### ✅ BENEFÍCIOS

1. **Isolamento Completo**: Cada aplicação roda em sua própria rede isolada
2. **Segurança**: Containers não conseguem acessar recursos de outros projetos
3. **Portabilidade**: Deploy em qualquer servidor que tenha Docker
4. **Versionamento**: Rollback fácil em caso de problemas
5. **Escalabilidade**: Fácil adicionar réplicas ou recursos
6. **Manutenção**: Atualizar um projeto não afeta os outros

---

## 🏗️ ARQUITETURA ATUAL vs NOVA

### ❌ ARQUITETURA ATUAL (Problemática)

```
┌─────────────────────────────────────────────────┐
│         Servidor Ubuntu (Bare Metal)            │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  PM2     │  │  Python  │  │ Docker   │     │
│  │          │  │ Gunicorn │  │  (n8n)   │     │
│  ├──────────┤  ├──────────┤  └──────────┘     │
│  │patrimonio│  │ estresse │                    │
│  │ana-back  │  │          │                    │
│  └──────────┘  └──────────┘                    │
│                                                 │
│  ┌─────────────────────────────────┐           │
│  │    PostgreSQL (ÚNICA INSTÂNCIA)  │           │
│  │  ├─ DB patrimonio                │           │
│  │  ├─ DB estresse                  │           │
│  │  └─ DB ana_hidro                 │           │
│  └─────────────────────────────────┘           │
│                                                 │
│  ┌─────────────────────────────────┐           │
│  │         Nginx (Monolítico)       │           │
│  │  Todas as rotas em 1 arquivo     │           │
│  └─────────────────────────────────┘           │
└─────────────────────────────────────────────────┘

PROBLEMAS:
- Aplicações podem acessar dados de outras
- Conflitos de portas
- Dependências compartilhadas (Node, Python, etc)
- Difícil isolar falhas
- Deploy afeta todo o servidor
```

### ✅ NOVA ARQUITETURA (Isolada)

```
┌──────────────────────────────────────────────────────────────┐
│              Servidor Ubuntu + Docker                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────┐      │
│  │           NGINX (Único ponto de entrada)           │      │
│  │               Porta 80/443 (SSL)                   │      │
│  └────┬───────┬───────┬───────┬─────────────────────┘      │
│       │       │       │       │                              │
│  ┌────▼────┐ ┌▼─────┐ ┌▼────┐ ┌▼────┐                      │
│  │ Rede    │ │ Rede │ │Rede │ │Rede │                      │
│  │Patrimônio│ │Estres│ │ ANA │ │n8n │                      │
│  │         │ │  se  │ │     │ │    │                      │
│  │┌───────┐│ │┌────┐│ │┌───┐│ │┌──┐│                      │
│  ││Backend││ ││App ││ ││Back││ ││n8││                      │
│  ││:3000  ││ ││:8050││ ││:301││ ││n ││                      │
│  │└───────┘│ │└────┘│ │└───┘│ │└──┘│                      │
│  │┌───────┐│ │┌────┐│ │┌───┐│ │    │                      │
│  ││Front  ││ ││DB  ││ ││Fron││ │    │                      │
│  │└───────┘│ │└────┘│ │└───┘│ │    │                      │
│  │┌───────┐│ │      │ │┌───┐│ │    │                      │
│  ││  DB   ││ │      │ ││DB ││ │    │                      │
│  │└───────┘│ │      │ │└───┘│ │    │                      │
│  └─────────┘ └──────┘ └─────┘ └────┘                      │
│     172.20    172.21   172.22  172.23                       │
│     .0.0/24   .0.0/24  .0.0/24 .0.0/24                      │
└──────────────────────────────────────────────────────────────┘

VANTAGENS:
✅ Cada projeto tem sua própria rede isolada
✅ Bancos de dados separados por container
✅ Zero compartilhamento de recursos
✅ Falha em um projeto não afeta outros
✅ Deploy independente por projeto
✅ Fácil rollback e versionamento
```

---

## 📂 ESTRUTURA DE ARQUIVOS CRIADA

```
ProjetoTcc/
├── docker-compose.production.yml    # Orquestração de todos os containers
├── .env.production.example          # Template de variáveis de ambiente
│
├── server/                          # Backend ANA Hidro
│   ├── Dockerfile.production        # Build otimizado multi-stage
│   └── ...
│
├── docker/
│   └── nginx/
│       ├── nginx.conf               # Configuração principal
│       ├── conf.d/
│       │   ├── default.conf         # Server blocks HTTP/HTTPS
│       │   └── upstreams.conf       # Definição de backends
│       └── includes/
│           ├── proxy-params.conf    # Parâmetros de proxy comuns
│           ├── app-patrimonio.conf  # Rotas do PatrimônioUEG
│           ├── app-estresse.conf    # Rotas do Dash Estresse
│           ├── app-ana.conf         # Rotas do ANA Hidro
│           └── app-n8n.conf         # Rotas do n8n
```

---

## 🚀 PASSO A PASSO DA MIGRAÇÃO

### FASE 1: PREPARAÇÃO (SEM DOWNTIME)

#### 1.1. Backup Completo

```bash
# No servidor
ssh -p 8740 usuario@200.137.241.42

# Criar diretório de backup
mkdir -p ~/backup-pre-docker/$(date +%Y%m%d)
cd ~/backup-pre-docker/$(date +%Y%m%d)

# Backup dos bancos de dados
sudo -u postgres pg_dump patrimonio > patrimonio.sql
sudo -u postgres pg_dump estresse > estresse.sql
sudo -u postgres pg_dump ana_hidro > ana_hidro.sql

# Backup dos códigos
cp -r /var/www/patrimonial-frontend ./
cp -r /var/www/ana-frontend ./
cp -r ~/ana-backend ./

# Backup do Nginx
sudo cp -r /etc/nginx ./nginx-config/

# Backup do PM2
pm2 save
cp ~/.pm2/dump.pm2 ./

# Verificar backups
ls -lh
```

#### 1.2. Instalar Docker (se ainda não tiver)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sudo sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version

# IMPORTANTE: Fazer logout e login novamente para o grupo ter efeito
exit
```

#### 1.3. Preparar Arquivos no Servidor

```bash
# Reconectar ao servidor
ssh -p 8740 usuario@200.137.241.42

# Criar diretório do projeto
mkdir -p ~/docker-projects
cd ~/docker-projects
```

Agora **envie os arquivos do seu computador**:

```powershell
# No seu computador (PowerShell)
cd C:\Users\KUMA\Documents\ProjetoTcc

# Enviar docker-compose
scp -P 8740 docker-compose.production.yml usuario@200.137.241.42:~/docker-projects/

# Enviar configurações do Nginx
scp -P 8740 -r docker/nginx usuario@200.137.241.42:~/docker-projects/docker/

# Enviar .env (criar primeiro!)
scp -P 8740 .env.production usuario@200.137.241.42:~/docker-projects/.env
```

---

### FASE 2: CONFIGURAÇÃO

#### 2.1. Criar arquivo .env

```bash
# No servidor
cd ~/docker-projects

# Copiar template
cp .env.production.example .env

# Editar com senhas reais
nano .env
```

Preencha com as senhas dos bancos atuais:

```env
PATRIMONIO_DB_USER=postgres
PATRIMONIO_DB_PASSWORD=SENHA_DO_POSTGRES_AQUI

ESTRESSE_DB_USER=postgres
ESTRESSE_DB_PASSWORD=MESMA_SENHA

ANA_DB_USER=postgres
ANA_DB_PASSWORD=MESMA_SENHA

N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

#### 2.2. Preparar Códigos dos Projetos

```bash
cd ~/docker-projects

# Criar estrutura de diretórios
mkdir -p patrimonio/backend patrimonio/frontend/dist
mkdir -p estresse
mkdir -p server web/dist

# Copiar códigos existentes
cp -r /var/www/patrimonial-frontend/* patrimonio/frontend/dist/
cp -r ~/ana-backend/* server/
cp -r /var/www/ana-frontend/dist/* web/dist/

# TODO: Você precisará copiar o código do patrimonio-backend e estresse
```

---

### FASE 3: MIGRAÇÃO DOS BANCOS DE DADOS

#### 3.1. Iniciar apenas os containers de banco

```bash
cd ~/docker-projects

# Subir apenas os bancos
docker compose -f docker-compose.production.yml up -d \
  patrimonio-db estresse-db ana-db

# Aguardar inicialização (30 segundos)
sleep 30

# Verificar status
docker compose ps
```

#### 3.2. Restaurar dados

```bash
# Restaurar PatrimônioUEG
docker compose exec -T patrimonio-db psql -U patrimonio_user -d patrimonio \
  < ~/backup-pre-docker/*/patrimonio.sql

# Restaurar Estresse
docker compose exec -T estresse-db psql -U estresse_user -d estresse \
  < ~/backup-pre-docker/*/estresse.sql

# Restaurar ANA Hidro
docker compose exec -T ana-db psql -U ana_user -d ana_hidro \
  < ~/backup-pre-docker/*/ana_hidro.sql

# Verificar dados
docker compose exec patrimonio-db psql -U patrimonio_user -d patrimonio -c "\dt"
```

---

### FASE 4: BUILD E TESTE (SEM DOWNTIME AINDA)

#### 4.1. Build das imagens

```bash
cd ~/docker-projects

# Build da imagem do ANA backend
docker compose build ana-backend

# Verificar imagem criada
docker images | grep ana
```

#### 4.2. Testar containers (porta alternativa)

```bash
# Subir todos os containers (exceto nginx)
docker compose up -d \
  patrimonio-backend patrimonio-frontend \
  estresse-app \
  ana-backend ana-frontend

# Verificar logs
docker compose logs -f --tail=50

# Testar saúde dos serviços
docker compose ps

# Testar endpoints
curl http://localhost:3000/health  # PatrimônioUEG (se exposto)
curl http://localhost:3001/health  # ANA Hidro (se exposto)
```

---

### FASE 5: CUTOVER (DOWNTIME ~2 MINUTOS)

#### 5.1. Parar serviços antigos

```bash
# Parar PM2
pm2 stop all
pm2 save

# Parar PostgreSQL nativo (se não usar mais)
# sudo systemctl stop postgresql
# CUIDADO: Só faça isso se tiver certeza que os dados foram migrados!

# Parar Nginx antigo
sudo systemctl stop nginx
```

#### 5.2. Subir Nginx containerizado

```bash
cd ~/docker-projects

# Iniciar nginx
docker compose up -d nginx

# Verificar logs
docker compose logs -f nginx

# Verificar se está respondendo
curl -k https://localhost/health
```

#### 5.3. Verificar aplicações

Abra no navegador:
- https://patrimonioueg.duckdns.org (PatrimônioUEG)
- https://patrimonioueg.duckdns.org/estresse (Dash Estresse)
- https://patrimonioueg.duckdns.org/ana (ANA Hidro)
- https://patrimonioueg.duckdns.org/n8n (n8n)

---

## 🔧 COMANDOS ÚTEIS

### Gerenciamento

```bash
# Ver status de todos os containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f ana-backend

# Reiniciar um serviço
docker compose restart ana-backend

# Parar todos
docker compose down

# Parar e remover volumes (CUIDADO!)
docker compose down -v

# Atualizar um serviço
docker compose up -d --build ana-backend
```

### Monitoramento

```bash
# Uso de recursos
docker stats

# Inspecionar um container
docker inspect ana-backend

# Entrar em um container
docker compose exec ana-backend sh

# Ver redes
docker network ls
docker network inspect docker-projects_ana_network
```

### Troubleshooting

```bash
# Ver todos os logs
docker compose logs --tail=100

# Verificar conectividade entre containers
docker compose exec nginx ping ana-backend

# Testar DNS interno
docker compose exec nginx nslookup ana-backend

# Ver configuração do Nginx
docker compose exec nginx nginx -T
```

---

## 🔄 ROLLBACK EM CASO DE PROBLEMAS

```bash
# Parar containers Docker
cd ~/docker-projects
docker compose down

# Reiniciar serviços antigos
pm2 resurrect
sudo systemctl start nginx
sudo systemctl start postgresql  # se tiver parado
```

---

## 📊 CHECKLIST FINAL

- [ ] Todos os backups realizados
- [ ] Docker e Docker Compose instalados
- [ ] Arquivo `.env` configurado
- [ ] Todos os códigos copiados
- [ ] Bancos de dados migrados e verificados
- [ ] Containers buildados com sucesso
- [ ] Testes de conectividade OK
- [ ] Nginx containerizado respondendo
- [ ] Todas as URLs funcionando
- [ ] SSL/HTTPS funcionando
- [ ] Logs sem erros críticos
- [ ] Serviços antigos desabilitados

---

## 🆘 SUPORTE

Em caso de problemas durante a migração:

1. **NÃO DELETE OS BACKUPS!**
2. Execute rollback (ver seção acima)
3. Verifique logs: `docker compose logs`
4. Teste conectividade: `docker compose exec nginx ping <serviço>`
5. Revise `.env` e senhas de banco

---

## 📈 PRÓXIMOS PASSOS PÓS-MIGRAÇÃO

1. **Configurar CI/CD** com GitHub Actions para deploy automatizado
2. **Monitoramento** com Prometheus + Grafana
3. **Backup automatizado** dos volumes Docker
4. **Log aggregation** com ELK Stack ou Loki
5. **Alertas** via Telegram/Email

---

**Autor**: GitHub Copilot  
**Data**: Outubro 2025  
**Versão**: 1.0
