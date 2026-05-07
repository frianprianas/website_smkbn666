FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create directory for authentication state
RUN mkdir -p auth_info_baileys

CMD ["node", "index.js"]
