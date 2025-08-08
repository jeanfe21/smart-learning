#!/bin/bash

echo "🧪 Testing Smart Learning Platform Services"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Auth Service
echo -e "\n${YELLOW}Testing Auth Service...${NC}"

# Health check
echo "1. Health Check:"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/v1/health)
if [[ $? -eq 0 && $HEALTH_RESPONSE == *"ok"* ]]; then
    echo -e "   ${GREEN}✅ Auth Service is healthy${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "   ${RED}❌ Auth Service health check failed${NC}"
    exit 1
fi

# Test registration
echo -e "\n2. User Registration:"
REG_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}')

if [[ $REG_RESPONSE == *"success"* ]]; then
    echo -e "   ${GREEN}✅ User registration successful${NC}"
    echo "   Response: $REG_RESPONSE"
else
    echo -e "   ${RED}❌ User registration failed${NC}"
    echo "   Response: $REG_RESPONSE"
fi

# Test login (should fail because email not verified)
echo -e "\n3. User Login (should fail - email not verified):"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}')

if [[ $LOGIN_RESPONSE == *"verify your email"* ]]; then
    echo -e "   ${GREEN}✅ Login correctly rejected (email not verified)${NC}"
    echo "   Response: $LOGIN_RESPONSE"
else
    echo -e "   ${YELLOW}⚠️ Unexpected login response${NC}"
    echo "   Response: $LOGIN_RESPONSE"
fi

# Test User Service (if running)
echo -e "\n${YELLOW}Testing User Service...${NC}"

USER_HEALTH=$(curl -s http://localhost:3002/api/v1/health 2>/dev/null)
if [[ $? -eq 0 && $USER_HEALTH == *"ok"* ]]; then
    echo -e "   ${GREEN}✅ User Service is healthy${NC}"
    echo "   Response: $USER_HEALTH"
else
    echo -e "   ${RED}❌ User Service not responding${NC}"
    echo "   Note: User Service might not be running on port 3002"
fi

# Test database connections
echo -e "\n${YELLOW}Testing Database Connections...${NC}"

# Test Auth DB
PGPASSWORD=auth_password psql -h localhost -U auth_user -d auth_service_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Auth Service database connection successful${NC}"
else
    echo -e "   ${RED}❌ Auth Service database connection failed${NC}"
fi

# Test User DB
PGPASSWORD=user_password psql -h localhost -U user_service -d user_service_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ User Service database connection successful${NC}"
else
    echo -e "   ${RED}❌ User Service database connection failed${NC}"
fi

# Test Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Redis connection successful${NC}"
else
    echo -e "   ${RED}❌ Redis connection failed${NC}"
fi

echo -e "\n${YELLOW}API Documentation:${NC}"
echo "📚 Auth Service: http://localhost:3001/api/docs"
echo "📚 User Service: http://localhost:3002/api/docs"

echo -e "\n${GREEN}🎉 Testing completed!${NC}"

