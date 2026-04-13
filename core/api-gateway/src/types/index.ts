/**
 * API 网关类型定义
 * 作者: GitHub Copilot
 */

// 路由目标配置
export interface RouteTarget {
  name: string;
  protocol: 'http' | 'https';
  host: string;
  port: number;
  basePath?: string;
  timeout?: number;
  retries?: number;
}

// 路由规则配置
export interface RouteRule {
  path: string;
  pattern?: RegExp;
  methods?: string[];
  target: RouteTarget;
  middlewares?: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  description?: string;
}

// 网关配置
export interface GatewayConfig {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  cors?: {
    origin: string[];
    credentials: boolean;
    methods: string[];
  };
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// 请求上下文
export interface RequestContext {
  requestId: string;
  timestamp: number;
  method: string;
  path: string;
  schoolId?: string;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
  requestId: string;
}

// 错误响应
export interface ErrorResponse {
  code: number;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
  timestamp: number;
  requestId: string;
}

// 速率限制存储
export interface RateLimitStore {
  get(key: string): Promise<number>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

// 负载均衡策略
export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';

// 健康检查配置
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  path?: string;
}

// 服务实例
export interface ServiceInstance {
  id: string;
  name: string;
  url: string;
  weight?: number;
  isHealthy: boolean;
  lastHealthCheck?: number;
  failureCount: number;
  connections?: number;
}

// 日志记录
export interface GatewayLog {
  timestamp: number;
  requestId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  method: string;
  path: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// 可观测性指标
export interface GatewayMetrics {
  totalRequests: number;
  totalErrors: number;
  totalTimeoutErrors: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  activeConnections: number;
  healthyServices: number;
  unhealthyServices: number;
}
