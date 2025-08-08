import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: '1.0.0',
    };
  }

  getInfo() {
    return {
      name: 'Smart Learning Platform - User Service',
      description: 'User Management and Profile API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/docs',
        users: '/api/v1/users',
      },
    };
  }
}

