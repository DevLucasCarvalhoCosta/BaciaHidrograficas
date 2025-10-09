# ⚡ Comandos Úteis - Projeto ANA Hidro

## 🚀 Início Rápido

### Primeira Execução

```powershell
# 1. Instalar dependências do Backend
cd server
npm install

# 2. Configurar banco de dados
# Edite server/.env com suas credenciais PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/ana_hidro"
# ANA_BASE_URL="https://api.ana.gov.br/hidrowebservice"
# ANA_IDENTIFICADOR="seu_id"
# ANA_SENHA="sua_senha"

# 3. Gerar Prisma Client e aplicar migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Iniciar servidor backend
npm run dev
# Backend rodando em http://localhost:3000

# 5. Em OUTRO terminal - Instalar dependências do Frontend
cd web
npm install

# 6. Configurar variáveis de ambiente
# Crie web/.env:
# VITE_API_BASE_URL=http://localhost:3000

# 7. Iniciar aplicação frontend
npm run dev
# Frontend rodando em http://localhost:5173
```

---

## 🔧 Comandos do Backend (server/)

### Desenvolvimento
```powershell
npm run dev              # Inicia servidor em modo desenvolvimento (hot reload)
npm run build            # Compila TypeScript para JavaScript
npm start                # Inicia servidor compilado (produção)
npm run check            # Verifica TypeScript sem compilar
```

### Banco de Dados
```powershell
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate   # Cria e aplica migrations
npm run db:push          # Aplica schema sem criar migration
npx prisma studio        # Abre interface visual do banco
npx prisma db seed       # Popula banco com dados de exemplo (se configurado)
```

### Sincronização ANA
```powershell
# Usar API REST (via HTTP client ou browser)

# 1. Fazer login
POST http://localhost:3000/api/ana/login
Body: { "identificador": "seu_id", "senha": "sua_senha" }
# Retorna: { "token": "..." }

# 2. Sincronizar estações HIDRO de Goiás
POST http://localhost:3000/api/ana/estacoes/hidro/sync
Body: { "token": "token_do_login", "unidadefederativa": "GO" }

# 3. Listar estações sincronizadas
GET http://localhost:3000/api/ana/estacoes/hidro?unidadefederativa=GO
```

---

## 🎨 Comandos do Frontend (web/)

### Desenvolvimento
```powershell
npm run dev              # Inicia Vite dev server (http://localhost:5173)
npm run build            # Build para produção (pasta dist/)
npm run preview          # Preview do build de produção
```

### Type Checking
```powershell
npx tsc --noEmit         # Verifica tipos TypeScript sem compilar
```

### Linting (se configurado)
```powershell
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige problemas automaticamente
```

---

## 📦 Instalação de Dependências

### Adicionar Nova Biblioteca

#### Backend
```powershell
cd server
npm install nome-do-pacote
npm install -D @types/nome-do-pacote  # Se houver tipos TypeScript
```

#### Frontend
```powershell
cd web
npm install nome-do-pacote
npm install -D @types/nome-do-pacote  # Se houver tipos
```

### Atualizar Dependências
```powershell
# Verificar pacotes desatualizados
npm outdated

# Atualizar todos (cuidado em produção!)
npm update

# Atualizar um específico
npm install nome-pacote@latest
```

---

## 🗺️ Trocar Provider de Tiles do Mapa

Edite `web/src/components/MapView.tsx` (linha ~416):

### CartoDB Voyager (Atual)
```tsx
url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
```

### CartoDB Positron (Claro/Minimalista)
```tsx
url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
```

### CartoDB Dark Matter (Escuro)
```tsx
url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
```

### OpenStreetMap (Original)
```tsx
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
```

### Stamen Toner (Preto e Branco)
```tsx
url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png"
attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>'
```

---

## 🎨 Personalizar Cores do Tema

Edite `web/src/styles.css` (início do arquivo):

