# 📡 Documentação da API

Este documento descreve os endpoints disponíveis na API do sistema.

## Base URL

- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** Configurado via variável de ambiente

---

## Endpoints

### Health Check

#### `GET /health`

Verifica se o servidor está funcionando.

**Resposta:**
```json
{
  "status": "ok",
  "time": "2025-01-01T00:00:00.000Z"
}
```

---

### Estações (ANA)

#### `GET /api/ana/estacoes`

Lista todas as estações cadastradas.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `uf` | string | Filtrar por UF |
| `tipo` | string | Tipo da estação |
| `status` | string | Status (ativa/inativa) |

**Resposta:**
```json
{
  "estacoes": [...],
  "total": 100
}
```

#### `GET /api/ana/estacoes/:codigo`

Busca uma estação específica pelo código.

**Resposta:**
```json
{
  "codigo": "75650010",
  "nome": "Nome da Estação",
  "uf": "GO",
  "latitude": -16.123,
  "longitude": -49.456
}
```

---

### Séries Telemétricas

#### `GET /api/ana/series/:codigo`

Busca séries de dados de uma estação.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `dataInicio` | date | Data inicial |
| `dataFim` | date | Data final |

**Resposta:**
```json
{
  "codigoEstacao": "75650010",
  "totalRegistros": 1440,
  "dados": [...]
}
```

#### `POST /api/ana/series/sync`

Sincroniza dados de uma estação.

**Body:**
```json
{
  "codigoEstacao": "75650010",
  "dataBusca": "2025-10-01",
  "rangeIntervalo": "DIAS_30"
}
```

---

### Dashboard

#### `GET /api/dashboard/resumo`

Retorna resumo estatístico para o dashboard.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `codigoEstacao` | string | Código da estação |
| `periodo` | string | Período de análise |

**Resposta:**
```json
{
  "estatisticas": {
    "totalRegistros": 10000,
    "periodoInicio": "2025-01-01",
    "periodoFim": "2025-12-31"
  },
  "metricas": {
    "chuva": { "media": 10.5, "max": 150.0 },
    "temperatura": { "media": 25.3, "max": 38.0 }
  }
}
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Autenticação

Para endpoints que requerem autenticação com a API ANA, o token é gerenciado internamente pelo servidor. Configure as credenciais nas variáveis de ambiente.
