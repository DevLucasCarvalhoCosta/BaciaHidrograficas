# 💧 Sistema ANA Hidro - Monitoramento de Recursos Hídricos

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-TCC-blue)

Sistema moderno e profissional para visualização e análise de estações hidrológicas da **ANA (Agência Nacional de Águas e Saneamento Básico)**.

## 📸 Preview

![Screenshot do Sistema](docs/screenshot.png)

## 🎯 Características Principais

### 🎨 Interface Moderna
- Design system profissional com tema azul/água
- Marcadores customizados diferenciando estações ativas/inativas
- Mapas modernos CartoDB Voyager (100% gratuito)
- Responsivo para desktop, tablet e mobile

### 🔍 Funcionalidades
- Visualização de estações em mapa interativo
- Filtros por UF, tipo, status operacional e rio
- Filtros avançados por datas e múltiplos critérios
- Busca inteligente por nome, código ou rio
- Estatísticas em tempo real
- Popups informativos com dados das estações

### 🌐 Dados
- Integração com API oficial da ANA
- Abrangência: Todos os estados brasileiros
- Estado padrão: Goiás (GO)
- Sincronização em tempo real

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│  React Frontend │ ◄─────► │  Express Backend │ ◄─────► │  PostgreSQL │
│   (Vite + TS)   │         │   (Node + TS)    │         │             │
│                 │         │                  │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                     │
                                     │
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │   API da ANA     │
                            │  (Hidrowebservice)│
                            │                  │
                            └──────────────────┘
```

## 🚀 Tecnologias

### Frontend
- React 18.3
- TypeScript 5.6
- Vite 5.4
- Leaflet + React Leaflet
- CartoDB Tiles

### Backend
- Node.js 18+
- Express 4.19
- TypeScript 5.6
- Prisma ORM 6.17
- PostgreSQL
- Zod (validação)
- Axios (HTTP client)

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- Git

### 1. Clonar Repositório
```bash
git clone https://github.com/SEU_USUARIO/ana-hidro.git
cd ana-hidro
```

### 2. Backend
```bash
cd server
npm install

# Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# Configurar banco
npx prisma generate
npx prisma migrate dev

# Iniciar
npm run dev
```

### 3. Frontend
```bash
cd web
npm install

# Configurar .env
cp .env.example .env

# Iniciar
npm run dev
```

Acesse: http://localhost:5173

## 🌐 Deploy para Produção

### Opção 1: Servidor Tradicional (UEG)
Siga o guia completo: [DEPLOY_UEG.md](DEPLOY_UEG.md)

**Resumo rápido**: [DEPLOY_RAPIDO.md](DEPLOY_RAPIDO.md)

### Opção 2: Railway/Render
```bash
# Ver configurações em:
railway.json
render.yaml
```

## 📚 Documentação

- **[DEPLOY_UEG.md](DEPLOY_UEG.md)** - Guia completo de deploy no servidor UEG
- **[DEPLOY_RAPIDO.md](DEPLOY_RAPIDO.md)** - Guia rápido de deploy
- **[MELHORIAS.md](MELHORIAS.md)** - Relatório de melhorias implementadas
- **[TESTES.md](TESTES.md)** - Guia de testes e validação
- **[COMANDOS.md](COMANDOS.md)** - Comandos úteis e referências
- **[RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)** - Resumo do projeto

## 🔧 Scripts Úteis

### No Servidor
```bash
./deploy.sh     # Deploy/atualização automática
./populate.sh   # Popular banco com dados da ANA
./backup.sh     # Backup do banco de dados
```

### Desenvolvimento
```bash
# Backend
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm start        # Iniciar produção

# Frontend
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview do build
```

## 🗂️ Estrutura do Projeto

```
ana-hidro/
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── services/      # Serviços (ANA Client)
│   │   └── db/            # Prisma client
│   ├── prisma/            # Schema e migrations
│   └── ecosystem.config.js # Configuração PM2
│
├── web/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   └── services/      # API client, utils
│   └── dist/              # Build de produção
│
├── docs/                   # Documentação
├── deploy.sh              # Script de deploy
├── populate.sh            # Script de população
└── backup.sh              # Script de backup
```

## 📊 API Endpoints

### Autenticação
```http
POST /api/ana/login
Body: { "identificador": "...", "senha": "..." }
Response: { "token": "..." }
```

### Estações
```http
GET /api/ana/estacoes/hidro?unidadefederativa=GO&q=search
POST /api/ana/estacoes/hidro/sync
GET /api/ana/bacias?uf=GO
```

Ver documentação completa: `server/requests.http`

## 🧪 Testes

```bash
# Backend
cd server
npm test

# Frontend
cd web
npm test
```

Guia completo de testes: [TESTES.md](TESTES.md)

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC) com foco em:
- Visualização de dados geoespaciais
- Integração com APIs governamentais
- Desenvolvimento full-stack moderno
- Deploy em ambientes de produção

## 👥 Autores

- **Seu Nome** - Desenvolvimento Full Stack
- **Orientador** - Prof. Dr. Nome do Orientador

## 📝 Licença

Projeto acadêmico - Universidade Estadual de Goiás (UEG)

## 🤝 Contribuindo

Este é um projeto acadêmico, mas sugestões são bem-vindas!

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

- Email: seu.email@ueg.br
- LinkedIn: [seu-linkedin](https://linkedin.com/in/seu-perfil)

## 🙏 Agradecimentos

- ANA - Agência Nacional de Águas
- Universidade Estadual de Goiás (UEG)
- CartoDB por fornecer tiles gratuitos
- Comunidades Open Source de React, Node.js e Leaflet

---

**Desenvolvido com 💙 para monitoramento de recursos hídricos do Brasil** 🇧🇷

⭐ Se este projeto te ajudou, considere dar uma estrela!
