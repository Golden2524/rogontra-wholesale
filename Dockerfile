FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY backend ./backend
COPY package.json ./package.json

EXPOSE 3000

CMD ["node", "backend/src/server.js"]
