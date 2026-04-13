/**
 * 错误处理和响应格式化中间件
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import { getRequestId } from './logger';

// 自定义错误类
export class GatewayError extends Error {
  constructor(
    public statusCode: number = 500,
    message: string = 'Internal Server Error',
    public errors?: { field: string; message: string }[]
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 常见错误
export class BadRequestError extends GatewayError {
  constructor(message: string = 'Bad Request', errors?: { field: string; message: string }[]) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends GatewayError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends GatewayError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends GatewayError {
  constructor(message: string = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends GatewayError {
  constructor(message: string = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends BadRequestError {
  constructor(errors: { field: string; message: string }[]) {
    super('Validation Error', errors);
  }
}

export class TimeoutError extends GatewayError {
  constructor(message: string = 'Request Timeout') {
    super(504, message);
  }
}

export class ServiceUnavailableError extends GatewayError {
  constructor(message: string = 'Service Unavailable') {
    super(503, message);
  }
}

/**
 * 标准化响应格式
 */
export function formatResponse<T>(data: T, statusCode: number = 200, message: string = 'Success'): {
  code: number;
  message: string;
  data: T;
  timestamp: number;
} {
  return {
    code: statusCode,
    message,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 标准化错误响应
 */
export function formatErrorResponse(error: any, requestId: string): {
  code: number;
  message: string;
  errors?: { field: string; message: string }[];
  timestamp: number;
  requestId: string;
} {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors;

  return {
    code: statusCode,
    message,
    ...(errors && { errors }),
    timestamp: Date.now(),
    requestId,
  };
}

/**
 * 全局错误处理中间件
 */
export function errorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);
    const statusCode = err.statusCode || 500;

    // 确保是 GatewayError 实例
    if (!(err instanceof GatewayError)) {
      err = new GatewayError(statusCode, err.message || 'Internal Server Error');
    }

    // 发送错误响应
    res.status(statusCode).json(formatErrorResponse(err, requestId));
  };
}

/**
 * 404 处理中间件
 */
export function notFoundHandler() {
  return (req: Request, res: Response): void => {
    const requestId = getRequestId(req);
    const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);

    res.status(404).json(formatErrorResponse(error, requestId));
  };
}

/**
 * 异步路由错误捕获包装器
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 验证中间件工厂
 */
export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.body, { abortEarly: false });

      if (error) {
        const errors = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        throw new ValidationError(errors);
      }

      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * CORS 错误处理
 */
export function corsErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (err.status === 403) {
      const requestId = getRequestId(req);
      const error = new ForbiddenError('CORS policy violation');

      res.status(403).json(formatErrorResponse(error, requestId));
      return;
    }

    next(err);
  };
}

/**
 * 请求超时配置
 */
export function timeoutHandler(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      const requestId = getRequestId(req);
      const error = new TimeoutError('Request timeout');

      if (!res.headersSent) {
        res.status(504).json(formatErrorResponse(error, requestId));
      }

      // 销毁连接
      req.socket.destroy();
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
}

/**
 * 响应拦截中间件
 */
export function responseInterceptor() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);

    // 包装 res.json
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // 如果已包含标准格式，直接返回
      if (data.code && data.message !== undefined && data.timestamp) {
        data.requestId = requestId;
        return originalJson(data);
      }

      // 否则格式化响应
      const statusCode = res.statusCode || 200;
      const response = formatResponse(data, statusCode);
      (response as any).requestId = requestId;

      return originalJson(response);
    };

    next();
  };
}
