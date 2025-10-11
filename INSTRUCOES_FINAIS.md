# 🎯 INSTRUÇÕES FINAIS - IMPLEMENTAÇÃO COMPLETA

## ✅ O QUE JÁ FOI FEITO

### 1. Estrutura de Dados
- ✅ Schema Prisma atualizado com modelo `SerieTelemetrica`
- ✅ Migration aplicada com sucesso (`npx prisma generate`)
- ✅ Campos corretos conforme estrutura real da ANA

### 2. Serviços (anaClient.ts)
- ✅ Métodos atualizados com parâmetros corretos:
  - `Codigos_Estacoes`
  - `Tipo Filtro Data` → Deve ser `DATA_LEITURA`
  - `Data de Busca (yyyy-MM-dd)` → Campo obrigatório
  - `Range Intervalo de busca` → Ex: `DIAS_30`

### 3. Script de Sincronização
- ✅ Criado `src/scripts/sync-ano-2025.ts`
- ✅ Busca dados mês a mês (30 dias por requisição)
- ✅ Aguarda resposta de cada requisição antes de prosseguir
- ✅ Salva dados automaticamente no banco
- ✅ Restrito à estação `75650010`

## ⚠️ PENDÊNCIAS

### 1. Rotas (ana.ts) - PRECISA CORRIGIR

Os seguintes endpoints estão **faltando o parâmetro `dataBusca`**:

#### Linha ~650 - GET /series/test/:codigoEstacao
```typescript
// ❌ INCORRETO (falta dataBusca)
const chuvaData = await client.getSerieTelemetricaChuva(token, {
  codigoEstacao,
  tipoFiltroData,
  rangeIntervalo,
});

// ✅ CORRETO
const chuvaData = await client.getSerieTelemetricaChuva(token, {
  codigoEstacao,
  tipoFiltroData: tipoFiltroData ?? 'DATA_LEITURA',
  dataBusca: req.query.dataBusca as string,  // ← ADICIONAR
  rangeIntervalo,
});
```

**LOCAIS A CORRIGIR:**
- Linha ~650: `getSerieTelemetricaChuva` (endpoint de teste)
- Linha ~668: `getSerieTelemetricaVazao` (endpoint de teste)
- Linha ~686: `getSerieTelemetricaNivel` (endpoint de teste)
- Linha ~761: `getSerieTelemetricaChuva` (endpoint /series/sync)
- Linha ~763: `getSerieTelemetricaVazao` (endpoint /series/sync)
- Linha ~765: `getSerieTelemetricaNivel` (endpoint /series/sync)

### 2. Validações Necessárias

#### Adicionar validação da estação 75650010

```typescript
// No início de GET /series/test/:codigoEstacao
if (codigoEstacao !== '75650010') {
  return res.status(403).json({
    error: 'Acesso negado',
    message: 'Somente a estação 75650010 está disponível no momento'
  });
}
```

#### Adicionar validação do dataBusca

```typescript
const dataBusca = req.query.dataBusca as string;
if (!dataBusca) {
  return res.status(400).json({
    error: 'Parâmetro obrigatório ausente',
    message: 'dataBusca é obrigatório no formato yyyy-MM-dd (ex: ?dataBusca=2025-10-01)'
  });
}

// Validar formato
if (!/^\d{4}-\d{2}-\d{2}$/.test(dataBusca)) {
  return res.status(400).json({
    error: 'Formato de data inválido',
    message: 'dataBusca deve estar no formato yyyy-MM-dd'
  });
}
```

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Corrigir as rotas
Editar `server/src/routes/ana.ts` e adicionar `dataBusca` em todas as chamadas aos métodos da API.

### Passo 2: Testar o endpoint
```bash
# Exemplo com data específica
curl "http://localhost:3000/api/ana/series/test/75650010?dataBusca=2025-10-01&rangeIntervalo=DIAS_30"
```

### Passo 3: Executar o script de sincronização
```bash
cd server
npx tsx src/scripts/sync-ano-2025.ts
```

Este script irá:
1. Fazer login na API da ANA
2. Buscar dados de 30 em 30 dias para todo o ano de 2025
3. Salvar todos os dados no banco automaticamente
4. Exibir progresso detalhado

### Passo 4: Verificar dados salvos
```bash
# Ver estatísticas dos dados salvos
curl "http://localhost:3000/api/ana/series/75650010"
```

## 📋 ESTRUTURA DE PARÂMETROS DA API

### Parâmetros Corretos:
```typescript
{
  'Codigos_Estacoes': '75650010',                    // Código da estação
  'Tipo Filtro Data': 'DATA_LEITURA',                // Tipo do filtro
  'Data de Busca (yyyy-MM-dd)': '2025-10-01',        // Data de referência
  'Range Intervalo de busca': 'DIAS_30'              // Busca 30 dias ANTES desta data
}
```

### Intervalos Disponíveis:
- `MINUTO_5`, `MINUTO_10`
- `HORA_1` até `HORA_16`
- `DIAS_30`

### Comportamento:
- **`DATA_LEITURA` + `2025-10-01` + `DIAS_30`**  
  → Retorna dados dos últimos 30 dias **ANTES** de 01/10/2025  
  → Ou seja: de 01/09/2025 até 01/10/2025

## 🎯 FUNCIONALIDADE FINAL

1. **Script de Sincronização (sync-ano-2025.ts)**
   - Busca automaticamente todo o ano de 2025
   - Mês a mês (30 dias por vez)
   - Aguarda cada resposta
   - Salva tudo no banco

2. **Endpoint de Teste (GET /series/test/:codigoEstacao)**
   - Permite testar a API manualmente
   - Requer `dataBusca` obrigatório
   - Mostra estrutura completa dos dados
   - Restrito à estação 75650010

3. **Dashboard (Futuro)**
   - Botão "Buscar Dados Detalhados"
   - Redireciona para tela de dashboards
   - Mostra dados já salvos no banco
   - Gráficos e análises

## ⚠️ LEMBRETE IMPORTANTE

**A API da ANA funciona assim:**
- Você passa uma **data de referência**
- Ela retorna os **30 dias ANTERIORES** a essa data
- Por isso o script incrementa de 30 em 30 dias
- Começando em 30/01/2025 (pega de 01/01 até 30/01)
- Depois 30/02/2025 (pega de 01/02 até 30/02)
- E assim sucessivamente até o fim do ano

## 📝 CHECKLIST FINAL

- [x] Schema Prisma atualizado
- [x] Prisma Client regenerado
- [x] AnaClient atualizado com parâmetros corretos
- [x] Script de sincronização criado
- [ ] **Rotas corrigidas com dataBusca** ← FAZER AGORA
- [ ] Testes com endpoint /series/test
- [ ] Executar script de sincronização
- [ ] Verificar dados no banco
- [ ] Implementar dashboard (futuro)
