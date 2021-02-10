FROM node:lts-stretch AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm audit fix

COPY tsconfig.json ./
COPY src src
RUN npm run build


FROM alpine:edge
WORKDIR /app

RUN apk update && apk upgrade
RUN apk add --no-cache make g++ python3 \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      nodejs-npm
RUN addgroup -g 1000 -S pptr && \
    adduser -D -u 1000 -S -G pptr pptr
RUN echo '%pptr ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build

RUN npm install --production
CMD ["node", "/app/build/app.js"]
