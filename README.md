# Smart Learning Platform - Microservices Implementation

A comprehensive microservices-based learning management system built with Nx monorepo, NestJS, Prisma ORM, and PostgreSQL.

## 🏗️ Architecture Overview

This project implements a microservices architecture using:

- **Nx Monorepo**: Workspace management and build optimization
- **NestJS**: TypeScript-first Node.js framework for building scalable server-side applications
- **Prisma ORM**: Type-safe database client with auto-generated types
- **PostgreSQL**: Robust relational database for each service
- **Redis**: Caching and session management
- **JWT**: Secure authentication and authorization

## 📁 Project Structure

```
smart-learning-platform/
├── apps/
│   ├── auth-service/          # Authentication & Authorization
│   ├── user-service/          # User Management & Profiles
│   └── organization-service/  # Multi-tenant Organizations
├── libs/
│   ├── shared-types/          # TypeScript interfaces & types
│   ├── shared-events/         # Event-driven communication
│   └── shared-utils/          # Utility functions & HTTP clients
├── prisma/
│   ├── auth-service/          # Auth service database schema
│   └── user-service/          # User service database schema
└── docs/                      # Documentation
```

## 🚀 Services Overview

### Auth Service (Port 3001)
- User registration and login
- JWT token management
- Password reset functionality
- Email verification
- Security event logging
- Rate limiting and account locking

**Key Features:**
- ✅ Secure password hashing with bcrypt
- ✅ JWT access and refresh tokens
- ✅ Email verification workflow
- ✅ Password reset with secure tokens
- ✅ Failed login attempt tracking
- ✅ Session management

### User Service (Port 3002)
- User profile management
- Learning preferences and analytics
- Avatar upload functionality
- User search and filtering
- Admin user management

**Key Features:**
- ✅ Comprehensive user profiles
- ✅ Learning style assessment
- ✅ Progress tracking and statistics
- ✅ Multi-role support (Admin, Instructor, Learner)
- ✅ Privacy controls

### Organization Service (Port 3003)
- Multi-tenant organization management
- Custom branding and settings
- Domain management
- Feature toggles per organization

## 🗄️ Database Design

Each service has its own dedicated PostgreSQL database following the microservices principle of database per service:

- **auth_service_db**: Authentication data, tokens, security events
- **user_service_db**: User profiles, preferences, learning statistics

### Database Features:
- ✅ UUID primary keys for security and scalability
- ✅ Comprehensive indexing for performance
- ✅ Audit trails and timestamps
- ✅ Foreign key relationships within service boundaries
- ✅ Enum types for consistent data validation

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | NestJS | Server-side application framework |
| **Database** | PostgreSQL | Primary data storage |
| **ORM** | Prisma | Type-safe database access |
| **Cache** | Redis | Session storage and caching |
| **Authentication** | JWT | Stateless authentication |
| **Validation** | class-validator | Request validation |
| **Documentation** | Swagger/OpenAPI | API documentation |
| **Testing** | Jest | Unit and integration testing |
| **Monorepo** | Nx | Workspace management |

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd smart-learning-platform
npm install
```

2. **Setup databases:**
```bash
# Run the setup script
./setup-dev-db.sh
```

3. **Configure environment variables:**
```bash
# Copy and edit environment file
cp .env.example .env
# Edit .env with your database credentials
```

4. **Run database migrations:**
```bash
# Auth Service
cd auth-service && npx prisma migrate dev --name init

# User Service  
cd user-service && npx prisma migrate dev --name init
```

5. **Build shared libraries:**
```bash
npx nx build shared-types
npx nx build shared-events
npx nx build shared-utils
```

6. **Start services:**
```bash
# Terminal 1: Auth Service
npx nx serve auth-service

# Terminal 2: User Service
npx nx serve user-service
```

### Quick Test

Run the test script to verify everything is working:

```bash
./test-services.sh
```

## 📚 API Documentation

Once services are running, access the interactive API documentation:

- **Auth Service**: http://localhost:3001/api/docs
- **User Service**: http://localhost:3002/api/docs

## 🔐 Authentication Flow

### Registration Process
1. User submits email and password
2. System validates input and creates user record
3. Email verification token is generated
4. Verification email is sent (simulated in development)
5. User clicks verification link to activate account

### Login Process
1. User submits credentials
2. System validates email and password
3. Account status and verification are checked
4. JWT access and refresh tokens are generated
5. Session is created and tracked

### Token Management
- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Security**: Tokens are hashed and stored securely

## 🎯 API Examples

### User Registration
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com", 
    "password": "SecurePass123!"
  }'
```

