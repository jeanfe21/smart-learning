#!/bin/bash

echo "📋 Creating Database Schemas for All Services"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create schemas based on API contract specifications

echo -e "\n${YELLOW}🗄️ Creating Content Service Schema...${NC}"
mkdir -p content-service/prisma
cat > content-service/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/content_client"
}

datasource db {
  provider = "postgresql"
  url      = env("CONTENT_SERVICE_DATABASE_URL")
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String?
  thumbnail   String?
  status      CourseStatus @default(DRAFT)
  difficulty  DifficultyLevel
  duration    Int      // in minutes
  price       Decimal? @db.Decimal(10,2)
  
  // Relationships
  organizationId String
  instructorId   String
  categoryId     String?
  
  // Content
  lessons     Lesson[]
  materials   CourseMaterial[]
  tags        CourseTag[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  
  @@map("courses")
}

model Lesson {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String   // Rich text content
  videoUrl    String?
  duration    Int      // in minutes
  order       Int
  
  // Relationships
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  // Content
  materials   LessonMaterial[]
  quizzes     LessonQuiz[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("lessons")
}

model CourseMaterial {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        MaterialType
  url         String
  fileSize    Int?     // in bytes
  mimeType    String?
  
  // Relationships
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("course_materials")
}

model LessonMaterial {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        MaterialType
  url         String
  fileSize    Int?
  mimeType    String?
  
  // Relationships
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("lesson_materials")
}

model CourseTag {
  id       String @id @default(cuid())
  name     String @unique
  color    String?
  
  // Relationships
  courses  Course[]
  
  @@map("course_tags")
}

model LessonQuiz {
  id          String   @id @default(cuid())
  title       String
  description String?
  questions   Json     // Array of quiz questions
  passingScore Int     @default(70)
  timeLimit   Int?     // in minutes
  
  // Relationships
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("lesson_quizzes")
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum MaterialType {
  PDF
  VIDEO
  AUDIO
  IMAGE
  DOCUMENT
  LINK
  ARCHIVE
}
EOF

echo -e "\n${YELLOW}📊 Creating Learning Progress Service Schema...${NC}"
mkdir -p learning-progress-service/prisma
cat > learning-progress-service/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/learning_progress_client"
}

datasource db {
  provider = "postgresql"
  url      = env("LEARNING_PROGRESS_SERVICE_DATABASE_URL")
}

model LearningPath {
  id          String   @id @default(cuid())
  title       String
  description String?
  difficulty  DifficultyLevel
  estimatedHours Int
  
  // Relationships
  organizationId String
  creatorId      String
  
  // Content
  steps       LearningPathStep[]
  enrollments LearningPathEnrollment[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("learning_paths")
}

model LearningPathStep {
  id          String   @id @default(cuid())
  title       String
  description String?
  order       Int
  type        StepType
  resourceId  String   // Course ID, Assessment ID, etc.
  isRequired  Boolean  @default(true)
  
  // Relationships
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id], onDelete: Cascade)
  
  // Progress tracking
  completions StepCompletion[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("learning_path_steps")
}

model LearningPathEnrollment {
  id          String   @id @default(cuid())
  userId      String
  status      EnrollmentStatus @default(ACTIVE)
  progress    Float    @default(0) // 0-100
  
  // Relationships
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id], onDelete: Cascade)
  
  // Progress tracking
  stepCompletions StepCompletion[]
  
  // Metadata
  enrolledAt  DateTime @default(now())
  completedAt DateTime?
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, pathId])
  @@map("learning_path_enrollments")
}

model StepCompletion {
  id          String   @id @default(cuid())
  userId      String
  status      CompletionStatus @default(IN_PROGRESS)
  score       Float?   // 0-100
  timeSpent   Int?     // in minutes
  
  // Relationships
  stepId      String
  step        LearningPathStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  enrollmentId String
  enrollment  LearningPathEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  
  // Metadata
  startedAt   DateTime @default(now())
  completedAt DateTime?
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, stepId])
  @@map("step_completions")
}

