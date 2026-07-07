FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/db /app/data

EXPOSE 3000

# Copy CSV files from the project root (mounted as volume)
ENV CSV_DIR=/app/data
ENV DB_PATH=/app/db/worldcup.db
ENV PORT=3000

CMD ["node", "server.js"]
