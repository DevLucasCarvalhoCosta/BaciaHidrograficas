# 📊 Consultas SQL - Dados Sincronizados

## 🔌 Conectar ao Banco PostgreSQL

### Opção 1: Via psql (terminal)
```bash
# Usando as credenciais do .env
psql -h localhost -U seu_usuario -d seu_banco

# Exemplo (ajuste conforme seu .env):
psql -h localhost -U postgres -d baciahidrografica
```

### Opção 2: Via conexão string do .env
```bash
# Pegar a DATABASE_URL do arquivo .env
# Exemplo: postgresql://usuario:senha@localhost:5432/banco

psql "postgresql://usuario:senha@localhost:5432/banco"
```

---

## 📈 Consultas Básicas

### 1. Ver todos os dados ordenados por data (mais recente primeiro)
```sql
SELECT 
  codigoestacao,
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Cota_Sensor,
  Vazao_Adotada,
  Temperatura_Agua,
  Bateria
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
ORDER BY "Data_Hora_Medicao" DESC
LIMIT 100;
```

### 2. Ver dados mais antigos primeiro
```sql
SELECT 
  codigoestacao,
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Cota_Sensor,
  Vazao_Adotada,
  Temperatura_Agua,
  Bateria
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
ORDER BY "Data_Hora_Medicao" ASC
LIMIT 100;
```

### 3. Contar total de registros
```sql
SELECT COUNT(*) as total_registros
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010';
```

---

## 🎯 Consultas por Período

### 1. Dados de um mês específico (Janeiro 2025)
```sql
SELECT 
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Temperatura_Agua,
  Bateria
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND Data_Hora_Medicao >= '2025-01-01'
  AND Data_Hora_Medicao < '2025-02-01'
ORDER BY "Data_Hora_Medicao" ASC;
```

### 2. Dados de uma semana específica
```sql
SELECT 
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Cota_Sensor,
  Temperatura_Agua
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND Data_Hora_Medicao >= '2025-09-01'
  AND Data_Hora_Medicao < '2025-09-08'
ORDER BY "Data_Hora_Medicao" ASC;
```

### 3. Dados de um dia específico
```sql
SELECT 
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Chuva_Adotada,
  Cota_Sensor,
  Vazao_Adotada,
  Temperatura_Agua,
  Temperatura_Interna,
  Bateria
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND Data_Hora_Medicao >= '2025-09-02'
  AND Data_Hora_Medicao < '2025-09-03'
ORDER BY "Data_Hora_Medicao" ASC;
```

---

## 📊 Estatísticas e Agregações

### 1. Resumo geral dos dados
```sql
SELECT 
  COUNT(*) as total_registros,
  MIN("Data_Hora_Medicao") as data_inicio,
  MAX("Data_Hora_Medicao") as data_fim,
  COUNT(DISTINCT DATE("Data_Hora_Medicao")) as dias_com_dados
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010';
```

### 2. Estatísticas de Chuva
```sql
SELECT 
  COUNT(*) as total_medicoes,
  MIN(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_minima,
  MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
  AVG(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_media
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Chuva_Acumulada" IS NOT NULL
  AND "Chuva_Acumulada" != '';
```

### 3. Estatísticas de Temperatura
```sql
SELECT 
  COUNT(*) as total_medicoes,
  MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
  MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima,
  AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Temperatura_Agua" IS NOT NULL
  AND "Temperatura_Agua" != '';
```

### 4. Estatísticas de Bateria
```sql
SELECT 
  MIN(CAST("Bateria" AS DECIMAL)) as bateria_minima,
  MAX(CAST("Bateria" AS DECIMAL)) as bateria_maxima,
  AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Bateria" IS NOT NULL
  AND "Bateria" != '';
```

---

## 📅 Dados Agregados por Período

### 1. Média diária de temperatura
```sql
SELECT 
  DATE("Data_Hora_Medicao") as dia,
  COUNT(*) as total_medicoes,
  AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
  MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
  MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Temperatura_Agua" IS NOT NULL
  AND "Temperatura_Agua" != ''
GROUP BY DATE("Data_Hora_Medicao")
ORDER BY dia DESC;
```

### 2. Total de chuva por dia
```sql
SELECT 
  DATE("Data_Hora_Medicao") as dia,
  MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima_do_dia,
  COUNT(*) as total_medicoes
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Chuva_Acumulada" IS NOT NULL
  AND "Chuva_Acumulada" != ''
GROUP BY DATE("Data_Hora_Medicao")
ORDER BY dia DESC;
```

### 3. Resumo mensal
```sql
SELECT 
  DATE_TRUNC('month', "Data_Hora_Medicao") as mes,
  COUNT(*) as total_medicoes,
  AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
  MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Temperatura_Agua" IS NOT NULL
  AND "Temperatura_Agua" != ''
GROUP BY DATE_TRUNC('month', "Data_Hora_Medicao")
ORDER BY mes DESC;
```

---

## 🔍 Consultas Avançadas