### Get User Profile
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:3002/api/v1/users/profile
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npx nx test

# Test specific service
npx nx test auth-service
npx nx test user-service

# Test shared libraries
npx nx test shared-types
npx nx test shared-events
npx nx test shared-utils
```

### Integration Testing
```bash
# Test service endpoints
./test-services.sh

# Test database connections
./test-databases.sh
```

## 🚀 Deployment

### Development Environment
```bash
# Start all services locally
npm run dev

# Or start individual services
npx nx serve auth-service
npx nx serve user-service
```

### Production Deployment

1. **Build for production:**
```bash
npx nx build auth-service --prod
npx nx build user-service --prod
```

2. **Environment setup:**
- Configure production database URLs
- Set secure JWT secrets
- Configure Redis connection
- Set up email service credentials

3. **Database migration:**
```bash
npx prisma migrate deploy
```

4. **Start services:**
```bash
npm run start:prod
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_DATABASE_URL` | Auth service database connection | - |
| `USER_DATABASE_URL` | User service database connection | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token expiry | 15m |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry | 7d |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `AUTH_SERVICE_PORT` | Auth service port | 3001 |
| `USER_SERVICE_PORT` | User service port | 3002 |

### Database Configuration

Each service uses its own PostgreSQL database:

```env
# Auth Service
AUTH_DATABASE_URL="postgresql://auth_user:auth_password@localhost:5432/auth_service_db"

# User Service  
USER_DATABASE_URL="postgresql://user_service:user_password@localhost:5432/user_service_db"
```

## 📊 Monitoring and Logging

### Health Checks
- **Auth Service**: `GET /api/v1/health`
- **User Service**: `GET /api/v1/health`

### Logging
- Structured logging with service identification
- Request/response logging for debugging
- Error tracking and reporting
- Security event logging

## 🔒 Security Features

### Authentication Security
- Password strength validation
- Secure password hashing (bcrypt with salt rounds)
- JWT token security with expiration
- Refresh token rotation
- Account lockout after failed attempts

### API Security
- Rate limiting per endpoint
- Request validation and sanitization
- CORS configuration
- Security headers
- Input validation with class-validator

### Database Security
- Parameterized queries (Prisma ORM)
- Database user permissions
- Connection encryption
- Audit logging

## 🎯 Performance Optimization

### Database Performance
- Strategic indexing on frequently queried fields
- Connection pooling
- Query optimization with Prisma
- Database-specific optimizations

### Caching Strategy
- Redis for session storage
- API response caching
- Database query result caching
- Static asset caching

### Scalability Features
- Horizontal scaling ready
- Stateless service design
- Database per service isolation
- Event-driven communication

## 🔄 Inter-Service Communication

### HTTP Communication
- RESTful APIs between services
- Standardized error handling
- Request/response logging
- Circuit breaker pattern (planned)

### Event-Driven Communication
- Asynchronous event publishing
- Event sourcing capabilities
- Domain event handling
- Message queuing (planned)

## 📈 Future Enhancements

### Planned Features
- [ ] API Gateway implementation
- [ ] Service mesh integration
- [ ] Distributed tracing
- [ ] Advanced monitoring and metrics
- [ ] Automated testing pipeline
- [ ] Container orchestration
- [ ] Message queue integration
- [ ] Advanced caching strategies

### Scalability Improvements
- [ ] Database sharding
- [ ] Read replicas
- [ ] CDN integration
- [ ] Load balancing
- [ ] Auto-scaling policies

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run the test suite
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint and Prettier configuration
- Comprehensive test coverage
- API documentation updates
- Database migration scripts

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- API documentation available at service endpoints
- Database schema documentation in `/docs`
- Architecture decision records in `/docs/adr`

### Troubleshooting
- Check service health endpoints
- Verify database connections
- Review application logs
- Validate environment configuration

### Getting Help
- Create an issue for bugs or feature requests
- Check existing documentation
- Review test examples
- Contact the development team

---

**Built with ❤️ using Nx, NestJS, and Prisma**

