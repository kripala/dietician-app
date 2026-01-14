#!/bin/bash

# Configuration
PID_FILE=".pids"

echo "📊 Dietician App Service Status"
echo "--------------------------------------------------"

# 1. Docker services
if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' | grep -q "^dietician-mailhog$"; then
        echo "📧 MailHog:   ✅ RUNNING (Docker)"
    else
        echo "📧 MailHog:   ❌ STOPPED"
    fi
else
    echo "📧 MailHog:   ⚠️ Docker unavailable"
fi

# 2. Local Postgres
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_CHECK_OK=false
if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -q -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" >/dev/null 2>&1; then
        POSTGRES_CHECK_OK=true
    fi
else
    if lsof -Pi :"$POSTGRES_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        POSTGRES_CHECK_OK=true
    fi
fi

if [ "$POSTGRES_CHECK_OK" = true ]; then
    echo "🐘 Postgres:  ✅ RUNNING (Port $POSTGRES_PORT)"
else
    echo "🐘 Postgres:  ❌ STOPPED (expecting local instance on $POSTGRES_HOST:$POSTGRES_PORT)"
fi

# 3. Backend
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "☕ Backend:   ✅ RUNNING (Port 8080)"
else
    echo "☕ Backend:   ❌ STOPPED"
fi

# 4. Frontend
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "📱 Frontend:  ✅ RUNNING (Port 8081 - Metro)"
else
    echo "📱 Frontend:  ❌ STOPPED"
fi

echo "--------------------------------------------------"
if [ -f "logs/backend.log" ]; then
    echo "Last backend log line:"
    tail -n 1 logs/backend.log
fi
if [ -f "logs/mobile.log" ]; then
    echo "Last mobile log line:"
    tail -n 1 logs/mobile.log
fi
