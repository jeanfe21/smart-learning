// Shared types for inter-service communication

// User related types
export interface UserBasicInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id: string;
  status: UserStatus;
}

export interface UserProfile {
  user_id: string;
  avatar_url?: string;
  bio?: string;
  timezone: string;
  language: string;
  phone_number?: string;
  date_of_birth?: Date;
  address_line1?: string;
  city?: string;
  country?: string;
  profile_visibility: ProfileVisibility;
  show_email: boolean;
}

export interface LearningPreferences {
  user_id: string;
  visual_score: number;
  auditory_score: number;
  reading_score: number;
  kinesthetic_score: number;
  preferred_content_types: string[];
  difficulty_preference: DifficultyLevel;
  pace_preference: PacePreference;
}

export interface LearningStats {
  user_id: string;
  total_courses_enrolled: number;
  courses_completed: number;
  courses_in_progress: number;
  total_learning_time: number;
  this_week_learning_time: number;
  average_score?: number;
  total_assessments_taken: number;
  last_activity?: Date;
}

// Authentication types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  status: UserStatus;
  email_verified: boolean;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: any;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// Event types for inter-service communication
export interface UserCreatedEvent {
  type: 'user.created';
  data: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    organization_id: string;
    role: UserRole;
  };
  timestamp: Date;
}

export interface UserUpdatedEvent {
  type: 'user.updated';
  data: {
    user_id: string;
    changes: Partial<UserBasicInfo>;
  };
  timestamp: Date;
}

export interface UserDeletedEvent {
  type: 'user.deleted';
  data: {
    user_id: string;
    organization_id: string;
  };
  timestamp: Date;
}

export interface AuthenticationEvent {
  type: 'auth.login' | 'auth.logout' | 'auth.password_reset';
  data: {
    user_id: string;
    ip_address?: string;
    user_agent?: string;
  };
  timestamp: Date;
}

// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  ORGANIZATION = 'ORGANIZATION',
  PRIVATE = 'PRIVATE',
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum PacePreference {
  SLOW = 'SLOW',
  MODERATE = 'MODERATE',
  FAST = 'FAST',
  SELF_PACED = 'SELF_PACED',
}

// HTTP Client types
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ServiceEndpoints {
  auth: string;
  user: string;
  organization: string;
  subscription: string;
}

// Error types
export interface ServiceError {
  service: string;
  operation: string;
  error: string;
  statusCode?: number;
  timestamp: Date;
}

