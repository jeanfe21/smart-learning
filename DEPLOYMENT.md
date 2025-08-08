# Smart Learning Platform - Deployment Guide

This guide covers deployment strategies for the Smart Learning Platform microservices architecture.

## 🎯 Deployment Options

### 1. Local Development
- Single machine setup
- PostgreSQL and Redis locally
- Services running on different ports

### 2. Docker Containers
- Containerized services
- Docker Compose orchestration
- Isolated environments

### 3. Cloud Deployment
- AWS/GCP/Azure deployment
- Managed databases
- Container orchestration

### 4. Kubernetes
- Production-grade orchestration
- Auto-scaling and load balancing
- Service mesh integration

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.0+
- Docker Compose 2.0+

### Build Docker Images

1. **Create Dockerfiles for each service:**

```dockerfile
# auth-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/auth-service ./apps/auth-service
COPY libs ./libs

# Build the application
RUN npx nx build auth-service --prod

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/apps/auth-service/main.js"]
```

2. **Build images:**
```bash
# Build auth service
docker build -f auth-service/Dockerfile -t smart-learning/auth-service .

# Build user service
docker build -f user-service/Dockerfile -t smart-learning/user-service .
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Databases
  auth-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auth_service_db
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: ${AUTH_DB_PASSWORD}
    volumes:
      - auth_db_data:/var/lib/postgresql/data
    networks:
      - backend

  user-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: user_service_db
      POSTGRES_USER: user_service
      POSTGRES_PASSWORD: ${USER_DB_PASSWORD}
    volumes:
      - user_db_data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend

  # Services
  auth-service:
    image: smart-learning/auth-service
    environment:
      AUTH_DATABASE_URL: postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db:5432/auth_service_db
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
    depends_on:
      - auth-db
      - redis
    networks:
      - backend
      - frontend
    ports:
      - "3001:3001"

  user-service:
    image: smart-learning/user-service
    environment:
      USER_DATABASE_URL: postgresql://user_service:${USER_DB_PASSWORD}@user-db:5432/user_service_db
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
    depends_on:
      - user-db
      - redis
    networks:
      - backend
      - frontend
    ports:
      - "3002:3002"

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - auth-service
      - user-service
    networks:
      - frontend

volumes:
  auth_db_data:
  user_db_data:
  redis_data:

networks:
  frontend:
  backend:
```

### Deploy with Docker Compose

```bash
# Set environment variables
export AUTH_DB_PASSWORD=secure_auth_password
export USER_DB_PASSWORD=secure_user_password
export JWT_SECRET=your-super-secure-jwt-secret

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec auth-service npx prisma migrate deploy
docker-compose exec user-service npx prisma migrate deploy
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Prerequisites
- AWS CLI configured
- ECS/EKS cluster
- RDS PostgreSQL instances
- ElastiCache Redis cluster

#### Infrastructure Setup

1. **Create RDS instances:**
```bash
# Auth Service Database
aws rds create-db-instance \
  --db-instance-identifier smart-learning-auth-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username auth_user \
  --master-user-password ${AUTH_DB_PASSWORD} \
  --allocated-storage 20

# User Service Database
aws rds create-db-instance \
  --db-instance-identifier smart-learning-user-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username user_service \
  --master-user-password ${USER_DB_PASSWORD} \
  --allocated-storage 20
