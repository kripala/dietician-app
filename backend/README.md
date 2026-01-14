# Dietician App Backend

Spring Boot backend API for the Dietician mobile application.

## Features

- ✅ Email/Password authentication with OTP verification
- ✅ Google OAuth 2.0 integration
- ✅ JWT token-based authentication (access + refresh tokens)
- ✅ AES-256-GCM encryption for sensitive data at rest
- ✅ BCrypt password hashing
- ✅ PostgreSQL database with SSL support
- ✅ Mail-in-a-Box SMTP integration
- ✅ Flyway database migrations
- ✅ RESTful API design

## Prerequisites

- Java 17 or higher
- Maven 3.8+
- PostgreSQL 14+
- Mail-in-a-Box server (for email)

## Setup

### 1. Database Setup

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE dietician_db;
CREATE USER dietician_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dietician_db TO dietician_user;
\q
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Generate secure keys:
```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32
```

### 3. Build and Run

```bash
# Build the project
./mvnw clean package

# Run the application
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080/api`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/oauth2/authorize/google` - Google OAuth login

## Security

- All sensitive data (email addresses) encrypted at rest using AES-256-GCM
- Passwords hashed with BCrypt
- JWT tokens for stateless authentication
- PostgreSQL connections use SSL
- CORS configured for mobile app origins

## Database Migrations

Flyway manages database schema migrations automatically. Migration files are in:
`src/main/resources/db/migration/`

## Testing

```bash
./mvnw test
```

## Production Deployment

See the main project README for deployment instructions on Hostinger VPS.
