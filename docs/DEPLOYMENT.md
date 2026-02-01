# 🚀 Guia de Deploy

Este documento descreve como fazer deploy do sistema em diferentes ambientes.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Deploy Local (Desenvolvimento)](#deploy-local-desenvolvimento)
- [Deploy com Docker](#deploy-com-docker)
- [Deploy em Produção](#deploy-em-produção)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Pré-requisitos

- **Node.js** 18+
- **PostgreSQL** 15+
- **Docker** (opcional, para deploy containerizado)
- **PM2** (para produção)
- **Nginx** (para produção)

---

## Deploy Local (Desenvolvimento)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Edite .env com suas configurações

# Configurar banco de dados
npx prisma generate
npx prisma db push

# Iniciar em modo desenvolvimento
npm run dev
```

### 2. Frontend

```bash
cd web
npm install
cp .env.example .env
# Edite .env se necessário

npm run dev
```

---

## Deploy com Docker

### Usando Docker Compose

```bash
# Na raiz do projeto
docker-compose up -d
```

O arquivo `docker-compose.yml` na pasta `docker/` contém a configuração completa.

---

## Deploy em Produção

### 1. Preparar Servidor

```bash
# Instalar dependências do sistema
sudo apt update && sudo apt install -y nodejs npm postgresql nginx

# Instalar PM2 globalmente
npm install -g pm2
```

### 2. Backend

```bash
cd server
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
```

### 3. Frontend

```bash
cd web
npm install
npm run build

# Copiar build para nginx
sudo cp -r dist/* /var/www/html/ana/
```

### 4. Configurar Nginx

Configure o proxy reverso usando os arquivos em `docker/nginx/`.

---

## Variáveis de Ambiente

### Backend (`server/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente | `production` |
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `ANA_BASE_URL` | URL base da API ANA | `https://api.ana.gov.br/hidrowebservice` |
| `ANA_IDENTIFICADOR` | Identificador de acesso | - |
| `ANA_SENHA` | Senha de acesso | - |

### Frontend (`web/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL da API backend | `http://localhost:3001` |

---

## Troubleshooting

### Problema: Conexão recusada com banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `DATABASE_URL`

### Problema: API ANA não responde
- Verifique se `ANA_BASE_URL` está correto
- Confirme as credenciais de acesso

### Problema: Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está configurado corretamente
- Confirme que o backend está rodando