```

2. **Create ElastiCache cluster:**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id smart-learning-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

3. **Deploy to ECS:**
```json
{
  "family": "smart-learning-auth-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "auth-service",
      "image": "your-account.dkr.ecr.region.amazonaws.com/smart-learning/auth-service:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AUTH_DATABASE_URL",
          "value": "postgresql://auth_user:password@auth-db.region.rds.amazonaws.com:5432/auth_service_db"
        },
        {
          "name": "JWT_SECRET",
          "value": "your-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smart-learning-auth-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform

#### Prerequisites
- GCP CLI (gcloud) configured
- GKE cluster
- Cloud SQL PostgreSQL instances
- Memorystore Redis instance

#### Deploy to GKE

1. **Create Cloud SQL instances:**
```bash
# Auth Service Database
gcloud sql instances create smart-learning-auth-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=us-central1

# User Service Database
gcloud sql instances create smart-learning-user-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=us-central1
```

2. **Create Kubernetes manifests:**
```yaml
# auth-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: gcr.io/your-project/smart-learning/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: AUTH_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: auth-database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

3. **Deploy to GKE:**
```bash
# Apply manifests
kubectl apply -f auth-service-deployment.yaml
kubectl apply -f user-service-deployment.yaml

# Create ingress
kubectl apply -f ingress.yaml
```

## 🚀 Production Considerations

### Environment Variables

Create a comprehensive environment configuration:

```bash
# Production Environment Variables
export NODE_ENV=production

# Database URLs
export AUTH_DATABASE_URL="postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db.region.provider.com:5432/auth_service_db"
export USER_DATABASE_URL="postgresql://user_service:${USER_DB_PASSWORD}@user-db.region.provider.com:5432/user_service_db"

# Security
export JWT_SECRET="${JWT_SECRET}"
export JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
export JWT_REFRESH_TOKEN_EXPIRES_IN="7d"

# Redis
export REDIS_URL="redis://redis.region.provider.com:6379"

# Email Service
export EMAIL_SERVICE="sendgrid"
export EMAIL_API_KEY="${EMAIL_API_KEY}"

# Monitoring
export SENTRY_DSN="${SENTRY_DSN}"
export NEW_RELIC_LICENSE_KEY="${NEW_RELIC_LICENSE_KEY}"
```

### Database Migration

```bash
# Production migration script
#!/bin/bash

echo "Running production database migrations..."

# Auth Service
echo "Migrating Auth Service database..."
cd auth-service
npx prisma migrate deploy
npx prisma generate

# User Service
echo "Migrating User Service database..."
cd ../user-service
npx prisma migrate deploy
npx prisma generate

echo "Migrations completed successfully!"
```

### Health Checks

Configure health checks for each service:

```yaml
# Kubernetes health check example
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/v1/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Load Balancing

#### Nginx Configuration

```nginx
# nginx.conf
upstream auth_service {
    server auth-service-1:3001;
    server auth-service-2:3001;
    server auth-service-3:3001;
}

upstream user_service {
    server user-service-1:3002;
    server user-service-2:3002;
    server user-service-3:3002;
}

server {
    listen 80;
    server_name api.smartlearning.com;

    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/v1/users {
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### SSL/TLS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.smartlearning.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API routes
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoints:**
```typescript
// Enhanced health check
@Get('health')
async getHealth() {
  const dbStatus = await this.checkDatabaseConnection();
  const redisStatus = await this.checkRedisConnection();
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.npm_package_version,
    dependencies: {
      database: dbStatus,
      redis: redisStatus
    }
  };
}
```

2. **Structured Logging:**
```typescript
import { Logger } from '@nestjs/common';

export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);
    
    try {
      // Login logic
      this.logger.log(`Login successful for user: ${loginDto.email}`);
    } catch (error) {
      this.logger.error(`Login failed for user: ${loginDto.email}`, error.stack);
      throw error;
    }
  }
}
```

### Metrics Collection

```typescript
// Prometheus metrics example
import { register, Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
```bash
# Check database connectivity
PGPASSWORD=password psql -h database-host -U username -d database_name -c "SELECT 1;"

# Check service logs
kubectl logs deployment/auth-service
docker-compose logs auth-service
```

2. **Service Discovery Issues:**
```bash
# Check service endpoints
kubectl get endpoints
kubectl describe service auth-service

# Test internal connectivity
kubectl exec -it pod-name -- curl http://auth-service:3001/api/v1/health
```

3. **Memory/CPU Issues:**
```bash
# Check resource usage
kubectl top pods
docker stats

# Scale services
kubectl scale deployment auth-service --replicas=5
```

### Performance Optimization

1. **Database Optimization:**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_organization_id ON users(organization_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

2. **Connection Pooling:**
```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx nx test
      - run: npx nx lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -f auth-service/Dockerfile -t ${{ secrets.REGISTRY }}/auth-service:${{ github.sha }} .
          docker build -f user-service/Dockerfile -t ${{ secrets.REGISTRY }}/user-service:${{ github.sha }} .
      - name: Push to registry
        run: |
          docker push ${{ secrets.REGISTRY }}/auth-service:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/user-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/auth-service auth-service=${{ secrets.REGISTRY }}/auth-service:${{ github.sha }}
          kubectl set image deployment/user-service user-service=${{ secrets.REGISTRY }}/user-service:${{ github.sha }}
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Health checks implemented
- [ ] Monitoring setup
- [ ] Backup strategy in place

### Deployment
- [ ] Build and test all services
- [ ] Deploy database changes first
- [ ] Deploy services with zero downtime
- [ ] Verify health checks
- [ ] Test critical user flows
- [ ] Monitor error rates and performance

### Post-Deployment
- [ ] Verify all services are healthy
- [ ] Check application logs
- [ ] Monitor performance metrics
- [ ] Test API endpoints
- [ ] Validate database connections
- [ ] Confirm backup processes

---

This deployment guide provides comprehensive instructions for deploying the Smart Learning Platform in various environments. Choose the deployment strategy that best fits your infrastructure requirements and scale needs.

