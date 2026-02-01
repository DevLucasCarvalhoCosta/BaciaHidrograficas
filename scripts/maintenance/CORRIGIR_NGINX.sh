#!/bin/bash

echo "=========================================="
echo "🔧 CORRIGINDO CONFIGURAÇÃO DO NGINX"
echo "=========================================="

# Fazer backup
echo "📦 Fazendo backup da configuração atual..."
docker exec nginx-gateway cp /etc/nginx/includes/app-ana.conf /etc/nginx/includes/app-ana.conf.before-fix

# Criar nova configuração
echo "✏️  Criando nova configuração..."
docker exec nginx-gateway tee /etc/nginx/includes/app-ana.conf > /dev/null <<'EOF'
# ============================================
# PROJETO: ANA Hidro
# Sistema de Análise Hidrológica
# ============================================

# ========================================
# ROTAS DIRETAS DA API (PRIORIDADE MÁXIMA)
# ========================================

# API Dashboard - Rotas diretas sem prefixo /ana
location /api/dashboard/ {
    proxy_pass http://ana-backend:3001;
    include /etc/nginx/includes/proxy-params.conf;

    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;        
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }

    # Timeouts
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
}

# API ANA - Rotas diretas sem prefixo /ana (estações, etc)
location /api/ana/ {
    proxy_pass http://ana-backend:3001;
    include /etc/nginx/includes/proxy-params.conf;

    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;        
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }

    # Timeouts
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
}

# ========================================
# ROTAS COM PREFIXO /ana (para acesso via subpath)
# ========================================

# API do ANA Backend - Dashboard (com prefixo /ana)
location /ana/api/dashboard/ {
    rewrite ^/ana/api/(.*)$ /api/$1 break;
    proxy_pass http://ana-backend:3001;
    include /etc/nginx/includes/proxy-params.conf;

    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;        
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }

    # Timeouts
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
}

# API do ANA Backend - Rotas gerais (com prefixo /ana)
location /ana/api/ana/ {
    rewrite ^/ana/api/ana/(.*)$ /api/ana/$1 break;
    proxy_pass http://ana-backend:3001;
    include /etc/nginx/includes/proxy-params.conf;

    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Timeouts
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
}

# ========================================
# FRONTEND E ASSETS
# ========================================

# Aplicação ANA - Assets e recursos estáticos
location ~ ^/ana/(assets/|.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))  {
    rewrite ^/ana/(.*)$ /$1 break;
    proxy_pass http://ana-frontend:80;
    include /etc/nginx/includes/proxy-params.conf;

    # CORS para assets
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;

    # Cache para assets estáticos
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Aplicação ANA - SPA (Single Page Application)
location /ana/ {
    rewrite ^/ana/(.*)$ /$1 break;
    proxy_pass http://ana-frontend:80;
    include /etc/nginx/includes/proxy-params.conf;

    # Headers específicos para SPA
    proxy_set_header X-Forwarded-Prefix /ana;

    # CORS
    add_header 'Access-Control-Allow-Origin' '*' always;

    # Sem cache para aplicação dinâmica
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    expires off;
}

# Redirecionamento para adicionar barra final
location = /ana {
    return 301 /ana/;
}
EOF

echo ""
echo "✅ Configuração aplicada!"
echo ""
echo "🔍 Testando configuração do NGINX..."
docker exec nginx-gateway nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuração válida! Recarregando NGINX..."
    docker exec nginx-gateway nginx -s reload
    echo ""
    echo "✅ NGINX recarregado com sucesso!"
    echo ""
    echo "🧪 Testando endpoints..."
    echo ""
    
    echo "1️⃣ Teste: GET /api/ana/estacoes"
    curl -s -o /dev/null -w "Status: %{http_code}\n" https://anahidro.duckdns.org/api/ana/estacoes/hidro?unidadefederativa=GO
    
    echo ""
    echo "2️⃣ Teste: GET /api/dashboard/stats/75650010"
    curl -s -o /dev/null -w "Status: %{http_code}\n" https://anahidro.duckdns.org/api/dashboard/stats/75650010
    
    echo ""
    echo "=========================================="
    echo "✅ CORREÇÃO CONCLUÍDA!"
    echo "=========================================="
    echo ""
    echo "📝 O backup foi salvo em:"
    echo "   /etc/nginx/includes/app-ana.conf.before-fix"
    echo ""
    echo "Para reverter em caso de problemas:"
    echo "   docker exec nginx-gateway cp /etc/nginx/includes/app-ana.conf.before-fix /etc/nginx/includes/app-ana.conf"
    echo "   docker exec nginx-gateway nginx -s reload"
else
    echo ""
    echo "❌ ERRO na configuração do NGINX!"
    echo "Revertendo para o backup..."
    docker exec nginx-gateway cp /etc/nginx/includes/app-ana.conf.before-fix /etc/nginx/includes/app-ana.conf
    echo "✅ Backup restaurado."
    exit 1
fi
