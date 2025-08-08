# User Management Service - Database Schema

## Overview
User Management Service menangani user profiles, learning preferences, avatar management, learning statistics, dan user CRUD operations berdasarkan API Contract.

## Database: `user_service_db`

## Prisma Schema

```prisma
// user-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/user-client"
}

datasource db {
  provider = "postgresql"
  url      = env("USER_DATABASE_URL")
}

// Main User Profile Model
model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique
  username          String?   @unique
  first_name        String    @map("first_name")
  last_name         String    @map("last_name")
  
  // Role and Organization
  role              UserRole  @default(LEARNER)
  organization_id   String    @map("organization_id") @db.Uuid
  subscription_id   String?   @map("subscription_id") @db.Uuid
  
  // Account Status
  status            UserStatus @default(ACTIVE)
  
  // Timestamps
  created_at        DateTime  @default(now()) @map("created_at")
  updated_at        DateTime  @updatedAt @map("updated_at")
  last_login        DateTime? @map("last_login")
  
  // Relations
  profile           UserProfile?
  learning_preferences LearningPreferences?
  learning_stats    LearningStats?
  user_invitations  UserInvitation[]
  
  @@map("users")
  @@index([organization_id])
  @@index([role])
  @@index([status])
  @@index([email])
}

// User Profile Data
model UserProfile {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @unique @map("user_id") @db.Uuid
  
  // Profile Information
  avatar_url      String?   @map("avatar_url")
  bio             String?   @db.Text
  timezone        String    @default("UTC")
  language        String    @default("en")
  
  // Personal Information
  phone_number    String?   @map("phone_number")
  date_of_birth   DateTime? @map("date_of_birth") @db.Date
  gender          Gender?
  
  // Address Information
  address_line1   String?   @map("address_line1")
  address_line2   String?   @map("address_line2")
  city            String?
  state_province  String?   @map("state_province")
  postal_code     String?   @map("postal_code")
  country         String?
  
  // Social Links
  linkedin_url    String?   @map("linkedin_url")
  twitter_url     String?   @map("twitter_url")
  website_url     String?   @map("website_url")
  
  // Privacy Settings
  profile_visibility ProfileVisibility @default(ORGANIZATION) @map("profile_visibility")
  show_email      Boolean   @default(false) @map("show_email")
  show_phone      Boolean   @default(false) @map("show_phone")
  
  created_at      DateTime  @default(now()) @map("created_at")
  updated_at      DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("user_profiles")
}

// Learning Preferences and Style
model LearningPreferences {
  id                    String    @id @default(uuid()) @db.Uuid
  user_id               String    @unique @map("user_id") @db.Uuid
  
  // Learning Style Scores (0.0 to 1.0)
  visual_score          Float     @default(0.5) @map("visual_score")
  auditory_score        Float     @default(0.5) @map("auditory_score")
  reading_score         Float     @default(0.5) @map("reading_score")
  kinesthetic_score     Float     @default(0.5) @map("kinesthetic_score")
  
  // Content Preferences
  preferred_content_types String[] @map("preferred_content_types") // ["video", "text", "interactive", "audio"]
  difficulty_preference DifficultyLevel @default(INTERMEDIATE) @map("difficulty_preference")
  pace_preference       PacePreference @default(MODERATE) @map("pace_preference")
  
  // Learning Schedule
  preferred_study_time  String?   @map("preferred_study_time") // "morning", "afternoon", "evening"
  daily_study_goal      Int?      @map("daily_study_goal") // minutes per day
  weekly_study_goal     Int?      @map("weekly_study_goal") // minutes per week
  
  // Notification Preferences
  reminder_enabled      Boolean   @default(true) @map("reminder_enabled")
  reminder_frequency    ReminderFrequency @default(DAILY) @map("reminder_frequency")
  reminder_time         String?   @map("reminder_time") // "09:00"
  
  // Accessibility
  font_size             FontSize  @default(MEDIUM) @map("font_size")
  high_contrast         Boolean   @default(false) @map("high_contrast")
  screen_reader         Boolean   @default(false) @map("screen_reader")
  closed_captions       Boolean   @default(false) @map("closed_captions")
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                  User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("learning_preferences")
}

// Learning Statistics and Analytics
model LearningStats {
  id                      String    @id @default(uuid()) @db.Uuid
  user_id                 String    @unique @map("user_id") @db.Uuid
  
  // Course Statistics
  total_courses_enrolled  Int       @default(0) @map("total_courses_enrolled")
  courses_completed       Int       @default(0) @map("courses_completed")
  courses_in_progress     Int       @default(0) @map("courses_in_progress")
  
  // Time Statistics (in minutes)
  total_learning_time     Int       @default(0) @map("total_learning_time")
  this_week_learning_time Int       @default(0) @map("this_week_learning_time")
  this_month_learning_time Int      @default(0) @map("this_month_learning_time")
  
  // Performance Statistics
  average_score           Float?    @map("average_score")
  highest_score           Float?    @map("highest_score")
  total_assessments_taken Int       @default(0) @map("total_assessments_taken")
  assessments_passed      Int       @default(0) @map("assessments_passed")
  
  // Engagement Statistics
  login_streak            Int       @default(0) @map("login_streak")
  longest_login_streak    Int       @default(0) @map("longest_login_streak")
  total_logins            Int       @default(0) @map("total_logins")
  
  // Achievement Statistics
  certificates_earned     Int       @default(0) @map("certificates_earned")
  badges_earned           Int       @default(0) @map("badges_earned")
  points_earned           Int       @default(0) @map("points_earned")
  
  // Activity Tracking
  last_activity           DateTime? @map("last_activity")
  last_course_accessed    String?   @map("last_course_accessed") @db.Uuid
  last_lesson_completed   String?   @map("last_lesson_completed") @db.Uuid
  
  // Weekly/Monthly Reset Fields
  week_start_date         DateTime? @map("week_start_date") @db.Date
  month_start_date        DateTime? @map("month_start_date") @db.Date
  
  created_at              DateTime  @default(now()) @map("created_at")
  updated_at              DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                    User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("learning_stats")
}

// User Invitations for Organization
model UserInvitation {
  id                String    @id @default(uuid()) @db.Uuid
  email             String
  organization_id   String    @map("organization_id") @db.Uuid
  invited_by        String    @map("invited_by") @db.Uuid
  
  // Invitation Details
  role              UserRole  @default(LEARNER)
  temporary_password String?  @map("temporary_password")
  invitation_token  String    @unique @map("invitation_token")
  
  // Status and Expiration
  status            InvitationStatus @default(PENDING)
  expires_at        DateTime  @map("expires_at")
  accepted_at       DateTime? @map("accepted_at")
  
  // Tracking
  sent_at           DateTime  @default(now()) @map("sent_at")
  reminder_sent_at  DateTime? @map("reminder_sent_at")
  reminder_count    Int       @default(0) @map("reminder_count")
  
  created_at        DateTime  @default(now()) @map("created_at")
  updated_at        DateTime  @updatedAt @map("updated_at")
  
  // Relations
  invited_by_user   User      @relation(fields: [invited_by], references: [id])
  
  @@map("user_invitations")
  @@index([organization_id])
  @@index([email])
  @@index([status])
  @@index([expires_at])
}

// User Skills and Competencies
model UserSkill {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @map("user_id") @db.Uuid
  skill_name      String    @map("skill_name")
  skill_category  String    @map("skill_category")
  
  // Proficiency
  proficiency_level ProficiencyLevel @map("proficiency_level")
  self_assessed   Boolean   @default(true) @map("self_assessed")
  verified        Boolean   @default(false)
  verified_by     String?   @map("verified_by") @db.Uuid
  verified_at     DateTime? @map("verified_at")
  
  // Evidence
  evidence_type   String?   @map("evidence_type") // "certificate", "assessment", "project"
  evidence_url    String?   @map("evidence_url")
  
  created_at      DateTime  @default(now()) @map("created_at")
  updated_at      DateTime  @updatedAt @map("updated_at")
  
  @@map("user_skills")
  @@index([user_id])
  @@index([skill_category])
  @@unique([user_id, skill_name])
}

// User Goals and Objectives
model UserGoal {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @map("user_id") @db.Uuid
  
  // Goal Details
  title           String
  description     String?   @db.Text
  goal_type       GoalType  @map("goal_type")
  target_value    Float?    @map("target_value")
  current_value   Float     @default(0) @map("current_value")
  unit            String?   // "hours", "courses", "points", etc.
  
  // Timeline
  start_date      DateTime  @map("start_date") @db.Date
  target_date     DateTime  @map("target_date") @db.Date
  completed_at    DateTime? @map("completed_at")
  
  // Status
  status          GoalStatus @default(ACTIVE)
  priority        Priority  @default(MEDIUM)
  
  // Progress Tracking
  progress_percentage Float  @default(0) @map("progress_percentage")
  last_progress_update DateTime? @map("last_progress_update")
  
  created_at      DateTime  @default(now()) @map("created_at")
  updated_at      DateTime  @updatedAt @map("updated_at")
  
  @@map("user_goals")
  @@index([user_id])
  @@index([status])
  @@index([target_date])
}

// User Activity Log
model UserActivity {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @map("user_id") @db.Uuid
  
  // Activity Details
  activity_type   ActivityType @map("activity_type")
  activity_data   Json?     @map("activity_data")
  
  // Context
  ip_address      String?   @map("ip_address")
  user_agent      String?   @map("user_agent")
  device_type     String?   @map("device_type")
  
  created_at      DateTime  @default(now()) @map("created_at")
  
  @@map("user_activities")
  @@index([user_id])
  @@index([activity_type])
  @@index([created_at])
}

// Enums
enum UserRole {
  SUPER_ADMIN
  ORG_ADMIN
  INSTRUCTOR
  LEARNER
  
  @@map("user_role")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
  
  @@map("user_status")
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
  
  @@map("gender")
}

enum ProfileVisibility {
  PUBLIC
  ORGANIZATION
  PRIVATE
  
  @@map("profile_visibility")
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
  
  @@map("difficulty_level")
}

enum PacePreference {
  SLOW
  MODERATE
  FAST
  SELF_PACED
  
  @@map("pace_preference")
}

enum ReminderFrequency {
  DAILY
  WEEKLY
  MONTHLY
  NEVER
  
  @@map("reminder_frequency")
}

enum FontSize {
  SMALL
  MEDIUM
  LARGE
  EXTRA_LARGE
  
  @@map("font_size")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
  
  @@map("invitation_status")
}

enum ProficiencyLevel {
  NOVICE
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
  
  @@map("proficiency_level")
}

enum GoalType {
  LEARNING_TIME
  COURSE_COMPLETION
  SKILL_DEVELOPMENT
  CERTIFICATION
  ASSESSMENT_SCORE
  CUSTOM
  
  @@map("goal_type")
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
  
  @@map("goal_status")
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
  
  @@map("priority")
}

enum ActivityType {
  PROFILE_UPDATED
  PREFERENCES_CHANGED
  GOAL_CREATED
  GOAL_UPDATED
  SKILL_ADDED
  SKILL_VERIFIED
  AVATAR_UPLOADED
  PASSWORD_CHANGED
  EMAIL_CHANGED
  
  @@map("activity_type")
}
```

