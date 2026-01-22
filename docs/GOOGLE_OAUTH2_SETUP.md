# Google OAuth2 Implementation Guide

## Overview

Complete guide to implementing Google Sign-In (OAuth2) for the Dietician App.

---

## Quick Facts

| Question | Answer |
|----------|--------|
| **Cost** | **100% FREE** - No charges for Google Sign-In |
| **Users Limit** | Unlimited |
| **Apps per Account** | Unlimited |
| **Maintenance** | ~30 minutes/year |
| **Implementation Time** | ~6 hours |

---

## Gmail Account Recommendation

**Create a dedicated Gmail account** (recommended)

Create: `dietician.oauth@gmail.com` or similar

| Option | Pros | Cons |
|--------|------|------|
| **New Gmail** ✅ | Separation of concerns, easy ownership transfer | One more account |
| **Existing Gmail** | No new account needed | Personal/business mix, security risk |
| **Google Workspace** | Professional, team access | Costs $6-12/month (not needed) |

---

## Google Cloud Console Setup Steps

### 1. Create Project
- Go to: https://console.cloud.google.com
- Create new project: `dietician-app`

### 2. Enable API
- Navigate: APIs & Services > Library
- Search: "Google+ API" or "Google Identity"
- Click: Enable

### 3. OAuth Consent Screen
- Navigate: APIs & Services > OAuth consent screen
- Choose: **External** (for public apps)
- Fill in:
  - App name: `Dietician App`
  - User support email: `your-email@example.com`
  - Developer contact: `your-email@example.com`
- Add Scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Add Test Users (during development)

### 4. Create OAuth2 Client ID
- Navigate: APIs & Services > Credentials
- Click: Create Credentials > OAuth Client ID
- Application type: **Web application**
- Name: `Dietician Web App`
- Authorized redirect URIs:
  ```
  https://app.mamaarogyam.cloud/api/auth/oauth2/callback/google
  http://localhost:8081/api/auth/oauth2/callback/google
  ```
- Copy: **Client ID** and **Client Secret**

---

## Configuration Values

Once you have the Client ID and Secret from Google Cloud Console:

```properties
# Backend (application.properties)
spring.security.oauth2.client.registration.google.client-id=your-client-id.apps.googleusercontent.com
spring.security.oauth2.client.registration.google.client-secret=your-google-client-secret
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/api/auth/oauth2/callback/google

# Frontend Mobile
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `backend/src/main/java/com/dietician/config/OAuth2Config.java` | Create |
| `backend/src/main/java/com/dietician/controller/AuthController.java` | Modify |
| `mobile/src/screens/auth/LoginScreen.tsx` | Modify |
| `backend/src/main/resources/application.properties` | Modify |

---

## Implementation Order

1. **Google Cloud Console Setup** (30 min)
2. **Backend OAuth2 Handler** (2 hours)
3. **Update Configuration** (30 min)
4. **Frontend Integration** (2 hours)
5. **Testing** (1 hour)

---

## Security Checklist

- [ ] Client Secret kept in backend only (never in frontend)
- [ ] Redirect URIs match exactly (including trailing slash)
- [ ] Domain verified for production
- [ ] HTTPS used for production
- [ ] Test users added during development

---

## Maintenance

| Task | Frequency | Time |
|------|-----------|------|
| Monitor Google Cloud Console | Monthly | 5 min |
| Update Client Secret (if compromised) | As needed | 10 min |
| Renew Domain Verification | Yearly | 10 min |
| Check OAuth2 Usage Quota | Quarterly | 5 min |

**Total:** ~30 minutes/year
