/**
 * 认证中间件
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JWTPayload } from '../types';

// 扩展 Express Request 对象
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
      schoolId?: string;
    }
  }
}

/**
 * JWT 认证中间件
 * 从请求头中提取并验证 JWT 令牌
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        code: 401,
        message: 'Missing authorization header',
      });
      return;
    }

    // 提取 Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        code: 401,
        message: 'Invalid authorization header format',
      });
      return;
    }

    const token = parts[1];

    // 验证令牌
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        code: 401,
        message: 'Invalid or expired token',
      });
      return;
    }

    // 将用户信息保存到 request 对象
    req.user = payload;
    req.token = token;
    req.schoolId = payload.schoolId;

    next();
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Authentication error',
    });
  }
}

/**
 * API 密钥认证中间件
 * 用于服务之间的通信
 */
export function authenticateAPIKey(req: Request, res: Response, next: NextFunction): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        code: 401,
        message: 'Missing API key',
      });
      return;
    }

    // 验证 API 密钥（从环境变量或数据库）
    const validApiKey = process.env.API_KEY;

    if (apiKey !== validApiKey) {
      res.status(401).json({
        code: 401,
        message: 'Invalid API key',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'API key authentication error',
    });
  }
}

/**
 * 多租户隔离中间件
 * 确保用户只能访问自己学校的数据
 */
export function validateTenant(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user || !req.user.schoolId) {
      res.status(401).json({
        code: 401,
        message: 'Invalid user context',
      });
      return;
    }

    // 检查请求中的 schoolId 是否与令牌中的 schoolId 匹配
    const requestSchoolId = req.query.schoolId || req.body.schoolId || req.params.schoolId;

    if (requestSchoolId && requestSchoolId !== req.user.schoolId) {
      res.status(403).json({
        code: 403,
        message: 'Access denied: school ID mismatch',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Tenant validation error',
    });
  }
}

/**
 * 可选的 JWT 认证中间件
 * 如果有令牌则验证，没有则继续但不保存用户信息
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const payload = verifyToken(token);

        if (payload) {
          req.user = payload;
          req.token = token;
          req.schoolId = payload.schoolId;
        }
      }
    }

    next();
  } catch (error) {
    // 继续处理，即使认证失败
    next();
  }
}
