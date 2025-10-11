# 📋 Componente DataTable - Documentação

## 🎯 Visão Geral

O componente `DataTable` é uma tabela interativa e profissional com funcionalidades avançadas para visualização e exportação de dados.

## ✨ Funcionalidades

### 1. **Ordenação por Coluna** 🔄
- Clique no cabeçalho de qualquer coluna marcada como `sortable`
- Ciclo de ordenação: Crescente → Decrescente → Sem ordenação
- Ícones visuais indicam o estado atual:
  - `⇅` - Coluna não ordenada
  - `↑` - Ordenação crescente
  - `↓` - Ordenação decrescente

### 2. **Filtros por Coluna** 🔍
- Campos de busca abaixo dos cabeçalhos de colunas `filterable`
- Busca em tempo real (case-insensitive)
- Suporta busca parcial (substring matching)
- Contador mostra resultados filtrados vs. total

### 3. **Paginação** 📄
- 50 registros por página (padrão)
- Controles de navegação:
  - `⟪` - Primeira página
  - `‹` - Página anterior
  - `›` - Próxima página
  - `⟫` - Última página
- Indicador visual da página atual

### 4. **Exportação para Excel** 📊
- Exporta dados filtrados/ordenados para XLSX
- Nome do arquivo inclui timestamp
- Colunas formatadas conforme especificado
- Largura de colunas ajustada automaticamente

### 5. **Formatação Customizada** 🎨
- Função `format()` para cada coluna
- Suporte a datas, números, moedas, etc.
- Valores `null/undefined` tratados como "N/A"

## 🔧 Propriedades (Props)

```typescript
interface DataTableProps {
  data: any[]                    // Array de objetos com os dados
  columns: Column[]              // Configuração das colunas
  title?: string                 // Título da tabela (padrão: "Dados")
  exportFileName?: string        // Nome base do arquivo exportado
}

interface Column {
  key: string                    // Chave do objeto em `data`
  label: string                  // Nome exibido no cabeçalho
  sortable?: boolean             // Permite ordenação (padrão: false)
  filterable?: boolean           // Mostra campo de filtro (padrão: false)
  format?: (value: any) => string // Função de formatação (opcional)
}
```

## 📖 Exemplo de Uso

```tsx
import { DataTable } from './dashboard'

function MeuComponente() {
  const dados = [
    { dia: '2025-09-01', chuva: 25.5, temp: 22.3, registros: 48 },
    { dia: '2025-09-02', chuva: 0, temp: 24.1, registros: 48 },
    // ... mais dados
  ]

  return (
    <DataTable
      title="Dados Pluviométricos - Setembro 2025"
      exportFileName="dados_chuva_setembro"
      data={dados}
      columns={[
        {
          key: 'dia',
          label: 'Data',
          sortable: true,
          filterable: true,
          format: (value) => {
            const [year, month, day] = value.split('-')
            return `${day}/${month}/${year}`
          }
        },
        {
          key: 'chuva',
          label: 'Chuva (mm)',
          sortable: true,
          filterable: false,
          format: (value) => value != null ? value.toFixed(2) : 'N/A'
        },
        {
          key: 'temp',
          label: 'Temperatura (°C)',
          sortable: true,
          filterable: false,
          format: (value) => value != null ? value.toFixed(1) : 'N/A'
        },
        {
          key: 'registros',
          label: 'Medições',
          sortable: true,
          filterable: false,
          format: (value) => value?.toString() || '0'
        }
      ]}
    />
  )
}
```

## 🎨 Estilos CSS

### Classes Principais

```css
.data-table-container      /* Container principal */
.data-table-header         /* Cabeçalho com título e ações */
.table-title-section       /* Seção de título e contador */
.table-count               /* Badge com contagem de registros */
.table-actions             /* Botões de ação */
.btn-clear-filters         /* Botão limpar filtros */
.btn-export                /* Botão exportar XLSX */
.data-table-wrapper        /* Wrapper com scroll */
.data-table                /* Tabela em si */
.column-filter             /* Input de filtro */
.table-pagination          /* Controles de paginação */
```

