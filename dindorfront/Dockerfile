# ── Stage 1 : Build Angular ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2 : Nginx ───────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=builder /app/dist/dindorfront/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
