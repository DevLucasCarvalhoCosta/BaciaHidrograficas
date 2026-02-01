# 📜 Scripts

Esta pasta contém scripts auxiliares para deploy e manutenção do sistema.

## 📁 Estrutura

```
scripts/
├── deploy/          # Scripts de deploy
│   ├── deploy.sh    # Script principal de deploy
│   ├── backup.sh    # Backup do sistema
│   ├── setup-ueg-server.sh  # Setup inicial do servidor
│   └── populate.sh  # Popular banco de dados
│
└── maintenance/     # Scripts de manutenção
    ├── CORRIGIR_NGINX.sh    # Correções de configuração Nginx
    ├── VERIFICAR_SERVIDOR.sh # Verificação de status
    └── migrate-to-docker.sh  # Migração para Docker
```

## ⚠️ Atenção

Estes scripts são destinados ao ambiente de produção/servidor.
Revise e adapte conforme necessário antes de executar.
