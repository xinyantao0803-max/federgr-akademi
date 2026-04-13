/**
 * 速率限制中间件
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * 内存中的速率限制存储
 */
class MemoryRateLimitStore {
  private store: RateLimitStore = {};

  get(key: string): number {
    const entry = this.store[key];
    if (!entry) return 0;

    if (Date.now() > entry.resetTime) {
      delete this.store[key];
      return 0;
    }

    return entry.count;
  }

  set(key: string, count: number, windowMs: number): void {
    this.store[key] = {
      count,
      resetTime: Date.now() + windowMs,
    };
  }

  increment(key: string, windowMs: number): number {
    const current = this.get(key);
    const newCount = current + 1;

    this.set(key, newCount, windowMs);

    return newCount;
  }

  reset(key: string): void {
    delete this.store[key];
  }

  // 定期清理过期条目
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => delete this.store[key]);
  }
}

const defaultStore = new MemoryRateLimitStore();

// 定期清理
setInterval(() => {
  defaultStore.cleanup();
}, 60000); // 每分钟清理一次

/**
 * 创建速率限制中间件
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyGenerator = (req) => req.ip || 'unknown',
    skip = () => false,
    message = 'Too many requests, please try again later',
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 检查是否跳过
      if (skip(req)) {
        next();
        return;
      }

      const key = keyGenerator(req);
      const count = defaultStore.increment(key, windowMs);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString());
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

      if (count > maxRequests) {
        res.status(429).json({
          code: 429,
          message,
          timestamp: Date.now(),
        });
        return;
      }

      next();
    } catch (error) {
      next();
    }
  };
}

/**
 * 基于用户的速率限制
 */
export function userRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'> = {}) {
  return rateLimit({
    ...config,
    keyGenerator: (req) => (req as any).user?.userId || req.ip || 'unknown',
  });
}

/**
 * 基于 IP 的速率限制
 */
export function ipRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'> = {}) {
  return rateLimit({
    ...config,
    keyGenerator: (req) => req.ip || 'unknown',
  });
}

/**
 * 基于 API 密钥的速率限制
 */
export function apiKeyRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'> = {}) {
  return rateLimit({
    ...config,
    keyGenerator: (req) => req.headers['x-api-key'] as string || req.ip || 'unknown',
  });
}

/**
 * 特殊端点的速率限制（如登录）
 */
export function strictRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'> = {}) {
  return rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // 15 分钟
    maxRequests: config.maxRequests || 5, // 最多 5 次尝试
    keyGenerator: (req) => req.ip || 'unknown',
    ...config,
  });
}
