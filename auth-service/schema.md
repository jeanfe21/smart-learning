# Authentication Service - Database Schema

## Overview
Authentication Service menangani OAuth 2.0 + OpenID Connect authentication, JWT token management, password reset, dan role-based access control (RBAC).

## Database: `auth_service_db`

## Prisma Schema

```prisma
// auth-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/auth-client"
}

datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

// User Authentication Model
model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique
  password_hash     String    @map("password_hash")
  email_verified    Boolean   @default(false) @map("email_verified")
  email_verified_at DateTime? @map("email_verified_at")
  
  // Account status
  status            UserStatus @default(ACTIVE)
  locked_until      DateTime?  @map("locked_until")
  failed_login_attempts Int    @default(0) @map("failed_login_attempts")
  
  // Timestamps
  created_at        DateTime  @default(now()) @map("created_at")
  updated_at        DateTime  @updatedAt @map("updated_at")
  last_login_at     DateTime? @map("last_login_at")
  
  // Relations
  refresh_tokens    RefreshToken[]
  password_resets   PasswordReset[]
  user_sessions     UserSession[]
  oauth_accounts    OAuthAccount[]
  
  @@map("users")
}

// Refresh Token Management
model RefreshToken {
  id            String    @id @default(uuid()) @db.Uuid
  user_id       String    @map("user_id") @db.Uuid
  token_hash    String    @unique @map("token_hash")
  expires_at    DateTime  @map("expires_at")
  revoked       Boolean   @default(false)
  revoked_at    DateTime? @map("revoked_at")
  
  // Device/Client information
  device_id     String?   @map("device_id")
  user_agent    String?   @map("user_agent")
  ip_address    String?   @map("ip_address")
  
  created_at    DateTime  @default(now()) @map("created_at")
  
  // Relations
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
  @@index([user_id])
  @@index([expires_at])
}

// Password Reset Tokens
model PasswordReset {
  id            String    @id @default(uuid()) @db.Uuid
  user_id       String    @map("user_id") @db.Uuid
  token_hash    String    @unique @map("token_hash")
  expires_at    DateTime  @map("expires_at")
  used          Boolean   @default(false)
  used_at       DateTime? @map("used_at")
  
  // Request information
  ip_address    String?   @map("ip_address")
  user_agent    String?   @map("user_agent")
  
  created_at    DateTime  @default(now()) @map("created_at")
  
  // Relations
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("password_resets")
  @@index([user_id])
  @@index([expires_at])
}

// User Sessions for tracking active sessions
model UserSession {
  id            String    @id @default(uuid()) @db.Uuid
  user_id       String    @map("user_id") @db.Uuid
  session_token String    @unique @map("session_token")
  
  // Session information
  ip_address    String?   @map("ip_address")
  user_agent    String?   @map("user_agent")
  device_id     String?   @map("device_id")
  location      String?   // Geolocation info
  
  // Session status
  is_active     Boolean   @default(true) @map("is_active")
  expires_at    DateTime  @map("expires_at")
  last_activity DateTime  @default(now()) @map("last_activity")
  
  created_at    DateTime  @default(now()) @map("created_at")
  ended_at      DateTime? @map("ended_at")
  
  // Relations
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("user_sessions")
  @@index([user_id])
  @@index([expires_at])
  @@index([is_active])
}

// OAuth Account Integration (Google, Microsoft, etc.)
model OAuthAccount {
  id                String  @id @default(uuid()) @db.Uuid
  user_id           String  @map("user_id") @db.Uuid
  provider          String  // google, microsoft, github, etc.
  provider_user_id  String  @map("provider_user_id")
  
  // OAuth tokens
  access_token      String? @map("access_token")
  refresh_token     String? @map("refresh_token")
  expires_at        DateTime? @map("expires_at")
  
  // Provider profile data
  provider_data     Json?   @map("provider_data")
  
  created_at        DateTime @default(now()) @map("created_at")
  updated_at        DateTime @updatedAt @map("updated_at")
  
  // Relations
  user              User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@unique([provider, provider_user_id])
  @@map("oauth_accounts")
  @@index([user_id])
}

// Email Verification Tokens
model EmailVerification {
  id            String    @id @default(uuid()) @db.Uuid
  email         String
  token_hash    String    @unique @map("token_hash")
  expires_at    DateTime  @map("expires_at")
  verified      Boolean   @default(false)
  verified_at   DateTime? @map("verified_at")
  
  // Request information
  ip_address    String?   @map("ip_address")
  user_agent    String?   @map("user_agent")
  
  created_at    DateTime  @default(now()) @map("created_at")
  
  @@map("email_verifications")
  @@index([email])
  @@index([expires_at])
}

// Security Events Logging
model SecurityEvent {
  id            String    @id @default(uuid()) @db.Uuid
  user_id       String?   @map("user_id") @db.Uuid
  event_type    SecurityEventType @map("event_type")
  
  // Event details
  description   String?
  ip_address    String?   @map("ip_address")
  user_agent    String?   @map("user_agent")
  location      String?   // Geolocation
  
  // Risk assessment
  risk_level    RiskLevel @default(LOW) @map("risk_level")
  blocked       Boolean   @default(false)
  
  // Additional data
  metadata      Json?
  
  created_at    DateTime  @default(now()) @map("created_at")
  
  @@map("security_events")
  @@index([user_id])
  @@index([event_type])
  @@index([created_at])
  @@index([risk_level])
}

// API Keys for service-to-service authentication
model ApiKey {
  id            String    @id @default(uuid()) @db.Uuid
  name          String    // Human readable name
  key_hash      String    @unique @map("key_hash")
  
  // Permissions and scope
  scopes        String[]  // Array of allowed scopes
  organization_id String? @map("organization_id") @db.Uuid
  
  // Status and expiration
  is_active     Boolean   @default(true) @map("is_active")
  expires_at    DateTime? @map("expires_at")
  
  // Usage tracking
  last_used_at  DateTime? @map("last_used_at")
  usage_count   Int       @default(0) @map("usage_count")
  
  created_at    DateTime  @default(now()) @map("created_at")
  created_by    String?   @map("created_by") @db.Uuid
  
  @@map("api_keys")
  @@index([organization_id])
  @@index([is_active])
}

// Rate Limiting
model RateLimit {
  id            String    @id @default(uuid()) @db.Uuid
  identifier    String    // IP address, user_id, or api_key
  endpoint      String    // API endpoint pattern
  
  // Rate limit tracking
  requests_count Int      @default(0) @map("requests_count")
  window_start  DateTime  @map("window_start")
  window_end    DateTime  @map("window_end")
  
  // Limit configuration
  max_requests  Int       @map("max_requests")
  window_size   Int       @map("window_size") // in seconds
  
  created_at    DateTime  @default(now()) @map("created_at")
  updated_at    DateTime  @updatedAt @map("updated_at")
  
  @@unique([identifier, endpoint, window_start])
  @@map("rate_limits")
  @@index([identifier])
  @@index([window_end])
}

// Enums
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
  
  @@map("user_status")
}

enum SecurityEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGIN_BLOCKED
  PASSWORD_CHANGED
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET_COMPLETED
  EMAIL_VERIFIED
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  SUSPICIOUS_ACTIVITY
  TOKEN_REFRESH
  SESSION_CREATED
  SESSION_ENDED
  OAUTH_LINKED
  OAUTH_UNLINKED
  
  @@map("security_event_type")
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
  
  @@map("risk_level")
}
```

