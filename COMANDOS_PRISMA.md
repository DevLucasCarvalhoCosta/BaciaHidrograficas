# Comandos para Executar (Git Bash ou Terminal)

## 1. Gerar Prisma Client
```bash
cd /c/Users/KUMA/Documents/ProjetoTcc/server
npm run prisma:generate
```

## 2. Criar e Aplicar Migration
```bash
cd /c/Users/KUMA/Documents/ProjetoTcc/server
npx prisma migrate dev --name series-telemetricas
```

## OU usar db push (mais rápido para desenvolvimento)
```bash
cd /c/Users/KUMA/Documents/ProjetoTcc/server
npm run db:push
```

## 3. Reiniciar o servidor backend
```bash
cd /c/Users/KUMA/Documents/ProjetoTcc/server
npm run dev
```

---

## Novos Endpoints Criados:

### 1. Sincronizar Séries Telemétricas
```bash
POST http://localhost:5000/api/ana/series/sync
Body: {
  "codigoEstacao": "87490000",
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31",
  "tipo": "chuva"  // ou "vazao", "nivel", ou omitir para buscar todos
}
```

### 2. Ver Estatísticas das Séries
```bash
GET http://localhost:5000/api/ana/series/87490000
```

### 3. Ver Dados de Série Específica
```bash
GET http://localhost:5000/api/ana/series/87490000/chuva?limit=100
GET http://localhost:5000/api/ana/series/87490000/vazao?limit=100
GET http://localhost:5000/api/ana/series/87490000/nivel?limit=100
```

---

## Próximos Passos Após Executar os Comandos:

1. ✅ Prisma Client gerado
2. ✅ Banco de dados atualizado com novas tabelas
3. ✅ Backend funcionando com novos endpoints
4. 🔄 Atualizar frontend para adicionar botão "Buscar Dados Detalhados" no popup das estações
5. 🔄 Criar dashboard com gráficos dos dados populados

Execute os comandos acima no Git Bash e me avise quando estiver pronto para continuar!
