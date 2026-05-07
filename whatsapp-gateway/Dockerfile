FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Install git and other build dependencies for native modules
RUN apk add --no-cache git python3 make g++
RUN npm install

COPY . .

# Create directory for authentication state
RUN mkdir -p auth_info_baileys

CMD ["node", "index.js"]