model UserProgress {
  id          String   @id @default(cuid())
  userId      String
  resourceType ResourceType
  resourceId  String
  progress    Float    @default(0) // 0-100
  status      ProgressStatus @default(NOT_STARTED)
  
  // Time tracking
  timeSpent   Int      @default(0) // in minutes
  lastAccessed DateTime @default(now())
  
  // Completion tracking
  completedAt DateTime?
  score       Float?   // 0-100
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, resourceType, resourceId])
  @@map("user_progress")
}

model LearningSession {
  id          String   @id @default(cuid())
  userId      String
  resourceType ResourceType
  resourceId  String
  duration    Int      // in minutes
  
  // Session data
  startTime   DateTime
  endTime     DateTime?
  isCompleted Boolean  @default(false)
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@map("learning_sessions")
}

model LearningAnalytics {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime @db.Date
  
  // Daily metrics
  timeSpent   Int      @default(0) // in minutes
  coursesAccessed Int  @default(0)
  lessonsCompleted Int @default(0)
  quizzesCompleted Int @default(0)
  averageScore Float?
  
  // Streak tracking
  streakDays  Int      @default(0)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, date])
  @@map("learning_analytics")
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum StepType {
  COURSE
  ASSESSMENT
  PROJECT
  READING
  VIDEO
  EXTERNAL_LINK
}

enum EnrollmentStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum CompletionStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum ResourceType {
  COURSE
  LESSON
  QUIZ
  ASSESSMENT
  PROJECT
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
}
EOF

echo -e "\n${YELLOW}📝 Creating Assessment Service Schema...${NC}"
mkdir -p assessment-service/prisma
cat > assessment-service/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/assessment_client"
}

datasource db {
  provider = "postgresql"
  url      = env("ASSESSMENT_SERVICE_DATABASE_URL")
}

