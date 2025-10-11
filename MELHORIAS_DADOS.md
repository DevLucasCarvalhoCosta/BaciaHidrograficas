# Melhorias na Normalização de Dados

## 📋 Problema Identificado

A API da ANA retorna valores booleanos como strings `"0"` e `"1"` ao invés de `true` e `false`. Isso dificultava o tratamento dos dados no frontend.

### Exemplo de dados recebidos:
```json
{
  "Operando": "1",
  "Tipo_Estacao_Qual_Agua": "1",
  "Tipo_Estacao_Pluviometro": "0",
  "Tipo_Estacao_Climatologica": "0"
}
```

## ✅ Solução Implementada

### 1. **Normalização no Frontend** (`MapView.tsx`)

Criamos funções utilitárias para converter automaticamente os dados:

#### **Função `toBoolean`**
Converte valores `"0"`/`"1"` e também `"Sim"`/`"Não"` para booleanos:

```typescript
function toBoolean(val: string | number | boolean | null | undefined): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'boolean') return val
  const str = String(val).trim()
  // Handle numeric strings: "1" = true, "0" = false
  if (str === '1') return true
  if (str === '0') return false
  // Handle text values
  const normalized = str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return normalized === 'sim' || normalized === 'true' || normalized === 'yes'
}
```

#### **Função `normalizeStation`**
Normaliza todos os campos booleanos de uma estação:

```typescript
function normalizeStation(raw: any): HidroStation {
  return {
    ...raw,
    Operando: toBoolean(raw.Operando),
    Tipo_Estacao_Pluviometro: toBoolean(raw.Tipo_Estacao_Pluviometro),
    Tipo_Estacao_Registrador_Chuva: toBoolean(raw.Tipo_Estacao_Registrador_Chuva),
    Tipo_Estacao_Registrador_Nivel: toBoolean(raw.Tipo_Estacao_Registrador_Nivel),
    Tipo_Estacao_Telemetrica: toBoolean(raw.Tipo_Estacao_Telemetrica),
    Tipo_Estacao_Climatologica: toBoolean(raw.Tipo_Estacao_Climatologica),
    Tipo_Estacao_Qual_Agua: toBoolean(raw.Tipo_Estacao_Qual_Agua),
    Tipo_Estacao_Sedimentos: toBoolean(raw.Tipo_Estacao_Sedimentos),
    Tipo_Rede_Basica: toBoolean(raw.Tipo_Rede_Basica),
    Tipo_Rede_Captacao: toBoolean(raw.Tipo_Rede_Captacao),
    Tipo_Rede_Qual_Agua: toBoolean(raw.Tipo_Rede_Qual_Agua),
  }
}
```

### 2. **Atualização da Interface TypeScript**

```typescript
export interface HidroStation {
  codigoestacao: string
  Operando?: string | boolean | null  // Agora aceita boolean
  Tipo_Estacao_Pluviometro?: string | boolean | null
  Tipo_Estacao_Registrador_Chuva?: string | boolean | null
  // ... outros campos
}
```

### 3. **Melhorias na UI**

#### **Filtro de Status Operacional**
```typescript
// Antes: comparação complexa de strings
const val = (s.Operando || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()
const target = operando === 'Sim' ? 'SIM' : 'NAO'
if (val !== target) return false

// Agora: comparação simples de booleanos
const isOperating = typeof s.Operando === 'boolean' ? s.Operando : toBoolean(s.Operando)
const target = operando === 'Sim'
if (isOperating !== target) return false
```

#### **Filtros de Tipo de Estação**
Agora usa dropdowns simples ao invés de listar valores complexos:

```tsx
<select value={tipoPluviometro} onChange={e=>setTipoPluviometro(e.target.value)}>
  <option value="">Todos</option>
  <option value="true">✓ Possui</option>
  <option value="false">✗ Não possui</option>
</select>
```

## 📊 Campos Normalizados

Os seguintes campos agora são tratados como booleanos:

### Status Operacional
- ✅ `Operando`

### Tipos de Estação
- ✅ `Tipo_Estacao_Pluviometro`
- ✅ `Tipo_Estacao_Registrador_Chuva`
- ✅ `Tipo_Estacao_Registrador_Nivel`
- ✅ `Tipo_Estacao_Telemetrica`
- ✅ `Tipo_Estacao_Climatologica`
- ✅ `Tipo_Estacao_Qual_Agua`
- ✅ `Tipo_Estacao_Sedimentos`

### Tipos de Rede
- ✅ `Tipo_Rede_Basica`
- ✅ `Tipo_Rede_Captacao`
- ✅ `Tipo_Rede_Qual_Agua`

## 🎯 Benefícios

1. **Código mais limpo**: Comparações booleanas simples ao invés de manipulação de strings
2. **Melhor performance**: Menos processamento de strings
3. **Type-safe**: TypeScript agora reconhece os tipos corretos
4. **UI mais intuitiva**: Filtros com "Possui" / "Não possui" ao invés de valores numéricos
5. **Manutenibilidade**: Fácil adicionar novos campos booleanos

## 🔄 Fluxo de Dados

```
API da ANA
  ↓ (retorna "0" e "1" como strings)
Backend (server/src/routes/ana.ts)
  ↓ (passa dados sem alteração)
Frontend - useEffect
  ↓ (aplica normalizeStation)
Estado React (stations)
  ↓ (valores booleanos true/false)
UI Components
  ↓ (usa comparações booleanas)
Mapa & Filtros
```

## 🚀 Próximos Passos Sugeridos

### Opção 1: Manter normalização no frontend (implementado)
✅ **Vantagem**: Flexibilidade para lidar com diferentes formatos da API
✅ **Vantagem**: Não requer alterações no backend/banco

### Opção 2: Normalizar no backend
Se quiser normalizar no backend, modifique `server/src/routes/ana.ts`:

```typescript
// Adicione após buscar do banco:
const normalizedData = data.map(station => ({
  ...station,
  Operando: station.Operando === '1' || station.Operando === 'Sim',
  Tipo_Estacao_Pluviometro: station.Tipo_Estacao_Pluviometro === '1',
  // ... outros campos
}))

return res.json({ data: normalizedData, pagination })
```

### Opção 3: Armazenar como boolean no banco
Modifique `prisma/schema.prisma`:

```prisma
model HidroStation {
  // ...
  Operando                              Boolean?
  Tipo_Estacao_Pluviometro             Boolean?
  // ... outros campos
}
```

**Nota**: Requer migração do banco de dados e conversão dos dados existentes.

## 📝 Testando

Para testar a normalização:

1. Verifique no console do browser:
```javascript
// Os valores devem ser booleanos
console.log(stations[0].Operando) // true ou false (não "1" ou "0")
```

2. Teste os filtros:
   - Status Operacional: ✓ Operando / ✗ Inativa
   - Tipo Pluviômetro: ✓ Possui / ✗ Não possui

3. Verifique os marcadores no mapa:
   - Verde = Operando (true)
   - Vermelho = Inativa (false)
