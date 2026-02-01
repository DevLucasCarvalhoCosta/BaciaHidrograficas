#!/bin/bash

echo "=========================================="
echo "1. VERIFICANDO CONTAINERS DOCKER"
echo "=========================================="
docker ps -a
echo ""

echo "=========================================="
echo "2. VERIFICANDO LOGS DO NGINX"
echo "=========================================="
docker logs nginx-ana --tail 50
echo ""

echo "=========================================="
echo "3. VERIFICANDO LOGS DO SERVIDOR API"
echo "=========================================="
docker logs server-ana --tail 50
echo ""

echo "=========================================="
echo "4. VERIFICANDO CONFIGURAÇÃO DO NGINX"
echo "=========================================="
docker exec nginx-ana cat /etc/nginx/nginx.conf
echo ""

echo "=========================================="
echo "5. VERIFICANDO UPSTREAMS DO NGINX"
echo "=========================================="
docker exec nginx-ana cat /etc/nginx/conf.d/upstreams.conf 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "=========================================="
echo "6. VERIFICANDO CONFIGURAÇÃO ANA NO NGINX"
echo "=========================================="
docker exec nginx-ana cat /etc/nginx/includes/app-ana.conf 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "=========================================="
echo "7. VERIFICANDO PORTAS ABERTAS"
echo "=========================================="
netstat -tulpn | grep -E ':(80|3000|5000|8080)'
echo ""

echo "=========================================="
echo "8. TESTANDO ENDPOINT DA API DIRETAMENTE"
echo "=========================================="
curl -v http://localhost:3000/api/ana/estacoes 2>&1 | head -30
echo ""

echo "=========================================="
echo "9. TESTANDO ENDPOINT ATRAVÉS DO NGINX"
echo "=========================================="
curl -v http://localhost/api/ana/estacoes 2>&1 | head -30
echo ""

echo "=========================================="
echo "10. VERIFICANDO REDE DOCKER"
echo "=========================================="
docker network inspect ana_network 2>/dev/null || docker network ls
echo ""

echo "=========================================="
echo "11. VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "=========================================="
docker exec server-ana env | grep -E '(PORT|DATABASE|NODE_ENV)'
echo ""

echo "=========================================="
echo "VERIFICAÇÃO COMPLETA!"
echo "=========================================="
