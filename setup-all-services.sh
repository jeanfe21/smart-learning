#!/bin/bash

echo "🚀 Smart Learning Platform - Complete Services Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service configuration
declare -A SERVICES=(
    ["api-gateway"]="3000"
    ["auth-service"]="3001"
    ["user-service"]="3002"
    ["organization-service"]="3003"
    ["subscription-service"]="3004"
    ["content-service"]="3005"
    ["learning-progress-service"]="3006"
    ["assessment-service"]="3007"
    ["notification-service"]="3008"
    ["reporting-service"]="3009"
)

# Database configuration
declare -A DATABASES=(
    ["auth-service"]="auth_service_db:auth_user:auth_password"
    ["user-service"]="user_service_db:user_service:user_password"
    ["organization-service"]="organization_service_db:org_user:org_password"
    ["subscription-service"]="subscription_service_db:sub_user:sub_password"
    ["content-service"]="content_service_db:content_user:content_password"
    ["learning-progress-service"]="learning_progress_db:progress_user:progress_password"
    ["assessment-service"]="assessment_service_db:assess_user:assess_password"
    ["notification-service"]="notification_service_db:notify_user:notify_password"
    ["reporting-service"]="reporting_service_db:report_user:report_password"
)

echo -e "\n${BLUE}📊 Services Overview:${NC}"
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    if [[ -d "$service" ]]; then
        echo -e "   ✅ $service (Port: $port) - Generated"
    else
        echo -e "   ❌ $service (Port: $port) - Missing"
    fi
done

echo -e "\n${YELLOW}🔧 Setup Options:${NC}"
echo "1. Setup databases for all services"
echo "2. Create Prisma schemas for all services"
echo "3. Setup environment variables"
echo "4. Generate service templates"
echo "5. Setup API Gateway configuration"
echo "6. Create Docker configuration"
echo "7. Setup all (complete setup)"
echo "8. Start development environment"

read -p "Choose option (1-8): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}🗄️ Setting up databases...${NC}"
        
        # Check if PostgreSQL is running
        if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL first.${NC}"
            exit 1
        fi
        
        for service in "${!DATABASES[@]}"; do
            IFS=':' read -r db_name db_user db_pass <<< "${DATABASES[$service]}"
            
            echo -e "   📊 Creating database for $service..."
            
            # Create user and database
            sudo -u postgres psql -c "CREATE USER $db_user WITH PASSWORD '$db_pass';" 2>/dev/null || true
            sudo -u postgres psql -c "CREATE DATABASE $db_name OWNER $db_user;" 2>/dev/null || true
            sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;" 2>/dev/null || true
            sudo -u postgres psql -c "ALTER USER $db_user CREATEDB;" 2>/dev/null || true
            
            echo -e "   ✅ Database $db_name created for $service"
        done
        
        echo -e "${GREEN}✅ All databases created successfully!${NC}"
        ;;
        
    2)
        echo -e "\n${YELLOW}📋 Creating Prisma schemas...${NC}"
        
        for service in "${!DATABASES[@]}"; do
            if [[ -d "$service" ]]; then
                IFS=':' read -r db_name db_user db_pass <<< "${DATABASES[$service]}"
                
                # Create prisma directory
                mkdir -p "$service/prisma"
                
                # Create basic schema.prisma
                cat > "$service/prisma/schema.prisma" << EOF
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/${service//-/_}_client"
}

datasource db {
  provider = "postgresql"
  url      = env("${service^^}_DATABASE_URL")
}

// Add your models here
// Example:
// model User {
//   id        String   @id @default(cuid())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//
//   @@map("users")
// }
EOF
                
                echo -e "   ✅ Prisma schema created for $service"
            fi
        done
        
        echo -e "${GREEN}✅ All Prisma schemas created!${NC}"
        ;;
        
    3)
        echo -e "\n${YELLOW}🔧 Setting up environment variables...${NC}"
        
        # Update .env file with all database URLs
        cat > .env << EOF
# Smart Learning Platform - Environment Variables

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
ORGANIZATION_SERVICE_PORT=3003
SUBSCRIPTION_SERVICE_PORT=3004
CONTENT_SERVICE_PORT=3005
LEARNING_PROGRESS_SERVICE_PORT=3006
ASSESSMENT_SERVICE_PORT=3007
NOTIFICATION_SERVICE_PORT=3008
REPORTING_SERVICE_PORT=3009

