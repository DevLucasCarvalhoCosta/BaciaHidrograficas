# 🚀 Executar Script - Passo a Passo

## ✅ Todas as Correções Aplicadas

1. ✅ Endpoint correto: `/HidroinfoanaSerieTelemetricaDetalhada/v2`
2. ✅ Parâmetro correto: `'Data de Busca'` (sem sufixo)
3. ✅ Método criado: `getSerieTelemetricaDetalhada()`
4. ✅ Rotas atualizadas
5. ✅ Script atualizado
6. ✅ Schema confirmado (campos como String)

---

## 🎯 Execute Agora

```bash
cd server
npx tsx src/scripts/sync-ano-2025.ts
```

---

## 📊 O que vai acontecer

1. **Login na API**: Obtém token de autenticação
2. **13 requisições**: Cobrindo todo o ano 2025 (de 30 em 30 dias)
3. **Para cada requisição**:
   - Busca ~1440 registros (30 dias × 48 medições/dia)
   - Salva no banco usando upsert (não duplica)
   - Aguarda 1 segundo antes da próxima
4. **Resultado final**: Total de registros processados

---

## ✅ Resultado Esperado

```
🚀 Iniciando sincronização de dados da estação 75650010 para o ano 2025
═══════════════════════════════════════════════════════════════════════

🔑 Fazendo login na API da ANA...
✅ Token obtido com sucesso

📅 Total de requisições necessárias: 13

[1/13] 📡 Buscando dados de 2025-01-01...
[ANA Detalhada] status = 200
[ANA Detalhada] items count = 1440
   ✅ 1440 registros recebidos
   💾 Salvando no banco de dados...
   ✅ 1440 registros salvos/atualizados

[2/13] 📡 Buscando dados de 2025-01-31...
...

═══════════════════════════════════════════════════════════════════════
✅ Sincronização concluída!
📊 Total de registros processados: ~18,000
📅 Período: Todo o ano de 2025
🏷️  Estação: 75650010
═══════════════════════════════════════════════════════════════════════
```

---

## 🔍 Após Sincronização

### Verificar dados no banco:
```bash
curl http://localhost:3000/api/ana/series/75650010
```

**Resposta esperada**:
```json
{
  "codigoEstacao": "75650010",
  "totalRegistros": 18000,
  "periodo": {
    "inicio": "2025-01-01T00:00:00.000Z",
    "fim": "2025-12-27T23:30:00.000Z"
  },
  "estatisticas": {
    "chuva": { "registros": 18000, "min": "0.00", "max": "904.80" },
    "temperatura": { "registros": 18000, "min": "15.20", "max": "28.50" }
  }
}
```

---

**Pronto para executar!** 🎉