### Temas de Cores

- **Cabeçalho**: Gradiente azul (`#1e40af` → `#1e3a8a`)
- **Hover**: Cinza claro (`#f9fafb`)
- **Alternado**: `#fafbfc` para linhas pares
- **Botão Export**: Gradiente verde (`#10b981` → `#059669`)
- **Filtros**: Background branco com opacidade

## 🔄 Fluxo de Dados

1. **Dados Originais** → `data` prop
2. **Aplicar Filtros** → `filters` state
3. **Aplicar Ordenação** → `sortColumn` + `sortDirection`
4. **Dados Processados** → `processedData` memo
5. **Aplicar Paginação** → `paginatedData`
6. **Renderizar Tabela** → Células com `format()`

## 📱 Responsividade

### Desktop (> 768px)
- Layout padrão com todos os recursos
- Scroll horizontal se necessário
- Largura total disponível

### Mobile (< 768px)
- Botões empilhados verticalmente
- Fonte reduzida (12px)
- Padding ajustado (10px/8px)
- Paginação em múltiplas linhas

## 💡 Dicas de Uso

### 1. Formatação de Datas
```typescript
format: (value) => {
  try {
    const date = new Date(value)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return value
  }
}
```

### 2. Números com Casas Decimais
```typescript
format: (value) => value != null ? Number(value).toFixed(2) : '-'
```

### 3. Valores Booleanos
```typescript
format: (value) => value ? '✓ Sim' : '✗ Não'
```

### 4. Valores Monetários
```typescript
format: (value) => {
  return value != null 
    ? new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value)
    : 'R$ 0,00'
}
```

## 🚀 Performance

- **useMemo** para processamento de dados (evita recálculos)
- **Paginação** para limitar renderização (50 itens/página)
- **Virtual scroll** não implementado (considerar para 10k+ linhas)

## 📊 Exportação XLSX

### Processo
1. Aplica filtros e ordenação atuais
2. Formata valores usando função `format()`
3. Cria worksheet com cabeçalhos (labels)
4. Ajusta largura das colunas automaticamente
5. Gera arquivo `{exportFileName}_{YYYY-MM-DD}.xlsx`
6. Inicia download no navegador

### Biblioteca Usada
- **xlsx** (SheetJS)
- Instalada via: `npm install xlsx`

## ✅ Integração no Dashboard

A tabela foi integrada no `StationDashboard` como uma nova aba:

```tsx
<button 
  className={activeTab === 'data' ? 'active' : ''}
  onClick={() => setActiveTab('data')}
>
  📋 Dados Brutos
</button>
```

### Dados Exibidos
- Data (formatada dd/mm/yyyy)
- Chuva Total, Máxima
- Temperatura Média, Mín, Máx
- Bateria Média
- Quantidade de Registros

### Funcionalidades Ativas
- ✅ Ordenação em todas as colunas
- ✅ Filtro apenas na coluna "Data"
- ✅ Exportação para XLSX
- ✅ Paginação (50 registros/página)
- ✅ Formatação com 2 casas decimais

## 🎯 Casos de Uso

1. **Análise Detalhada**: Ver todos os registros dia a dia
2. **Busca Específica**: Filtrar por data para encontrar períodos
3. **Ordenação**: Ordenar por chuva para ver dias com mais precipitação
4. **Exportação**: Baixar dados para análise offline (Excel, Power BI, etc.)
5. **Validação**: Conferir valores e quantidade de registros

## 🔮 Melhorias Futuras

- [ ] Virtual scroll para grandes volumes (10k+ linhas)
- [ ] Seleção de múltiplas linhas
- [ ] Exportação para CSV/JSON
- [ ] Filtros avançados (range, regex, multi-select)
- [ ] Colunas redimensionáveis
- [ ] Configuração de itens por página
- [ ] Busca global (todas as colunas)
- [ ] Totalizadores no rodapé
- [ ] Gráfico rápido de colunas numéricas
- [ ] Histórico de filtros/ordenações
