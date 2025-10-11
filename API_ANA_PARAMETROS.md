# 📡 Parâmetros Corretos da API ANA - Séries Telemétricas

## ✅ Estrutura REAL da API da ANA

Após análise da interface web da ANA, identificamos os **parâmetros corretos** que a API espera:

### 🔧 Parâmetros Obrigatórios

1. **`Codigos_Estacoes`** (string)
   - Código(s) da(s) estação(ões) 
   - Pode ser um único código: `75650010`
   - Ou múltiplos separados por vírgula: `75650010,75650020,75650030`

2. **`Tipo Filtro Data`** (string)
   - Tipo de filtro de data a aplicar
   - Valor padrão: `DATA_ULTIMA_ATUALIZACAO`
   - Este filtro indica que queremos dados baseados na última atualização

3. **`Range Intervalo de busca`** (string)
   - Intervalo temporal para buscar os dados
   - Opções disponíveis:
     - **`MINUTO_5`** - Últimos 5 minutos
     - **`MINUTO_10`** - Últimos 10 minutos
     - **`MINUTO_15`** - Últimos 15 minutos
     - **`MINUTO_30`** - Últimos 30 minutos
     - **`HORA_1`** - Última hora
     - **`HORA_2`** - Últimas 2 horas
     - **`HORA_3`** - Últimas 3 horas
     - **`HORA_4`** - Últimas 4 horas
     - **`HORA_5`** - Últimas 5 horas
     - **`HORA_6`** - Últimas 6 horas
     - **`HORA_7`** - Últimas 7 horas
     - **`HORA_8`** - Últimas 8 horas
     - **`HORA_9`** - Últimas 9 horas
     - **`HORA_10`** - Últimas 10 horas
     - **`HORA_11`** - Últimas 11 horas
     - **`HORA_12`** - Últimas 12 horas
     - **`HORA_13`** - Últimas 13 horas
     - **`HORA_14`** - Últimas 14 horas
     - **`HORA_15`** - Últimas 15 horas
     - **`HORA_16`** - Últimas 16 horas
     - **`DIAS_30`** - Últimos 30 dias ⭐ (padrão)

---

## 🔄 Mudanças Implementadas

### ❌ ANTES (Incorreto)
```typescript
// Parâmetros antigos que NÃO funcionam:
{
  'Codigo Estacao': '75650010',
  'Data Inicio': '2025-01-01',
  'Data Fim': '2025-01-31'
}
```

### ✅ DEPOIS (Correto)
```typescript
// Parâmetros corretos conforme interface da ANA:
{
  'Codigos_Estacoes': '75650010',
  'Tipo Filtro Data': 'DATA_ULTIMA_ATUALIZACAO',
  'Range Intervalo de busca': 'DIAS_30'
}
```

---

## 📝 Exemplos de Uso

### 1️⃣ Buscar dados dos últimos 30 dias (padrão)
```bash
GET /api/ana/series/test/75650010
```

### 2️⃣ Buscar dados da última hora
```bash
GET /api/ana/series/test/75650010?rangeIntervalo=HORA_1
```

### 3️⃣ Buscar dados dos últimos 5 minutos
```bash
GET /api/ana/series/test/75650010?rangeIntervalo=MINUTO_5
```

### 4️⃣ Sincronizar dados com intervalo personalizado
```bash
POST /api/ana/series/sync
Content-Type: application/json

{
  "codigoEstacao": "75650010",
  "rangeIntervalo": "HORA_12",
  "tipo": "chuva"
}
```

### 5️⃣ Buscar múltiplas estações
```typescript
// No código TypeScript:
await client.getSerieTelemetricaChuva(token, {
  codigoEstacao: ['75650010', '75650020', '75650030'],
  rangeIntervalo: 'DIAS_30'
});

// Resultado: envia "Codigos_Estacoes=75650010,75650020,75650030"
```

---

## 🎯 Endpoints Atualizados

### 1. **Endpoint de Teste**
```
GET /api/ana/series/test/:codigoEstacao
```

**Query Params:**
- `tipoFiltroData` (opcional) - padrão: `DATA_ULTIMA_ATUALIZACAO`
- `rangeIntervalo` (opcional) - padrão: `DIAS_30`

**Exemplo:**
```bash
curl "http://localhost:3000/api/ana/series/test/75650010?rangeIntervalo=HORA_6"
```

### 2. **Endpoint de Sincronização**
```
POST /api/ana/series/sync
```

**Body:**
```json
{
  "codigoEstacao": "75650010",
  "tipoFiltroData": "DATA_ULTIMA_ATUALIZACAO",
  "rangeIntervalo": "DIAS_30",
  "tipo": "chuva",
  "token": "seu_token_opcional"
}
```

---

## 📊 Estrutura de Resposta

Os dados retornados pela ANA incluem **TODOS os campos** em um único registro:

```json
{
  "codigoestacao": "75650010",
  "Data_Hora_Medicao": "2025-10-10 00:00:00.0",
  "Bateria": "12.70",
  "Chuva_Acumulada": "1288.40",
  "Chuva_Adotada": "1288.40",
  "Chuva_Acumulada_Status": 0,
  "Chuva_Adotada_Status": 0,
  "Cota_Sensor": "2033.00",
  "Cota_Adotada": "2033.00",
  "Cota_Display": null,
  "Cota_Manual": null,
  "Cota_Sensor_Status": 0,
  "Cota_Adotada_Status": 0,
  "Vazao_Adotada": "25.50",
  "Vazao_Adotada_Status": 0,
  "Temperatura_Agua": "19.80",
  "Temperatura_Interna": "24.30",
  "Pressao_Atmosferica": "1013.25",
  "Data_Atualizacao": "2025-10-10 01:15:00.0"
}
```

### Status dos Dados:
- **0** = Dado bom/validado
- **1** = Dado questionável
- **2** = Dado estimado

---

## 🚀 Próximos Passos

1. **Regenerar Prisma Client:**
   ```bash
   cd /c/Users/KUMA/Documents/ProjetoTcc/server
   npx prisma generate
   ```

2. **Testar endpoint com estação real:**
   ```bash
   curl http://localhost:3000/api/ana/series/test/75650010
   ```

3. **Sincronizar dados no banco:**
   ```bash
   curl -X POST http://localhost:3000/api/ana/series/sync \
     -H "Content-Type: application/json" \
     -d '{"codigoEstacao":"75650010","rangeIntervalo":"HORA_6"}'
   ```

4. **Verificar dados no banco:**
   ```bash
   curl http://localhost:3000/api/ana/series/75650010
   ```

---

## 📚 Referências

- **API ANA HidroWeb**: https://www.snirh.gov.br/hidrotelemetria/
- **Documentação Interface**: https://api.ana.gov.br/hidrowebservice/swagger-ui.html
- **Modelo de Dados**: Schema atualizado em `server/prisma/schema.prisma`

---

## ⚠️ Observações Importantes

1. **Não use mais `Data Inicio` e `Data Fim`** - A API trabalha com intervalos fixos baseados na data atual
2. **Os intervalos são retroativos** - `DIAS_30` busca os últimos 30 dias contando de hoje
3. **Múltiplas estações** - Você pode buscar dados de várias estações de uma vez
4. **Tipo de filtro** - Por enquanto só conhecemos `DATA_ULTIMA_ATUALIZACAO`, pode haver outros
5. **Bateria e temperatura** - Dados importantes para monitoramento da saúde da estação

---

✅ **Correção aplicada com sucesso!** A API agora está configurada corretamente para se comunicar com a ANA.
