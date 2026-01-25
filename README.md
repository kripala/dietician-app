# Dietitian App - Project README

A full-stack mobile application for dieticians to provide consultations, prescribe supplements, create food charts, and manage patient reminders.

## 🏗️ Architecture

### Backend (Spring Boot 3.3.0)
- **Language**: Java 17
- **Framework**: Spring Boot with Spring Security
- **Database**: PostgreSQL with SSL
- **Authentication**: JWT + OAuth 2.0 (Google)
- **Email**: Mail-in-a-Box SMTP integration
- **Security**: AES-256-GCM encryption, BCrypt password hashing

### Frontend (React Native + Expo)
- **Language**: TypeScript
- **Framework**: Expo (React Native)
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Storage**: AsyncStorage
- **Platforms**: iOS & Android

---

## 📁 Project Structure

```
dietician-app/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/dietician/
│   │   ├── config/            # Security, JPA Auditing
│   │   ├── controller/        # REST endpoints
│   │   ├── dto/               # Data transfer objects
│   │   ├── model/             # JPA entities
│   │   ├── repository/        # Data access
│   │   ├── security/          # JWT, OAuth handlers
│   │   ├── service/           # Business logic
│   │   └── util/              # Encryption utilities
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/      # Flyway migrations
│   └── pom.xml
│
└── mobile/                     # React Native app
    ├── src/
    │   ├── components/        # Reusable UI components
    │   ├── config/            # App configuration
    │   ├── context/           # React Context (Auth)
    │   ├── navigation/        # React Navigation
    │   ├── screens/           # Screen components
    │   ├── services/          # API client, Auth service
    │   ├── types/             # TypeScript definitions
    │   └── utils/             # Helper functions
    ├── App.tsx
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Backend**:
  - Java 17+
  - Maven 3.8+
  - PostgreSQL 14+
  - Mail-in-a-Box server (for email)

- **Frontend**:
  - Node.js 18+
  - npm or yarn
  - Expo CLI
  - Android Studio / Xcode (for emulators)

### Service Management Scripts

For convenience, use these scripts in the root directory:
- `./start-all.sh` - Start all services (MailHog, Backend, Frontend) in background
- `./stop-all.sh` - Stop all services
- `./restart-all.sh` - Restart all services
- `./status-all.sh` - Check which services are running

Logs for background processes are stored in the `logs/` directory.

Default seeded accounts (passwords use the case-sensitive values shown). They are inserted automatically by the backend at startup so that encryption and hashing go through the normal code path:
- Admin: `admin.vaibhav.kripala@gmail.com` / `Admin@123`
- Dietitian: `dietician.vaibhav.kripala@gmail.com` / `Dietitian@123`

If you drop/recreate the schema, restart the backend once to let the seeder run. Additional users created through the UI are assigned the PATIENT role by default.

> `start-all.sh` spins up MailHog via Docker but expects you to have a local Postgres instance listening on `localhost:5432`. Ensure Docker is running (for MailHog), Postgres is up, and Java 17+ is available. The script auto-detects common JDK locations or you can create a `.java-home` file in the repo root containing the desired `JAVA_HOME` path.

### Backend Setup

1. **Create PostgreSQL Database**:
```bash
sudo -u postgres psql
CREATE DATABASE dietician_db;
CREATE USER dietician_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dietician_db TO dietician_user;
\q
```

2. **Configure Environment Variables**:
```bash
cd backend
cp .env.example .env
# Edit .env with your values

# Generate secure keys:
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

3. **Run the Backend**:
```bash
./mvnw spring-boot:run
```

API will be available at: `http://localhost:8080/api`

### Frontend Setup

1. **Install Dependencies**:
```bash
cd mobile
npm install
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with your backend URL
```

3. **Run the App**:
```bash
# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios
```

---

## 🔐 Security Features

### Data Encryption
- **AES-256-GCM** encryption for sensitive data at rest
- Email addresses encrypted in database
- Encryption key stored in environment variables

### Password Security
- **BCrypt** hashing with salt
- Minimum 8 characters required
- Never stored in plain text

### Authentication
- **JWT tokens** with 24-hour expiration
- **Refresh tokens** with 7-day expiration
- Automatic token refresh on API calls
- Secure token storage in AsyncStorage

### Database Security
- PostgreSQL SSL connections
- Prepared statements (SQL injection prevention)
- Audit logging for all changes

---

## 📊 Database Schema

### Master Tables
- `roles` - User roles (ADMIN, DIETICIAN, PATIENT)

### Core Tables
- `users` - User accounts with encrypted email

### Audit Tables
- `audit_logs` - Change tracking
- `audit_log_details` - Field-level changes

### Audit Fields (All Tables)
```sql
created_by VARCHAR(100) NOT NULL
created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
modified_by VARCHAR(100)
modified_date TIMESTAMP WITHOUT TIME ZONE
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP code |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/oauth2/authorize/google` | Google OAuth login |

---

## 📧 Local Email Testing (MailHog)

Instead of setting up a full production mail server for local development, we use **MailHog**. It captures all outgoing emails so you can view them in a browser.

### 1. Start MailHog
Ensure Docker is running, then start the container:
```bash
docker-compose up -d mailhog
```

### 2. View Captured Emails
Open your browser and go to:
[http://localhost:8025](http://localhost:8025)

Any OTP or welcome emails sent by the backend will appear here instantly.

### 3. Backend Configuration
The `application.properties` is already configured to use MailHog by default for local development:
- **Host**: `localhost`
- **Port**: `1025` (SMTP)

---

## 📧 Production Email (Mail-in-a-Box)

1. **Provision Ubuntu VPS** (2GB RAM recommended)

2. **Install Mail-in-a-Box**:
```bash
curl -s https://mailinabox.email/setup.sh | sudo bash
```

3. **Configure DNS** as instructed during setup

4. **Update Backend Config**:
```properties
spring.mail.host=box.yourdomain.com
spring.mail.port=587
spring.mail.username=noreply@yourdomain.com
spring.mail.password=your_password
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Test Registration Flow
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","fullName":"Test User"}'

# Verify OTP (check email)
curl -X POST http://localhost:8080/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otpCode":"123456"}'
```

---

## 📱 Mobile App Features (In Progress)

### Completed
- ✅ API client with automatic token refresh
- ✅ Authentication service
- ✅ Auth context for state management
- ✅ TypeScript type definitions

### To Complete
- ⏳ Welcome/Onboarding screen
- ⏳ Login screen
- ⏳ Registration screen
- ⏳ Email OTP verification screen
- ⏳ React Navigation setup
- ⏳ Google Sign-In integration

---

## 🚀 Deployment

### Backend (Hostinger VPS)

1. **Build JAR**:
```bash
./mvnw clean package -DskipTests
```

2. **Create systemd service**:
```bash
sudo nano /etc/systemd/system/dietician-api.service
```

3. **Configure firewall**:
```bash
sudo ufw allow 8080/tcp
sudo ufw enable
```

### Frontend

Build for production:
```bash
# Android APK
cd mobile/android
./gradlew assembleRelease

# iOS (requires Mac + Xcode)
cd mobile/ios
pod install
# Build in Xcode
```

---

## 📝 Environment Variables

### Backend (.env)
```bash
DB_USERNAME=dietician_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
MAIL_HOST=box.yourdomain.com
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=your_mail_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend (.env)
```bash
API_BASE_URL=http://your-server-ip:8080/api
GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🔮 Future Features

- Patient management system
- Consultation scheduling
- Supplement prescription module
- Food charts and meal planning
- Push notifications
- Video consultation integration
- Medical document upload
- Payment integration

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Support

For issues or questions, contact the development team.
