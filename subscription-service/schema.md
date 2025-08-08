# Subscription Service - Database Schema

## Overview
Subscription Service menangani subscription plan management, billing and payment processing, usage tracking and limits, plan upgrades/downgrades, invoice management, dan payment method handling berdasarkan API Contract.

## Database: `subscription_service_db`

## Prisma Schema

```prisma
// subscription-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/subscription-client"
}

datasource db {
  provider = "postgresql"
  url      = env("SUBSCRIPTION_DATABASE_URL")
}

// Subscription Plans
model SubscriptionPlan {
  id                    String    @id @default(uuid()) @db.Uuid
  name                  String
  description           String?   @db.Text
  
  // Pricing
  price                 Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  billing_cycle         BillingCycle @map("billing_cycle")
  
  // Plan Configuration
  subscriber_type       SubscriberType @map("subscriber_type")
  is_popular            Boolean   @default(false) @map("is_popular")
  is_active             Boolean   @default(true) @map("is_active")
  
  // Trial Configuration
  trial_period_days     Int?      @map("trial_period_days")
  trial_price           Decimal?  @db.Decimal(10, 2) @map("trial_price")
  
  // Plan Features (JSON for flexibility)
  features              Json      // Feature configuration object
  
  // Metadata
  sort_order            Int       @default(0) @map("sort_order")
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subscriptions         Subscription[]
  plan_features         PlanFeature[]
  
  @@map("subscription_plans")
  @@index([subscriber_type])
  @@index([is_active])
  @@index([billing_cycle])
}

// Plan Features (for structured feature management)
model PlanFeature {
  id                    String    @id @default(uuid()) @db.Uuid
  plan_id               String    @map("plan_id") @db.Uuid
  feature_key           String    @map("feature_key")
  feature_name          String    @map("feature_name")
  
  // Feature Value
  feature_value         Json      @map("feature_value") // Can be boolean, number, string, or object
  feature_type          FeatureType @map("feature_type")
  
  // Limits and Quotas
  limit_value           Int?      @map("limit_value")
  is_unlimited          Boolean   @default(false) @map("is_unlimited")
  
  // Display
  display_order         Int       @default(0) @map("display_order")
  is_highlighted        Boolean   @default(false) @map("is_highlighted")
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  plan                  SubscriptionPlan @relation(fields: [plan_id], references: [id], onDelete: Cascade)
  
  @@unique([plan_id, feature_key])
  @@map("plan_features")
  @@index([feature_key])
}

// Active Subscriptions
model Subscription {
  id                    String    @id @default(uuid()) @db.Uuid
  
  // Subscriber Information
  subscriber_type       SubscriberType @map("subscriber_type")
  subscriber_id         String    @map("subscriber_id") @db.Uuid // User or Organization ID
  
  // Plan Information
  plan_id               String    @map("plan_id") @db.Uuid
  
  // Subscription Status
  status                SubscriptionStatus @default(ACTIVE)
  
  // Billing Dates
  start_date            DateTime  @map("start_date") @db.Date
  end_date              DateTime? @map("end_date") @db.Date
  billing_cycle         BillingCycle @map("billing_cycle")
  next_billing_date     DateTime? @map("next_billing_date") @db.Date
  
  // Trial Information
  trial_start_date      DateTime? @map("trial_start_date") @db.Date
  trial_end_date        DateTime? @map("trial_end_date") @db.Date
  is_trial              Boolean   @default(false) @map("is_trial")
  
  // Pricing
  current_price         Decimal   @db.Decimal(10, 2) @map("current_price")
  currency              String    @default("USD")
  
  // Payment
  payment_method_id     String?   @map("payment_method_id") @db.Uuid
  
  // Cancellation
  cancelled_at          DateTime? @map("cancelled_at")
  cancellation_reason   String?   @map("cancellation_reason") @db.Text
  cancel_at_period_end  Boolean   @default(false) @map("cancel_at_period_end")
  
  // Timestamps
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  plan                  SubscriptionPlan @relation(fields: [plan_id], references: [id])
  payment_method        PaymentMethod? @relation(fields: [payment_method_id], references: [id])
  invoices              Invoice[]
  usage_records         UsageRecord[]
  subscription_changes  SubscriptionChange[]
  
  @@map("subscriptions")
  @@index([subscriber_type, subscriber_id])
  @@index([status])
  @@index([next_billing_date])
  @@index([plan_id])
}

// Payment Methods
model PaymentMethod {
  id                    String    @id @default(uuid()) @db.Uuid
  
  // Owner Information
  subscriber_type       SubscriberType @map("subscriber_type")
  subscriber_id         String    @map("subscriber_id") @db.Uuid
  
  // Payment Method Details
  type                  PaymentMethodType
  
  // Card Information (encrypted)
  card_last_four        String?   @map("card_last_four")
  card_brand            String?   @map("card_brand")
  card_expiry_month     Int?      @map("card_expiry_month")
  card_expiry_year      Int?      @map("card_expiry_year")
  
  // Bank Account Information (encrypted)
  bank_name             String?   @map("bank_name")
  account_last_four     String?   @map("account_last_four")
  routing_number        String?   @map("routing_number")
  
  // Billing Address
  billing_address       Json?     @map("billing_address")
  
  // Status
  is_default            Boolean   @default(false) @map("is_default")
  is_verified           Boolean   @default(false) @map("is_verified")
  
  // External References
  stripe_payment_method_id String? @map("stripe_payment_method_id")
  paypal_payment_method_id String? @map("paypal_payment_method_id")
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subscriptions         Subscription[]
  payments              Payment[]
  
  @@map("payment_methods")
  @@index([subscriber_type, subscriber_id])
  @@index([type])
  @@index([is_default])
}

// Invoices
model Invoice {
  id                    String    @id @default(uuid()) @db.Uuid
  subscription_id       String    @map("subscription_id") @db.Uuid
  invoice_number        String    @unique @map("invoice_number")
  
  // Invoice Details
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  tax_amount            Decimal   @default(0) @db.Decimal(10, 2) @map("tax_amount")
  discount_amount       Decimal   @default(0) @db.Decimal(10, 2) @map("discount_amount")
  total_amount          Decimal   @db.Decimal(10, 2) @map("total_amount")
  
  // Status and Dates
  status                InvoiceStatus @default(DRAFT)
  issue_date            DateTime  @map("issue_date") @db.Date
  due_date              DateTime  @map("due_date") @db.Date
  paid_date             DateTime? @map("paid_date")
  
  // Billing Period
  period_start          DateTime  @map("period_start") @db.Date
  period_end            DateTime  @map("period_end") @db.Date
  
  // Payment Information
  payment_method_id     String?   @map("payment_method_id") @db.Uuid
  payment_attempt_count Int       @default(0) @map("payment_attempt_count")
  last_payment_attempt  DateTime? @map("last_payment_attempt")
  
  // External References
  stripe_invoice_id     String?   @map("stripe_invoice_id")
  
  // Files
  pdf_url               String?   @map("pdf_url")
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subscription          Subscription @relation(fields: [subscription_id], references: [id])
  payment_method        PaymentMethod? @relation(fields: [payment_method_id], references: [id])
  line_items            InvoiceLineItem[]
  payments              Payment[]
  
  @@map("invoices")
  @@index([subscription_id])
  @@index([status])
  @@index([due_date])
  @@index([invoice_number])
}

// Invoice Line Items
model InvoiceLineItem {
  id                    String    @id @default(uuid()) @db.Uuid
  invoice_id            String    @map("invoice_id") @db.Uuid
  
  // Item Details
  description           String    @db.Text
  quantity              Int       @default(1)
  unit_price            Decimal   @db.Decimal(10, 2) @map("unit_price")
  total_price           Decimal   @db.Decimal(10, 2) @map("total_price")
  
  // Item Type
  item_type             LineItemType @map("item_type")
  item_reference_id     String?   @map("item_reference_id") @db.Uuid
  
  // Period (for subscription items)
  period_start          DateTime? @map("period_start") @db.Date
  period_end            DateTime? @map("period_end") @db.Date
  
  created_at            DateTime  @default(now()) @map("created_at")
  
  // Relations
  invoice               Invoice   @relation(fields: [invoice_id], references: [id], onDelete: Cascade)
  
  @@map("invoice_line_items")
  @@index([invoice_id])
}

// Payments
model Payment {
  id                    String    @id @default(uuid()) @db.Uuid
  invoice_id            String?   @map("invoice_id") @db.Uuid
  payment_method_id     String    @map("payment_method_id") @db.Uuid
  
  // Payment Details
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  status                PaymentStatus @default(PENDING)
  
  // Payment Processing
  payment_intent_id     String?   @map("payment_intent_id")
  transaction_id        String?   @map("transaction_id")
  gateway               PaymentGateway @default(STRIPE)
  
  // Failure Information
  failure_code          String?   @map("failure_code")
  failure_message       String?   @map("failure_message") @db.Text
  
  // Refund Information
  refunded_amount       Decimal   @default(0) @db.Decimal(10, 2) @map("refunded_amount")
  refund_reason         String?   @map("refund_reason") @db.Text
  
  // Timestamps
  processed_at          DateTime? @map("processed_at")
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  invoice               Invoice?  @relation(fields: [invoice_id], references: [id])
  payment_method        PaymentMethod @relation(fields: [payment_method_id], references: [id])
  refunds               Refund[]
  
  @@map("payments")
  @@index([invoice_id])
  @@index([status])
  @@index([gateway])
  @@index([processed_at])
}

// Refunds
model Refund {
  id                    String    @id @default(uuid()) @db.Uuid
  payment_id            String    @map("payment_id") @db.Uuid
  
  // Refund Details
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  reason                String    @db.Text
  status                RefundStatus @default(PENDING)
  
  // Processing
  refund_id             String?   @map("refund_id") // External gateway refund ID
  processed_at          DateTime? @map("processed_at")
  
  // Metadata
  requested_by          String?   @map("requested_by") @db.Uuid
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  payment               Payment   @relation(fields: [payment_id], references: [id])
  
  @@map("refunds")
  @@index([payment_id])
  @@index([status])
}

// Usage Tracking
model UsageRecord {
  id                    String    @id @default(uuid()) @db.Uuid
  subscription_id       String    @map("subscription_id") @db.Uuid
  
  // Usage Details
  metric_name           String    @map("metric_name") // "active_users", "storage_gb", "api_calls"
  usage_value           Float     @map("usage_value")
  limit_value           Float?    @map("limit_value")
  
  // Billing Period
  billing_period_start  DateTime  @map("billing_period_start") @db.Date
  billing_period_end    DateTime  @map("billing_period_end") @db.Date
  
  // Overage
  overage_amount        Decimal   @default(0) @db.Decimal(10, 2) @map("overage_amount")
  overage_rate          Decimal?  @db.Decimal(10, 4) @map("overage_rate")
  
  // Timestamps
  recorded_at           DateTime  @default(now()) @map("recorded_at")
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subscription          Subscription @relation(fields: [subscription_id], references: [id])
  
  @@unique([subscription_id, metric_name, billing_period_start])
  @@map("usage_records")
  @@index([subscription_id])
  @@index([metric_name])
  @@index([billing_period_start])
}

// Subscription Changes (upgrades, downgrades, etc.)
model SubscriptionChange {
  id                    String    @id @default(uuid()) @db.Uuid
  subscription_id       String    @map("subscription_id") @db.Uuid
  
  // Change Details
  change_type           ChangeType @map("change_type")
  from_plan_id          String?   @map("from_plan_id") @db.Uuid
  to_plan_id            String?   @map("to_plan_id") @db.Uuid
  
  // Pricing Changes
  from_price            Decimal?  @db.Decimal(10, 2) @map("from_price")
  to_price              Decimal?  @db.Decimal(10, 2) @map("to_price")
  proration_amount      Decimal?  @db.Decimal(10, 2) @map("proration_amount")
  
  // Timing
  effective_date        DateTime  @map("effective_date")
  scheduled_date        DateTime? @map("scheduled_date")
  
  // Status
  status                ChangeStatus @default(PENDING)
  applied_at            DateTime? @map("applied_at")
  
  // Metadata
  reason                String?   @db.Text
  requested_by          String?   @map("requested_by") @db.Uuid
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subscription          Subscription @relation(fields: [subscription_id], references: [id])
  
  @@map("subscription_changes")
  @@index([subscription_id])
  @@index([change_type])
  @@index([status])
  @@index([effective_date])
}

// Coupons and Discounts
model Coupon {
  id                    String    @id @default(uuid()) @db.Uuid
  code                  String    @unique
  name                  String
  description           String?   @db.Text
  
  // Discount Configuration
  discount_type         DiscountType @map("discount_type")
  discount_value        Decimal   @db.Decimal(10, 2) @map("discount_value")
  max_discount_amount   Decimal?  @db.Decimal(10, 2) @map("max_discount_amount")
  
  // Validity
  valid_from            DateTime  @map("valid_from")
  valid_until           DateTime? @map("valid_until")
  is_active             Boolean   @default(true) @map("is_active")
  
  // Usage Limits
  max_uses              Int?      @map("max_uses")
  max_uses_per_customer Int?      @map("max_uses_per_customer")
  current_uses          Int       @default(0) @map("current_uses")
  
  // Restrictions
  minimum_amount        Decimal?  @db.Decimal(10, 2) @map("minimum_amount")
  applicable_plans      String[]  @map("applicable_plans") // Plan IDs
  
  created_at            DateTime  @default(now()) @map("created_at")
  updated_at            DateTime  @updatedAt @map("updated_at")
  
  // Relations
  coupon_usages         CouponUsage[]
  
  @@map("coupons")
  @@index([code])
  @@index([is_active])
  @@index([valid_from, valid_until])
}

// Coupon Usage Tracking
model CouponUsage {
  id                    String    @id @default(uuid()) @db.Uuid
  coupon_id             String    @map("coupon_id") @db.Uuid
  subscription_id       String    @map("subscription_id") @db.Uuid
  
  // Usage Details
  discount_amount       Decimal   @db.Decimal(10, 2) @map("discount_amount")
  
  used_at               DateTime  @default(now()) @map("used_at")
  
  // Relations
  coupon                Coupon    @relation(fields: [coupon_id], references: [id])
  subscription          Subscription @relation(fields: [subscription_id], references: [id])
  
  @@map("coupon_usages")
  @@index([coupon_id])
  @@index([subscription_id])
}

// Enums
enum BillingCycle {
  MONTHLY
  QUARTERLY
  ANNUALLY
  
  @@map("billing_cycle")
}

enum SubscriberType {
  USER
  ORGANIZATION
  
  @@map("subscriber_type")
}

enum FeatureType {
  BOOLEAN
  NUMBER
  STRING
  OBJECT
  
  @@map("feature_type")
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELLED
  UNPAID
  INCOMPLETE
  INCOMPLETE_EXPIRED
  
  @@map("subscription_status")
}

enum PaymentMethodType {
  CREDIT_CARD
  DEBIT_CARD
  BANK_ACCOUNT
  PAYPAL
  APPLE_PAY
  GOOGLE_PAY
  
  @@map("payment_method_type")
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
  
  @@map("invoice_status")
}

enum LineItemType {
  SUBSCRIPTION
  USAGE
  DISCOUNT
  TAX
  ONE_TIME
  
  @@map("line_item_type")
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
  
  @@map("payment_status")
}

enum PaymentGateway {
  STRIPE
  PAYPAL
  SQUARE
  BRAINTREE
  
  @@map("payment_gateway")
}

enum RefundStatus {
  PENDING
  SUCCEEDED
  FAILED
  CANCELLED
  
  @@map("refund_status")
}

enum ChangeType {
  UPGRADE
  DOWNGRADE
  PLAN_CHANGE
  BILLING_CYCLE_CHANGE
  CANCELLATION
  REACTIVATION
  
  @@map("change_type")
}

enum ChangeStatus {
  PENDING
  SCHEDULED
  APPLIED
  FAILED
  CANCELLED
  
  @@map("change_status")
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  
  @@map("discount_type")
}
```

