# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o projeto!

## Como Contribuir

### 1. Fork e Clone

```bash
git clone https://github.com/seu-usuario/BaciaHidrograficas.git
cd BaciaHidrograficas
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/minha-correcao
```

### 3. Instale as Dependências

```bash
# Backend
cd server && npm install

# Frontend
cd ../web && npm install
```

### 4. Faça suas Alterações

- Siga os padrões de código existentes
- Adicione testes se aplicável
- Atualize a documentação se necessário

### 5. Commit

```bash
git add .
git commit -m "feat: descrição da feature"
```

**Padrão de Commits:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas gerais

### 6. Push e Pull Request

```bash
git push origin feature/minha-feature
```

Abra um Pull Request no GitHub.

---

## Padrões de Código

### TypeScript

- Use tipos explícitos
- Evite `any`
- Prefira interfaces a types para objetos

### React

- Componentes funcionais
- Hooks para estado e efeitos
- Props tipadas

### Estilo

- CSS modular ou styled-components
- Nomes de classes semânticos

---

## Estrutura do Projeto

```
├── server/          # Backend Node.js
│   ├── src/
│   │   ├── routes/  # Rotas da API
│   │   ├── services/# Lógica de negócio
│   │   └── db/      # Configuração do banco
│   └── prisma/      # Schema e migrations
│
├── web/             # Frontend React
│   └── src/
│       ├── components/
│       ├── services/
│       └── styles/
│
└── docs/            # Documentação
```

---

## Reportando Bugs

Use as [Issues do GitHub](https://github.com/DevLucasCarvalhoCosta/BaciaHidrograficas/issues) com:

1. Descrição clara do problema
2. Passos para reproduzir
3. Comportamento esperado vs atual
4. Screenshots se aplicável
5. Ambiente (OS, Node version, etc.)

---

## Sugestões de Features

Abra uma Issue com:

1. Descrição da feature
2. Motivação/use case
3. Possível implementação (opcional)