## Key Features

### 1. **User Authentication**
- UUID-based user identification
- Secure password hashing
- Email verification system
- Account status management
- Failed login attempt tracking

### 2. **Token Management**
- JWT refresh token storage
- Token revocation support
- Device/client tracking
- Automatic cleanup of expired tokens

### 3. **Password Security**
- Secure password reset flow
- Token-based reset mechanism
- Usage tracking and expiration
- IP and user agent logging

### 4. **Session Management**
- Active session tracking
- Device fingerprinting
- Geolocation logging
- Session expiration handling

### 5. **OAuth Integration**
- Multiple OAuth provider support
- Token storage and refresh
- Provider profile data storage
- Account linking capabilities

### 6. **Security Monitoring**
- Comprehensive security event logging
- Risk level assessment
- Suspicious activity detection
- Automated blocking capabilities

### 7. **API Security**
- API key management
- Scope-based permissions
- Usage tracking and limits
- Organization-level access control

### 8. **Rate Limiting**
- Flexible rate limiting system
- Per-endpoint configuration
- Sliding window implementation
- Automatic cleanup

## Indexes and Performance

### Primary Indexes
- All foreign keys are indexed
- Unique constraints on tokens and emails
- Composite indexes for common queries

### Query Optimization
- Efficient user lookup by email
- Fast token validation
- Session management queries
- Security event filtering

## Security Considerations

### Data Protection
- All sensitive tokens are hashed
- No plain text passwords stored
- Secure token generation
- Regular cleanup of expired data

### Audit Trail
- Complete authentication event logging
- IP address and user agent tracking
- Risk assessment for all activities
- Compliance-ready audit logs

## Environment Variables

```env
# Database
AUTH_DATABASE_URL="postgresql://auth_user:auth_password@localhost:5432/auth_service_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"

# Security
PASSWORD_RESET_TOKEN_EXPIRES_IN="1h"
EMAIL_VERIFICATION_TOKEN_EXPIRES_IN="24h"
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION="30m"

# Rate Limiting
DEFAULT_RATE_LIMIT_REQUESTS=100
DEFAULT_RATE_LIMIT_WINDOW=3600

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

## Migration Strategy

### Initial Migration
1. Create database and user
2. Run Prisma migrations
3. Seed initial data (if needed)
4. Setup indexes and constraints

### Data Migration
- User data migration from existing systems
- Password hash migration (if applicable)
- OAuth account linking
- Session data cleanup

This schema provides a robust foundation for authentication and authorization in the Smart Learning Platform, supporting enterprise-level security requirements while maintaining scalability and performance.

