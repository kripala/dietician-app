FROM eclipse-temurin:17-jdk-alpine
LABEL version=1.0.0
LABEL description="Dietician Backend API"

# Install wget for health check
RUN apk add --no-cache wget

# Create directories for logs and uploads
RUN mkdir -p /var/log/dietician/access \
    && mkdir -p /var/dietician/uploads

# Set working directory
WORKDIR /app

# Copy JAR file
COPY target/dietician-api-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# IMPORTANT: External config support
# Spring Boot will load properties from mounted directory in this order:
# 1. JAR internal application.properties
# 2. /config/application.properties (external override - highest priority)
# Use --spring.config.additional-location=/config/ to load external config

ENTRYPOINT ["java", \
    "-Dspring.config.additional-location=/config/", \
    "-Dspring.profiles.active=prod", \
    "-jar", "app.jar"]
