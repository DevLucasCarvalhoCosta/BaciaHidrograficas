# 🌐 Frontend - Dashboard de Monitoramento

Interface web para visualização e análise de dados hidrológicos.

## Tecnologias

- **React 18** + TypeScript 5
- **Vite 5** (Build tool)
- **Leaflet** + React Leaflet (Mapas)
- **Recharts** (Gráficos)
- **CartoDB Voyager** (Tiles de mapa)

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env
```

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador.

## Build de Produção

```bash
# Gerar build otimizado
npm run build

# Preview da build
npm run preview
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Estrutura

```
src/
├── App.tsx           # Componente principal
├── main.tsx          # Entry point
├── components/
│   ├── MapView.tsx   # Mapa interativo
│   ├── DataViewer.tsx# Visualização de dados
│   ├── SyncManager.tsx # Gerenciador de sincronização
│   ├── FilterPanel.tsx # Painel de filtros
│   ├── common/       # Componentes reutilizáveis
│   └── dashboard/    # Componentes do dashboard
├── services/
│   └── api.ts        # Cliente HTTP
└── styles/
    ├── app.css
    └── dashboard.css
```

## Features

- 🗺️ **Mapa Interativo** - Visualização geoespacial com Leaflet
- 📊 **Dashboard** - Gráficos e métricas estatísticas
- 🔄 **Sincronização** - Gerenciamento de dados em tempo real
- 🎯 **Filtros Avançados** - Por UF, tipo, status, rio
- 📱 **Responsivo** - Desktop, tablet e mobile

## Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3001
```

