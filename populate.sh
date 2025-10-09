#!/bin/bash

# Script de População do Banco de Dados
# Sincroniza estações da ANA para o banco local

set -e

echo "🗄️ Iniciando população do banco de dados..."

# Ler credenciais do .env
cd /var/www/ana-hidro/server
source .env

# Verificar se variáveis existem
if [ -z "$ANA_IDENTIFICADOR" ] || [ -z "$ANA_SENHA" ]; then
    echo "❌ Erro: ANA_IDENTIFICADOR ou ANA_SENHA não configurados no .env"
    exit 1
fi

# Obter token
echo "🔐 Obtendo token de autenticação..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/ana/login \
  -H "Content-Type: application/json" \
  -d "{\"identificador\":\"$ANA_IDENTIFICADOR\",\"senha\":\"$ANA_SENHA\"}" \
  | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Erro ao obter token!"
    exit 1
fi

echo "✓ Token obtido com sucesso"

# Lista de UFs para sincronizar (principais estados)
UFS=("GO" "SP" "RJ" "MG" "BA" "PR" "SC" "RS" "ES" "MT" "MS" "DF")

echo ""
echo "📊 Sincronizando estações de ${#UFS[@]} estados..."
echo ""

TOTAL=0

for UF in "${UFS[@]}"
do
  echo "🌊 Sincronizando $UF..."
  
  RESULT=$(curl -s -X POST http://localhost:3000/api/ana/estacoes/hidro/sync \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\",\"unidadefederativa\":\"$UF\"}")
  
  UPSERTED=$(echo $RESULT | jq -r '.upserted // 0')
  TOTAL=$((TOTAL + UPSERTED))
  
  echo "  ✓ $UPSERTED estações sincronizadas"
  echo ""
  
  # Aguardar entre requisições para não sobrecarregar API
  sleep 3
done

echo ""
echo "🎉 População concluída!"
echo "📊 Total de estações: $TOTAL"
echo ""
echo "✅ Para verificar no banco:"
echo "   psql -U ana_user -d ana_hidro -c \"SELECT \\\"UF_Estacao\\\", COUNT(*) FROM \\\"HidroStation\\\" GROUP BY \\\"UF_Estacao\\\";\""
echo ""