```css
:root {
  /* Mudar cor principal (azul -> verde exemplo) */
  --color-primary: #10b981;           /* de #0284c7 */
  --color-primary-hover: #059669;     /* de #0369a1 */
  --color-primary-light: #d1fae5;     /* de #e0f2fe */
  
  /* Ajuste outros se necessário */
  --color-secondary: #14b8a6;
  --color-accent: #5eead4;
}
```

---

## 🔍 Debug & Logs

### Ver logs do backend
```powershell
cd server
npm run dev
# Logs aparecem no terminal
```

### Ver logs do frontend
- Abra DevTools do navegador (F12)
- Aba Console mostra erros e logs
- Aba Network mostra requisições HTTP

### Limpar cache do navegador
```
Chrome/Edge: Ctrl + Shift + R (Windows)
Firefox: Ctrl + Shift + R
Safari: Cmd + Option + R (Mac)
```

---

## 🐛 Resolução de Problemas

### Backend não inicia
```powershell
# Verificar se PostgreSQL está rodando
# Verificar .env está configurado
# Verificar porta 3000 não está em uso
netstat -ano | findstr :3000
```

### Frontend não conecta ao backend
```powershell
# Verificar VITE_API_BASE_URL no .env
# Verificar backend está rodando (http://localhost:3000/health)
# Abrir DevTools -> Network -> ver requisições
```

### Erro de CORS
```
Solução: Verificar cors está habilitado no server/src/index.ts
app.use(cors())
```

### Marcadores não aparecem
```powershell
# Verificar se há dados no banco
# Executar sync das estações:
POST http://localhost:3000/api/ana/estacoes/hidro/sync
```

### Build do frontend falha
```powershell
cd web
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Testes de API (usando requests.http)

Edite `server/requests.http` e use extensão REST Client do VS Code:

```http
### Login
POST http://localhost:3000/api/ana/login
Content-Type: application/json

{
  "identificador": "{{$dotenv ANA_IDENTIFICADOR}}",
  "senha": "{{$dotenv ANA_SENHA}}"
}

### Sincronizar Estações GO
POST http://localhost:3000/api/ana/estacoes/hidro/sync
Content-Type: application/json

{
  "token": "SEU_TOKEN_AQUI",
  "unidadefederativa": "GO"
}

### Listar Estações
GET http://localhost:3000/api/ana/estacoes/hidro?unidadefederativa=GO&pagina=1&tamanho=50
```

---

## 🚀 Deploy (Opcional)

### Frontend (Vercel/Netlify)
```powershell
cd web
npm run build
# Upload pasta dist/ para Vercel/Netlify
# Configurar variável: VITE_API_BASE_URL=https://seu-backend.com
```

### Backend (Heroku/Railway)
```powershell
cd server
# Configurar Procfile:
# web: node dist/index.js

# Configurar variáveis de ambiente no serviço
# DATABASE_URL=postgresql://...
# PORT=3000
# ANA_BASE_URL=...
```

---

## 📚 Documentação de Referências

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **Leaflet**: https://leafletjs.com
- **React Leaflet**: https://react-leaflet.js.org
- **Prisma**: https://www.prisma.io/docs
- **Express**: https://expressjs.com
- **CartoDB**: https://carto.com/attributions

---

## 🎯 Comandos para Apresentação/Demo

### 1. Preparar Demo
```powershell
# Terminal 1
cd server
npm run dev

# Terminal 2
cd web
npm run dev

# Abrir http://localhost:5173
```

### 2. Sincronizar Dados Frescos
```http
POST http://localhost:3000/api/ana/estacoes/hidro/sync
Body: { "unidadefederativa": "GO" }
```

### 3. Verificar Estatísticas
```http
GET http://localhost:3000/api/ana/estacoes/hidro?unidadefederativa=GO
```

---

**💡 Dica**: Salve este arquivo como atalho para referência rápida durante o desenvolvimento!
