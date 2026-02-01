<p align="center">
  <img src="https://img.shields.io/badge/ANA-Hidro-0284c7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTBIMTJWMnoiLz48cGF0aCBkPSJNMjEuMTggOC44MmMtLjUxLS40Ny0xLjI1LS42NC0yLS41NS0uOC4xLTEuNTguNDYtMi4xNS45MS0uODQuNjYtMi4wMiAxLjU0LTIuNjIgMi45Mi0uNjUgMS41LTEuMzIgMy44LTEuMzIgMy44Ii8+PC9zdmc+" alt="ANA Hidro"/>
</p>

<h1 align="center">💧 Sistema de Monitoramento de Bacias Hidrográficas</h1>

<p align="center">
  <strong>Análise de Séries Temporais para Identificação de Padrões no Nível de Rio em Estações Telemétricas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js" alt="Node"/>
  <img src="https://img.shields.io/badge/typescript-5.6+-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/react-18.3+-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/postgresql-15+-336791?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-problema-e-solução">Problema</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-uso">Uso</a> •
  <a href="#-documentação">Documentação</a>
</p>

---

## 📋 Sobre o Projeto

Este projeto foi desenvolvido como **Trabalho de Conclusão de Curso (TCC)** no curso de **Bacharelado em Sistemas de Informação** da **Universidade Estadual de Goiás (UEG)**, sob orientação do **Prof. Dr. Rafael Vianna de Carvalho**.

O **ANA Hidro** é um sistema web moderno para **coleta, armazenamento, análise e visualização** de dados hidrológicos provenientes de estações telemétricas da **Agência Nacional de Águas e Saneamento Básico (ANA)**. O sistema permite visualizar informações em mapas e painéis interativos, auxiliando na compreensão de padrões, tendências e variações nos níveis dos rios e na precipitação.

### 🎯 Objetivos

- **Integrar** dados oficiais da API da ANA de forma automatizada
- **Armazenar** e processar séries temporais de dados telemétricos
- **Visualizar** estações em mapa interativo com filtros avançados
- **Gerar** análises estatísticas avançadas (15+ métricas)
- **Detectar** padrões e anomalias automaticamente
- **Fornecer** insights contextualizados para gestão de recursos hídricos

---

## 🔍 Problema e Solução

### O Problema

Apesar de os dados hidrológicos serem disponibilizados publicamente pela ANA através de plataformas como **HidroWeb** e **Sistema Hidro-Telemetria**, existem limitações significativas:

- 📊 As interfaces priorizam acesso a tabelas de dados brutos, sem visualizações intuitivas
- 📈 Não oferecem recursos para análise exploratória e identificação de padrões temporais
- 🔧 Usuários precisam exportar dados para ferramentas externas (planilhas, Python, etc.)
- 📉 Séries apresentam lacunas, inconsistências e diferenças na frequência de medição
- 🎓 Exige conhecimento técnico especializado para interpretação

### A Solução

O **ANA Hidro** oferece uma interface moderna e intuitiva que:

| ❌ Antes | ✅ Com ANA Hidro |
|---------|------------------|
| Visualizações pontuais e restritas | Dashboard completo com 6 abas de análise |
| Dados brutos sem processamento | 15+ métricas estatísticas calculadas automaticamente |
| Sem detecção de padrões | 6 categorias de insights inteligentes |
| Interface técnica complexa | Design moderno, responsivo e acessível |
| Exportação manual para análise | Gráficos interativos e exportação integrada |

---

## ✨ Funcionalidades

### 🗺️ Mapa Interativo

<table>
<tr>
<td width="60%">

- Visualização geoespacial de estações com **Leaflet + CartoDB Voyager**
- Marcadores customizados diferenciando estações **ativas/inativas**
- **Filtros avançados**: UF, tipo, status, bacia, rio
- **Busca inteligente** por nome, código ou rio
- Popups informativos com dados da estação
- **Totalmente responsivo** (desktop, tablet, mobile)

</td>
<td width="40%">

