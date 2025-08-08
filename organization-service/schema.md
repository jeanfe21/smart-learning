# Organization Service - Database Schema

## Overview
Organization Service menangani multi-tenant organization management, hierarchical organization structure, organization settings, branding, domain management, dan organizational policies berdasarkan API Contract.

## Database: `organization_service_db`

## Prisma Schema

```prisma
// organization-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/organization-client"
}

datasource db {
  provider = "postgresql"
  url      = env("ORGANIZATION_DATABASE_URL")
}

// Main Organization Model
model Organization {
  id                      String    @id @default(uuid()) @db.Uuid
  name                    String
  domain                  String    @unique
  slug                    String    @unique // URL-friendly identifier
  
  // Hierarchy
  parent_organization_id  String?   @map("parent_organization_id") @db.Uuid
  organization_path       String[]  @map("organization_path") // For efficient hierarchy queries
  level                   Int       @default(0) // Depth in hierarchy
  
  // Subscription and Billing
  subscription_id         String?   @map("subscription_id") @db.Uuid
  
  // Contact Information
  email                   String?
  phone                   String?
  website                 String?
  
  // Address
  address_line1           String?   @map("address_line1")
  address_line2           String?   @map("address_line2")
  city                    String?
  state_province          String?   @map("state_province")
  postal_code             String?   @map("postal_code")
  country                 String?
  
  // Status and Metadata
  status                  OrganizationStatus @default(ACTIVE)
  organization_type       OrganizationType @default(COMPANY) @map("organization_type")
  industry                String?
  size                    OrganizationSize? @map("organization_size")
  
  // User Counts (cached for performance)
  user_count              Int       @default(0) @map("user_count")
  active_learners         Int       @default(0) @map("active_learners")
  
  // Timestamps
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  parent_organization     Organization? @relation("OrganizationHierarchy", fields: [parent_organization_id], references: [id])
  child_organizations     Organization[] @relation("OrganizationHierarchy")
  
  settings                OrganizationSettings?
  branding                OrganizationBranding?
  domains                 OrganizationDomain[]
  features                OrganizationFeature[]
  policies                OrganizationPolicy[]
  integrations            OrganizationIntegration[]
  
  @@map("organizations")
  @@index([parent_organization_id])
  @@index([domain])
  @@index([status])
  @@index([organization_path])
}

// Organization Settings
model OrganizationSettings {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @unique @map("organization_id") @db.Uuid
  
  // General Settings
  timezone                String    @default("UTC")
  default_language        String    @default("en") @map("default_language")
  date_format             String    @default("YYYY-MM-DD") @map("date_format")
  time_format             String    @default("24h") @map("time_format")
  currency                String    @default("USD")
  
  // Security Settings
  password_policy         Json      @map("password_policy") // Password requirements
  session_timeout         Int       @default(3600) @map("session_timeout") // seconds
  mfa_required            Boolean   @default(false) @map("mfa_required")
  ip_whitelist            String[]  @map("ip_whitelist")
  
  // Learning Settings
  default_course_visibility CourseVisibility @default(ORGANIZATION) @map("default_course_visibility")
  allow_self_enrollment   Boolean   @default(true) @map("allow_self_enrollment")
  require_course_approval Boolean   @default(false) @map("require_course_approval")
  
  // Communication Settings
  email_notifications     Boolean   @default(true) @map("email_notifications")
  sms_notifications       Boolean   @default(false) @map("sms_notifications")
  push_notifications      Boolean   @default(true) @map("push_notifications")
  
  // Data Retention
  user_data_retention_days Int      @default(2555) @map("user_data_retention_days") // 7 years
  activity_log_retention_days Int   @default(365) @map("activity_log_retention_days")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@map("organization_settings")
}

// Organization Branding
model OrganizationBranding {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @unique @map("organization_id") @db.Uuid
  
  // Logo and Images
  logo_url                String?   @map("logo_url")
  logo_dark_url           String?   @map("logo_dark_url")
  favicon_url             String?   @map("favicon_url")
  banner_url              String?   @map("banner_url")
  
  // Colors
  primary_color           String    @default("#007bff") @map("primary_color")
  secondary_color         String    @default("#6c757d") @map("secondary_color")
  accent_color            String?   @map("accent_color")
  background_color        String    @default("#ffffff") @map("background_color")
  text_color              String    @default("#212529") @map("text_color")
  
  // Typography
  primary_font            String    @default("Inter") @map("primary_font")
  secondary_font          String?   @map("secondary_font")
  
  // Custom CSS
  custom_css              String?   @map("custom_css") @db.Text
  
  // Email Branding
  email_header_color      String?   @map("email_header_color")
  email_footer_text       String?   @map("email_footer_text") @db.Text
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@map("organization_branding")
}

// Custom Domains
model OrganizationDomain {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  domain                  String    @unique
  
  // Domain Configuration
  is_primary              Boolean   @default(false) @map("is_primary")
  is_verified             Boolean   @default(false) @map("is_verified")
  verification_token      String?   @map("verification_token")
  
  // SSL Configuration
  ssl_enabled             Boolean   @default(false) @map("ssl_enabled")
  ssl_certificate_url     String?   @map("ssl_certificate_url")
  ssl_expires_at          DateTime? @map("ssl_expires_at")
  
  // DNS Configuration
  dns_configured          Boolean   @default(false) @map("dns_configured")
  cname_target            String?   @map("cname_target")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  verified_at             DateTime? @map("verified_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@map("organization_domains")
  @@index([organization_id])
  @@index([is_verified])
}

// Organization Features
model OrganizationFeature {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  feature_key             String    @map("feature_key")
  
  // Feature Configuration
  is_enabled              Boolean   @default(true) @map("is_enabled")
  configuration           Json?     // Feature-specific configuration
  
  // Limits and Quotas
  usage_limit             Int?      @map("usage_limit")
  current_usage           Int       @default(0) @map("current_usage")
  
  // Billing
  is_billable             Boolean   @default(false) @map("is_billable")
  cost_per_unit           Float?    @map("cost_per_unit")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@unique([organization_id, feature_key])
  @@map("organization_features")
  @@index([feature_key])
}

// Learning Policies
model OrganizationPolicy {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  policy_type             PolicyType @map("policy_type")
  
  // Policy Configuration
  is_active               Boolean   @default(true) @map("is_active")
  policy_data             Json      @map("policy_data")
  
  // Enforcement
  enforcement_level       EnforcementLevel @default(RECOMMENDED) @map("enforcement_level")
  violation_action        ViolationAction @default(WARNING) @map("violation_action")
  
  // Metadata
  created_by              String    @map("created_by") @db.Uuid
  approved_by             String?   @map("approved_by") @db.Uuid
  approved_at             DateTime? @map("approved_at")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@map("organization_policies")
  @@index([organization_id])
  @@index([policy_type])
  @@index([is_active])
}

// External Integrations
model OrganizationIntegration {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  integration_type        IntegrationType @map("integration_type")
  
  // Integration Details
  name                    String
  description             String?   @db.Text
  is_active               Boolean   @default(true) @map("is_active")
  
  // Configuration
  configuration           Json      // Integration-specific settings
  credentials             Json?     // Encrypted credentials
  
  // API Details
  api_endpoint            String?   @map("api_endpoint")
  api_version             String?   @map("api_version")
  webhook_url             String?   @map("webhook_url")
  
  // Status and Health
  last_sync_at            DateTime? @map("last_sync_at")
  sync_status             SyncStatus @default(PENDING) @map("sync_status")
  error_message           String?   @map("error_message") @db.Text
  
  // Usage Statistics
  total_syncs             Int       @default(0) @map("total_syncs")
  successful_syncs        Int       @default(0) @map("successful_syncs")
  failed_syncs            Int       @default(0) @map("failed_syncs")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  organization            Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  
  @@map("organization_integrations")
  @@index([organization_id])
  @@index([integration_type])
  @@index([is_active])
}

// Organization Invitations
model OrganizationInvitation {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  email                   String
  
  // Invitation Details
  role                    String    // Role to be assigned
  invited_by              String    @map("invited_by") @db.Uuid
  invitation_token        String    @unique @map("invitation_token")
  
  // Status
  status                  InvitationStatus @default(PENDING)
  expires_at              DateTime  @map("expires_at")
  accepted_at             DateTime? @map("accepted_at")
  
  // Tracking
  sent_count              Int       @default(1) @map("sent_count")
  last_sent_at            DateTime  @default(now()) @map("last_sent_at")
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  @@map("organization_invitations")
  @@index([organization_id])
  @@index([email])
  @@index([status])
  @@index([expires_at])
}

// Organization Activity Log
model OrganizationActivity {
  id                      String    @id @default(uuid()) @db.Uuid
  organization_id         String    @map("organization_id") @db.Uuid
  
  // Activity Details
  activity_type           OrganizationActivityType @map("activity_type")
  description             String    @db.Text
  
  // Actor Information
  actor_id                String?   @map("actor_id") @db.Uuid
  actor_type              ActorType @map("actor_type")
  actor_name              String?   @map("actor_name")
  
  // Context
  ip_address              String?   @map("ip_address")
  user_agent              String?   @map("user_agent")
  
  // Additional Data
  metadata                Json?
  
  created_at              DateTime  @default(now()) @map("created_at")
  
  @@map("organization_activities")
  @@index([organization_id])
  @@index([activity_type])
  @@index([created_at])
  @@index([actor_id])
}

// Enums
enum OrganizationStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_SETUP
  
  @@map("organization_status")
}

enum OrganizationType {
  COMPANY
  EDUCATIONAL_INSTITUTION
  GOVERNMENT
  NON_PROFIT
  HEALTHCARE
  OTHER
  
  @@map("organization_type")
}

enum OrganizationSize {
  STARTUP          // 1-10
  SMALL            // 11-50
  MEDIUM           // 51-200
  LARGE            // 201-1000
  ENTERPRISE       // 1000+
  
  @@map("organization_size")
}

enum CourseVisibility {
  PUBLIC
  ORGANIZATION
  PRIVATE
  
  @@map("course_visibility")
}

enum PolicyType {
  MANDATORY_COURSES
  CERTIFICATION_REQUIREMENTS
  PROGRESS_TRACKING
  DATA_RETENTION
  CONTENT_APPROVAL
  USER_ACCESS
  SECURITY_COMPLIANCE
  
  @@map("policy_type")
}

enum EnforcementLevel {
  RECOMMENDED
  REQUIRED
  STRICT
  
  @@map("enforcement_level")
}

enum ViolationAction {
  WARNING
  BLOCK_ACCESS
  NOTIFY_ADMIN
  AUTOMATIC_REMEDIATION
  
  @@map("violation_action")
}

enum IntegrationType {
  SSO_SAML
  SSO_OAUTH
  LDAP
  ACTIVE_DIRECTORY
  LMS_INTEGRATION
  HR_SYSTEM
  CRM_SYSTEM
  ANALYTICS_PLATFORM
  CUSTOM_API
  
  @@map("integration_type")
}

enum SyncStatus {
  PENDING
  IN_PROGRESS
  SUCCESS
  FAILED
  PARTIAL_SUCCESS
  
  @@map("sync_status")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
  
  @@map("invitation_status")
}

enum OrganizationActivityType {
  ORGANIZATION_CREATED
  ORGANIZATION_UPDATED
  SETTINGS_CHANGED
  BRANDING_UPDATED
  DOMAIN_ADDED
  DOMAIN_VERIFIED
  FEATURE_ENABLED
  FEATURE_DISABLED
  POLICY_CREATED
  POLICY_UPDATED
  INTEGRATION_ADDED
  INTEGRATION_CONFIGURED
  USER_INVITED
  USER_JOINED
  USER_REMOVED
  SUBSCRIPTION_CHANGED
  
  @@map("organization_activity_type")
}

enum ActorType {
  USER
  SYSTEM
  API
  INTEGRATION
  
  @@map("actor_type")
}
```

