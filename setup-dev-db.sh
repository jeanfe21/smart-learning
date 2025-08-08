#!/bin/bash

# Setup Development Databases for Smart Learning Platform
# This script sets up PostgreSQL databases for development without Docker

echo "🚀 Setting up development databases for Smart Learning Platform..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed. Installing..."
    sudo apt update
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
fi

echo "✅ PostgreSQL and Redis are available"

# Create databases and users
echo "📊 Creating databases and users..."

# Auth Service Database
sudo -u postgres psql -c "CREATE USER auth_user WITH PASSWORD 'auth_password';" 2>/dev/null || echo "User auth_user already exists"
sudo -u postgres psql -c "CREATE DATABASE auth_service_db OWNER auth_user;" 2>/dev/null || echo "Database auth_service_db already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO auth_user;"

# User Service Database
sudo -u postgres psql -c "CREATE USER user_service WITH PASSWORD 'user_password';" 2>/dev/null || echo "User user_service already exists"
sudo -u postgres psql -c "CREATE DATABASE user_service_db OWNER user_service;" 2>/dev/null || echo "Database user_service_db already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE user_service_db TO user_service;"

echo "✅ Databases created successfully"

# Test connections
echo "🔍 Testing database connections..."

# Test Auth DB
PGPASSWORD=auth_password psql -h localhost -U auth_user -d auth_service_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Auth Service database connection successful"
else
    echo "❌ Auth Service database connection failed"
fi

# Test User DB
PGPASSWORD=user_password psql -h localhost -U user_service -d user_service_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ User Service database connection successful"
else
    echo "❌ User Service database connection failed"
fi

# Test Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis connection successful"
else
    echo "❌ Redis connection failed"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Database Information:"
echo "📊 Auth Service DB: postgresql://auth_user:auth_password@localhost:5432/auth_service_db"
echo "📊 User Service DB: postgresql://user_service:user_password@localhost:5432/user_service_db"
echo "🔴 Redis: redis://localhost:6379"
echo ""
echo "Next steps:"
echo "1. Run migrations: cd auth-service && npx prisma migrate dev"
echo "2. Run migrations: cd user-service && npx prisma migrate dev"
echo "3. Start services: npm run start:auth and npm run start:user"

