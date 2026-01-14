#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
PID_FILE="$PROJECT_ROOT/.pids"

require_command() {
  local cmd=$1
  if ! command -v "$cmd" >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

echo "🛑 Stopping Dietician App services..."

# 1. Stop Docker dependencies
if require_command docker; then
  echo "📦 Stopping Docker services (MailHog)..."
  docker compose stop mailhog >/dev/null 2>&1 || true
else
  echo "⚠️ Docker is not available. Skipping MailHog shutdown."
fi

# 2. Stop Backend and Frontend processes
if [ -f "$PID_FILE" ]; then
    while IFS= read -r pid; do
        if ps -p "$pid" > /dev/null; then
            echo "Killing process $pid..."
            kill "$pid" 2>/dev/null
            sleep 1
            # Hard kill if still running
            if ps -p "$pid" > /dev/null; then
                kill -9 "$pid" 2>/dev/null
            fi
        fi
    done < "$PID_FILE"
    rm "$PID_FILE"
    echo "✅ Backend and Frontend processes stopped."
else
    echo "⚠️ No PID file found. Services might not be running or were started manually."
fi

# Additional cleanup for any stray expo/java processes on project ports
echo "🧹 Cleaning up port conflicts..."
fuser -k 8080/tcp 2>/dev/null # Backend
fuser -k 8081/tcp 2>/dev/null # Metro Bundler

echo "✅ All services stopped."
