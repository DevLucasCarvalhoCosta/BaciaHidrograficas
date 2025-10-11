# 🚀 Executar Sincronização de Dados 2025

## ✅ O que foi implementado

### 1. **Correções na API da ANA**
- ✅ Parâmetro `Tipo Filtro Data` corrigido para: `DATA_LEITURA`
- ✅ Adicionado campo `Data de Busca` no formato `yyyy-MM-dd`
- ✅ Mantido `Codigos_Estacoes` e `Range Intervalo de busca`

### 2. **Restrição de Estação**
- ✅ Apenas estação `75650010` permitida (validação implementada)
- ✅ Outras estações retornarão erro 403

### 3. **Script de Sincronização Inteligente**
- ✅ Busca dados **mês a mês** (30 dias por vez)
- ✅ Aguarda resposta de cada requisição antes de prosseguir
- ✅ Trata erros e continua de onde parou
- ✅ Salva dados automaticamente no banco PostgreSQL

## 📋 Estrutura de Parâmetros da API

```typescript
{
  "Codigos_Estacoes": "75650010",
  "Tipo Filtro Data": "DATA_LEITURA",
  "Data de Busca": "2025-10-01",
  "Range Intervalo de busca": "DIAS_30"
}
```

### Como funciona o Range:
- `DIAS_30` = Busca 30 dias **antes** da data especificada
- Exemplo: Data `2025-10-01` + Range `DIAS_30` = Dados de 01/09/2025 a 01/10/2025

## 🎯 Como Executar

### Passo 1: Garantir que o servidor está rodando
```bash
cd server
npm run dev
```

### Passo 2: Em outro terminal, executar o script
```bash
cd server
npx tsx src/scripts/sync-ano-2025.ts
```

### Passo 3: Acompanhar o progresso
O script vai exibir logs como:
```
🚀 Iniciando sincronização da estação 75650010 - Ano 2025
📅 Buscando período: 2025-01-31 (mês 1/12)
✅ Sincronizados 1440 registros do mês 1
📅 Buscando período: 2025-02-28 (mês 2/12)
...
```

## 📊 Endpoints da API

### 1. Buscar Dados Detalhados (Dashboard)
```bash
# Buscar últimos 30 dias
GET http://localhost:3000/api/ana/series/test/75650010

# Com data específica
GET http://localhost:3000/api/ana/series/test/75650010?dataBusca=2025-10-01&rangeIntervalo=DIAS_30
```

### 2. Sincronizar Dados (Salvar no Banco)
```bash
POST http://localhost:3000/api/ana/series/sync
Content-Type: application/json

{
  "codigoEstacao": "75650010",
  "dataBusca": "2025-10-01",
  "rangeIntervalo": "DIAS_30"
}
```

### 3. Consultar Dados Salvos
```bash
GET http://localhost:3000/api/ana/series/75650010
```

## 🔒 Validações Implementadas

### Estação Permitida
```typescript
// Apenas esta estação está habilitada
const ESTACAO_PERMITIDA = "75650010";
```

### Parâmetros Obrigatórios
- `codigoEstacao` (ou via URL)
- `dataBusca` (padrão: data atual)
- `rangeIntervalo` (padrão: DIAS_30)

## 📁 Estrutura de Dados Salva

```typescript
{
  codigoestacao: "75650010",
  Data_Hora_Medicao: "2025-10-01T14:30:00Z",
  
  // Dados de Chuva
  Chuva_Acumulada: "2.5",
  Chuva_Acumulada_Status: "1",
  Chuva_Adotada: "2.5",
  Chuva_Adotada_Status: "1",
  
  // Dados de Cota/Nível
  Cota_Sensor: "150.25",
  Cota_Sensor_Status: "1",
  Cota_Adotada: "150.25",
  Cota_Adotada_Status: "1",
  
  // Dados de Vazão
  Vazao_Adotada: "1250.5",
  Vazao_Adotada_Status: "1",
  
  // Dados Ambientais
  Temperatura_Agua: "25.3",
  Temperatura_Interna: "28.5",
  Pressao_Atmosferica: "1013.2",
  
  // Equipamento
  Bateria: "12.6"
}
```

## ⚙️ Funcionamento do Script

### Algoritmo de Busca Mês a Mês
```typescript
1. Define datas finais de cada mês de 2025 (31/jan, 28/fev, ...)
2. Para cada mês:
   a. Faz requisição com Data_Busca = último dia do mês
   b. Range = DIAS_30 (busca os 30 dias anteriores)
   c. Aguarda resposta completa
   d. Salva dados no banco
   e. Aguarda 2 segundos (rate limiting)
   f. Vai para próximo mês
3. Se erro: registra e continua
```

### Benefícios:
- ✅ Respeita limite de 30 dias da API
- ✅ Não sobrecarrega o servidor
- ✅ Recuperável em caso de falha
- ✅ Logs detalhados de progresso

## 🎨 Próximos Passos (Dashboard)

Após sincronizar os dados, você pode:

1. **Criar visualizações** dos dados salvos
2. **Filtrar por período** específico
3. **Gerar gráficos** de:
   - Chuva acumulada ao longo do ano
   - Variação de vazão
   - Níveis de cota
   - Temperatura da água

## ⚠️ Importante

- ✅ O script só funciona para estação `75650010`
- ✅ Dados são salvos com **upsert** (não duplica)
- ✅ Use o endpoint `/series/test` para visualizar sem salvar
- ✅ Use o endpoint `/series/sync` para buscar e salvar
- ✅ O script automático faz ambos (busca + salva)

## 🐛 Troubleshooting

### Erro: "Estação não permitida"
→ Apenas `75650010` está habilitada. Verifique o código da estação.

### Erro: "Data de Busca inválida"
→ Use formato `yyyy-MM-dd` (ex: `2025-10-01`)

### Erro de conexão com a API
→ Verifique se tem acesso à internet e se a API da ANA está disponível

### Dados não aparecem no banco
→ Verifique se o PostgreSQL está rodando e se as credenciais estão corretas no `.env`

## 📚 Referências

- **API ANA**: Interface com parâmetros `DATA_LEITURA`
- **Script**: `server/src/scripts/sync-ano-2025.ts`
- **Rotas**: `server/src/routes/ana.ts`
- **Cliente**: `server/src/services/anaClient.ts`
- **Schema**: `server/prisma/schema.prisma`

---

**Status**: ✅ Pronto para uso
**Data**: 11 de outubro de 2025
**Estação**: 75650010 (única habilitada)
