# 📊 Atualização: Duas Abas de Dados

## 🎯 Mudanças Implementadas

### Antes:
- ❌ Uma única aba "📋 Dados Brutos"
- ❌ Mostrava apenas dados agregados
- ❌ Nomes de colunas incorretos

### Depois:
- ✅ Duas abas separadas: "📝 Dados Brutos" e "📊 Dados Agregados"
- ✅ Dados brutos com todos os registros do banco (sem filtro)
- ✅ Nomes de colunas corrigidos conforme a estrutura real

## 📝 Aba: Dados Brutos

### Características:
- **Fonte**: Registros diretos do banco de dados (tabela `SerieTelemetrica`)
- **Frequência**: ~96 registros por dia (medições a cada 15 minutos)
- **Filtro**: Nenhum - mostra TODOS os registros do mês selecionado

### Colunas:

| Coluna | Campo no Banco | Formato | Ordenável | Filtrável |
|--------|----------------|---------|-----------|-----------|
| **Data/Hora** | `Data_Hora_Medicao` | dd/mm/yyyy HH:mm | ✅ | ✅ |
| **Chuva Acumulada (mm)** | `Chuva_Acumulada` | 2 decimais | ✅ | ❌ |
| **Temp. Água (°C)** | `Temperatura_Agua` | 2 decimais | ✅ | ❌ |
| **Temp. Interna (°C)** | `Temperatura_Interna` | 2 decimais | ✅ | ❌ |
| **Bateria (V)** | `Bateria` | 2 decimais | ✅ | ❌ |

### Exemplo de Dados:
```json
{
  "Data_Hora_Medicao": "2025-07-31T23:45:00.000Z",
  "Chuva_Acumulada": 798.2,
  "Temperatura_Agua": 14.3,
  "Temperatura_Interna": 15.1,
  "Bateria": 12.9
}
```

### Como São Carregados:
```typescript
const loadRawData = async (mes: string) => {
  const [year, month] = mes.split('-')
  const dataInicio = `${year}-${month}-01`
  const ultimoDia = new Date(parseInt(year), parseInt(month), 0).getDate()
  const dataFim = `${year}-${month}-${ultimoDia}`
  
  const response = await api.get(`/api/dashboard/serie-chuva/${codigoEstacao}`, {
    params: { dataInicio, dataFim }
  })
  
  setDadosBrutos(response.dados || [])
}
```

## 📊 Aba: Dados Agregados

### Características:
- **Fonte**: Endpoint `/api/dashboard/agregado-diario` (dados processados)
- **Frequência**: 1 registro por dia (agregação dos registros brutos)
- **Processamento**: Cálculos de média, mínima, máxima

### Colunas:

| Coluna | Campo no Banco | Formato | Ordenável | Filtrável |
|--------|----------------|---------|-----------|-----------|
| **Data** | `dia` | dd/mm/yyyy | ✅ | ✅ |
| **Chuva Máxima (mm)** | `chuva_maxima` | 2 decimais | ✅ | ❌ |
| **Temp. Média (°C)** | `temp_media` | 2 decimais | ✅ | ❌ |
| **Temp. Mínima (°C)** | `temp_minima` | 2 decimais | ✅ | ❌ |
| **Temp. Máxima (°C)** | `temp_maxima` | 2 decimais | ✅ | ❌ |
| **Bateria Média (V)** | `bateria_media` | 2 decimais | ✅ | ❌ |
| **Total Medições** | `total_medicoes` | Inteiro | ✅ | ❌ |

### Exemplo de Dados:
```json
{
  "dia": "2025-07-31T00:00:00.000Z",
  "total_medicoes": 96,
  "chuva_maxima": "798.2",
  "temp_media": "14.3",
  "temp_minima": "13.8",
  "temp_maxima": "14.7",
  "bateria_media": "12.8958333333333333"
}
```

## 🔄 Fluxo de Carregamento

```
1. Usuário seleciona mês no dropdown
   ↓
2. loadMonthData() é chamada
   ↓
3. Carrega dados agregados (setAgregadoDiario)
   ↓
4. Chama loadRawData() automaticamente
   ↓
5. Carrega dados brutos (setDadosBrutos)
   ↓
6. Ambas as abas ficam prontas para visualização
```

## 📁 Código Modificado

### StationDashboard.tsx

#### 1. Novo Estado:
```typescript
const [dadosBrutos, setDadosBrutos] = useState<any[]>([])
```

#### 2. Tipo de Aba Atualizado:
```typescript
const [activeTab, setActiveTab] = useState<
  'overview' | 'series' | 'comparison' | 'alerts' | 'rawdata' | 'aggregated'
>('overview')
```