```
🔵 Estação Ativa
⚫ Estação Inativa
📍 Clique para detalhes
🔍 Filtros dinâmicos
```

</td>
</tr>
</table>

### 📊 Dashboard Analítico

O sistema oferece **6 abas de análise** completas:

| Aba | Descrição |
|-----|-----------|
| **📈 Visão Geral** | Estatísticas do mês, gráficos de chuva e temperatura, insights inteligentes |
| **📉 Séries Temporais** | Gráficos de linha com seletor de período personalizado |
| **📊 Comparações** | Gráficos dual-axis, análise de tendências históricas, métricas estatísticas |
| **⚠️ Alertas** | Detecção de temperatura alta/baixa, bateria crítica, eventos extremos |
| **📄 Dados Brutos** | Tabela paginada com 22 campos, ordenável e filtrável |
| **📋 Dados Agregados** | Resumo diário com médias, máximas e mínimas |

### 🧮 Métricas Estatísticas

O sistema calcula automaticamente **15+ métricas**:

```
📊 Estatísticas Básicas        📈 Análises Avançadas
├── Média                      ├── Coeficiente de Variação (CV)
├── Desvio Padrão              ├── Correlação de Pearson
├── Mínimo / Máximo            ├── Amplitude Térmica
├── Amplitude                  ├── Completude de Dados
└── Mediana                    └── Tendências Mensais
```

### 💡 Sistema de Insights Inteligentes

Detecta automaticamente **6 categorias** de padrões:

| Categoria | Detecção | Exemplo |
|-----------|----------|---------|
| **🌧️ Precipitação** | Aumento/redução >30% | "Aumento de 45% na precipitação em relação ao mês anterior" |
| **🌡️ Temperatura** | Amplitude >8°C | "Amplitude térmica de 12°C indica forte sazonalidade" |
| **🔄 Correlação** | Chuva vs Temperatura | "Correlação inversa forte (-0.72) entre chuva e temperatura" |
| **🔋 Saúde do Sistema** | Bateria <12V | "Bateria crítica em 11.2V - manutenção urgente" |
| **📊 Qualidade** | Completude <70% | "Apenas 65% dos dados esperados foram recebidos" |
| **⚡ Extremos** | Precipitação >3× média | "Evento extremo: 156mm em 24h (média: 42mm)" |

Cada insight inclui:
- 📋 **Recomendação prática** para gestores
- 🔬 **Contexto científico** com referências (IPCC, Wetzel, ANA, Tucci)
- 🎯 **Classificação de severidade** (INFO, SUCCESS, WARNING, CRITICAL)

### 🔄 Sincronização Inteligente

- Interface web para gerenciamento de sincronização
- **Scheduler automático** configurável (a cada X horas)
- Monitoramento em **tempo real** com barra de progresso
- Histórico completo de execuções
- Suporte a sincronização por período específico

---

## 🚀 Tecnologias

