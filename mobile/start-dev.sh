#!/bin/bash
# Development startup script that shows the correct URLs

cd "$(dirname "$0")"

# Get the current WiFi/Ethernet IP (exclude Docker and localhost)
CURRENT_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' | head -1)

# Fallback to ipconfig methods
if [[ -z "$CURRENT_IP" || "$CURRENT_IP" == "127.0.0.1" ]]; then
    CURRENT_IP=$(hostname -I | awk '{print $1}')
fi

echo "============================================"
echo "  Dietician App - Development Server"
echo "============================================"
echo ""
echo "Current IP: $CURRENT_IP"
echo ""
echo "Open in browser:"
echo "  Laptop:  http://localhost:8081"
echo "  Mobile:  http://$CURRENT_IP:8081"
echo ""
echo "For mobile, use this URL:"
echo "  http://$CURRENT_IP:8081"
echo ""
echo "============================================"
echo ""

# Start Expo
npm start
