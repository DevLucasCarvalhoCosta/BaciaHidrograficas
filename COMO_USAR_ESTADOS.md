# 🗺️ Como Visualizar Estações de Diferentes Estados

## ✅ Funcionalidades Implementadas

### 1. **Seletor de Estados (UF)**
- Frontend possui dropdown com **todos os 27 estados** brasileiros
- Nome completo exibido: "GO - Goiás", "RS - Rio Grande do Sul", etc.
- **Mapa centraliza automaticamente** no estado selecionado
- Coordenadas otimizadas para cada capital

### 2. **Backend Preparado**
O backend já suporta sincronizar dados de **qualquer estado**:
- ✅ Endpoint: `POST /api/ana/estacoes/hidro/sync`
- ✅ Aceita parâmetro: `unidadefederativa` ou `UF`
- ✅ Lista estações: `GET /api/ana/estacoes/hidro?uf=RS`

---

## 📋 Como Sincronizar Dados de Um Novo Estado

### **Método 1: Via Thunder Client / Postman**

1. Abra Thunder Client no VS Code (ou Postman)

2. Configure a requisição POST:
```
URL: http://localhost:3000/api/ana/estacoes/hidro/sync
Method: POST
Headers: Content-Type: application/json
```

3. Body (JSON):
```json
{
  "unidadefederativa": "RS"
}
```

4. Clique em **Send**

5. Aguarde a resposta:
```json
{
  "total": 450,
  "upserted": 450
}
```

### **Método 2: Via Curl (Terminal)**

```bash
curl -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
  -H "Content-Type: application/json" \
  -d '{"unidadefederativa":"RS"}'
```

### **Método 3: Via Código JavaScript**

```javascript
const syncEstado = async (uf) => {
  const response = await fetch('http://localhost:3000/api/ana/estacoes/hidro/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unidadefederativa: uf })
  });
  const data = await response.json();
  console.log(`✅ ${data.upserted} estações sincronizadas para ${uf}`);
};

// Exemplo
syncEstado('RS');
syncEstado('SP');
syncEstado('MG');
```

---

## 🎯 Estados Prioritários Recomendados

### **Maior Volume de Dados:**
1. **MG** - Minas Gerais (maior densidade de estações)
2. **SP** - São Paulo
3. **RS** - Rio Grande do Sul
4. **PR** - Paraná
5. **BA** - Bahia

### **Regiões Hidrográficas Importantes:**
- **Bacia do Paraná:** PR, SP, MG, MS, GO
- **Bacia do São Francisco:** MG, BA, PE, AL, SE
- **Bacia Amazônica:** AM, PA, RO, AC, RR, AP
- **Bacia do Uruguai:** RS, SC

---

## 🚀 Workflow Completo

### **1. Sincronizar Estado**
```bash
POST /api/ana/estacoes/hidro/sync
Body: { "unidadefederativa": "RS" }
```

### **2. Verificar Sincronização**
```bash
GET /api/ana/estacoes/hidro?uf=RS&tamanho=10
```

### **3. Visualizar no Frontend**
- Abra: http://localhost:5173
- Selecione: **RS - Rio Grande do Sul** no dropdown
- Mapa centraliza automaticamente
- Estações aparecem no mapa

### **4. Buscar Dados Detalhados**
- Clique em uma estação no mapa
- Botão: **"📊 Buscar Dados Detalhados"**
- Busca séries de chuva, vazão e nível dos últimos 12 meses

---

## 📊 Informações por Estado

| Estado | Sigla | Estimativa Estações | Bacias Principais |
|--------|-------|---------------------|-------------------|
| Minas Gerais | MG | ~800 | São Francisco, Paraná, Doce |
| São Paulo | SP | ~600 | Paraná, Tietê |
| Rio Grande do Sul | RS | ~450 | Uruguai, Jacuí |
| Goiás | GO | ~300 | Tocantins, Paranaíba |
| Paraná | PR | ~400 | Paraná, Iguaçu |
| Bahia | BA | ~400 | São Francisco, Paraguaçu |
| Mato Grosso | MT | ~250 | Amazônica, Paraguai |

---

## ⚙️ Configurações do Banco

Os dados são armazenados na tabela `HidroStation`:
- **Chave única:** `codigoestacao`
- **Indexado por:** UF_Estacao
- **Campos principais:** ~70 colunas incluindo dados históricos

---

## 🔧 Troubleshooting

### **Problema: "Nenhuma estação encontrada"**
**Solução:** Execute o sync do estado primeiro:
```bash
POST /api/ana/estacoes/hidro/sync
Body: { "unidadefederativa": "XX" }
```

### **Problema: "Mapa não centraliza"**
**Verificar:** Coordenadas do estado em `MapView.tsx` linha ~148

### **Problema: "Erro ao buscar dados da ANA"**
**Verificar:** Credenciais no `.env`:
```
ANA_IDENTIFICADOR=seu_email@example.com
ANA_SENHA=sua_senha
ANA_BASE_URL=https://api.ana.gov.br/hidrowebservice
```

---

## 📝 Exemplo: Sincronizar 5 Estados Principais

```javascript
const estados = ['GO', 'RS', 'SP', 'MG', 'PR'];

for (const uf of estados) {
  console.log(`🔄 Sincronizando ${uf}...`);
  
  const response = await fetch('http://localhost:3000/api/ana/estacoes/hidro/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unidadefederativa: uf })
  });
  
  const data = await response.json();
  console.log(`✅ ${uf}: ${data.upserted} estações`);
  
  // Aguardar 2 segundos entre requisições
  await new Promise(r => setTimeout(r, 2000));
}

console.log('🎉 Sincronização completa!');
```

---

## 🎨 Melhorias Futuras (Opcional)

### **Frontend:**
- [ ] Botão "Sincronizar Estado Atual" no painel
- [ ] Indicador de estados já sincronizados (badge verde/vermelho)
- [ ] Contador de estações por estado em tempo real
- [ ] Filtro por bacia hidrográfica

### **Backend:**
- [ ] Cache de dados sincronizados (Redis)
- [ ] Sincronização incremental (apenas novos dados)
- [ ] Websocket para progresso em tempo real
- [ ] Agendamento automático (cron jobs)

---

## 📚 Links Úteis

- **API ANA:** https://api.ana.gov.br/hidrowebservice
- **Documentação HidroWeb:** https://www.snirh.gov.br/hidrotelemetria/
- **Bacias Hidrográficas:** https://www.ana.gov.br/panorama-das-aguas/divisao-hidrografica-nacional

---

**🎯 Resumo Rápido:**
1. Selecione estado no dropdown do frontend
2. Execute `POST /api/ana/estacoes/hidro/sync` com `{"unidadefederativa":"XX"}`
3. Recarregue o mapa - estações aparecem automaticamente
4. Clique em estações para ver detalhes e buscar dados históricos
