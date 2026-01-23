# Frontend Dockerfile
# Generated from: specs/deployment/containerization.md
# Multi-stage build for React/Vite application

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG VITE_BACKEND_API_URL
ARG VITE_APP_NAME=Todo AI Chatbot

# Set environment variables for build
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build the application
RUN npm run build

# Stage 3: Production (nginx)
FROM nginx:alpine AS production

# Install envsubst for runtime config injection
RUN apk add --no-cache gettext

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy config template
COPY public/config.js.template /usr/share/nginx/html/config.js.template

# Create startup script to inject runtime config
RUN echo '#!/bin/sh' > /start-nginx.sh && \
    echo 'set -e' >> /start-nginx.sh && \
    echo 'export BACKEND_API_URL="${BACKEND_API_URL:-http://todo-backend:8000}"' >> /start-nginx.sh && \
    echo '# Process config template if it exists (first run), otherwise skip (restart)' >> /start-nginx.sh && \
    echo 'if [ -f /usr/share/nginx/html/config.js.template ]; then' >> /start-nginx.sh && \
    echo '  envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js' >> /start-nginx.sh && \
    echo '  rm -f /usr/share/nginx/html/config.js.template' >> /start-nginx.sh && \
    echo 'elif [ ! -f /usr/share/nginx/html/config.js ]; then' >> /start-nginx.sh && \
    echo '  # Template missing and config.js missing - create a default one' >> /start-nginx.sh && \
    echo '  echo "window.__RUNTIME_CONFIG__ = { VITE_BACKEND_API_URL: \\"${BACKEND_API_URL}\\" };" > /usr/share/nginx/html/config.js' >> /start-nginx.sh && \
    echo 'fi' >> /start-nginx.sh && \
    echo 'exec nginx -g "daemon off;"' >> /start-nginx.sh && \
    chmod +x /start-nginx.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Use custom entrypoint
ENTRYPOINT ["/start-nginx.sh"]