model Assessment {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        AssessmentType
  difficulty  DifficultyLevel
  
  // Configuration
  timeLimit   Int?     // in minutes
  passingScore Float   @default(70) // 0-100
  maxAttempts Int      @default(3)
  isRandomized Boolean @default(false)
  showResults Boolean  @default(true)
  
  // Relationships
  organizationId String
  creatorId      String
  courseId       String?
  
  // Content
  questions   Question[]
  attempts    AssessmentAttempt[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  
  @@map("assessments")
}

model Question {
  id          String   @id @default(cuid())
  title       String
  content     String   // Question text
  type        QuestionType
  points      Float    @default(1)
  order       Int
  
  // Configuration
  options     Json?    // For multiple choice questions
  correctAnswer Json   // Correct answer(s)
  explanation String?
  
  // Relationships
  assessmentId String
  assessment  Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  
  // Responses
  responses   QuestionResponse[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("questions")
}

model AssessmentAttempt {
  id          String   @id @default(cuid())
  userId      String
  status      AttemptStatus @default(IN_PROGRESS)
  score       Float?   // 0-100
  
  // Time tracking
  startedAt   DateTime @default(now())
  submittedAt DateTime?
  timeSpent   Int?     // in minutes
  
  // Relationships
  assessmentId String
  assessment  Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  
  // Responses
  responses   QuestionResponse[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("assessment_attempts")
}

model QuestionResponse {
  id          String   @id @default(cuid())
  userId      String
  answer      Json     // User's answer
  isCorrect   Boolean?
  points      Float?   // Points earned
  
  // Relationships
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  attemptId   String
  attempt     AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  
  // Metadata
  answeredAt  DateTime @default(now())
  
  @@unique([questionId, attemptId])
  @@map("question_responses")
}

model Certificate {
  id          String   @id @default(cuid())
  title       String
  description String?
  templateUrl String?
  
  // Recipient
  userId      String
  recipientName String
  recipientEmail String
  
  // Achievement
  achievementType AchievementType
  resourceId      String // Course ID, Assessment ID, etc.
  score           Float? // Final score
  
  // Certificate data
  certificateNumber String @unique
  issuedAt         DateTime @default(now())
  expiresAt        DateTime?
  
  // Verification
  verificationCode String @unique
  isVerified       Boolean @default(true)
  
  // Relationships
  organizationId   String
  
  // Metadata
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@map("certificates")
}

model Badge {
  id          String   @id @default(cuid())
  name        String
  description String?
  iconUrl     String?
  color       String?
  
  // Requirements
  criteria    Json     // Badge earning criteria
  
  // Relationships
  organizationId String
  
  // Earned badges
  userBadges  UserBadge[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("badges")
}

model UserBadge {
  id          String   @id @default(cuid())
  userId      String
  
  // Achievement data
  earnedAt    DateTime @default(now())
  progress    Float?   // Progress towards badge (0-100)
  
  // Relationships
  badgeId     String
  badge       Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, badgeId])
  @@map("user_badges")
}

enum AssessmentType {
  QUIZ
  EXAM
  ASSIGNMENT
  PROJECT
  SURVEY
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  ESSAY
  FILL_IN_BLANK
  MATCHING
  ORDERING
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
  EXPIRED
}

enum AchievementType {
  COURSE_COMPLETION
  ASSESSMENT_PASS
  PERFECT_SCORE
  LEARNING_PATH_COMPLETION
  STREAK_ACHIEVEMENT
  SKILL_MASTERY
}
EOF

echo -e "\n${YELLOW}📧 Creating Notification Service Schema...${NC}"
mkdir -p notification-service/prisma
cat > notification-service/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/notification_client"
}

datasource db {
  provider = "postgresql"
  url      = env("NOTIFICATION_SERVICE_DATABASE_URL")
}

model NotificationTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  type        NotificationType
  channel     NotificationChannel
  
  // Template content
  subject     String?  // For email
  title       String?  // For push notifications
  body        String   // Template body with variables
  htmlBody    String?  // HTML version for email
  
  // Configuration
  isActive    Boolean  @default(true)
  variables   Json?    // Available template variables
  
  // Relationships
  organizationId String?
  
  // Usage
  notifications Notification[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("notification_templates")
}

model Notification {
  id          String   @id @default(cuid())
  type        NotificationType
  channel     NotificationChannel
  status      NotificationStatus @default(PENDING)
  
  // Recipient
  userId      String?
  email       String?
  phoneNumber String?
  deviceToken String?
  
  // Content
  subject     String?
  title       String?
  body        String
  htmlBody    String?
  data        Json?    // Additional data for push notifications
  
  // Delivery
  scheduledAt DateTime?
  sentAt      DateTime?
  deliveredAt DateTime?
  readAt      DateTime?
  
  // Error handling
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  lastError   String?
  
  // Relationships
  templateId  String?
  template    NotificationTemplate? @relation(fields: [templateId], references: [id])
  organizationId String?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("notifications")
}

model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  type        NotificationType
  
  // Channel preferences
  emailEnabled Boolean  @default(true)
  pushEnabled  Boolean  @default(true)
  smsEnabled   Boolean  @default(false)
  
  // Timing preferences
  quietHoursStart String? // HH:MM format
  quietHoursEnd   String? // HH:MM format
  timezone        String?
  
  // Frequency preferences
  frequency   NotificationFrequency @default(IMMEDIATE)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, type])
  @@map("notification_preferences")
}

model EmailCampaign {
  id          String   @id @default(cuid())
  name        String
  subject     String
  body        String
  htmlBody    String?
  
  // Targeting
  targetAudience Json   // Criteria for recipient selection
  
  // Scheduling
  scheduledAt DateTime?
  sentAt      DateTime?
  
  // Status
  status      CampaignStatus @default(DRAFT)
  
  // Statistics
  totalRecipients Int    @default(0)
  sentCount       Int    @default(0)
  deliveredCount  Int    @default(0)
  openedCount     Int    @default(0)
  clickedCount    Int    @default(0)
  
  // Relationships
  organizationId  String
  creatorId       String
  
  // Campaign sends
  campaignSends   CampaignSend[]
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("email_campaigns")
}