## Key Features

### 1. **Flexible Subscription Plans**
- Multiple billing cycles support
- Feature-based plan configuration
- Trial period management
- Plan popularity and sorting
- Subscriber type differentiation

### 2. **Comprehensive Billing**
- Automated invoice generation
- Proration calculations
- Tax and discount handling
- Multiple payment methods
- Payment retry logic

### 3. **Usage Tracking**
- Real-time usage monitoring
- Overage calculation
- Billing period management
- Multiple metric types
- Usage-based billing

### 4. **Payment Processing**
- Multiple payment gateways
- Secure payment method storage
- Refund management
- Failed payment handling
- Payment method verification

### 5. **Subscription Lifecycle**
- Plan upgrades and downgrades
- Cancellation management
- Reactivation support
- Change scheduling
- Proration handling

### 6. **Discount System**
- Coupon code management
- Usage tracking and limits
- Multiple discount types
- Plan-specific restrictions
- Time-based validity

## API Mapping

### Subscription Information
- `GET /subscriptions/current` → Subscription + Plan + PaymentMethod + UsageRecord
- `GET /subscriptions/plans` → SubscriptionPlan + PlanFeature
- `GET /subscriptions/usage` → UsageRecord aggregation

### Subscription Management
- `POST /subscriptions/upgrade` → Create SubscriptionChange
- `POST /subscriptions/downgrade` → Create SubscriptionChange
- `PUT /subscriptions/payment-method` → Update/Create PaymentMethod

