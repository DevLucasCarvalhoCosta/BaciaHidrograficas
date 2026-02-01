# 💧 Sistema de Monitoramento de Bacias Hidrográficas

**Trabalho de Conclusão de Curso (TCC)**  
**Universidade Estadual de Goiás (UEG)**  
**Desenvolvedor:** Lucas Carvalho Costa  
**Ano:** 2025

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Arquitetura do Sistema](#-arquitetura-do-sistema)
4. [Fonte de Dados](#-fonte-de-dados)
5. [Modelo de Dados](#-modelo-de-dados)
6. [Sincronização de Dados](#-sincronização-de-dados)
7. [Análises e Processamento](#-análises-e-processamento)
8. [Interface e Visualizações](#-interface-e-visualizações)
9. [Instalação e Configuração](#-instalação-e-configuração)
10. [Deploy](#-deploy)
11. [Guia de Uso](#-guia-de-uso)
12. [Metodologia Científica](#-metodologia-científica)
13. [Referências](#-referências)

---

## 🎯 Visão Geral

Sistema web moderno e profissional para **coleta, armazenamento, análise e visualização** de dados hidrológicos de estações telemétricas da **ANA (Agência Nacional de Águas e Saneamento Básico)**. 

### Objetivos

- ✅ Integrar dados da API oficial da ANA
- ✅ Armazenar e processar séries temporais de dados telemétricos
- ✅ Visualizar estações em mapa interativo
- ✅ Gerar análises estatísticas avançadas
- ✅ Detectar padrões e anomalias automaticamente
- ✅ Fornecer insights contextualizados para gestão de recursos hídricos

### Características Principais

🗺️ **Mapa Interativo**
- Visualização geoespacial de estações
- Marcadores customizados (ativos/inativos)
- Filtros avançados (UF, tipo, status, rio)
- Popups informativos

📊 **Dashboard Analítico**
- 6 abas de análise (Visão Geral, Séries, Comparações, Alertas, Dados, Agregados)
- Gráficos dual-axis profissionais
- 15+ métricas estatísticas
- Sistema de insights inteligentes

🔄 **Sincronização Automatizada**
- Interface web para gerenciamento
- Scheduler automático configurável
- Monitoramento em tempo real
- Histórico completo de execuções

---

## 🚀 Stack Tecnológica

### Frontend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **React** | 18.3+ | Biblioteca UI |
| **TypeScript** | 5.6+ | Tipagem estática |
| **Vite** | 5.4+ | Build tool |
| **Leaflet** | 1.9+ | Mapas interativos |
| **React Leaflet** | 4.2+ | Integração React |
| **Recharts** | 2.10+ | Gráficos |

### Backend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 4.19+ | Framework web |
| **TypeScript** | 5.6+ | Tipagem estática |
| **Prisma** | 6.17+ | ORM |
| **PostgreSQL** | 15+ | Banco de dados |
| **Zod** | 3.22+ | Validação |
| **Axios** | 1.6+ | Cliente HTTP |

### Infraestrutura

- **CartoDB Voyager**: Tiles de mapa (gratuito)
- **PM2**: Gerenciador de processos Node.js
- **Nginx**: Proxy reverso e servidor web
- **GitHub Actions**: CI/CD automatizado

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Componentes Principais:                               │  │
│  │  • MapView: Mapa interativo com Leaflet              │  │
│  │  • StationDashboard: Análises e gráficos             │  │
│  │  • SyncManager: Gerenciamento de sincronização       │  │
│  │  • FilterPanel: Filtros avançados                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes:                                           │  │
│  │  • /api/ana/* - Dados da ANA                         │  │
│  │  • /api/dashboard/* - Dados do dashboard             │  │
│  │  • /api/ana/sync/* - Sincronização                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Services:                                             │  │
│  │  • anaClient: Cliente HTTP para API ANA              │  │
│  │  • syncService: Lógica de sincronização              │  │
│  │  • scheduler: Automação periódica                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tabelas:                                              │  │
│  │  • Station: Estações básicas                         │  │
│  │  • HidroStation: Inventário completo (68 campos)     │  │
│  │  • SerieTelemetrica: Dados telemétricos (15 min)    │  │
│  │  • SyncLog: Histórico de sincronizações              │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API da ANA (Externa)                            │
│  https://api.ana.gov.br/hidrowebservice                     │
│  • Autenticação JWT                                          │
│  • Séries Telemétricas                                       │
│  • Inventário de Estações                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Fonte de Dados

### Agência Nacional de Águas (ANA)

**Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH)**  
**API Base:** `https://api.ana.gov.br/hidrowebservice`

### Dados Coletados

#### Parâmetros Telemétricos (a cada 15 minutos)

| Categoria | Parâmetros | Unidade |
|-----------|-----------|---------|
| **Precipitação** | Chuva Acumulada, Chuva Adotada | mm |
| **Nível d'água** | Cota Sensor, Cota Adotada, Display, Manual | m |
| **Vazão** | Vazão Adotada | m³/s |
| **Temperatura** | Água, Interna | °C |
| **Pressão** | Atmosférica | hPa |
| **Equipamento** | Bateria | V |

#### Indicadores de Qualidade

- **0**: Dado validado (confiável)
- **1**: Dado questionável
- **2**: Dado estimado

### Parâmetros da API

A API da ANA utiliza intervalos retroativos fixos:

```json
{
  "Codigos_Estacoes": "75650010",
  "Tipo Filtro Data": "DATA_LEITURA",
  "Range Intervalo de busca": "DIAS_30"
}
```

**Intervalos disponíveis**: `MINUTO_5` até `MINUTO_30`, `HORA_1` até `HORA_16`, `DIAS_30`

---

## 🗄️ Modelo de Dados

### Esquema Relacional (PostgreSQL + Prisma)

#### 1. Station (Estações Básicas)

```prisma
model Station {
  id              String   @id @default(cuid())
  codigoestacao   String   @unique
  Estacao_Nome    String?
  Latitude        Float?
  Longitude       Float?
  UF              String?
  Corpo_Hidrico   String?
  criadaEm        DateTime @default(now())
  atualizadaEm    DateTime @updatedAt
}
```

#### 2. HidroStation (Inventário Completo - 68 campos)

```prisma
model HidroStation {
  codigoestacao                String    @id
  Estacao_Nome                 String?
  Latitude                     String?
  Longitude                    String?
  Bacia_Nome                   String?
  Sub_Bacia_Nome              String?
  Rio_Nome                     String?
  Municipio_Nome              String?
  UF_Estacao                  String?
  Operando                     String?
  
  // Tipos de Estação (booleanos "0"/"1")
  Tipo_Estacao_Telemetrica    String?
  Tipo_Estacao_Pluviometro    String?
  Tipo_Estacao_Climatologica  String?
  // ... +10 tipos
  
  // Períodos de Operação
  Pluviometro_Data_Inicio     String?
  Pluviometro_Data_Fim        String?
  // ... +20 campos de datas
  
  // Relacionamento
  serieTelemetrica SerieTelemetrica[]
}
```

#### 3. SerieTelemetrica (Dados Telemétricos)

```prisma
model SerieTelemetrica {
  id                      String    @id @default(cuid())
  codigoestacao          String
  Data_Hora_Medicao      DateTime
  
  // Chuva
  Chuva_Acumulada        String?
  Chuva_Adotada          String?
  Chuva_Acumulada_Status String?
  Chuva_Adotada_Status   String?
  
  // Cota
  Cota_Sensor            String?
  Cota_Adotada           String?
  Cota_Display           String?
  Cota_Manual            String?
  Cota_Sensor_Status     String?
  Cota_Adotada_Status    String?
  
  // Vazão
  Vazao_Adotada          String?
  Vazao_Adotada_Status   String?
  
  // Temperatura
  Temperatura_Agua       String?
  Temperatura_Interna    String?
  
  // Pressão
  Pressao_Atmosferica    String?
  
  // Equipamento
  Bateria                String?
  
  Data_Atualizacao       String?
  criadaEm               DateTime  @default(now())
  
  // Relacionamento
  hidroStation HidroStation @relation(fields: [codigoestacao], references: [codigoestacao])
  
  @@unique([codigoestacao, Data_Hora_Medicao])
  @@index([codigoestacao, Data_Hora_Medicao])
}
```

#### 4. SyncLog (Histórico de Sincronizações)

```prisma
model SyncLog {
  id                    String   @id @default(cuid())
  codigoEstacao        String
  dataInicio           String
  dataFim              String
  inicioExecucao       DateTime
  fimExecucao          DateTime?
  duracaoMs            Int?
  totalRequisicoes     Int      @default(0)
  registrosProcessados Int      @default(0)
  erros                Int      @default(0)
  sucesso              Boolean  @default(false)
  detalhes             String?
  tipoSync             String   @default("manual")
  
  @@index([codigoEstacao, inicioExecucao])
  @@index([sucesso, inicioExecucao])
}
```

---

## 🔄 Sincronização de Dados

### Visão Geral do Processo

O sistema busca dados da API da ANA e armazena no PostgreSQL para análise posterior.

### Fluxo Completo

```
1. USUÁRIO → Clica em "Sincronizar"
   ↓
2. FRONTEND → POST /api/ana/sync/ultimos-dias { dias: 7 }
   ↓
3. BACKEND → Retorna "Sincronização iniciada" (não aguarda)
   ↓
4. SYNC SERVICE → Executa em background:
   ├─ Login na ANA (obtém token JWT)
   ├─ Calcula intervalos de datas
   ├─ Para cada intervalo:
   │  ├─ GET api.ana.gov.br/.../SerieTelemetricaDetalhada
   │  ├─ Recebe array de dados (JSON)
   │  └─ UPSERT no PostgreSQL (via Prisma)
   └─ Salva log em SyncLog
   ↓
5. FRONTEND → Polling GET /api/ana/sync/status (a cada 2s)
   ↓
6. DASHBOARD → Dados disponíveis para visualização
```

### Endpoints de Sincronização

#### POST /api/ana/sync/manual
Sincronização customizada por período:
```json
{
  "codigoEstacao": "75650010",
  "dataInicio": "2025-01-01",
  "dataFim": "2025-01-31",
  "intervaloDias": 30
}
```

#### POST /api/ana/sync/ultimos-dias
Sincronização rápida:
```json
{
  "codigoEstacao": "75650010",
  "dias": 7
}
```

#### GET /api/ana/sync/status
Monitoramento em tempo real:
```json
{
  "isRunning": true,
  "currentStation": "75650010",
  "progress": {
    "current": 5,
    "total": 12,
    "percentage": 42
  },
  "currentOperation": "Buscando dados de 2025-01-05",
  "lastSync": {
    "startTime": "2025-11-08T10:00:00Z",
    "recordsProcessed": 1523,
    "errors": 0
  }
}
```

### Sincronização Automática (Scheduler)

Configurável via variáveis de ambiente:

```bash
SYNC_AUTO_ENABLED=true
SYNC_INTERVAL_HOURS=24
SYNC_ON_STARTUP=false
```

O scheduler executa automaticamente:
- ✅ No intervalo configurado
- ✅ Em background (não bloqueia aplicação)
- ✅ Com logging completo
- ✅ Reinício automático após servidor reiniciar

---

## 📊 Análises e Processamento

### Agregações Temporais

Os dados brutos (96 medições/dia) são agregados para visualização:

#### Agregação Diária

```sql
SELECT 
  DATE("Data_Hora_Medicao") as dia,
  COUNT(*) as total_medicoes,
  MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
  AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
  MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
  MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima,
  AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
FROM "SerieTelemetrica"
WHERE codigoestacao = $1
  AND TO_CHAR("Data_Hora_Medicao", 'YYYY-MM') = $2
GROUP BY DATE("Data_Hora_Medicao")
ORDER BY dia DESC
```

#### Agregação Mensal

```sql
SELECT 
  TO_CHAR(DATE_TRUNC('month', "Data_Hora_Medicao"), 'YYYY-MM') as mes,
  COUNT(*) as total_medicoes,
  MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
  AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
  AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
FROM "SerieTelemetrica"
WHERE codigoestacao = $1
GROUP BY DATE_TRUNC('month', "Data_Hora_Medicao")
ORDER BY mes ASC
```

### Métricas Estatísticas

O sistema calcula automaticamente:

| Métrica | Fórmula | Interpretação |
|---------|---------|---------------|
| **Média** | `μ = Σxi / n` | Valor central |
| **Desvio Padrão** | `σ = √(Σ(xi - μ)² / n)` | Dispersão dos dados |
| **Coeficiente de Variação** | `CV = (σ / μ) × 100` | Variabilidade relativa |
| **Correlação de Pearson** | `r = Σ[(xi - x̄)(yi - ȳ)] / (n × σx × σy)` | Relação entre variáveis |
| **Amplitude** | `A = max - min` | Variação total |

### Sistema de Insights Inteligentes

Detecta automaticamente **6 categorias** de padrões:

#### 1. Tendência de Precipitação
- ⚠️ Aumento expressivo (>30%)
- ☀️ Redução significativa (>30%)
- 📊 Alta variabilidade (CV>50%)

#### 2. Padrão de Temperatura
- 🌡️ Amplitude térmica significativa (>8°C)
- 🔥 Temperatura média elevada (>26°C)
- ❄️ Temperatura média baixa (<18°C)

#### 3. Correlação Chuva x Temperatura
- 🔄 Correlação inversa forte (<-0.4)
- ⚠️ Correlação positiva atípica (>0.4)

#### 4. Saúde do Sistema
- 🔋 Bateria crítica (<12V)
- 📉 Degradação progressiva (>10%)

#### 5. Qualidade dos Dados
- ✅ Excelente completude (>95%)
- ⚠️ Baixa completude (<70%)

**Cálculo:** `Completude = (Medições / 2880) × 100`

#### 6. Eventos Extremos
- ⚡ Precipitação extrema (>3× média)

Cada insight inclui:
- 📋 **Recomendação prática**
- 🔬 **Contexto científico** com referências (IPCC, Wetzel, ANA)
- 🎯 **Classificação de severidade** (INFO, SUCCESS, WARNING, CRITICAL)

---

## 🎨 Interface e Visualizações

### Mapa Interativo

**Tecnologia:** Leaflet + React Leaflet + CartoDB Voyager

**Funcionalidades:**
- ✅ Visualização de todas as estações sincronizadas
- ✅ Marcadores customizados (💧):
  - Azul (#0284c7): Estações ativas
  - Cinza (#94a3b8): Estações inativas
- ✅ Popups informativos com dados da estação
- ✅ Filtros avançados:
  - Por UF (estado)
  - Por bacia hidrográfica
  - Por status operacional
  - Por tipo de estação
  - Busca por nome/código/rio
- ✅ Responsivo (desktop, tablet, mobile)

### Dashboard de Estação

Interface com **6 abas** de análise:

#### 📈 1. Visão Geral
- 4 cards de estatísticas (Chuva, Temperatura, Bateria, Registros)
- Seletor de mês
- Gráfico de barras: Chuva máxima diária
- Gráfico de linha: Temperatura média diária
- Gráfico comparativo mensal integrado
- Análise de tendências históricas
- Insights inteligentes

#### 📉 2. Séries Temporais
- Seletor de período (data início/fim)
- Gráfico de linha: Chuva acumulada (diário)
- Gráfico de linha: Temperaturas (diário)
- Descrições metodológicas

#### 📊 3. Comparações
- **MonthlyComparisonChart**: Gráfico dual-axis profissional
  - Barras: Precipitação máxima mensal (eixo esquerdo)
  - Linha vermelha: Temperatura média (eixo direito)
  - Linhas de tendência tracejadas (médias móveis)
  - Resumo estatístico (4 cards)
- **HistoricalTrends**: Análise estatística completa
  - 15+ métricas calculadas
  - Padrões sazonais identificados
  - Cards coloridos com animações
- **TrendInsights**: Insights inteligentes
  - 6 categorias de detecção
  - Recomendações específicas
  - Contexto científico integrado

#### ⚠️ 4. Alertas
- 3 cards de alerta (Temp Alta, Temp Baixa, Bateria Baixa)
- Lista dos 10 últimos eventos por tipo
- Critérios dos alertas

#### 📄 5. Dados Brutos
- Tabela paginada, ordenável e filtrável
- Todos os 22 campos da medição
- Formatação de datas e números
- Exportação para CSV

#### 📋 6. Dados Agregados
- Tabela com agregação diária
- 7 campos calculados
- Exportação para CSV

### Design System

**Paleta de Cores:**
```css
--color-primary: #0284c7;      /* Azul água */
--color-secondary: #06b6d4;    /* Ciano */
--color-success: #10b981;      /* Verde */
--color-warning: #f59e0b;      /* Amarelo */
--color-error: #ef4444;        /* Vermelho */
--color-temperature: #ef4444;   /* Vermelho (gráficos) */
--color-rain: #3b82f6;         /* Azul (gráficos) */
```

**Tipografia:**
- Títulos: 18-24px, peso 600-700
- Corpo: 14px, peso 400
- Labels: 12-13px, peso 500
- Valores: 18-26px, peso 700-800

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Git

### 1. Clonar Repositório

```bash
git clone https://github.com/DevLucasCarvalhoCosta/BaciaHidrograficas.git
cd BaciaHidrograficas
```

### 2. Configurar Backend

```bash
cd server
npm install

# Criar arquivo .env
cat > .env << EOF
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/ana_hidro

# API da ANA (obrigatório)
ANA_BASE_URL=https://api.ana.gov.br/hidrowebservice
ANA_IDENTIFICADOR=seu_usuario
ANA_SENHA=sua_senha

# Server
PORT=3000

# Scheduler (opcional)
SYNC_AUTO_ENABLED=true
SYNC_INTERVAL_HOURS=24
SYNC_ON_STARTUP=false
EOF

# Configurar banco
npx prisma generate
npx prisma db push

# Iniciar servidor
npm run dev
```

### 3. Configurar Frontend

```bash
cd web
npm install

# Criar arquivo .env (opcional)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000
EOF

# Iniciar aplicação
npm run dev
```

### 4. Acessar Sistema

Abra o navegador em: `http://localhost:5173`

---

## 🚀 Deploy

### Servidor UEG (Produção)

O projeto está configurado para deploy automatizado via GitHub Actions no servidor da UEG.

#### URLs de Produção
- **Frontend**: https://anahidro.duckdns.org/
- **Backend API**: https://anahidro.duckdns.org/api
- **Health Check**: https://anahidro.duckdns.org/api/health

#### Configuração

**1. Secrets do GitHub:**
- `UEG_SSH_HOST`: IP do servidor
- `UEG_SSH_PORT`: Porta SSH (8740)
- `UEG_SSH_USER`: Usuário SSH
- `UEG_SSH_KEY`: Chave privada SSH
- `DATABASE_URL`: URL do PostgreSQL
- `ANA_BASE_URL`: URL da API ANA
- `ANA_IDENTIFICADOR`: Usuário ANA
- `ANA_SENHA`: Senha ANA

**2. Deploy Automático:**

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

O GitHub Actions irá:
1. ✅ Verificar pré-requisitos
2. ✅ Build backend + frontend
3. ✅ Deploy para servidor
4. ✅ Health checks
5. ✅ Reiniciar com PM2

**3. Monitoramento:**

```bash
ssh -p 8740 usuario@200.137.241.42
pm2 logs ana-backend
pm2 monit
```

### Opções Alternativas

- **Railway**: Ver `railway.json`
- **Render**: Ver `render.yaml`

---

## 📖 Guia de Uso

### 1. Visualizar Estações no Mapa

1. Acesse a aplicação
2. Estações sincronizadas aparecem automaticamente
3. Use filtros para refinar:
   - Selecione UF (ex: Goiás)
   - Filtre por status (Operando/Inativa)
   - Busque por nome ou código
4. Clique em um marcador para ver detalhes

### 2. Sincronizar Dados de uma Estação

**Via Interface Web:**
1. Clique em uma estação no mapa
2. No popup, clique em "🔄 Sincronizar Dados"
3. Escolha o período:
   - **Rápido**: Últimos 1, 3, 7, 15 ou 30 dias
   - **Personalizado**: Selecione data início e fim
4. Clique em "Sincronizar"
5. Acompanhe o progresso em tempo real

**Via API (cURL):**
```bash
# Últimos 7 dias
curl -X POST http://localhost:3000/api/ana/sync/ultimos-dias \
  -H "Content-Type: application/json" \
  -d '{"codigoEstacao":"75650010","dias":7}'

# Período específico
curl -X POST http://localhost:3000/api/ana/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "codigoEstacao":"75650010",
    "dataInicio":"2025-01-01",
    "dataFim":"2025-01-31"
  }'
```

### 3. Analisar Dados de uma Estação

1. Na aba "📊 Dados", clique em "📊 Dashboard Detalhado"
2. Explore as 6 abas:
   - **Visão Geral**: Estatísticas do mês
   - **Séries Temporais**: Gráficos de período
   - **Comparações**: Análises mensais
   - **Alertas**: Eventos críticos
   - **Dados Brutos**: Tabela completa
   - **Dados Agregados**: Resumo diário

### 4. Interpretar Insights

Na aba **Comparações**, role até **"💡 Análises Inteligentes"**:

- **Ícone 🔵 INFO**: Observação técnica
- **Ícone ✅ SUCCESS**: Condição ideal
- **Ícone ⚠️ WARNING**: Atenção necessária
- **Ícone 🚨 CRITICAL**: Intervenção urgente

Cada insight contém:
- **Descrição**: O que foi detectado
- **📋 Recomendação**: Ações específicas
- **🔬 Contexto Científico**: Fundamentação com referências

---

## 📚 Metodologia Científica

### Validação de Dados

**Na Sincronização:**
- ✅ Validação de formato de data/hora
- ✅ Conversão segura de tipos
- ✅ Ignora registros sem código ou timestamp

**Nos Cálculos:**
- ✅ Exclusão de valores nulos
- ✅ Conversão com tratamento de erro
- ✅ Validação de intervalos

### Cálculos Estatísticos

#### Coeficiente de Variação
```
CV = (σ / μ) × 100

Onde:
σ = Desvio padrão
μ = Média

Interpretação:
CV < 20%: Baixa variabilidade
CV 20-50%: Média variabilidade
CV > 50%: Alta variabilidade
```

#### Correlação de Pearson
```
r = Σ[(xi - x̄)(yi - ȳ)] / (n × σx × σy)

Onde:
r = coeficiente (-1 a 1)
xi, yi = valores de X e Y
x̄, ȳ = médias
σx, σy = desvios padrão

Interpretação:
r < -0.7: Forte correlação negativa
-0.7 ≤ r < -0.4: Moderada negativa
-0.4 ≤ r < 0.4: Fraca/inexistente
0.4 ≤ r < 0.7: Moderada positiva
r ≥ 0.7: Forte correlação positiva
```

#### Completude de Dados
```
Completude = (Medições Recebidas / Medições Esperadas) × 100

Esperado = 96 medições/dia × 30 dias = 2.880 medições/mês

Interpretação:
≥ 95%: Excelente qualidade
80-95%: Boa qualidade
70-80%: Qualidade aceitável
< 70%: Baixa qualidade (análises comprometidas)
```

### Thresholds de Alertas

| Parâmetro | Threshold | Justificativa |
|-----------|-----------|---------------|
| **Temperatura Alta** | > 30°C | Risco de eutrofização (Wetzel, 2001) |
| **Temperatura Baixa** | < 15°C | Atípico para rios tropicais brasileiros |
| **Bateria Crítica** | < 12V | Tensão nominal de baterias chumbo-ácido |
| **Variação Precipitação** | > 30% | Padrão IPCC para mudanças significativas |
| **Amplitude Térmica** | > 8°C | Forte sazonalidade regional |

### Referências Científicas

1. **IPCC (2021)** - Climate Change 2021: The Physical Science Basis
2. **Wetzel, R. G. (2001)** - Limnology: Lake and River Ecosystems. 3rd ed.
3. **Tucci, C. E. M. (2009)** - Hidrologia: Ciência e Aplicação. 4ª ed. UFRGS/ABRH
4. **ANA (2007)** - Conjuntura dos Recursos Hídricos no Brasil
5. **Lima, W. P. (2008)** - Hidrologia Florestal Aplicada ao Manejo de Bacias Hidrográficas

---

## 📝 Referências

### Documentação Oficial

1. **Agência Nacional de Águas (ANA)**  
   Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH)  
   https://www.snirh.gov.br/hidrotelemetria/

2. **API HidroWeb Service da ANA**  
   Documentação técnica da API RESTful  
   https://api.ana.gov.br/hidrowebservice/swagger-ui.html

3. **Prisma ORM**  
   https://www.prisma.io/docs

4. **React Documentation**  
   https://react.dev/

5. **Leaflet.js**  
   https://leafletjs.com/

### Tecnologias

6. **TypeScript Handbook**  
   https://www.typescriptlang.org/docs/

7. **PostgreSQL Documentation**  
   https://www.postgresql.org/docs/

8. **Express.js**  
   https://expressjs.com/

9. **CartoDB Basemaps**  
   https://carto.com/basemaps/

### Dados Abertos

10. **Portal Brasileiro de Dados Abertos**  
    https://dados.gov.br/

---

## 🎓 Informações Acadêmicas

**Instituição:** Universidade Estadual de Goiás (UEG)  
**Curso:** [Nome do Curso]  
**Tipo:** Trabalho de Conclusão de Curso (TCC)  
**Desenvolvedor:** Lucas Carvalho Costa  
**Orientador:** Prof. Dr. [Nome do Orientador]  
**Ano:** 2025  
**Repositório:** https://github.com/DevLucasCarvalhoCosta/BaciaHidrograficas

---

## 📞 Contato

- **Email:** [seu.email@ueg.br]
- **LinkedIn:** [seu-linkedin]
- **GitHub:** [@DevLucasCarvalhoCosta](https://github.com/DevLucasCarvalhoCosta)

---

## 📄 Licença

Projeto acadêmico desenvolvido como Trabalho de Conclusão de Curso (TCC).  
Os dados utilizados são públicos e de propriedade da ANA.

---

**Desenvolvido com 💙 para o futuro da gestão de recursos hídricos no Brasil** 🇧🇷💧