# Database URLs
EOF
        
        for service in "${!DATABASES[@]}"; do
            IFS=':' read -r db_name db_user db_pass <<< "${DATABASES[$service]}"
            service_upper=$(echo "$service" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
            echo "${service_upper}_DATABASE_URL=\"postgresql://$db_user:$db_pass@localhost:5432/$db_name\"" >> .env
        done
        
        cat >> .env << EOF

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"

# Security
PASSWORD_RESET_TOKEN_EXPIRES_IN="1h"
EMAIL_VERIFICATION_TOKEN_EXPIRES_IN="24h"
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION="30m"

# Redis
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN="*"

# Email Service
EMAIL_FROM="noreply@smartlearning.com"
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# File Upload
MAX_FILE_SIZE="10mb"
UPLOAD_PATH="./uploads"

# API Rate Limiting
RATE_LIMIT_WINDOW="15m"
RATE_LIMIT_MAX_REQUESTS=100
EOF
        
        echo -e "${GREEN}✅ Environment variables configured!${NC}"
        ;;
        
    4)
        echo -e "\n${YELLOW}🏗️ Generating service templates...${NC}"
        
        for service in "${!SERVICES[@]}"; do
            if [[ -d "$service" && "$service" != "auth-service" && "$service" != "user-service" ]]; then
                port=${SERVICES[$service]}
                
                # Update main.ts with correct port
                cat > "$service/src/main.ts" << EOF
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('${service^} API')
    .setDescription('Smart Learning Platform - ${service^} Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.${service^^}_PORT || ${port};
  await app.listen(port);
  
  Logger.log(\`🚀 ${service^} is running on: http://localhost:\${port}/\${globalPrefix}\`);
  Logger.log(\`📚 API Documentation: http://localhost:\${port}/api/docs\`);
}

bootstrap();
EOF
                
                # Update app.controller.ts with health check
                cat > "$service/src/app/app.controller.ts" << EOF
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }
}
EOF
                
                # Update app.service.ts with health check
                cat > "$service/src/app/app.service.ts" << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '${service}',
      version: '1.0.0',
    };
  }
}
EOF
                
                echo -e "   ✅ Template created for $service"
            fi
        done
        
        echo -e "${GREEN}✅ All service templates generated!${NC}"
        ;;
        
    5)
        echo -e "\n${YELLOW}🌐 Setting up API Gateway...${NC}"
        
        if [[ -d "apps/api-gateway" ]]; then
            # Create API Gateway configuration
            cat > "apps/api-gateway/src/main.ts" << EOF
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Smart Learning Platform API Gateway')
    .setDescription('Central API Gateway for Smart Learning Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  
  Logger.log(\`🚀 API Gateway is running on: http://localhost:\${port}/\${globalPrefix}\`);
  Logger.log(\`📚 API Documentation: http://localhost:\${port}/api/docs\`);
}

bootstrap();
EOF
            
            echo -e "   ✅ API Gateway configured"
        fi
        
        echo -e "${GREEN}✅ API Gateway setup complete!${NC}"
        ;;
        
    6)
        echo -e "\n${YELLOW}🐳 Creating Docker configuration...${NC}"
        
        # Create docker-compose for all services
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - smart-learning-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - smart-learning-network

  # Services
EOF
        
        for service in "${!SERVICES[@]}"; do
            port=${SERVICES[$service]}
            cat >> docker-compose.yml << EOF
  ${service}:
    build:
      context: .
      dockerfile: ${service}/Dockerfile
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    networks:
      - smart-learning-network
    volumes:
      - .:/app
      - /app/node_modules

EOF
        done
        
        cat >> docker-compose.yml << EOF
volumes:
  postgres_data:
  redis_data:

networks:
  smart-learning-network:
    driver: bridge
EOF
        
        echo -e "${GREEN}✅ Docker configuration created!${NC}"
        ;;
        
    7)
        echo -e "\n${YELLOW}🚀 Complete setup starting...${NC}"
        
        # Run all setup steps
        $0 1  # Setup databases
        $0 2  # Create Prisma schemas
        $0 3  # Setup environment variables
        $0 4  # Generate service templates
        $0 5  # Setup API Gateway
        $0 6  # Create Docker configuration
        
        echo -e "\n${GREEN}🎉 Complete setup finished!${NC}"
        echo -e "\n${BLUE}Next steps:${NC}"
        echo -e "1. Review and customize Prisma schemas in each service"
        echo -e "2. Run migrations: ${YELLOW}npx prisma migrate dev${NC} in each service directory"
        echo -e "3. Start services: ${YELLOW}$0 8${NC}"
        ;;
        
    8)
        echo -e "\n${YELLOW}🚀 Starting development environment...${NC}"
        
        # Check if databases are running
        if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            echo -e "${RED}❌ PostgreSQL is not running. Starting with Docker...${NC}"
            docker-compose up -d postgres redis
            sleep 5
        fi
        
        echo -e "\n${BLUE}Available services to start:${NC}"
        echo -e "1. Start all services"
        echo -e "2. Start core services (API Gateway, Auth, User)"
        echo -e "3. Start specific service"
        
        read -p "Choose option (1-3): " start_choice
        
        case $start_choice in
            1)
                echo -e "${YELLOW}Starting all services...${NC}"
                for service in "${!SERVICES[@]}"; do
                    if [[ -d "$service" ]]; then
                        echo -e "Starting $service..."
                        npx nx serve $service &
                    fi
                done
                ;;
            2)
                echo -e "${YELLOW}Starting core services...${NC}"
                npx nx serve api-gateway &
                npx nx serve auth-service &
                npx nx serve user-service &
                ;;
            3)
                echo -e "${BLUE}Available services:${NC}"
                for service in "${!SERVICES[@]}"; do
                    if [[ -d "$service" ]]; then
                        echo -e "   - $service"
                    fi
                done
                read -p "Enter service name: " selected_service
                if [[ -d "$selected_service" ]]; then
                    npx nx serve $selected_service
                else
                    echo -e "${RED}❌ Service not found: $selected_service${NC}"
                fi
                ;;
        esac
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option. Please choose 1-8.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"

