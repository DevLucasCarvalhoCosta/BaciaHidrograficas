# 💧 ANA Hidro - Sistema de Monitoramento de Recursos Hídricos

Sistema moderno e profissional para visualização e análise de estações hidrológicas da **ANA (Agência Nacional de Águas e Saneamento Básico)**.

## 🎯 Características

### Interface Moderna
- 🎨 **Design System Profissional**: Paleta de cores azul, tipografia otimizada, espaçamentos consistentes
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🗺️ **Mapa Interativo**: Tiles modernos do CartoDB Voyager (100% gratuito)
- 🎯 **Marcadores Customizados**: Ícones diferenciados para estações ativas/inativas

### Funcionalidades Avançadas
- 🔍 **Busca Inteligente**: Por nome, código ou rio
- 🎛️ **Filtros Múltiplos**: UF, tipo de estação, status operacional, rio
- 📅 **Filtros por Data**: Períodos de operação dos equipamentos
- 📊 **Estatísticas em Tempo Real**: Total de estações e filtradas
- 🎨 **Filtros Avançados**: Sistema de regras personalizáveis

### Dados
- 🌐 **Estado Padrão**: Goiás (GO)
- 📍 **Abrangência**: Todos os estados brasileiros
- 🔄 **Sincronização**: API da ANA em tempo real

## 🚀 Tecnologias Utilizadas

- **React 18.3** - Framework UI moderno
- **TypeScript 5.6** - Type safety
- **Vite 5.4** - Build tool ultrarrápido
- **Leaflet 1.9** - Biblioteca de mapas open source
- **React Leaflet 4.2** - Integração React + Leaflet
- **CartoDB Tiles** - Mapas modernos e gratuitos

## 🛠️ Instalação e Execução

```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

Acesse: http://localhost:5173

## 🎨 Sistema de Design

### Paleta de Cores
- **Primary**: `#0284c7` (Sky Blue)
- **Secondary**: `#06b6d4` (Cyan)
- **Accent**: `#22d3ee` (Light Cyan)
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Amber)

### Componentes UI
- Inputs e selects com bordas arredondadas e transições
- Botões com hover effects e sombras
- Cards com elevação e gradientes sutis
- Badges de estatísticas
- Popups customizados no mapa
- Scrollbars estilizadas

## 📂 Estrutura do Projeto

```
web/
├── src/
│   ├── components/
│   │   ├── MapView.tsx          # Componente principal do mapa
│   │   └── FilterPanel.tsx      # Painel de filtros avançados
│   ├── services/
│   │   ├── api.ts               # Cliente HTTP com paginação
│   │   ├── leafletIcons.ts      # Fix para ícones Leaflet no Vite
│   │   └── customMarkerIcon.ts  # Marcadores customizados
│   ├── App.tsx                   # Componente raiz
│   ├── main.tsx                  # Entry point
│   └── styles.css               # Design system global
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🗺️ Mapas Utilizados

**CartoDB Voyager** - Tiles gratuitos e modernos
- URL: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Licença: CC BY 3.0
- Suporte: Zoom até nível 20
- Estilo: Minimalista e profissional

## 🔧 Configuração

Crie um arquivo `.env` na pasta `web/`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

O `vite.config.ts` está configurado com proxy para facilitar desenvolvimento.

## 📊 API Endpoints Utilizados

- `GET /api/ana/estacoes/hidro` - Lista estações com paginação automática
  - Query params: `unidadefederativa`, `q`, `pagina`, `tamanho`

## 🎯 Melhorias Implementadas

### v2.0.0 (Atual)
- ✅ Design system moderno e profissional com CSS variables
- ✅ Mapas CartoDB Voyager (substituindo OSM)
- ✅ Marcadores customizados com ícones de água 💧
- ✅ Diferenciação visual entre estações ativas/inativas
- ✅ Estado padrão alterado de RS para GO (Goiás)
- ✅ Interface responsiva aprimorada
- ✅ Popups informativos redesenhados
- ✅ Sistema de badges de estatísticas
- ✅ Melhor UX em filtros e controles
- ✅ Transições e animações CSS suaves

## 📝 Licença

Projeto acadêmico - TCC

---

**Desenvolvido com 💙 para monitoramento de recursos hídricos do Brasil** 🇧🇷

