# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend directory
COPY karno/backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all backend source code
COPY karno/backend/ .

# Create necessary directories
RUN mkdir -p public/uploads

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the app
CMD ["npm", "start"] 