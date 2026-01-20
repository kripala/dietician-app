FROM node:18-alpine
LABEL version=1.0.0
LABEL description="Dietician Frontend (React Native Web)"

# Install wget for health check
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and server files
COPY . .

# Install serve globally for production
RUN npm install -g serve

# Build web bundle
RUN npx expo export --platform web

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1

# Serve the exported web files
CMD ["serve", "-s", "dist", "-l", "8081"]
