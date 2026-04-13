/**
 * FederGR Akademi - 认证模块类型定义
 * 作者: GitHub Copilot
 * 创建日期: 2026-04-13
 */

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  VISITOR = 'visitor',
}

// 认证方式
export enum AuthMethod {
  PASSWORD = 'password',
  OAUTH2 = 'oauth2',
  LDAP = 'ldap',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
}

// JWT 令牌类型
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

// 用户实体接口
export interface IUser {
  id: string;
  schoolId: string; // 租户ID
  username: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// JWT 令牌负载
export interface JWTPayload {
  userId: string;
  schoolId: string;
  username: string;
  email?: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: TokenType;
}

// 认证请求
export interface AuthRequest {
  username: string;
  password: string;
  schoolId?: string;
  method?: AuthMethod;
}

// 认证响应
export interface AuthResponse {
  code: number;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: Partial<IUser>;
    expiresIn: number;
  };
}

// 权限检查结果
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// 角色权限映射
export type RolePermissions = {
  [key in UserRole]: string[];
}

// API 响应标准格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
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
}

// 2FA 配置
export interface TwoFactorConfig {
  enabled: boolean;
  method: 'email' | 'sms' | 'authenticator';
  secret?: string;
  verified: boolean;
}

// 会话信息
export interface SessionInfo {
  userId: string;
  schoolId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  isValid: boolean;
}
