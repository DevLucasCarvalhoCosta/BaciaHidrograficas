# 🖥️ Backend - ANA Integration Server

API REST para integração com a API da ANA (Agência Nacional de Águas).

## Tecnologias

- **Node.js 18** + Express 4
- **TypeScript 5**
- **Prisma 6** (ORM)
- **PostgreSQL 15**
- **Zod** (Validação)

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Gerar cliente Prisma
npx prisma generate

# Aplicar schema no banco
npx prisma db push
```

## Desenvolvimento

```bash
# Iniciar em modo desenvolvimento (hot reload)
npm run dev
```

O servidor estará disponível em `http://localhost:3001`.

## Build de Produção

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor compilado
npm start
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia servidor em produção |
| `npm run prisma:generate` | Gera cliente Prisma |
| `npm run prisma:migrate` | Executa migrations |
| `npm run db:push` | Sincroniza schema com banco |

## Estrutura

```
src/
├── index.ts          # Entry point
├── db/
│   └── prisma.ts     # Cliente Prisma
├── routes/
│   ├── ana.ts        # Rotas de integração ANA
│   └── dashboard.ts  # Rotas do dashboard
├── services/
│   ├── anaClient.ts  # Cliente HTTP para API ANA
│   ├── scheduler.ts  # Agendamento de tarefas
│   └── syncService.ts# Sincronização de dados
└── scripts/
    └── sync-ano-2025.ts  # Script de sincronização
```

## Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/ana/estacoes` | Lista estações |
| GET | `/api/ana/series/:codigo` | Dados de uma estação |
| POST | `/api/ana/series/sync` | Sincroniza dados |
| GET | `/api/dashboard/resumo` | Resumo estatístico |

## Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis.