## Key Features

### 1. **Hierarchical Organization Structure**
- Parent-child organization relationships
- Organization path for efficient hierarchy queries
- Level-based depth tracking
- Recursive organization management

### 2. **Multi-Domain Support**
- Custom domain management
- Domain verification system
- SSL certificate management
- DNS configuration tracking
- Primary domain designation

### 3. **Comprehensive Settings**
- Security policies and configurations
- Learning management settings
- Communication preferences
- Data retention policies
- Timezone and localization

### 4. **Branding and Customization**
- Logo and image management
- Color scheme customization
- Typography settings
- Custom CSS support
- Email branding

### 5. **Feature Management**
- Feature flag system
- Usage tracking and limits
- Billing integration
- Feature-specific configuration

### 6. **Policy Management**
- Learning policies and requirements
- Enforcement levels
- Violation handling
- Approval workflows

### 7. **External Integrations**
- SSO and authentication systems
- LMS and HR integrations
- API and webhook support
- Sync status monitoring
- Error handling and retry logic

### 8. **Activity Tracking**
- Comprehensive audit logging
- Actor identification
- Context information
- Metadata support

## API Mapping

### Organization Information
- `GET /organizations/current` → Organization + Settings + Branding + Features
- `PUT /organizations/current` → Update Organization + Settings + Branding