### Arquitetura do Sistema

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MapView │ Dashboard │ SyncManager │ FilterPanel       │    │
│  │  Leaflet │ Recharts  │ WebSocket   │ React Hooks       │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Routes: /api/ana/* │ /api/dashboard/* │ /api/sync/*   │    │
│  │  Services: anaClient │ syncService │ scheduler         │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬───────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Station │ HidroStation │ SerieTelemetrica │ SyncLog   │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS/JWT
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   API da ANA (Externa)                          │
│           https://api.ana.gov.br/hidrowebservice               │
│  Dados: Nível do Rio │ Chuva │ Vazão │ Temperatura │ Bateria   │
└────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

<table>
<tr>
<td valign="top" width="50%">

#### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | 18.3+ | Biblioteca UI |
| TypeScript | 5.6+ | Tipagem estática |
| Vite | 5.4+ | Build tool |
| Leaflet | 1.9+ | Mapas interativos |
| React Leaflet | 4.2+ | Integração React |
| Recharts | 2.10+ | Gráficos |
| XLSX | 0.18+ | Exportação Excel |

</td>
<td valign="top" width="50%">

#### Backend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.19+ | Framework web |
| TypeScript | 5.6+ | Tipagem estática |
| Prisma | 6.17+ | ORM |
| PostgreSQL | 15+ | Banco de dados |
| Zod | 3.22+ | Validação |
| Axios | 1.6+ | Cliente HTTP |

</td>
</tr>
</table>

#### Infraestrutura
- **Docker** + Docker Compose - Containerização
- **Nginx** - Proxy reverso e servidor web
- **PM2** - Gerenciador de processos Node.js
- **GitHub Actions** - CI/CD automatizado
- **CartoDB Voyager** - Tiles de mapa (gratuito)

---

## 📦 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ 
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Git](https://git-scm.com/)
- Credenciais de acesso à API da ANA (solicitar em: https://www.ana.gov.br/)

### 1. Clone o repositório

```bash
git clone https://github.com/DevLucasCarvalhoCosta/BaciaHidrograficas.git
cd BaciaHidrograficas
```

### 2. Configure o Backend

```bash
cd server
npm install

# Crie o arquivo de configuração
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ana_hidro?schema=public"

# API da ANA (obrigatório)
ANA_BASE_URL=https://api.ana.gov.br/hidrowebservice
ANA_IDENTIFICADOR=seu_identificador
ANA_SENHA=sua_senha

# Servidor
PORT=3001
NODE_ENV=development
```

Configure o banco de dados:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Configure o Frontend

```bash
cd ../web
npm install

# (Opcional) Configure a URL da API
cp .env.example .env

npm run dev
```

### 4. Acesse o Sistema

Abra no navegador: **http://localhost:5173**

---

## 📖 Uso

### 1. Visualizar Estações no Mapa

1. Acesse a aplicação
2. As estações sincronizadas aparecem automaticamente no mapa
3. Use os filtros para refinar a busca:
   - Selecione UF (ex: Goiás)
   - Filtre por status (Operando/Inativa)
   - Busque por nome ou código
4. Clique em um marcador para ver detalhes

### 2. Sincronizar Dados

1. Clique em uma estação no mapa
2. No popup, clique em "🔄 Sincronizar Dados"
3. Escolha o período:
   - **Rápido**: Últimos 1, 3, 7, 15 ou 30 dias
   - **Personalizado**: Selecione data início e fim
4. Acompanhe o progresso em tempo real

### 3. Analisar Dados

1. Após sincronizar, clique em "📊 Dashboard"
2. Explore as 6 abas de análise
3. Veja os insights inteligentes na aba "Comparações"
4. Exporte dados nas abas "Dados Brutos" e "Dados Agregados"

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/API.md](docs/API.md) | Documentação completa da API REST |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guia de deploy em produção |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Como contribuir com o projeto |
| [docs/DOCUMENTACAO_COMPLETA.md](docs/DOCUMENTACAO_COMPLETA.md) | Documentação técnica detalhada |

---

## 📁 Estrutura do Projeto

```
BaciaHidrograficas/
├── 📄 docker-compose.yml    # Configuração Docker
├── 📄 README.md             # Este arquivo
├── 📄 LICENSE               # Licença MIT
│
├── 📁 docs/                 # Documentação
│   ├── API.md               # Documentação da API
│   ├── DEPLOYMENT.md        # Guia de deploy
│   ├── CONTRIBUTING.md      # Guia de contribuição
│   └── DOCUMENTACAO_COMPLETA.md
│
├── 📁 server/               # Backend Node.js/Express
│   ├── src/
│   │   ├── routes/          # Endpoints da API
│   │   ├── services/        # Lógica de negócio
│   │   └── db/              # Configuração Prisma
│   └── prisma/              # Schema do banco
│
├── 📁 web/                  # Frontend React
│   └── src/
│       ├── components/      # Componentes React
│       │   ├── dashboard/   # Componentes do dashboard
│       │   └── common/      # Componentes reutilizáveis
│       ├── services/        # Chamadas à API
│       └── styles/          # Estilos CSS
│
├── 📁 docker/               # Configurações Docker/Nginx
│   └── nginx/
│
└── 📁 scripts/              # Scripts de automação
    ├── deploy/              # Scripts de deploy
    └── maintenance/         # Scripts de manutenção
```

---

## 📡 Fonte de Dados

### Agência Nacional de Águas (ANA)

Os dados são obtidos através da **API oficial da ANA**, que disponibiliza medições de estações telemétricas distribuídas pelo território nacional.

#### Parâmetros Coletados (a cada 15 minutos)

| Categoria | Parâmetros | Unidade |
|-----------|-----------|---------|
| **Precipitação** | Chuva Acumulada, Chuva Adotada | mm |
| **Nível d'água** | Cota Sensor, Cota Adotada, Cota Manual | m |
| **Vazão** | Vazão Adotada | m³/s |
| **Temperatura** | Água, Interna | °C |
| **Pressão** | Atmosférica | hPa |
| **Equipamento** | Bateria | V |

#### Indicadores de Qualidade

- **0**: Dado validado (confiável)
- **1**: Dado questionável
- **2**: Dado estimado

---

## 🔬 Metodologia Científica

### Referências Utilizadas

O sistema utiliza metodologias e thresholds baseados em literatura científica consolidada:

- **IPCC (2021)** - Climate Change 2021: The Physical Science Basis
- **Wetzel, R. G. (2001)** - Limnology: Lake and River Ecosystems. 3rd ed.
- **Tucci, C. E. M. (2001)** - Hidrologia: Ciência e Aplicação. UFRGS/ABRH
- **ANA (2007)** - Conjuntura dos Recursos Hídricos no Brasil
- **Montgomery & Runger (2018)** - Applied Statistics and Probability for Engineers

### Thresholds de Alertas

| Parâmetro | Threshold | Justificativa |
|-----------|-----------|---------------|
| Temperatura Alta | > 30°C | Risco de eutrofização (Wetzel, 2001) |
| Temperatura Baixa | < 15°C | Atípico para rios tropicais brasileiros |
| Bateria Crítica | < 12V | Tensão nominal de baterias chumbo-ácido |
| Variação Precipitação | > 30% | Padrão IPCC para mudanças significativas |
| Amplitude Térmica | > 8°C | Forte sazonalidade regional |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalhes.

```bash
# 1. Fork o projeto
# 2. Clone seu fork
git clone https://github.com/seu-usuario/BaciaHidrograficas.git

# 3. Crie sua branch
git checkout -b feature/nova-feature

# 4. Commit suas mudanças
git commit -m 'feat: adiciona nova feature'

# 5. Push para a branch
git push origin feature/nova-feature

# 6. Abra um Pull Request
```

---

## 👤 Autor

<table>
<tr>
<td align="center">
<b>Lucas Carvalho Costa</b><br>
Bacharelado em Sistemas de Informação<br>
Universidade Estadual de Goiás (UEG)<br><br>
<a href="https://github.com/DevLucasCarvalhoCosta">
<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>
<a href="https://linkedin.com/in/seu-perfil">
<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>
</td>
</tr>
</table>

**Orientador:** Prof. Dr. Rafael Vianna de Carvalho

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

Os dados utilizados são públicos e de propriedade da [Agência Nacional de Águas (ANA)](https://www.ana.gov.br/).

---

## 🙏 Agradecimentos

- [Agência Nacional de Águas (ANA)](https://www.ana.gov.br/) - Disponibilização dos dados
- [Universidade Estadual de Goiás (UEG)](https://www.ueg.br/) - Instituição de ensino
- [CartoDB](https://carto.com/) - Tiles de mapa gratuitos
- Comunidades Open Source de React, Node.js, Leaflet e Prisma

---

<p align="center">
  <strong>Desenvolvido com 💙 para monitoramento de recursos hídricos do Brasil</strong> 🇧🇷💧
</p>

<p align="center">
  ⭐ Se este projeto te ajudou, considere dar uma estrela!
</p>
