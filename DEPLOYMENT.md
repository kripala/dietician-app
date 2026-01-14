# Deployment Scripts

Two deployment scripts have been created to make rebuilding and redeploying the backend and frontend easier.

## Scripts Location
- `/home/vaibhavk/github/dietician-app/deploy-backend.sh` - Backend deployment script
- `/home/vaibhavk/github/dietician-app/deploy-frontend.sh` - Frontend deployment script

## Backend Deployment Script (`deploy-backend.sh`)

### What it does:
1. **Stops current backend** - Kills any process running on port 8080
2. **Navigates to backend directory**
3. **Loads environment variables** - Reads from `backend/.env` if exists
4. **Cleans previous build** - Runs `mvn clean`
5. **Builds backend** - Runs `mvn install -DskipTests`
6. **Starts backend** - Starts Spring Boot with logging
7. **Waits for backend to be ready** - Checks if API is accessible
8. **Displays deployment summary**

### Usage:
```bash
cd /home/vaibhavk/github/dietician-app
./deploy-backend.sh
```

### Output:
- Backend API: http://localhost:8080/api
- Logs: `/var/log/dietician/dietician-8080.log`
- PID file: `.backend-pid`

## Frontend Deployment Script (`deploy-frontend.sh`)

### What it does:
1. **Stops current frontend** - Kills any process running on port 8081
2. **Navigates to frontend directory**
3. **Clears Metro bundler cache** - Removes `.expo` and `.cache` directories
4. **Installs dependencies** (if needed) - Runs `npm install`
5. **Starts frontend** - Starts Expo web server with `--clear` flag
6. **Waits for frontend to be ready** - Checks if web UI is accessible
7. **Displays deployment summary**

### Usage:
```bash
cd /home/vaibhavk/github/dietician-app
./deploy-frontend.sh
```

### Output:
- Web UI: http://localhost:8081
- Logs: `/var/log/dietician/mobile/mobile.log`
- PID file: `.frontend-pid`

## Features

### ✅ Automated Process
- No manual stopping/starting needed
- Scripts handle the entire deployment process

### ✅ Error Handling
- Validates each step
- Provides clear error messages
- Shows build progress

### ✅ Logging
- All logs stored in `/var/log/dietician/`
- Easy access to logs with `tail -f`

### ✅ PID Tracking
- PIDs saved to `.backend-pid` and `.frontend-pid`
- Easy to stop processes: `kill $(cat .backend-pid)`

### ✅ Color-Coded Output
- Blue: Step in progress
- Green: Success
- Yellow: Warning
- Red: Error

## Examples

### Deploy Backend Only
```bash
cd ~/github/dietician-app
./deploy-backend.sh
```

### Deploy Frontend Only
```bash
cd ~/github/dietician-app
./deploy-frontend.sh
```

### Deploy Both
```bash
cd ~/github/dietician-app
./deploy-backend.sh && ./deploy-frontend.sh
```

## Monitoring

### Check Backend Logs
```bash
tail -f /var/log/dietician/dietician-8080.log
```

### Check Frontend Logs
```bash
tail -f /var/log/dietician/mobile/mobile.log
```

### Check All Services
```bash
./status-all.sh
```

## Stopping Services

### Stop Backend
```bash
# Using script
kill $(cat .backend-pid)

# Or manually
fuser -k 8080/tcp
```

### Stop Frontend
```bash
# Using script
kill $(cat .frontend-pid)

# Or manually
fuser -k 8081/tcp
```

### Stop All
```bash
./stop-all.sh
```

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check logs: `tail -100 /var/log/dietician/dietician-8080.log`
- Ensure database is running on port 5432

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Check logs: `tail -100 /var/log/dietician/mobile/mobile.log`
- Try clearing cache manually: `rm -rf mobile/.expo mobile/node_modules/.cache`

### Port already in use
- Stop all services: `./stop-all.sh`
- Kill processes manually: `fuser -k 8080/tcp 8081/tcp`
- Restart deployment

## Environment Variables

Backend reads from `backend/.env`:
```bash
DB_USERNAME=dietician_user
DB_PASSWORD=dietician_user
```

Frontend uses defaults from `mobile/src/config/index.ts`:
```javascript
API_BASE_URL: 'http://localhost:8080/api'
```
