FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Railway does NOT automatically pass env vars as Docker build args.
# The default value here IS the production URL — it gets baked into the JS bundle by Vite.
ARG VITE_API_URL=https://backend-production-e1e6.up.railway.app/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
