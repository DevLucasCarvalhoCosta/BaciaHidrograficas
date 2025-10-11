# 🌊 Exemplo Prático: Sincronizando Rio Grande do Sul (RS)

## 📋 Passo a Passo Completo

### **1. Certifique-se que o servidor está rodando**

```bash
# No terminal, pasta server/
cd server
npm run dev
```

Você deve ver:
```
🚀 Servidor rodando em http://localhost:3000
```

---

### **2. Sincronizar Estações do RS**

#### **Opção A: Thunder Client (Recomendado)**

1. Abra o Thunder Client no VS Code (ícone de raio na barra lateral)
2. Clique em "New Request"
3. Configure:
   - **Method:** POST
   - **URL:** `http://localhost:3000/api/ana/estacoes/hidro/sync`
4. Aba "Headers":
   - Key: `Content-Type`
   - Value: `application/json`
5. Aba "Body" (JSON):
```json
{
  "unidadefederativa": "RS"
}
```
6. Clique em **Send**
7. Aguarde (pode levar 30-60 segundos)
8. Resposta esperada:
```json
{
  "total": 450,
  "upserted": 450
}
```

#### **Opção B: Curl (Terminal Git Bash)**

```bash
curl -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
  -H "Content-Type: application/json" \
  -d '{"unidadefederativa":"RS"}'
```

#### **Opção C: Arquivo requests.http**

Crie arquivo `server/requests-rs.http`:
```http
### Sincronizar estações do Rio Grande do Sul
POST http://localhost:3000/api/ana/estacoes/hidro/sync
Content-Type: application/json

{
  "unidadefederativa": "RS"
}
```

Clique em "Send Request" acima da linha POST.

---

### **3. Verificar que os Dados Foram Salvos**

```bash
# Verificar primeiras 5 estações
GET http://localhost:3000/api/ana/estacoes/hidro?uf=RS&tamanho=5
```

Resposta esperada:
```json
{
  "data": [
    {
      "codigoestacao": "74000000",
      "Estacao_Nome": "PASSO DOS ÍNDIOS",
      "UF_Estacao": "RS",
      "Rio_Nome": "RIO URUGUAI",
      "Latitude": "-27.5833",
      "Longitude": "-53.6667",
      "Operando": "1"
    },
    // ... mais estações
  ],
  "pagination": {
    "pagina": 1,
    "tamanho": 5,
    "total": 450,
    "paginas": 90
  }
}
```

---

### **4. Visualizar no Frontend**

1. Abra o navegador: `http://localhost:5173`
2. No painel lateral, no dropdown **"Estado (UF)"**
3. Selecione: **RS - Rio Grande do Sul**
4. O mapa vai:
   - ✅ Centralizar automaticamente no RS
   - ✅ Mostrar todas as ~450 estações
   - ✅ Atualizar contador: "Total: 450"

---

### **5. Explorar os Dados**

#### **Filtrar por Rio Uruguai:**
- Campo "Rio": digite `uruguai`
- Clique **🔍 Buscar**

#### **Ver apenas estações operando:**
- "Status Operacional": selecione **✓ Operando**

#### **Buscar por nome específico:**
- "Busca Rápida": digite `PASSO`
- Clique **🔍 Buscar**

---

### **6. Buscar Dados Históricos de Uma Estação**

1. Clique em qualquer marcador azul no mapa
2. Popup abre com informações da estação
3. Clique no botão **"📊 Buscar Dados Detalhados"**
4. Confirme a mensagem
5. Aguarde 10-20 segundos
6. Mensagem de sucesso mostra:
```
✅ Dados sincronizados com sucesso!

💧 Chuva: 180 registros
🌊 Vazão: 150 registros
📏 Nível: 200 registros

📊 Agora você pode visualizar esses dados em dashboards!
```

---

## 🎯 Bacias Hidrográficas do RS

As principais bacias do Rio Grande do Sul são:

