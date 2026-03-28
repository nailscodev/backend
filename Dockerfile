FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Cache npm downloads between depot rebuilds (BuildKit cache mount)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy configs first (changes often, small)
COPY tsconfig*.json nest-cli.json ./
# Copy source separately so its cache key is independent
COPY src/ ./src/
# Copy any other needed files
COPY Procfile* ./

RUN node node_modules/typescript/bin/tsc -p tsconfig.build.json \
    && echo "BUILD OK — dist has $(find dist -name '*.js' | wc -l) JS files" \
    && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
# Install only production dependencies — skip devDeps (smaller image)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Create uploads directory and non-root user
RUN mkdir -p uploads/categories \
    && addgroup -S app \
    && adduser -S app -G app \
    && chown -R app:app /app

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

USER app

CMD ["node", "dist/main.js"]
