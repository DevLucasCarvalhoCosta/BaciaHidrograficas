# ANA Integration Server (Backend)

Backend Node.js + TypeScript para integrar com a API da ANA (Agência Nacional de Águas). Este serviço expõe um endpoint de login que chama o endpoint oficial da ANA (GET /EstacoesTelemetricas/OAUth/v1) e retorna o token.

## Requisitos
- Node.js 18+ (recomendado) e npm
- Acesso à API da ANA (URL base e credenciais)

## Configuração
1. Instale as dependências:
   ```powershell
   cd "c:\Users\KUMA\Documents\ProjetoTcc\server"
   npm install
   ```
2. Crie o arquivo `.env` baseado em `.env.example`:
   ```ini
   PORT=3000
  # ANA_BASE_URL deve ser apenas a base (sem o caminho de auth)
  # Exemplo correto: https://api.ana.gov.br/hidrowebservice
  # NÃO incluir: /EstacoesTelemetricas/OAUth/v1
  ANA_BASE_URL=https://<sua-base-da-ana>
   # opcional: pode enviar no body também
   ANA_IDENTIFICADOR=<seu-identificador>
   ANA_SENHA=<sua-senha>
   
  # Postgres
  # Exemplo: postgresql://postgres:postgres@localhost:5432/ana_db?schema=public
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ana_db?schema=public
   ```

## Rodando em desenvolvimento
```powershell
cd "c:\Users\KUMA\Documents\ProjetoTcc\server"
npx ts-node-dev --respawn --transpile-only src/index.ts
```

Você deve ver no terminal: `Server listening on http://localhost:3000`.

## Testando
- Healthcheck:
  ```powershell
  Invoke-RestMethod -Uri http://localhost:3000/health | ConvertTo-Json -Depth 5
  ```
- Login (enviando credenciais no body):
  ```powershell
  $body = @{ identificador = "<seu-identificador>"; senha = "<sua-senha>" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/ana/login -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
  ```
- Login (usando credenciais do `.env`, body vazio):
  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/ana/login -ContentType 'application/json' -Body '{}' | ConvertTo-Json -Depth 5
  ```

Se as credenciais e a URL base estiverem corretas, a resposta conterá um `token` (string) para uso nos próximos endpoints da ANA.

## Banco de Dados (Postgres + Prisma)

1. Suba o Postgres com Docker:
   ```powershell
   cd "c:\Users\KUMA\Documents\ProjetoTcc\server"
   docker compose up -d
   ```
2. Gere o client Prisma e crie o schema no banco:
   ```powershell
   npm run prisma:generate
   npm run db:push
   ```

## Sincronizar inventário HidroSat
- Endpoint: `POST /api/ana/estacoes/hidrosat/sync`
- Opções de autenticação:
  - Enviar `{ token: "<token>" }` no body, ou
  - Enviar `{ identificador, senha }` no body (ou definir no `.env`).

Exemplos (Git Bash):
```bash
curl.exe -s -X POST "http://localhost:3000/api/ana/estacoes/hidrosat/sync" \
  -H "Content-Type: application/json" \
  -d "{\"identificador\":\"<seu-identificador>\",\"senha\":\"<sua-senha>\"}"

# Com token já obtido
curl.exe -s -X POST "http://localhost:3000/api/ana/estacoes/hidrosat/sync" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"<seu-token>\"}"
```

Resposta esperada:
```json
{ "total": <itens retornados>, "upserted": <quantidade persistida> }
```

## Notas
- O endpoint oficial de login da ANA é um GET com headers `Identificador` e `Senha`. Este backend encapsula essa chamada e normaliza o retorno para `{ token: "..." }`.
- Erros da ANA (HTTP 4xx/5xx) são propagados como erro do nosso endpoint com a mensagem informada.
- Não faça commit do arquivo `.env` (já ignorado no `.gitignore`).