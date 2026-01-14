#!/bin/bash

echo "🔄 Restarting Dietician App services..."

./stop-all.sh
sleep 2
./start-all.sh

echo "✅ Restart complete."
