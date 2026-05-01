FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# We remove --production for now just to ensure all tools are available
RUN npm install 

COPY . .

# CHANGE: Match the port Prometheus is looking for
EXPOSE 5000

# CHANGE: It's better to run the file directly in Docker
CMD ["node", "server.js"]