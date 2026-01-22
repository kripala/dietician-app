#!/bin/bash
#
# Backup Script for Dietician App
# Backs up database and encryption key together
#
# Usage: ./scripts/backup-db-with-key.sh
#

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"

# Database credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-dietician_db}"
DB_USER="${DB_USER:-dietician_user}"

# Encryption key location
CONFIG_DIR="${CONFIG_DIR:-/opt/dietician/config/backend}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# Create temporary directory for this backup
mkdir -p "$BACKUP_NAME"
cd "$BACKUP_NAME"

log_info "Starting backup: ${BACKUP_NAME}"

# 1. Dump database
log_info "Backing up database..."
PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > backup.sql 2>/dev/null

if [ ! -s backup.sql ]; then
    log_error "Database backup failed or is empty"
    cd ..
    rm -rf "$BACKUP_NAME"
    exit 1
fi

log_info "Database backup completed: $(du -h backup.sql | cut -f1)"

# 2. Extract encryption key
log_info "Extracting encryption key..."
if [ -f "$CONFIG_DIR/application.properties" ]; then
    grep "encryption.key=" "$CONFIG_DIR/application.properties" > encryption.key 2>/dev/null || true

    if [ ! -s encryption.key ]; then
        log_warn "Could not extract encryption key from config"
        echo "# ENCRYPTION KEY NOT FOUND - PLEASE ADD MANUALLY" > encryption.key
    else
        log_info "Encryption key extracted"
    fi
else
    log_warn "Config file not found at $CONFIG_DIR/application.properties"
    echo "# CONFIG FILE NOT FOUND AT $CONFIG_DIR" > encryption.key
fi

# 3. Create restore instructions
cat > RESTORE_INSTRUCTIONS.txt << 'EOF'
# Dietician App Restore Instructions

## What's in this backup

- backup.sql: Database dump with encrypted emails
- encryption.key: Key required to decrypt emails

## Restore Steps

### 1. Extract this archive
   tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
   cd backup_YYYYMMDD_HHMMSS

### 2. Restore encryption key to config

   # Add to your config file:
   cat encryption.key >> /opt/dietician/config/backend/application.properties

   # Or manually add the line:
   # encryption.key=<VALUE_FROM_FILE>

### 3. Create database (if doesn't exist)
   createdb -U dietician_user dietician_db

### 4. Restore database
   psql -U dietician_user -d dietician_db < backup.sql

### 5. Restart application
   docker restart dietician-backend

### 6. Verify

   # Check logs for errors
   docker logs dietician-backend

   # Test login to verify encryption works

## ⚠️ CRITICAL WARNINGS

1. NEVER use a different encryption key than what's in this backup
   - Old emails will NOT decrypt
   - Users will NOT be able to log in

2. NEVER lose the encryption.key file
   - Without it, encrypted emails are useless

3. If you change encryption.key after restore:
   - All existing emails will become unreadable
   - You MUST re-encrypt all data first

## Support

For issues, see: docs/ENCRYPTION_KEY_MANAGEMENT.md
EOF

# 4. Create metadata
cat > metadata.txt << EOF
Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Database: ${DB_NAME}
Database Size: $(du -h backup.sql | cut -f1)
Hostname: $(hostname)
EOF

# 5. Go back and create archive
cd "$BACKUP_DIR"
log_info "Creating archive..."
tar -czf "$BACKUP_FILE" "$BACKUP_NAME"

# 6. Cleanup temporary directory
rm -rf "$BACKUP_NAME"

# 7. Get final file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

log_info "✅ Backup completed successfully!"
log_info "   File: ${BACKUP_DIR}/${BACKUP_FILE}"
log_info "   Size: ${BACKUP_SIZE}"
log_info ""
log_info "To restore, follow RESTORE_INSTRUCTIONS.txt inside the archive."
log_warn "⚠️  Keep this backup secure - it contains your encryption key!"
