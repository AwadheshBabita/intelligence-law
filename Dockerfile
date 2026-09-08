# Production Dockerfile for Intelligence Law Backend
# Use Node.js 20 LTS
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY src ./src

# Expose the port Render will use (PORT env var set by Render automatically)
EXPOSE 3001

# Start the application
CMD ["npx", "tsx", "src/server.ts"]