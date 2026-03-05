FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

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

# Copy production dependencies and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create uploads directory
RUN mkdir -p uploads/categories

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]
