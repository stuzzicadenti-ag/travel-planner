FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY src/ src/
ENV NODE_ENV=production PORT=4002
EXPOSE 4002
CMD ["node", "src/server.js"]
