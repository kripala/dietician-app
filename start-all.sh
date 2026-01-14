#!/bin/bash
export JAVA_HOME=/usr/lib/jvm/java-1.17.0-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
export EXPO_OFFLINE=${EXPO_OFFLINE:-true}
set -euo pipefail

# Configuration
PROJECT_ROOT=$(pwd)
LOG_DIR="/var/log/dietician"
PID_FILE="$PROJECT_ROOT/.pids"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/mobile"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
JAVA_HOME_FILE="$PROJECT_ROOT/.java-home"
JAVA_HOME_CANDIDATES=(
  "/usr/lib/jvm/java-17-openjdk-amd64"
  "/usr/lib/jvm/java-1.17.0-openjdk-amd64"
  "/usr/lib/jvm/java-17-openjdk"
  "/usr/lib/jvm/openjdk-17"
  "/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"
)
DEFAULT_JAVA_HOME=""
for candidate in "${JAVA_HOME_CANDIDATES[@]}"; do
  if [ -d "$candidate" ]; then
    DEFAULT_JAVA_HOME="$candidate"
    break
  fi
done

if [ -f "$JAVA_HOME_FILE" ]; then
  FILE_JAVA_HOME=$(<"$JAVA_HOME_FILE")
  if [ -n "$FILE_JAVA_HOME" ] && [ -d "$FILE_JAVA_HOME" ]; then
    DEFAULT_JAVA_HOME="$FILE_JAVA_HOME"
  fi
fi

if [ -z "${JAVA_HOME:-}" ] && [ -n "$DEFAULT_JAVA_HOME" ]; then
  export JAVA_HOME="$DEFAULT_JAVA_HOME"
fi

require_command() {
  local cmd=$1
  local help_text=$2
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ '$cmd' command is required. $help_text"
    exit 1
  fi
}

wait_for_port() {
  local host=$1
  local port=$2
  local timeout=${3:-60}
  local elapsed=0

  while ! (exec 3<>/dev/tcp/"$host"/"$port") 2>/dev/null; do
    if [ "$elapsed" -ge "$timeout" ]; then
      return 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  exec 3>&-
  return 0
}

get_java_major_version() {
  local java_binary=$1
  local version
  version=$("$java_binary" -version 2>&1 | awk -F '"' '/version/ {print $2}')
  local major=${version%%.*}
  if [ "$major" = "1" ]; then
    major=$(echo "$version" | cut -d. -f2)
  fi
  echo "$major"
}

ensure_java_runtime() {
  local java_binary="java"
  if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    java_binary="$JAVA_HOME/bin/java"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi

  if ! command -v "$java_binary" >/dev/null 2>&1; then
    echo "❌ Java runtime not found. Install Java 17+ and set JAVA_HOME."
    exit 1
  fi

  local major_version
  major_version=$(get_java_major_version "$java_binary")
  if [ -z "$major_version" ] || [ "$major_version" -lt 17 ]; then
    echo "❌ Java 17+ is required (detected major version ${major_version:-unknown}). Please install Java 17 and update JAVA_HOME."
    exit 1
  fi

  local version_banner
  version_banner=$("$java_binary" -version 2>&1 | head -n 1)
  echo "☕ Using $version_banner"
}

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

echo "🚀 Starting Dietician App services..."

require_command docker "Please install Docker and ensure it's running."
require_command mvn "Install Maven 3.8+ to run the backend."
require_command npm "Install Node.js 18+ (includes npm) to run the frontend."
require_command npx "Install Node.js 18+ (includes npx) to run the frontend."
ensure_java_runtime

# 1. Start Docker dependencies (MailHog)
echo "📦 Starting Docker dependencies (MailHog)..."
docker compose up -d mailhog

echo "⏳ Waiting for local Postgres on localhost:5432..."
if wait_for_port "localhost" 5432 60; then
  echo "✅ Postgres is ready."
else
  echo "❌ Could not connect to Postgres on port 5432. Please ensure your local database is running."
  exit 1
fi

# Load backend environment variables if present
if [ -f "$BACKEND_ENV_FILE" ]; then
  echo "🔐 Loading backend environment variables from backend/.env"
  # shellcheck disable=SC1090
  set -o allexport
  source "$BACKEND_ENV_FILE"
  set +o allexport
fi

export DB_USERNAME=${DB_USERNAME:-dietician_user}
export DB_PASSWORD=${DB_PASSWORD:-dietician_password}

# 2. Start Backend (Spring Boot)
echo "☕ Starting Backend API using Java 17..."
cd "$BACKEND_DIR"
nohup mvn spring-boot:run > "$LOG_DIR/dietician-8080.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"
echo "✅ Backend started in background (PID: $BACKEND_PID). Logs: $LOG_DIR/dietician-8080.log"

# 3. Start Frontend (React Native/Expo)
echo "📱 Starting Mobile Frontend (Web)..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install >> "$LOG_DIR/mobile/mobile.log" 2>&1
fi
nohup npx expo start --web > "$LOG_DIR/mobile/mobile.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"
echo "✅ Frontend started in background (PID: $FRONTEND_PID). Logs: $LOG_DIR/mobile/mobile.log"

cd "$PROJECT_ROOT"
echo ""
echo "🌟 All services are starting up!"
echo "--------------------------------------------------"
echo "API Endpoint: http://localhost:8080/api"
echo "MailHog UI:   http://localhost:8025"
echo "Frontend UI:  http://localhost:8081"
echo "--------------------------------------------------"
echo "Note: It may take 30-60 seconds for the browser UI to be ready."
echo "Use ./status-all.sh to check status or ./stop-all.sh to stop."
