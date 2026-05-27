FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# VITE_API_URL must be declared as ARG so Railway passes it as a Docker build arg.
# Vite bakes VITE_* vars into the JS bundle at build time — if undefined here,
# the fallback '/api' (relative path) is used, pointing to the wrong host.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