## Key Features

### 1. **User Profile Management**
- Comprehensive user profile with personal information
- Avatar management and social links
- Privacy settings and profile visibility
- Address and contact information
- Accessibility preferences

### 2. **Learning Preferences**
- Learning style assessment (VARK model)
- Content type preferences
- Difficulty and pace preferences
- Study schedule and goals
- Notification preferences
- Accessibility settings

### 3. **Learning Analytics**
- Comprehensive learning statistics
- Time tracking and engagement metrics
- Performance analytics
- Achievement tracking
- Activity monitoring
- Streak tracking

### 4. **User Invitations**
- Organization-based user invitations
- Role assignment during invitation
- Temporary password support
- Invitation status tracking
- Expiration and reminder management

### 5. **Skills Management**
- User skill tracking and assessment
- Proficiency level management
- Skill verification system
- Evidence-based skill validation
- Skill categorization

### 6. **Goal Setting**
- Personal learning goals
- Progress tracking
- Multiple goal types support
- Timeline management
- Priority-based organization

### 7. **Activity Logging**
- Comprehensive user activity tracking
- Device and context information
- Activity type categorization
- Audit trail for compliance

## API Mapping

### Profile Endpoints
- `GET /users/profile` → User + UserProfile + LearningPreferences + LearningStats
- `PUT /users/profile` → Update User, UserProfile, LearningPreferences
- `POST /users/upload-avatar` → Update UserProfile.avatar_url

