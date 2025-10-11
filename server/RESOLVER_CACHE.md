# 🔧 Resolver Problema de Cache

## ❌ Problema Identificado

O script ainda está usando código antigo em cache, por isso o parâmetro `Data de Busca (yyyy-MM-dd)` aparece ao invés de `Data de Busca`.

## ✅ Solução: Limpar Cache e Recompilar

Execute estes comandos **na ordem**:

### 1. Parar todos os processos Node.js
```powershell
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force
```

### 2. Limpar cache do Node.js
```bash
cd server
rm -rf node_modules/.cache
rm -rf dist
rm -rf .tsbuildinfo
```

### 3. Recompilar o código
```bash
# Se estiver usando TypeScript, recompilar
npx tsc --build --clean
npx tsc
```

### 4. Executar o script novamente
```bash
npx tsx src/scripts/sync-ano-2025.ts
```

---

## 🚀 Comando Único (PowerShell)

Execute tudo de uma vez:

```powershell
cd server
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force .tsbuildinfo -ErrorAction SilentlyContinue
npx tsx src/scripts/sync-ano-2025.ts
```

---

## 🚀 Comando Único (Bash/Git Bash)

```bash
cd server
rm -rf node_modules/.cache dist .tsbuildinfo
npx tsx src/scripts/sync-ano-2025.ts
```

---

## ✅ Verificar se Funcionou

Após executar, você deve ver nos logs:

```
[ANA Detalhada] GET /EstacoesTelemetricas/HidroinfoanaSerieTelemetricaDetalhada/v2 params = {
  Codigos_Estacoes: '75650010',
  'Tipo Filtro Data': 'DATA_LEITURA',
  'Data de Busca': '2025-01-01',  // ✅ SEM o sufixo (yyyy-MM-dd)
  'Range Intervalo de busca': 'DIAS_30'
}
```

**NÃO** deve aparecer: `'Data de Busca (yyyy-MM-dd)'` ❌

---

## 🔍 Se Ainda Não Funcionar

Se o problema persistir após limpar o cache, verifique:

### 1. Confirmar que o arquivo foi salvo
```bash
grep -n "Data de Busca" src/services/anaClient.ts
```

**Resultado esperado**:
- Deve mostrar `'Data de Busca':` (sem sufixo) na linha ~89

**Se mostrar** `'Data de Busca (yyyy-MM-dd)':` → O arquivo não foi salvo corretamente

### 2. Reabrir VS Code
```bash
# Fechar VS Code completamente
# Reabrir e executar novamente
code .
```

---

## 📊 Por Que Isso Acontece?

1. **tsx** usa cache interno para acelerar execução
2. **Node.js** mantém módulos em cache
3. **TypeScript** pode ter cache de compilação
4. Limpar cache força recarregar arquivos atualizados

---

**Execute o comando único e teste novamente!** 🚀