### Billing and Invoices
- `GET /subscriptions/invoices` → Invoice + InvoiceLineItem
- `GET /subscriptions/invoices/{id}/download` → Invoice PDF generation

## Indexes and Performance

### Primary Indexes
- Subscription lookup by subscriber
- Invoice and payment queries
- Usage tracking by period
- Plan and feature queries

### Query Optimization
- Efficient billing calculations
- Fast usage aggregations
- Payment status tracking
- Subscription change history

## Environment Variables

```env
# Database
SUBSCRIPTION_DATABASE_URL="postgresql://subscription_service:subscription_password@localhost:5435/subscription_service_db"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# Billing
DEFAULT_CURRENCY="USD"
INVOICE_DUE_DAYS=15
PAYMENT_RETRY_ATTEMPTS=3
PAYMENT_RETRY_DELAY="3d"

# Usage Tracking
USAGE_AGGREGATION_INTERVAL="1h"
OVERAGE_NOTIFICATION_THRESHOLD=0.8

# File Storage
INVOICE_STORAGE_BUCKET="smart-learning-invoices"
INVOICE_RETENTION_YEARS=7
```

## Data Migration

### From Existing Systems
- Subscription data migration
- Payment method migration
- Invoice history import
- Usage data migration
- Plan configuration transfer

### Data Validation
- Payment method validation
- Currency format validation
- Date range validation
- Usage metric validation
- Plan feature validation

This schema provides a comprehensive foundation for subscription and billing management in the Smart Learning Platform, supporting complex billing scenarios, multiple payment methods, and detailed usage tracking as specified in the API contract.

