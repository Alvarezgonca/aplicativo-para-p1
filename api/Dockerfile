# Imagem da API em dois estagios: o primeiro instala as dependencias, o
# segundo leva so o necessario para rodar (sem cache do npm nem ferramentas
# de desenvolvimento), o que deixa a imagem menor e com menos a explorar.

FROM node:24.22.3-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24.22.3-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Roda como o usuario sem privilegios que a imagem do Node ja traz, e nao
# como root: uma falha na API nao vira controle do conteiner.
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/saude >/dev/null || exit 1

CMD ["node", "src/server.js"]