#### 3. Nova Função:
```typescript
const loadRawData = async (mes: string) => {
  // Busca todos os registros brutos do mês
  // Usa o endpoint série-chuva com range de datas
}
```

#### 4. Modificação em loadMonthData:
```typescript
const loadMonthData = async (mes: string) => {
  // ... carrega dados agregados
  await loadRawData(mes) // ← Nova chamada
}
```

## 🎨 Interface do Usuário

### Navegação de Abas:

```
┌─────────────────────────────────────────────────────────────┐
│  📈 Visão Geral  │  📉 Séries  │  📊 Comparações  │         │
│  🚨 Alertas  │  📝 Dados Brutos  │  📊 Dados Agregados   │
└─────────────────────────────────────────────────────────────┘
```

### Aba Dados Brutos:
```
┌─────────────────────────────────────────────────────────────┐
│  📝 Dados Brutos - Estação 75650010 - 2025-07              │
│  [2880 registros]  [🗑️ Limpar] [📊 Exportar XLSX]         │
├─────────────────────────────────────────────────────────────┤
│ Data/Hora      │ Chuva │ Temp.Água │ Temp.Int. │ Bateria │
│ 31/07 23:45    │ 798.2 │   14.3    │   15.1    │  12.9   │
│ 31/07 23:30    │ 798.2 │   14.2    │   15.0    │  12.9   │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Aba Dados Agregados:
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dados Agregados - Estação 75650010 - 2025-07          │
│  [31 registros]  [🗑️ Limpar] [📊 Exportar XLSX]           │
├─────────────────────────────────────────────────────────────┤
│ Data       │ Chuva │ T.Méd │ T.Min │ T.Max │ Bat. │ Med. │
│ 31/07/2025 │ 798.2 │ 14.3  │ 13.8  │ 14.7  │ 12.9 │  96  │
│ 30/07/2025 │ 798.2 │ 14.8  │ 14.4  │ 15.6  │ 12.8 │  96  │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

## 💡 Informações nas Abas

### Dados Brutos:
- ✅ Registros originais sem processamento
- ✅ Frequência de ~96 medições/dia (15 em 15 minutos)
- ✅ Chuva acumulada desde o início
- ✅ Temperaturas instantâneas
- ✅ Voltagem da bateria

### Dados Agregados:
- ✅ Agregação diária dos registros brutos
- ✅ Chuva máxima do dia
- ✅ Médias, mínimas e máximas calculadas
- ✅ Bateria média
- ✅ Total de medições usadas no cálculo

## 🚀 Como Testar

1. **Recarregue a página** (Ctrl+F5)
2. Abra o dashboard de uma estação
3. Selecione um mês
4. Clique em **"📝 Dados Brutos"**:
   - Deve mostrar ~2880 registros (96/dia × 30 dias)
   - Data/Hora com minutos
   - Todos os registros do banco
5. Clique em **"📊 Dados Agregados"**:
   - Deve mostrar 28-31 registros (1 por dia)
   - Apenas data
   - Valores calculados (médias, etc.)

## 📊 Comparação

### Quantidade de Dados:

| Aba | Registros/Mês | Tamanho Aprox. | Uso |
|-----|---------------|----------------|-----|
| **Dados Brutos** | ~2880 | ~200KB | Análise detalhada, troubleshooting |
| **Dados Agregados** | ~30 | ~5KB | Visão geral, tendências, relatórios |

### Performance:

- **Dados Brutos**: Carregamento mais lento, scroll necessário
- **Dados Agregados**: Carregamento rápido, visualização completa

## ✅ Melhorias Aplicadas

1. ✅ Nomes de colunas corrigidos (eram `chuva_total`, agora `chuva_maxima`)
2. ✅ Campo `registros` renomeado para `total_medicoes`
3. ✅ Formatação de data com hora (dd/mm/yyyy HH:mm) para brutos
4. ✅ Formatação de data simples (dd/mm/yyyy) para agregados
5. ✅ Carregamento automático ao trocar de mês
6. ✅ Exportação separada com nomes descritivos
7. ✅ Informações contextuais em cada aba

## 🎯 Casos de Uso

### Use "Dados Brutos" quando:
- 🔍 Investigar valores específicos de horário
- 🐛 Fazer troubleshooting de problemas
- 📊 Analisar padrões intra-diários
- 🔬 Validar qualidade dos dados
- 📈 Criar gráficos de alta resolução

### Use "Dados Agregados" quando:
- 📊 Gerar relatórios diários
- 📈 Analisar tendências mensais
- 🎯 Comparar dias
- 💾 Exportar resumos
- 📉 Visualizar padrões gerais
