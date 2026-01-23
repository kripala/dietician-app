#!/bin/bash
# Local development setup script for Dietician App
# This script:
# 1. Drops and recreates the database schema
# 2. Exports environment variables from .env
# 3. Starts the backend application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Dietician App - Local Development Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

# Export environment variables from .env
echo -e "${YELLOW}Loading environment variables from .env...${NC}"
export $(grep -v '^#' .env | xargs)

# Verify required variables are set
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: DB_USERNAME or DB_PASSWORD not set in .env${NC}"
    exit 1
fi

# Ask user if they want to drop and recreate the schema
echo -e "${YELLOW}Do you want to drop and recreate the database schema?${NC}"
echo -e "${YELLOW}This will delete ALL existing data! (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Dropping and recreating schema...${NC}"

    # Drop and recreate schema
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U "$DB_USERNAME" -d dietician_db << EOF
        DROP SCHEMA IF EXISTS diet CASCADE;
        CREATE SCHEMA diet;
        GRANT ALL ON SCHEMA diet TO $DB_USERNAME;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Schema recreated successfully!${NC}"
    else
        echo -e "${RED}Failed to recreate schema. Make sure PostgreSQL is running.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping schema recreation.${NC}"
fi

# Check if Maven wrapper exists
if [ -f ./mvnw ]; then
    echo -e "${GREEN}Starting backend application with Maven wrapper...${NC}"
    # Use local properties file if it exists (contains real secrets)
    if [ -f "$PROJECT_ROOT/application-dev.properties.local" ]; then
        echo -e "${GREEN}Loading real secrets from application-dev.properties.local${NC}"
        ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev \
            -Dspring.config.additional-location=$PROJECT_ROOT/application-dev.properties.local
    else
        echo -e "${YELLOW}Warning: application-dev.properties.local not found${NC}"
        echo -e "${YELLOW}Using default jumbled values - OAuth may not work!${NC}"
        ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
    fi
else
    echo -e "${GREEN}Starting backend application with Maven...${NC}"
    if [ -f "$PROJECT_ROOT/application-dev.properties.local" ]; then
        echo -e "${GREEN}Loading real secrets from application-dev.properties.local${NC}"
        mvn spring-boot:run -Dspring-boot.run.profiles=dev \
            -Dspring.config.additional-location=$PROJECT_ROOT/application-dev.properties.local
    else
        echo -e "${YELLOW}Warning: application-dev.properties.local not found${NC}"
        mvn spring-boot:run -Dspring-boot.run.profiles=dev
    fi
fi
