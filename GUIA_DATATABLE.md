# 🚀 Guia Rápido - DataTable

## ✅ O que foi criado?

Nova aba **"📋 Dados Brutos"** no dashboard com tabela interativa!

## 🎯 Como Usar

### 1. **Acessar a Tabela**
1. Abra o dashboard de uma estação
2. Clique na aba **"📋 Dados Brutos"**
3. Selecione o mês desejado no dropdown acima

### 2. **Ordenar Dados** 🔄
- Clique no cabeçalho de qualquer coluna
- 1º clique: Ordem crescente ↑
- 2º clique: Ordem decrescente ↓
- 3º clique: Remove ordenação ⇅

### 3. **Filtrar por Data** 🔍
- Digite no campo de filtro abaixo de "Data"
- Exemplos:
  - `01` - Mostra dia 01
  - `2025` - Mostra todas de 2025
  - `09` - Mostra todas de setembro

### 4. **Navegar Páginas** 📄
- Use os botões de navegação:
  - `⟪` - Primeira página
  - `‹` - Página anterior
  - `›` - Próxima página
  - `⟫` - Última página
- Mostra 50 registros por vez

### 5. **Exportar para Excel** 📊
1. Clique no botão **"📊 Exportar XLSX"**
2. Arquivo será baixado automaticamente
3. Nome: `estacao_[CODIGO]_[MES]_[DATA].xlsx`
4. Abre no Excel, Google Sheets, LibreOffice, etc.

### 6. **Limpar Filtros** 🗑️
- Clique em **"🗑️ Limpar Filtros"**
- Remove todos os filtros e ordenações
- Volta ao estado inicial

## 📊 Colunas Disponíveis

| Coluna | Descrição | Ordenável | Filtrável |
|--------|-----------|-----------|-----------|
| **Data** | Dia do registro (dd/mm/yyyy) | ✅ | ✅ |
| **Chuva Total (mm)** | Precipitação acumulada do dia | ✅ | ❌ |
| **Chuva Máxima (mm)** | Maior valor em um momento | ✅ | ❌ |
| **Temp. Média (°C)** | Temperatura média do dia | ✅ | ❌ |
| **Temp. Mínima (°C)** | Menor temperatura do dia | ✅ | ❌ |
| **Temp. Máxima (°C)** | Maior temperatura do dia | ✅ | ❌ |
| **Bateria Média (V)** | Tensão média da bateria | ✅ | ❌ |
| **Registros** | Quantidade de medições | ✅ | ❌ |

## 💡 Exemplos Práticos

### Encontrar o dia mais chuvoso
1. Clique em "Chuva Total (mm)" → ordenação decrescente ↓
2. O primeiro da lista é o dia com mais chuva

### Verificar temperaturas extremas
1. Clique em "Temp. Máxima (°C)" → ordenação decrescente ↓
2. Ou clique em "Temp. Mínima (°C)" → ordenação crescente ↑

### Buscar um dia específico
1. Digite o dia no filtro de "Data"
2. Ex: `15` para ver o dia 15

### Exportar dados para análise
1. Aplique filtros/ordenações desejadas
2. Clique em "📊 Exportar XLSX"
3. Abra no Excel para gráficos/análises

## 🎨 Visual

- **Cabeçalho azul** - Destaque para identificação
- **Linhas alternadas** - Melhor legibilidade
- **Hover** - Linha destacada ao passar mouse
- **Scroll horizontal** - Se necessário
- **Scroll vertical** - Máximo 600px de altura
- **Responsivo** - Adapta a telas pequenas

## 🔄 Para Testar

1. **Recarregue a página** (Ctrl+F5)
2. Abra o dashboard da estação 75650010
3. Clique na aba **"📋 Dados Brutos"**
4. Teste ordenação, filtros e exportação!

## 📝 Observações

- Dados são do mês selecionado no dropdown acima
- Filtros mantêm ordenação aplicada
- Exportação respeita filtros/ordenações
- Paginação automática com mais de 50 registros
- Valores `null` aparecem como "N/A"
- Números formatados com 2 casas decimais

## ✨ Recursos Técnicos

- ✅ React + TypeScript
- ✅ Biblioteca XLSX (SheetJS)
- ✅ Ordenação inteligente (números vs. strings)
- ✅ Busca case-insensitive
- ✅ Memoização para performance
- ✅ CSS responsivo
- ✅ Exportação com timestamp
- ✅ Largura de colunas auto-ajustada no Excel
