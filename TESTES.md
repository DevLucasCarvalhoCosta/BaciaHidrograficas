# 🧪 Guia de Testes - ANA Hidro

## 🚀 Como Iniciar o Projeto

### 1. Backend (Server)

```powershell
# Navegar para a pasta do servidor
cd server

# Instalar dependências (se ainda não fez)
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
# DATABASE_URL=postgresql://user:password@localhost:5432/ana_hidro
# ANA_BASE_URL=https://api.ana.gov.br/hidrowebservice
# ANA_IDENTIFICADOR=seu_identificador
# ANA_SENHA=sua_senha

# Gerar Prisma Client
npm run prisma:generate

# Aplicar migrations (primeira vez)
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

O servidor estará rodando em: http://localhost:3000

### 2. Frontend (Web)

```powershell
# Em outro terminal, navegar para a pasta web
cd web

# Instalar dependências (se ainda não fez)
npm install

# Criar arquivo .env
# VITE_API_BASE_URL=http://localhost:3000

# Iniciar aplicação
npm run dev
```

A aplicação estará disponível em: http://localhost:5173

## ✅ Checklist de Testes

### Testes Visuais

- [ ] **Header do Painel**
  - [ ] Título "💧 Estações Hidrológicas - ANA" visível
  - [ ] Subtítulo descritivo presente
  - [ ] Cores azuis (#0284c7) aplicadas

- [ ] **Badges de Estatísticas**
  - [ ] Badge "Total" mostrando número correto
  - [ ] Badge "Filtradas" atualizando ao filtrar
  - [ ] Badge "Estado" mostrando "GO"
  - [ ] Layout em cards brancos com sombra

- [ ] **Controles de Filtro**
  - [ ] Select de UF funcionando
  - [ ] Input de busca com placeholder
  - [ ] Botão "🔍 Buscar" com cor azul
  - [ ] Todos os inputs com bordas arredondadas

- [ ] **Mapa**
  - [ ] Tiles CartoDB Voyager carregando (estilo minimalista)
  - [ ] Marcadores customizados (💧) visíveis
  - [ ] Marcadores azuis para estações ativas
  - [ ] Marcadores cinzas para estações inativas
  - [ ] Zoom funcionando suavemente

- [ ] **Popups**
  - [ ] Abrem ao clicar no marcador
  - [ ] Título em negrito azul
  - [ ] Emojis nos campos (🔢, 📍, 🌊, 📊, ⚡)
  - [ ] Status colorido (verde/vermelho)
  - [ ] Coordenadas na parte inferior

### Testes Funcionais

- [ ] **Carregar Dados de GO**
  - [ ] Ao abrir, carrega automaticamente dados de Goiás
  - [ ] Loading indicator aparece durante carregamento
  - [ ] Estações aparecem no mapa após carregar

- [ ] **Trocar Estado**
  - [ ] Selecionar SP (São Paulo)
  - [ ] Mapa recarrega com novas estações
  - [ ] Badge "Estado" atualiza para "SP"
  - [ ] Marcadores substituídos pelos de SP

- [ ] **Busca Rápida**
  - [ ] Digitar nome de rio (ex: "Araguaia")
  - [ ] Clicar em "Buscar"
  - [ ] Apenas estações relacionadas aparecem
  - [ ] Badge "Filtradas" atualiza

- [ ] **Filtros Básicos**
  - [ ] Filtrar por "Tipo de Estação"
  - [ ] Filtrar por "Status Operacional" (Operando/Inativa)
  - [ ] Filtrar por "Rio"
  - [ ] Marcadores atualizam dinamicamente

- [ ] **Filtros Avançados**
  - [ ] Clicar "➕ Adicionar Filtro"
  - [ ] Selecionar campo, operador e valor
  - [ ] Clicar "✓ Aplicar Filtros"
  - [ ] Resultados filtrados corretamente
  - [ ] Clicar "🗑️ Limpar Tudo" remove todos os filtros

- [ ] **Filtros por Data** (abrir seção Details)
  - [ ] Selecionar período de Pluviômetro
  - [ ] Filtros aplicam corretamente
  - [ ] Limpar datas remove o filtro

### Testes de Responsividade

- [ ] **Desktop (> 1024px)**
  - [ ] Painel lateral à esquerda (450px)
  - [ ] Mapa ocupa resto da tela
  - [ ] Todos os elementos visíveis

- [ ] **Tablet (768px - 1024px)**
  - [ ] Painel com largura ajustada
  - [ ] Grid de filtros em 2 colunas
  - [ ] Mapa redimensiona corretamente

- [ ] **Mobile (< 768px)**
  - [ ] Painel empilha acima do mapa
  - [ ] Altura do painel reduzida (40vh)
  - [ ] Filtros em coluna única
  - [ ] Mapa ocupa 60vh
  - [ ] Scrollbar funciona no painel

### Testes de Interação

- [ ] **Hover States**
  - [ ] Botões levantam ao passar mouse
  - [ ] Inputs mudam borda ao hover
  - [ ] Details sections destacam ao hover

- [ ] **Focus States**
  - [ ] Inputs mostram borda azul ao focus
  - [ ] Shadow azul claro aparece (#e0f2fe)
  - [ ] Navegação por Tab funciona

- [ ] **Loading States**
  - [ ] Spinner animado durante carregamento
  - [ ] Mensagem "Carregando dados..." visível
  - [ ] UI não trava durante load

- [ ] **Error States**
  - [ ] Mensagens de erro em vermelho
  - [ ] Background rosa claro (#fef2f2)
  - [ ] Borda vermelha à esquerda

### Testes de Performance

- [ ] **Carregamento Inicial**
  - [ ] Página carrega em < 3 segundos
  - [ ] Imagens otimizadas
  - [ ] Fonts carregam corretamente

- [ ] **Renderização de Marcadores**
  - [ ] 100+ marcadores renderizam suavemente
  - [ ] Sem lag ao fazer zoom
  - [ ] Popups abrem instantaneamente

- [ ] **Filtros**
  - [ ] Aplicar filtros é instantâneo (< 100ms)
  - [ ] Sem delay perceptível
  - [ ] Interface responsiva durante filtro

## 🐛 Problemas Comuns e Soluções

### Mapa não carrega
```
Solução: Verificar se o backend está rodando em localhost:3000
Verificar: Console do navegador para erros de CORS
```

### Marcadores não aparecem
```
Solução: Verificar se há dados no banco
Executar: POST /api/ana/estacoes/hidro/sync para sincronizar
```

### Tiles do mapa quebrados
```
Solução: Verificar conexão com internet
Alternativa: Trocar para outro provedor de tiles gratuito
```

### Estilos não aplicam
```
Solução: Limpar cache do navegador (Ctrl+Shift+R)
Verificar: Se styles.css está sendo importado em main.tsx
```

### Backend não conecta com banco
```
Solução: Verificar DATABASE_URL no .env
Executar: npm run prisma:migrate
Verificar: PostgreSQL está rodando
```

## 📸 Screenshots Esperados

### Desktop - View Completa
- Painel lateral com filtros
- Mapa com múltiplos marcadores azuis
- Badges de estatísticas visíveis

### Desktop - Popup Aberto
- Popup com informações da estação
- Emojis e cores corretas
- Status colorido (verde/vermelho)

### Mobile - View Vertical
- Painel no topo (40vh)
- Mapa embaixo (60vh)
- Scrollbar no painel funcionando

## ✨ Recursos Destacados para Apresentação

1. **Design Moderno**: Mostrar o before/after com OSM vs CartoDB
2. **Marcadores Inteligentes**: Demonstrar diferença visual ativo/inativo
3. **Filtros Poderosos**: Combinar múltiplos filtros ao mesmo tempo
4. **Responsividade**: Redimensionar janela do desktop para mobile
5. **Performance**: Mostrar carregamento rápido de centenas de estações

## 🎯 Métricas de Sucesso

- ✅ Todos os testes visuais passando
- ✅ Todos os testes funcionais passando
- ✅ Responsivo em 3 breakpoints
- ✅ Sem erros no console
- ✅ Performance fluida (60fps)

---

**Boa sorte com os testes! 🚀**
