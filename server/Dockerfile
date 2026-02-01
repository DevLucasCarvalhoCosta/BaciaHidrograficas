# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /build

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build

# Gerar Prisma Client
RUN npx prisma generate

# ============================================
# STAGE 2: Runtime
# ============================================
FROM node:20-alpine

# Instalar dumb-init para gerenciar sinais corretamente
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar node_modules e build do stage anterior
COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /build/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /build/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /build/package*.json ./

# Criar diretório de logs
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicialização
CMD ["node", "dist/index.js"]
