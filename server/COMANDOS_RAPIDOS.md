# ⚡ Comandos Rápidos - Sincronização ANA 2025

## 🎯 Resumo da Implementação

✅ **API corrigida**: Agora usa `DATA_LEITURA` + `Data de Busca`  
✅ **Estação única**: Apenas `75650010` habilitada  
✅ **Script inteligente**: Busca mês a mês automaticamente  
✅ **Prisma atualizado**: Cliente regenerado com sucesso  

---

## 🚀 Comandos para Executar AGORA

### 1️⃣ Iniciar o servidor (Terminal 1)
```bash
cd server
npm run dev
```

### 2️⃣ Executar sincronização do ano 2025 (Terminal 2)
```bash
cd server
npx tsx src/scripts/sync-ano-2025.ts
```

**O script vai:**
- Buscar dados de **janeiro a dezembro de 2025**
- Fazer requisições **mês a mês** (30 dias por vez)
- Aguardar resposta antes de prosseguir
- Salvar tudo no banco PostgreSQL
- Mostrar progresso em tempo real

---

## 🧪 Testar Endpoints Manualmente

### Teste 1: Buscar dados sem salvar
```bash
curl http://localhost:3000/api/ana/series/test/75650010
```

### Teste 2: Buscar com data específica
```bash
curl "http://localhost:3000/api/ana/series/test/75650010?dataBusca=2025-10-01&rangeIntervalo=DIAS_30"
```

### Teste 3: Sincronizar e salvar dados
```bash
curl -X POST http://localhost:3000/api/ana/series/sync \
  -H "Content-Type: application/json" \
  -d "{\"codigoEstacao\":\"75650010\",\"dataBusca\":\"2025-10-01\",\"rangeIntervalo\":\"DIAS_30\"}"
```

### Teste 4: Consultar dados salvos
```bash
curl http://localhost:3000/api/ana/series/75650010
```

---

## 📊 Estrutura dos Parâmetros

```typescript
{
  "Codigos_Estacoes": "75650010",           // Código da estação
  "Tipo Filtro Data": "DATA_LEITURA",       // Tipo de filtro (corrigido!)
  "Data de Busca": "2025-10-01",            // Data de referência
  "Range Intervalo de busca": "DIAS_30"     // 30 dias antes da data
}
```

---

## 📁 Arquivos Modificados

| Arquivo | O que foi feito |
|---------|-----------------|
| `src/services/anaClient.ts` | ✅ Adicionado `DATA_LEITURA` + `Data de Busca` |
| `src/routes/ana.ts` | ✅ Validação de estação `75650010` |
| `src/scripts/sync-ano-2025.ts` | ✅ Script mês a mês criado |
| `prisma/schema.prisma` | ✅ Modelo `SerieTelemetrica` confirmado |

---

## 🎨 Fluxo do Dashboard (Futuro)

```
1. Usuário clica em "Buscar Dados Detalhados"
2. Frontend chama: GET /api/ana/series/test/75650010
3. Exibe dados em gráficos/tabelas
4. Não salva no banco (apenas visualização)
```

---

## 🔄 Fluxo do Script de Sincronização

```
1. Script inicia: sync-ano-2025.ts
2. Para cada mês (jan-dez 2025):
   a. Chama API com Data de Busca = último dia do mês
   b. Range = DIAS_30 (busca 30 dias anteriores)
   c. Aguarda resposta completa
   d. Salva no banco usando upsert
   e. Aguarda 2 segundos
   f. Próximo mês
3. Finaliza com resumo total
```

---

## ⚠️ Validações Ativas

- ✅ Apenas estação `75650010` permitida
- ✅ Data de Busca deve ser formato `yyyy-MM-dd`
- ✅ Range deve ser um dos valores válidos (DIAS_30, HORA_1, etc)
- ✅ Outras estações retornam erro 403

---

## 🐛 Problemas Conhecidos

### ❌ Erro: "Property 'serieTelemetrica' does not exist"
**Solução**: O VS Code precisa recarregar o TypeScript:
```bash
# PowerShell
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force

# Depois, no VS Code:
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### ❌ Erro: "Estação não permitida"
**Solução**: Apenas `75650010` está habilitada. Não tente outras estações.

### ❌ Erro: "Data de Busca inválida"
**Solução**: Use formato `yyyy-MM-dd`, exemplo: `2025-10-01`

---

## 📈 Dados Salvos no Banco

Cada registro contém:
- `codigoestacao`: "75650010"
- `Data_Hora_Medicao`: Timestamp da medição
- `Chuva_Acumulada` e `Chuva_Adotada`
- `Cota_Sensor` e `Cota_Adotada`
- `Vazao_Adotada`
- `Temperatura_Agua` e `Temperatura_Interna`
- `Pressao_Atmosferica`
- `Bateria`
- E mais 15 campos com status

---

## ✨ Próximos Passos

1. ✅ **Executar o script**: `npx tsx src/scripts/sync-ano-2025.ts`
2. ⏳ **Aguardar sincronização** (12 meses = ~12 requisições)
3. ⏳ **Criar dashboard** para visualizar dados
4. ⏳ **Adicionar gráficos** de chuva, vazão, cota
5. ⏳ **Implementar filtros** por período

---

## 🎯 Comando Único (Copy & Paste)

```bash
# Terminal 1 - Servidor
cd server && npm run dev

# Terminal 2 - Sincronização (execute depois que o servidor iniciar)
cd server && npx tsx src/scripts/sync-ano-2025.ts
```

---

**Status**: ✅ Pronto para executar  
**Tempo estimado**: ~2-3 minutos (12 requisições com delay)  
**Dados esperados**: ~15.000 registros (depende da frequência de medição)
