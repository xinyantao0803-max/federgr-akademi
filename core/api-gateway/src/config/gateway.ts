/**
 * API 网关默认配置
 * 作者: GitHub Copilot
 */

import { GatewayConfig, RouteRule } from '../types';

/**
 * 默认网关配置
 */
export const defaultGatewayConfig: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || '8000', 10),
  host: process.env.GATEWAY_HOST || '0.0.0.0',
  environment: (process.env.NODE_ENV || 'development') as any,
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  },
  timeout: parseInt(process.env.GATEWAY_TIMEOUT || '30000', 10),
  logLevel: (process.env.LOG_LEVEL || 'info') as any,
};

/**
 * 示例路由配置
 */
export const defaultRoutes: RouteRule[] = [
  // 认证模块
  {
    path: '/api/auth',
    pattern: /^\/api\/auth\/.*/,
    methods: ['POST', 'GET'],
    target: {
      name: 'auth',
      protocol: 'http',
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: false,
    description: 'Authentication service',
  },

  // 教务模块
  {
    path: '/api/edu',
    pattern: /^\/api\/edu\/.*/,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    target: {
      name: 'edu',
      protocol: 'http',
      host: process.env.EDU_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.EDU_SERVICE_PORT || '3002', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: true,
    description: 'Education management service',
  },

  // 门禁模块
  {
    path: '/api/access-control',
    pattern: /^\/api\/access-control\/.*/,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    target: {
      name: 'access-control',
      protocol: 'http',
      host: process.env.ACCESS_CONTROL_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.ACCESS_CONTROL_SERVICE_PORT || '3003', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: true,
    description: 'Access control service',
  },

  // 支付模块
  {
    path: '/api/payment',
    pattern: /^\/api\/payment\/.*/,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    target: {
      name: 'payment',
      protocol: 'http',
      host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3004', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: true,
    description: 'Payment service',
  },

  // 物联网模块
  {
    path: '/api/iot',
    pattern: /^\/api\/iot\/.*/,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    target: {
      name: 'iot',
      protocol: 'http',
      host: process.env.IOT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.IOT_SERVICE_PORT || '3005', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: true,
    description: 'IoT service',
  },

  // 广播模块
  {
    path: '/api/broadcast',
    pattern: /^\/api\/broadcast\/.*/,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    target: {
      name: 'broadcast',
      protocol: 'http',
      host: process.env.BROADCAST_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.BROADCAST_SERVICE_PORT || '3006', 10),
      basePath: '',
      timeout: 10000,
    },
    requireAuth: true,
    description: 'Broadcast service',
  },
];

/**
 * 获取环境特定的配置
 */
export function getEnvironmentConfig(): GatewayConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const configs: Record<string, Partial<GatewayConfig>> = {
    development: {
      logLevel: 'debug',
      timeout: 30000,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 10000, // 开发环境更宽松
      },
    },
    staging: {
      logLevel: 'info',
      timeout: 30000,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 5000,
      },
    },
    production: {
      logLevel: 'warn',
      timeout: 20000,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 1000,
      },
    },
  };

  return {
    ...defaultGatewayConfig,
    ...(configs[nodeEnv] || {}),
  } as GatewayConfig;
}