### Organization Hierarchy
- `GET /organizations` → Organization list with hierarchy
- `POST /organizations` → Create Organization + default Settings
- `GET /organizations/{id}/hierarchy` → Hierarchical organization tree

### Domain Management
- `GET /organizations/domains` → OrganizationDomain list
- `POST /organizations/domains` → Create OrganizationDomain
- `PUT /organizations/domains/{id}/verify` → Update verification status

### Feature Management
- `GET /organizations/features` → OrganizationFeature list
- `PUT /organizations/features/{key}` → Update feature configuration

## Indexes and Performance

### Primary Indexes
- Organization domain and slug (unique)
- Hierarchy path for tree queries
- Feature and policy lookups
- Activity log time-based queries

### Query Optimization
- Efficient hierarchy traversal
- Fast domain verification
- Feature flag lookups
- Activity log pagination

## Environment Variables

```env
# Database
ORGANIZATION_DATABASE_URL="postgresql://org_service:org_password@localhost:5434/organization_service_db"

# File Storage
LOGO_STORAGE_BUCKET="smart-learning-logos"
MAX_LOGO_SIZE_MB=10
ALLOWED_LOGO_FORMATS="png,jpg,jpeg,svg"

# Domain Management
DOMAIN_VERIFICATION_TIMEOUT="24h"
SSL_CERTIFICATE_PROVIDER="letsencrypt"

# Integration
WEBHOOK_TIMEOUT="30s"
MAX_SYNC_RETRIES=3
SYNC_RETRY_DELAY="5m"

# Activity Logging
ACTIVITY_LOG_RETENTION_DAYS=365
ACTIVITY_BATCH_SIZE=1000
```

## Data Migration

### From Existing Systems
- Organization hierarchy mapping
- Settings and configuration migration
- Branding asset migration
- Integration configuration transfer
- Activity log import

### Data Validation
- Domain format validation
- Color code validation
- URL validation
- JSON schema validation for configurations
- Hierarchy consistency checks

This schema provides a robust foundation for multi-tenant organization management in the Smart Learning Platform, supporting complex organizational structures, comprehensive customization, and enterprise-level features as specified in the API contract.

