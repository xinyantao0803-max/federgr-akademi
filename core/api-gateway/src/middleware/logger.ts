/**
 * 日志中间件和日志系统
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import { RequestContext, GatewayLog } from '../types';

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// 日志存储
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * 日志记录器
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private level: LogLevel = LogLevel.INFO;
  private onLog?: (log: LogEntry) => void;

  constructor(level: LogLevel = LogLevel.INFO, onLog?: (log: LogEntry) => void) {
    this.level = level;
    this.onLog = onLog;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // 保持日志大小
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台
    this.console(level, message, data);

    // 触发回调
    if (this.onLog) {
      this.onLog(entry);
    }
  }

  private console(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, data);
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// 全局日志实例
export const globalLogger = new Logger(LogLevel.INFO);

/**
 * 请求日志中间件
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = (req as any).id || generateRequestId();
    const method = req.method;
    const path = req.path;
    const ipAddress = req.ip || 'unknown';

    // 添加请求上下文
    (req as any).requestId = requestId;
    (req as any).context = {
      requestId,
      timestamp: startTime,
      method,
      path,
      ipAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
    } as RequestContext;

    // 记录请求开始
    globalLogger.info(`→ ${method} ${path}`, {
      requestId,
      ipAddress,
      userAgent: req.headers['user-agent'],
    });

    // 拦截响应
    const originalSend = res.send;

    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 记录响应
      globalLogger.info(`← ${method} ${path} ${statusCode}`, {
        requestId,
        responseTime: `${responseTime}ms`,
        statusCode,
      });

      // 设置响应头
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * 错误日志中间件
 */
export function errorLogger() {
  return (err: any, req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req as any).requestId || generateRequestId();
    const method = req.method;
    const path = req.path;

    globalLogger.error(`✗ ${method} ${path} - Error`, {
      requestId,
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
    });

    // 确保响应已发送
    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({
        code: err.statusCode || 500,
        message: err.message || 'Internal Server Error',
        requestId,
        timestamp: Date.now(),
      });
    }
  };
}

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取请求 ID
 */
export function getRequestId(req: Request): string {
  return (req as any).requestId || generateRequestId();
}

/**
 * 获取请求上下文
 */
export function getRequestContext(req: Request): RequestContext {
  return (req as any).context || {
    requestId: generateRequestId(),
    timestamp: Date.now(),
    method: req.method,
    path: req.path,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] as string,
  };
}

/**
 * 性能监控中间件
 */
export function performanceMonitor() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒

      const requestId = (req as any).requestId;

      // 记录慢查询
      if (duration > 1000) {
        globalLogger.warn(`⚠ 慢请求 ${req.method} ${req.path}`, {
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  };
}