### **1. Bacia do Rio Uruguai** (Oeste)
- **Principais Rios:** Uruguai, Ijuí, Turvo
- **Estações:** ~150
- **Municípios:** Uruguaiana, Santo Ângelo, Ijuí

### **2. Bacia do Guaíba** (Centro-Leste)
- **Principais Rios:** Jacuí, Taquari, Caí, Sinos, Gravataí
- **Estações:** ~200
- **Municípios:** Porto Alegre, Região Metropolitana

### **3. Bacia Litorânea** (Litoral)
- **Principais Rios:** Camaquã, Jaguarão
- **Estações:** ~50
- **Municípios:** Rio Grande, Pelotas

### **4. Bacia do Rio Ibicuí** (Sudoeste)
- **Principais Rios:** Ibicuí, Santa Maria
- **Estações:** ~50
- **Municípios:** Alegrete, Santiago

---

## 📊 Consultas Úteis para RS

### **Ver todas as bacias do RS:**
```
GET http://localhost:3000/api/ana/bacias?uf=RS
```

### **Estações do Rio Uruguai:**
```
GET http://localhost:3000/api/ana/estacoes/hidro?uf=RS&rio=uruguai
```

### **Estações de Porto Alegre e Região:**
```
GET http://localhost:3000/api/ana/estacoes/hidro?uf=RS&q=porto alegre
```

### **Estações Telemétricas (tempo real):**
```
GET http://localhost:3000/api/ana/estacoes/hidro?uf=RS&tipotelemetrica=true
```

---

## 🔄 Sincronizar Outros Estados Importantes

Depois de sincronizar o RS, você pode fazer o mesmo para:

### **Estados Vizinhos:**
```json
{"unidadefederativa": "SC"}  // Santa Catarina
{"unidadefederativa": "PR"}  // Paraná
```

### **Mesma Bacia do Uruguai:**
```json
{"unidadefederativa": "SC"}  // Alto Uruguai
{"unidadefederativa": "PR"}  // Iguaçu (afluente do Paraná)
```

---

## 🛠️ Troubleshooting

### **Erro: "Nenhuma estação encontrada para RS"**
**Causa:** Estado não foi sincronizado
**Solução:** Execute o POST para sync primeiro

### **Erro: "Cannot read properties of undefined (reading 'chuva')"**
**Causa:** Prisma Client não regenerado após schema.prisma
**Solução:**
```bash
cd server
npx prisma generate
npm run dev
```

### **Mapa não mostra estações:**
**Verificar:**
1. Console do navegador (F12) para erros
2. Response da API: `GET /api/ana/estacoes/hidro?uf=RS`
3. Se `total: 0`, rodar sync novamente

---

## 📈 Próximos Passos

Após sincronizar RS:

1. ✅ **Visualizar no mapa** - centralizando automaticamente
2. ✅ **Filtrar por bacias** - usando campo "Rio"
3. ✅ **Buscar dados históricos** - clicando nas estações
4. 🔜 **Criar dashboards** - gráficos de chuva/vazão/nível
5. 🔜 **Comparar estados** - GO vs RS
6. 🔜 **Análise de bacias** - tendências hidrológicas

---

## 🎯 Exemplo Real: Estação Passo dos Índios

**Código:** 74000000
**Nome:** PASSO DOS ÍNDIOS
**Rio:** Rio Uruguai
**UF:** RS
**Coordenadas:** -27.5833, -53.6667
**Município:** São Borja

### Dados disponíveis:
- ✅ Pluviometria (chuva)
- ✅ Fluviometria (nível/vazão)
- ✅ Telemetria (tempo real)

### Como acessar:
1. Selecione "RS" no dropdown
2. Busque "passo dos indios"
3. Clique no marcador azul
4. Veja histórico completo da estação

---

**✨ Agora você pode explorar todas as estações hidrológicas do Rio Grande do Sul!**
