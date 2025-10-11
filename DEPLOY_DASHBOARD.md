# 🚀 Deploy do Dashboard - Instruções Completas

## 📋 Resumo do Problema
O dashboard não estava funcionando porque:
1. ❌ O arquivo `dashboard.ts` não estava sendo compilado no container
2. ❌ O NGINX estava configurado apenas para rotas com prefixo `/ana/`
3. ❌ O frontend chamava diretamente `/api/dashboard/` (sem prefixo)

## ✅ Soluções Aplicadas

### 1. Configuração do NGINX Corrigida
- ✅ Adicionadas rotas diretas `/api/dashboard/` e `/api/ana/`
- ✅ Mantidas rotas com prefixo `/ana/` para compatibilidade
- ✅ Arquivo: `docker/nginx/includes/app-ana.conf`

### 2. Código do Backend
- ✅ Arquivo `server/src/routes/dashboard.ts` existe e está completo
- ✅ Arquivo `server/src/index.ts` carrega as rotas corretamente
- ✅ Dockerfile está configurado para build multi-stage

## 🔧 Como Fazer Deploy

### Opção 1: Deploy via Git (Recomendado)

```bash
# No seu PC (Windows)
cd c:\Users\KUMA\Documents\ProjetoTcc

# 1. Commitar tudo
git add .
git commit -m "fix: adicionar rotas do dashboard e corrigir configuração NGINX"
git push

# No servidor (SSH)
cd ~/docker-ueg-projects

# 2. Fazer pull
git pull

# 3. Rebuild do backend
docker-compose build ana-backend --no-cache

# 4. Reiniciar containers
docker-compose up -d ana-backend

# 5. Verificar
docker logs ana-backend --tail 20
docker exec ana-backend ls -la /app/dist/routes/
```

### Opção 2: Deploy Manual (Rápido)

**No servidor SSH, execute:**

```bash
cd ~/docker-ueg-projects

# 1. Copiar código do servidor para o diretório correto
cp -r ~/docker-ueg-projects/server/* ~/docker-ueg-projects/server/ 2>/dev/null || true

# 2. Rebuild do backend
docker-compose build ana-backend --no-cache

# 3. Reiniciar
docker-compose up -d ana-backend

# 4. Ver logs
docker logs ana-backend --tail 20 -f
```

## 🧪 Testes

Depois do deploy, teste os endpoints:

```bash
# Teste 1: API de estações (deve retornar 200)
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  https://patrimonioueg.duckdns.org/api/ana/estacoes/hidro?unidadefederativa=GO

# Teste 2: Dashboard stats (deve retornar 200)
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  https://patrimonioueg.duckdns.org/api/dashboard/stats/75650010

# Teste 3: Ver dados completos
curl -s https://patrimonioueg.duckdns.org/api/dashboard/stats/75650010 | head -20
```

## 📊 Verificação Final

```bash
# 1. Ver se dashboard.js foi criado
docker exec ana-backend ls -la /app/dist/routes/

# 2. Ver logs do backend
docker logs ana-backend --tail 50

# 3. Testar no navegador
# Acesse: https://patrimonioueg.duckdns.org/ana/
# Clique na estação 75650010
# Verifique se o dashboard carrega
```

## 🔄 Estrutura de Arquivos

```
ProjetoTcc/
├── server/
│   ├── src/
│   │   ├── index.ts              ✅ Carrega as rotas
│   │   ├── routes/
│   │   │   ├── ana.ts            ✅ Rotas da API ANA
│   │   │   └── dashboard.ts      ✅ Rotas do Dashboard
│   │   ├── services/
│   │   └── db/
│   ├── Dockerfile.production     ✅ Build multi-stage
│   └── package.json
├── docker/
│   └── nginx/
│       └── includes/
│           └── app-ana.conf      ✅ Configuração corrigida
└── web/
    └── src/
        ├── components/
        │   └── StationDashboard.tsx  ✅ Frontend do dashboard
        └── services/
            └── api.ts
```

## ⚠️ Troubleshooting

### Erro: "Cannot GET /api/dashboard/stats/..."
**Causa:** O arquivo dashboard.js não foi compilado no container

**Solução:**
```bash
docker-compose build ana-backend --no-cache
docker-compose up -d ana-backend
docker exec ana-backend ls -la /app/dist/routes/  # Deve mostrar dashboard.js
```

### Erro: 404 nas rotas do dashboard
**Causa:** NGINX não tem as rotas diretas configuradas

**Solução:** Já corrigido no arquivo `docker/nginx/includes/app-ana.conf`

### Container não inicia
**Causa:** Erro de compilação TypeScript

**Solução:**
```bash
# Ver logs de build
docker-compose build ana-backend

# Ver logs do container
docker logs ana-backend
```

## ✨ Resultado Esperado

Depois do deploy correto:
- ✅ `/api/ana/estacoes` retorna 200
- ✅ `/api/dashboard/stats/75650010` retorna 200
- ✅ Dashboard carrega no navegador
- ✅ Gráficos e tabelas são exibidos
- ✅ Filtros funcionam corretamente

## 📝 Checklist Final

- [ ] Código commitado no Git
- [ ] Pull feito no servidor
- [ ] Backend rebuilded com --no-cache
- [ ] Container reiniciado
- [ ] Arquivo dashboard.js existe em /app/dist/routes/
- [ ] Endpoints retornam 200
- [ ] Dashboard funciona no navegador
- [ ] Sem erros no console do navegador

---

**Data:** 11/10/2025
**Status:** ✅ Configurações corrigidas, aguardando deploy