model CampaignSend {
  id          String   @id @default(cuid())
  userId      String
  email       String
  status      SendStatus @default(PENDING)
  
  // Tracking
  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  
  // Error handling
  errorMessage String?
  
  // Relationships
  campaignId  String
  campaign    EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([campaignId, userId])
  @@map("campaign_sends")
}

model NotificationLog {
  id          String   @id @default(cuid())
  type        NotificationType
  channel     NotificationChannel
  status      NotificationStatus
  
  // Recipient
  userId      String?
  recipient   String   // Email, phone, or device token
  
  // Content summary
  subject     String?
  
  // Delivery info
  sentAt      DateTime?
  deliveredAt DateTime?
  
  // Error info
  errorMessage String?
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@map("notification_logs")
}

enum NotificationType {
  WELCOME
  EMAIL_VERIFICATION
  PASSWORD_RESET
  COURSE_ENROLLMENT
  LESSON_COMPLETION
  ASSESSMENT_COMPLETED
  CERTIFICATE_EARNED
  BADGE_EARNED
  REMINDER
  ANNOUNCEMENT
  SYSTEM_ALERT
  MARKETING
}

enum NotificationChannel {
  EMAIL
  PUSH
  SMS
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
  CANCELLED
}

enum NotificationFrequency {
  IMMEDIATE
  HOURLY
  DAILY
  WEEKLY
  NEVER
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  CANCELLED
}

enum SendStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
}
EOF

echo -e "\n${YELLOW}📊 Creating Reporting Service Schema...${NC}"
mkdir -p reporting-service/prisma
cat > reporting-service/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/reporting_client"
}

datasource db {
  provider = "postgresql"
  url      = env("REPORTING_SERVICE_DATABASE_URL")
}

model Report {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        ReportType
  category    ReportCategory
  
  // Configuration
  query       Json     // Report query configuration
  parameters  Json?    // Report parameters
  schedule    Json?    // Scheduling configuration
  
  // Access control
  isPublic    Boolean  @default(false)
  permissions Json?    // User/role permissions
  
  // Relationships
  organizationId String
  creatorId      String
  
  // Generated reports
  reportRuns     ReportRun[]
  
  // Metadata
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@map("reports")
}

model ReportRun {
  id          String   @id @default(cuid())
  status      RunStatus @default(PENDING)
  
  // Execution
  startedAt   DateTime?
  completedAt DateTime?
  duration    Int?     // in seconds
  
  // Parameters
  parameters  Json?    // Runtime parameters
  
  // Results
  resultData  Json?    // Report data
  resultUrl   String?  // URL to generated file
  format      ReportFormat
  
  // Error handling
  errorMessage String?
  
  // Relationships
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  requestedBy String   // User ID
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("report_runs")
}

