# ─── STAGE 1: BUILD ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── STAGE 2: SERVIDOR ─────────────────────────────────────
FROM nginx:alpine

# Vite genera dist/, NO build/ como CRA
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]