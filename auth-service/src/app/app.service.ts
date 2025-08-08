import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
    };
  }

  getInfo() {
    return {
      name: 'Smart Learning Platform - Auth Service',
      description: 'Authentication and Authorization API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/docs',
        auth: '/api/v1/auth',
      },
    };
  }
}

