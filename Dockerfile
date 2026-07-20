# build
FROM node:22-alpine AS builder

WORKDIR /app

COPY . /repo
WORKDIR /repo/site

RUN npm ci
RUN npm run build

# serve
FROM nginx:1.27-alpine

COPY --from=builder /repo/site/dist /usr/share/nginx/html
COPY site/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost/ || exit 1
