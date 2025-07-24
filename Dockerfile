# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY karno/backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY karno/backend/ .

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"] 