# 🔄 Atualizar Estrutura do Banco de Dados

## ⚠️ Mudança Importante

A estrutura dos dados da API da ANA é diferente do que esperávamos inicialmente.

### ❌ Antes (3 tabelas separadas):
- `SerieChuva` - apenas dados de chuva
- `SerieVazao` - apenas dados de vazão  
- `SerieNivel` - apenas dados de nível

### ✅ Agora (1 tabela completa):
- `SerieTelemetrica` - **TODOS** os dados em uma única medição:
  - Chuva (acumulada, adotada + status)
  - Cota/Nível (sensor, adotada, display, manual + status)
  - Vazão (adotada + status)
  - Temperatura (água, interna)
  - Pressão atmosférica
  - Bateria
  - Datas (medição, atualização)

---

## 🚀 Como Atualizar

### **1. Parar o servidor**
```bash
# Se estiver rodando, pare com Ctrl+C
```

### **2. Aplicar mudanças no banco**

**Git Bash:**
```bash
cd /c/Users/KUMA/Documents/ProjetoTcc/server
npm run db:push
```

Isso vai:
- ✅ Remover tabelas antigas (`SerieChuva`, `SerieVazao`, `SerieNivel`)
- ✅ Criar nova tabela (`SerieTelemetrica`)
- ✅ Manter integridade dos dados de estações

⚠️ **ATENÇÃO:** Dados antigos de séries serão perdidos, mas isso é OK porque ainda não tínhamos dados corretos!

### **3. Reiniciar o servidor**
```bash
npm run dev
```

---

## 📊 Nova Estrutura de Dados

Cada registro agora contém **TUDO** em uma medição:

```json
{
  "codigoestacao": "75650010",
  "Data_Hora_Medicao": "2025-10-10 00:00:00.0",
  "Data_Atualizacao": "2025-10-10 01:00:18.943",
  "Bateria": "12.70",
  "Chuva_Acumulada": "1288.40",
  "Chuva_Acumulada_Status": "0",
  "Chuva_Adotada": "0.00",
  "Chuva_Adotada_Status": "0",
  "Cota_Sensor": "2033.00",
  "Cota_Sensor_Status": "2",
  "Temperatura_Agua": "19.80",
  "Temperatura_Interna": "16.40",
  "Vazao_Adotada": null
}
```

---

## ✅ Vantagens da Nova Estrutura

1. **Mais Completa** - Todos os dados juntos
2. **Mais Precisa** - Mesma estrutura da API
3. **Mais Simples** - 1 tabela em vez de 3
4. **Mais Flexível** - Fácil adicionar novos campos
5. **Status Individual** - Cada dado tem seu status de qualidade

---

## 🔄 Próximos Passos

Após atualizar o banco:

1. ✅ Testar endpoint: `GET /api/ana/series/test/75650010`
2. ✅ Ver estrutura real dos dados da estação
3. ✅ Implementar sync correto
4. ✅ Criar dashboards com os dados reais

---

## 💡 Campos Importantes

### **Chuva:**
- `Chuva_Acumulada` - Total acumulado
- `Chuva_Adotada` - Valor corrigido/adotado
- `*_Status` - Qualidade do dado (0=bom, 1=duvidoso, 2=estimado)

### **Cota/Nível:**
- `Cota_Sensor` - Leitura direta do sensor
- `Cota_Adotada` - Valor validado/adotado
- `Cota_Display` - Valor mostrado no display local
- `Cota_Manual` - Leitura manual (se houver)

### **Temperatura:**
- `Temperatura_Agua` - Temperatura da água
- `Temperatura_Interna` - Temperatura interna do equipamento

### **Equipamento:**
- `Bateria` - Nível da bateria (volts)

---

**Execute agora:** `npm run db:push` no Git Bash!
