FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npx prisma generate
RUN npm run build
COPY --from=frontend /app/frontend/dist ./public
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=backend /app/backend ./
EXPOSE 8080
CMD ["node", "dist/index.js"]