model Dashboard {
  id          String   @id @default(cuid())
  name        String
  description String?
  layout      Json     // Dashboard layout configuration
  
  // Access control
  isPublic    Boolean  @default(false)
  permissions Json?    // User/role permissions
  
  // Relationships
  organizationId String
  creatorId      String
  
  // Widgets
  widgets     DashboardWidget[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("dashboards")
}

model DashboardWidget {
  id          String   @id @default(cuid())
  title       String
  type        WidgetType
  size        WidgetSize
  position    Json     // x, y, width, height
  
  // Configuration
  config      Json     // Widget-specific configuration
  dataSource  Json     // Data source configuration
  
  // Relationships
  dashboardId String
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("dashboard_widgets")
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  eventType   String
  eventName   String
  
  // Event data
  properties  Json?    // Event properties
  userId      String?
  sessionId   String?
  
  // Context
  organizationId String?
  courseId       String?
  lessonId       String?
  
  // Technical details
  userAgent   String?
  ipAddress   String?
  referrer    String?
  
  // Timestamp
  timestamp   DateTime @default(now())
  
  @@index([eventType, eventName])
  @@index([userId])
  @@index([timestamp])
  @@map("analytics_events")
}

model MetricSnapshot {
  id          String   @id @default(cuid())
  metricName  String
  metricType  MetricType
  value       Float
  
  // Dimensions
  dimensions  Json?    // Metric dimensions (e.g., course_id, user_id)
  
  // Time period
  period      TimePeriod
  periodStart DateTime
  periodEnd   DateTime
  
  // Relationships
  organizationId String?
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@unique([metricName, period, periodStart, organizationId])
  @@index([metricName, period])
  @@map("metric_snapshots")
}

model UserActivity {
  id          String   @id @default(cuid())
  userId      String
  activityType ActivityType
  
  // Activity details
  resourceType String?  // course, lesson, assessment, etc.
  resourceId   String?
  action       String   // viewed, completed, started, etc.
  
  // Context
  organizationId String?
  sessionId      String?
  
  // Metadata
  metadata    Json?
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([activityType, timestamp])
  @@map("user_activities")
}

model SystemMetric {
  id          String   @id @default(cuid())
  metricName  String
  value       Float
  unit        String?
  
  // System context
  service     String?  // Service name
  instance    String?  // Instance identifier
  
  // Metadata
  tags        Json?    // Additional tags
  timestamp   DateTime @default(now())
  
  @@index([metricName, timestamp])
  @@map("system_metrics")
}

enum ReportType {
  TABULAR
  CHART
  DASHBOARD
  EXPORT
}

enum ReportCategory {
  USER_ANALYTICS
  COURSE_ANALYTICS
  LEARNING_PROGRESS
  ASSESSMENT_RESULTS
  ENGAGEMENT_METRICS
  FINANCIAL_REPORTS
  SYSTEM_REPORTS
}

enum RunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum ReportFormat {
  JSON
  CSV
  EXCEL
  PDF
  HTML
}

enum WidgetType {
  CHART_LINE
  CHART_BAR
  CHART_PIE
  CHART_AREA
  TABLE
  METRIC
  PROGRESS
  LIST
}

enum WidgetSize {
  SMALL
  MEDIUM
  LARGE
  EXTRA_LARGE
}

enum MetricType {
  COUNTER
  GAUGE
  HISTOGRAM
  SUMMARY
}

enum TimePeriod {
  HOUR
  DAY
  WEEK
  MONTH
  QUARTER
  YEAR
}

enum ActivityType {
  LOGIN
  LOGOUT
  COURSE_VIEW
  LESSON_VIEW
  LESSON_COMPLETE
  ASSESSMENT_START
  ASSESSMENT_COMPLETE
  DOWNLOAD
  SEARCH
  PROFILE_UPDATE
}
EOF

echo -e "\n${GREEN}✅ All database schemas created successfully!${NC}"
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Review and customize schemas in each service's prisma/ directory"
echo "2. Run database setup: ${YELLOW}./setup-all-services.sh 1${NC}"
echo "3. Generate Prisma clients: ${YELLOW}./setup-all-services.sh 2${NC}"
echo "4. Run migrations for each service:"
echo "   ${YELLOW}cd content-service && npx prisma migrate dev --name init${NC}"
echo "   ${YELLOW}cd learning-progress-service && npx prisma migrate dev --name init${NC}"
echo "   ${YELLOW}cd assessment-service && npx prisma migrate dev --name init${NC}"
echo "   ${YELLOW}cd notification-service && npx prisma migrate dev --name init${NC}"
echo "   ${YELLOW}cd reporting-service && npx prisma migrate dev --name init${NC}"

echo -e "\n${GREEN}🎉 Database schemas are ready for implementation!${NC}"
EOF

chmod +x create-service-schemas.sh