### 1. Dados completos de todos os campos
```sql
SELECT 
  id,
  codigoestacao,
  "Data_Hora_Medicao",
  "Data_Atualizacao",
  "Chuva_Acumulada",
  "Chuva_Acumulada_Status",
  "Chuva_Adotada",
  "Chuva_Adotada_Status",
  "Cota_Sensor",
  "Cota_Sensor_Status",
  "Cota_Adotada",
  "Cota_Adotada_Status",
  "Cota_Display",
  "Cota_Display_Status",
  "Cota_Manual",
  "Cota_Manual_Status",
  "Vazao_Adotada",
  "Vazao_Adotada_Status",
  "Temperatura_Agua",
  "Temperatura_Agua_Status",
  "Temperatura_Interna",
  "Pressao_Atmosferica",
  "Pressao_Atmosferica_Status",
  "Bateria"
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
ORDER BY "Data_Hora_Medicao" DESC
LIMIT 10;
```

### 2. Verificar dados com valores extremos de temperatura
```sql
SELECT 
  "Data_Hora_Medicao",
  "Temperatura_Agua",
  "Temperatura_Interna"
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND (
    CAST("Temperatura_Agua" AS DECIMAL) > 30 
    OR CAST("Temperatura_Agua" AS DECIMAL) < 10
  )
ORDER BY "Data_Hora_Medicao" DESC;
```

### 3. Verificar níveis críticos de bateria
```sql
SELECT 
  "Data_Hora_Medicao",
  "Bateria"
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
  AND "Bateria" IS NOT NULL
  AND CAST("Bateria" AS DECIMAL) < 12.0
ORDER BY "Data_Hora_Medicao" DESC;
```

---

## 💾 Exportar Dados

### 1. Exportar para CSV (dentro do psql)
```sql
\copy (SELECT * FROM "SerieTelemetrica" WHERE codigoestacao = '75650010' ORDER BY "Data_Hora_Medicao" DESC) TO '/tmp/dados_estacao_75650010.csv' WITH CSV HEADER;
```

### 2. Exportar período específico
```sql
\copy (
  SELECT 
    "Data_Hora_Medicao",
    "Chuva_Acumulada",
    "Temperatura_Agua",
    "Bateria"
  FROM "SerieTelemetrica"
  WHERE codigoestacao = '75650010'
    AND Data_Hora_Medicao >= '2025-09-01'
    AND Data_Hora_Medicao < '2025-10-01'
  ORDER BY "Data_Hora_Medicao" ASC
) TO '/tmp/dados_setembro_2025.csv' WITH CSV HEADER;
```

---

## 🚀 Comandos Rápidos (Copy & Paste)

### Ver últimos 50 registros
```bash
psql "sua_connection_string" -c "SELECT Data_Hora_Medicao, Chuva_Acumulada, Temperatura_Agua, Bateria FROM \"SerieTelemetrica\" WHERE codigoestacao = '75650010' ORDER BY Data_Hora_Medicao DESC LIMIT 50;"
```

### Contar registros
```bash
psql "sua_connection_string" -c "SELECT COUNT(*) FROM \"SerieTelemetrica\" WHERE codigoestacao = '75650010';"
```

### Ver período de dados
```bash
psql "sua_connection_string" -c "SELECT MIN(Data_Hora_Medicao) as inicio, MAX(Data_Hora_Medicao) as fim FROM \"SerieTelemetrica\" WHERE codigoestacao = '75650010';"
```

---

## 🎯 Exemplo de Sessão Completa

```bash
# 1. Conectar ao banco
psql "postgresql://usuario:senha@localhost:5432/banco"

# 2. Dentro do psql:
# Ver estrutura da tabela
\d "SerieTelemetrica"

# Contar registros
SELECT COUNT(*) FROM "SerieTelemetrica" WHERE codigoestacao = '75650010';

# Ver últimos dados
SELECT 
  Data_Hora_Medicao,
  Chuva_Acumulada,
  Temperatura_Agua,
  Bateria
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010'
ORDER BY "Data_Hora_Medicao" DESC
LIMIT 20;

# Ver período coberto
SELECT 
  MIN("Data_Hora_Medicao") as inicio,
  MAX("Data_Hora_Medicao") as fim,
  COUNT(*) as total
FROM "SerieTelemetrica"
WHERE codigoestacao = '75650010';

# Sair
\q
```

---

## 📝 Notas Importantes

1. **Aspas duplas**: Use aspas duplas `"` para nomes de colunas com maiúsculas
2. **Conversão**: Use `CAST(campo AS DECIMAL)` para fazer cálculos numéricos
3. **Filtros**: Sempre filtre por `codigoestacao = '75650010'` para ver só dados da estação
4. **Performance**: Use `LIMIT` para limitar resultados em consultas grandes
5. **Datas**: PostgreSQL entende formato `YYYY-MM-DD HH:MM:SS`

---

**Total de registros esperados**: 34.788  
**Período**: Todo o ano de 2025  
**Estação**: 75650010