### Admin Endpoints
- `GET /users` → User list with filters
- `POST /users` → Create User + UserInvitation
- `GET /users/{user_id}` → User details with all relations
- `PUT /users/{user_id}` → Update User
- `DELETE /users/{user_id}` → Soft delete (status = INACTIVE)

## Indexes and Performance

### Primary Indexes
- User email and username (unique)
- Organization and role filtering
- Activity and statistics queries
- Time-based queries for analytics

### Query Optimization
- Efficient user lookup and filtering
- Fast profile data retrieval
- Optimized statistics calculations
- Activity log performance

## Environment Variables

```env
# Database
USER_DATABASE_URL="postgresql://user_service:user_password@localhost:5433/user_service_db"

# File Storage
AVATAR_STORAGE_BUCKET="smart-learning-avatars"
MAX_AVATAR_SIZE_MB=5
ALLOWED_AVATAR_FORMATS="jpg,jpeg,png,gif"

# Learning Analytics
STATS_UPDATE_INTERVAL="1h"
ACTIVITY_RETENTION_DAYS=365

# Invitations
INVITATION_EXPIRES_IN="7d"
MAX_REMINDER_COUNT=3
REMINDER_INTERVAL="2d"
```

## Data Migration

### From Existing Systems
- User profile data mapping
- Learning preference migration
- Historical statistics calculation
- Activity log import
- Skill data migration

### Data Validation
- Email format validation
- Phone number validation
- URL validation for social links
- Timezone validation
- Language code validation

This schema provides a comprehensive foundation for user management in the Smart Learning Platform, supporting detailed user profiles, learning analytics, and personalization features as specified in the API contract.

