FROM node:18-alpine
LABEL version=1.0.0
LABEL description="Dietician Frontend (React Native Web)"

# Install wget for health check and serve package
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build static web files for production
RUN npx expo export:web --output-dir web-build

# Install a simple HTTP server to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1

# Serve static files
CMD ["serve", "-s", "web-build", "-l", "8081"]
