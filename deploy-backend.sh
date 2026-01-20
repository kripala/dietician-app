#!/bin/bash
export JAVA_HOME=/usr/lib/jvm/java-1.17.0-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
set -euo pipefail

# Profile selection: dev (MailHog), prod (Mailcow)
SPRING_PROFILE=${1:-dev}
export SPRING_PROFILES_ACTIVE=$SPRING_PROFILE

# Configuration
PROJECT_ROOT=$(pwd)
LOG_DIR="/var/log/dietician"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

echo "========================================"
echo "  🔄 BACKEND DEPLOYMENT SCRIPT"
echo "========================================"
echo ""

# Step 1: Stop current backend
print_step "Stopping current backend deployment..."
fuser -k 8080/tcp 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "dietician-api" 2>/dev/null || true
sleep 3
print_success "Backend stopped"

# Step 2: Navigate to backend directory
print_step "Navigating to backend directory..."
cd "$BACKEND_DIR" || exit 1
print_success "Changed to backend directory"

# Step 3: Load environment variables
print_step "Loading environment variables..."
if [ -f "$BACKEND_ENV_FILE" ]; then
    echo "🔐 Loading backend environment variables from backend/.env"
    # shellcheck disable=SC1090
    set -o allexport
    source "$BACKEND_ENV_FILE"
    set +o allexport
    print_success "Environment variables loaded"
else
    print_warning "No .env file found, using defaults"
fi

export DB_USERNAME=${DB_USERNAME:-dietician_user}
export DB_PASSWORD=${DB_PASSWORD:-dietician_user}

# Step 4: Clean build
print_step "Cleaning previous build..."
mvn clean 2>&1 | tail -5
print_success "Build cleaned"

# Step 5: Build backend
print_step "Building backend (this may take a minute)..."
if mvn install -DskipTests 2>&1 | tee /tmp/backend-build.log; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed!"
    echo "Check /tmp/backend-build.log for details"
    exit 1
fi

# Step 6: Start backend
print_step "Starting backend with profile: $SPRING_PROFILE"
echo "   - dev  : MailHog (local email capture at http://localhost:8025)"
echo "   - prod : Mailcow (production emails)"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$LOG_DIR/dietician-8080.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend-pid"
print_success "Backend started in background (PID: $BACKEND_PID)"

# Step 7: Wait for backend to be ready
print_step "Waiting for backend to be ready (this may take 30-60 seconds)..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api >/dev/null 2>&1; then
        print_success "Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Backend startup taking longer than expected. Check logs: $LOG_DIR/dietician-8080.log"
    fi
    sleep 2
    echo -n "."
done
echo ""

# Step 8: Display status
echo ""
echo "========================================"
echo "  ✅ BACKEND DEPLOYMENT COMPLETE"
echo "========================================"
echo ""
echo "Backend Details:"
echo "  • Profile: $SPRING_PROFILE"
echo "  • PID: $BACKEND_PID"
echo "  • API Endpoint: http://localhost:8080/api"
if [ "$SPRING_PROFILE" = "dev" ]; then
  echo "  • Email: MailHog at http://localhost:8025"
else
  echo "  • Email: Mailcow at mail.mamaarogyam.cloud"
fi
echo "  • Logs: $LOG_DIR/dietician-8080.log"
echo ""
echo "Usage: ./deploy-backend.sh [dev|prod]"
echo "  dev  : MailHog (default)"
echo "  prod : Mailcow (production)"
echo ""
echo "To check logs:"
echo "  tail -f $LOG_DIR/dietician-8080.log"
echo ""
echo "To stop backend:"
echo "  kill $BACKEND_PID"
echo ""
