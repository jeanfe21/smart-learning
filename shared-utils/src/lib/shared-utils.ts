import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// HTTP Client utility
export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ HTTP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ HTTP Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

// Service Discovery utility
export class ServiceRegistry {
  private services: Map<string, string> = new Map();

  register(serviceName: string, serviceUrl: string): void {
    this.services.set(serviceName, serviceUrl);
    console.log(`📋 Registered service: ${serviceName} -> ${serviceUrl}`);
  }

  getServiceUrl(serviceName: string): string {
    const url = this.services.get(serviceName);
    if (!url) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    return url;
  }

  getAllServices(): Record<string, string> {
    return Object.fromEntries(this.services);
  }

  createHttpClient(serviceName: string, defaultHeaders?: Record<string, string>): HttpClient {
    const serviceUrl = this.getServiceUrl(serviceName);
    return new HttpClient(serviceUrl, defaultHeaders);
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Formatting utilities
export function formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'iso':
      return date.toISOString();
    default:
      return date.toString();
  }
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Pagination utilities
export interface PaginationOptions {
  page: number;
  per_page: number;
  total: number;
}

export interface PaginationResult {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_page?: number;
  prev_page?: number;
}

export function calculatePagination(options: PaginationOptions): PaginationResult {
  const { page, per_page, total } = options;
  const total_pages = Math.ceil(total / per_page);
  const has_next = page < total_pages;
  const has_prev = page > 1;

  return {
    page,
    per_page,
    total,
    total_pages,
    has_next,
    has_prev,
    next_page: has_next ? page + 1 : undefined,
    prev_page: has_prev ? page - 1 : undefined,
  };
}

// Error handling utilities
export class ServiceError extends Error {
  constructor(
    public service: string,
    public operation: string,
    public statusCode: number,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  toJSON() {
    return {
      name: this.name,
      service: this.service,
      operation: this.operation,
      statusCode: this.statusCode,
      message: this.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export function handleServiceError(error: any, service: string, operation: string): ServiceError {
  if (error.response) {
    // HTTP error response
    return new ServiceError(
      service,
      operation,
      error.response.status,
      error.response.data?.message || error.message,
      error
    );
  } else if (error.request) {
    // Network error
    return new ServiceError(
      service,
      operation,
      0,
      'Network error: Unable to reach service',
      error
    );
  } else {
    // Other error
    return new ServiceError(
      service,
      operation,
      500,
      error.message || 'Unknown error',
      error
    );
  }
}

// Retry utility
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delay, backoff = 'linear' } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }

      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;

      console.log(`⏳ Retry attempt ${attempt}/${maxAttempts} failed, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// Environment utilities
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  
  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  
  return numValue;
}

export function getEnvVarAsBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  
  return value.toLowerCase() === 'true';
}

// Logging utility
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  constructor(
    private service: string,
    private level: LogLevel = LogLevel.INFO
  ) {}

  error(message: string, meta?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`❌ [${this.service}] ERROR: ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`⚠️ [${this.service}] WARN: ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`ℹ️ [${this.service}] INFO: ${message}`, meta || '');
    }
  }

  debug(message: string, meta?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`🐛 [${this.service}] DEBUG: ${message}`, meta || '');
    }
  }
}

// Create default instances
export const serviceRegistry = new ServiceRegistry();
export const logger = new Logger('shared-utils');

