#!/bin/bash
export EXPO_OFFLINE=${EXPO_OFFLINE:-true}
set -euo pipefail

# Configuration
PROJECT_ROOT=$(pwd)
LOG_DIR="/var/log/dietician"
FRONTEND_DIR="$PROJECT_ROOT/mobile"

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
mkdir -p "$LOG_DIR/mobile"

echo "========================================"
echo "  🔄 FRONTEND DEPLOYMENT SCRIPT"
echo "========================================"
echo ""

# Step 1: Stop current frontend
print_step "Stopping current frontend deployment..."
fuser -k 8081/tcp 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "expo.*web" 2>/dev/null || true
pkill -f "metro.*bundler" 2>/dev/null || true
sleep 3
print_success "Frontend stopped"

# Step 2: Navigate to frontend directory
print_step "Navigating to frontend directory..."
cd "$FRONTEND_DIR" || exit 1
print_success "Changed to frontend directory"

# Step 3: Clear Metro bundler cache
print_step "Clearing Metro bundler cache..."
rm -rf "$PROJECT_ROOT/mobile/.expo"
rm -rf "$PROJECT_ROOT/mobile/node_modules/.cache"
print_success "Cache cleared"

# Step 4: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies (this may take several minutes)..."
    if npm install 2>&1 | tee /tmp/frontend-install.log; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies!"
        echo "Check /tmp/frontend-install.log for details"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

# Step 5: Start frontend
print_step "Starting frontend (Web mode)..."
nohup npx expo start --web --clear > "$LOG_DIR/mobile/mobile.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PROJECT_ROOT/.frontend-pid"
print_success "Frontend started in background (PID: $FRONTEND_PID)"

# Step 6: Wait for frontend to be ready
print_step "Waiting for frontend to be ready (this may take 30-60 seconds)..."
for i in {1..30}; do
    if curl -s http://localhost:8081 >/dev/null 2>&1; then
        print_success "Frontend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Frontend startup taking longer than expected. Check logs: $LOG_DIR/mobile/mobile.log"
    fi
    sleep 2
    echo -n "."
done
echo ""

# Step 7: Display status
echo ""
echo "========================================"
echo "  ✅ FRONTEND DEPLOYMENT COMPLETE"
echo "========================================"
echo ""
echo "Frontend Details:"
echo "  • PID: $FRONTEND_PID"
echo "  • Web UI: http://localhost:8081"
echo "  • Logs: $LOG_DIR/mobile/mobile.log"
echo ""
echo "To check logs:"
echo "  tail -f $LOG_DIR/mobile/mobile.log"
echo ""
echo "To stop frontend:"
echo "  kill $FRONTEND_PID"
echo ""
echo "To start in interactive mode (for debugging):"
echo "  cd mobile && npx expo start --web"
echo ""
