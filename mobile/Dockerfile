FROM node:18-alpine
LABEL version=1.0.0
LABEL description="Dietician Frontend (React Native Web)"

# Install wget for health check
RUN apk add --no-cache wget

# Set environment
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code and server files
COPY . .

# Install serve globally for production
RUN npm install -g serve

# Build web bundle - use explicit output directory
RUN npx expo export --platform web --output-dir dist

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1

# Serve the exported web files
CMD ["serve", "-s", "dist", "-l", "8081"]
