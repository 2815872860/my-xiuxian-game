FROM node:20-alpine

WORKDIR /workspace

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.mjs"]
