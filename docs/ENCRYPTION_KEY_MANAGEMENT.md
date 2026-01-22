# Encryption Key Management

## Overview

This application uses AES-256-GCM encryption to protect sensitive data at rest, specifically email addresses in the `users` table.

## How Encryption Works

1. **Algorithm**: AES-256-GCM (Galois/Counter Mode)
2. **Key Storage**: External configuration file (separate from database)
3. **Encrypted Data**: Email addresses in `users.email` column
4. **Search Index**: Separate `email_search` column contains SHA-256 hash for lookups

### Encryption Flow

```
Plain Email → Normalize → AES-256-GCM Encrypt → Base64 Encode → Store in DB
                                      ↑
                              encryption.key (32 bytes)
```

### Decryption Flow

```
DB Value → Base64 Decode → AES-256-GCM Decrypt → Plain Email
                                      ↑
                              encryption.key (32 bytes)
```

## Encryption Key Location

The encryption key is stored in the **external configuration file** (outside the JAR):

**Production VPS:**
```bash
/opt/dietician/config/backend/application.properties
```

**Format:**
```properties
encryption.key=<BASE64_ENCODED_32_BYTE_KEY>
```

**Key Generation:**
```bash
openssl rand -base64 32
```

## Why Key is Separate from Database

**Security Principle**: Keys and encrypted data must be stored separately.

| If Database is Compromised | Keys Separate ✅ | Keys in DB ❌ |
|---------------------------|-----------------|---------------|
| Attacker gets encrypted data | Yes | Yes |
| Attacker can decrypt data | **No** | **Yes** |

**Industry Standard**: This is how AWS KMS, Azure Key Vault, and all enterprise systems work.

## Backup Strategy

When backing up this application, you must preserve **BOTH**:

1. **Database dump** (contains encrypted emails)
2. **Encryption key** (required to decrypt)

### Automated Backup Script

Use the provided backup script:

```bash
./scripts/backup-db-with-key.sh
```

This creates: `backup-YYYY-MM-DD.tar.gz` containing:
- Database dump
- Encryption key
- Restore instructions

### Manual Backup

```bash
# 1. Backup database
pg_dump -U dietician_user -d dietician_db > backup-$(date +%Y%m%d).sql

# 2. Backup encryption key
grep encryption.key /opt/dietician/config/backend/application.properties > encryption.key

# 3. Store both securely
```

## Migration to New System

When moving this application to a new server or system:

### Step 1: Export from Old System

```bash
./scripts/backup-db-with-key.sh
# OR manually:
pg_dump -U dietician_user -d dietician_db > backup.sql
grep encryption.key /opt/dietician/config/backend/application.properties > encryption.key
```

### Step 2: Import to New System

```bash
# 1. Copy backup.sql and encryption.key to new system

# 2. Add encryption key to new config
cat encryption.key >> /opt/dietician/config/backend/application.properties

# 3. Create database if needed
createdb -U dietician_user dietician_db

# 4. Restore database
psql -U dietician_user -d dietician_db < backup.sql

# 5. Start application with correct encryption key
docker restart dietician-backend
```

### Step 3: Verify

```bash
# Check application logs for errors
docker logs dietician-backend

# Test login with existing user (verifies decryption works)
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## ⚠️ Critical Warnings

### NEVER Lose Your Encryption Key

If you lose the encryption key:
- ✅ You can restore the database
- ❌ **All encrypted emails become garbage**
- ❌ Users cannot log in with their email
- ❌ Data is permanently lost

### NEVER Change the Encryption Key

If you change the encryption key without re-encrypting data:
- ✅ New data encrypts with new key
- ❌ **Old data cannot be decrypted**
- ❌ Application breaks for existing users

### Key Rotation Requires Data Re-encryption

To safely change the encryption key:
1. Add new key as `encryption.key.new`
2. Decrypt all data with old key
3. Re-encrypt with new key
4. Update database
5. Switch `encryption.key` to new value
6. Test thoroughly before removing old key

## Troubleshooting

### Problem: Login fails with "Invalid email or password"

**Possible cause:** Encryption key mismatch

**Check:**
```bash
# Compare encryption keys
grep encryption.key /opt/dietician/config/backend/application.properties
```

### Problem: "Decryption failed" in logs

**Possible cause:** Database was restored with different encryption key

**Solution:** Ensure the same encryption.key from backup is used

### Problem: Emails show as gibberish in database

**Expected:** This is normal - emails are encrypted at rest

**To verify:**
```bash
# Should show: <ENCRYPTED_BASE64_STRING>
docker exec dietician-backend psql -U dietician_user -d dietician_db -c "SELECT email FROM diet.users LIMIT 1;"
```

## Security Best Practices

1. ✅ **Store encryption key outside database** (current implementation)
2. ✅ **Use different keys for different environments** (dev, staging, prod)
3. ✅ **Restrict access to encryption key file** (chmod 600)
4. ✅ **Backup encryption key separately from database**
5. ✅ **Never commit encryption key to git**
6. ✅ **Rotate keys only with proper re-encryption**

## Additional Resources

- [AES-GCM Specification](https://csrc.nist.gov/publications/detail/fips/197/final)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [Spring Boot Encryption Best Practices](https://docs.spring.io/spring-security/reference/features/integration/crypto.html)
