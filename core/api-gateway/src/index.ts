/**
 * FederGR API 网关主应用
 * 作者: GitHub Copilot
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GatewayConfig, RouteRule } from './types';
import { requestLogger, errorLogger, performanceMonitor, globalLogger, LogLevel } from './middleware/logger';
import { errorHandler, notFoundHandler, timeoutHandler, responseInterceptor } from './middleware/error-handler';
import { rateLimit, ipRateLimit } from './middleware/rate-limit';
import { metricsCollector, createMetricsEndpoint, createDetailedMetricsEndpoint } from './utils/metrics';
import { RouterForwarder, createRouterMiddleware } from './routing/forwarder';
import { HealthCheckManager, createHealthCheckEndpoint } from './utils/health-check';

/**
 * API 网关
 */
export class APIGateway {
  private app: express.Application;
  private config: GatewayConfig;
  private forwarder: RouterForwarder;
  private healthCheckManagers: Map<string, HealthCheckManager> = new Map();
  private server?: any;

  constructor(config: GatewayConfig) {
    this.app = express();
    this.config = config;
    this.forwarder = new RouterForwarder();

    // 设置日志级别
    if (config.logLevel) {
      globalLogger['level'] = config.logLevel as LogLevel;
    }

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全头
    this.app.use(helmet());

    // CORS
    if (this.config.cors) {
      this.app.use(cors({
        origin: this.config.cors.origin,
        credentials: this.config.cors.credentials,
        methods: this.config.cors.methods,
      }));
    }

    // 请求超时
    if (this.config.timeout) {
      this.app.use(timeoutHandler(this.config.timeout));
    }

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // 请求日志
    this.app.use(requestLogger());

    // 性能监控
    this.app.use(performanceMonitor());

    // 指标收集
    this.app.use(metricsCollector());

    // 全局速率限制
    if (this.config.rateLimit) {
      this.app.use(ipRateLimit({
        windowMs: this.config.rateLimit.windowMs,
        maxRequests: this.config.rateLimit.maxRequests,
      }));
    }

    // 响应拦截
    this.app.use(responseInterceptor());

    // 路由转发
    this.app.use(createRouterMiddleware(this.forwarder));

    // 错误处理
    this.app.use(errorHandler());
    this.app.use(errorLogger());
    this.app.use(notFoundHandler());
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/gateway/health', (_req: Request, res: Response) => {
      res.json({
        code: 200,
        message: 'API Gateway is running',
        timestamp: Date.now(),
      });
    });

    // 指标
    this.app.get('/gateway/metrics', createMetricsEndpoint());
    this.app.get('/gateway/metrics/detailed', createDetailedMetricsEndpoint());

    // 健康检查报告
    this.app.get('/gateway/health-check', createHealthCheckEndpoint(this.healthCheckManagers));

    // 网关信息
    this.app.get('/gateway/info', (_req: Request, res: Response) => {
      res.json({
        code: 200,
        message: 'Gateway information',
        data: {
          name: 'FederGR API Gateway',
          version: '1.0.0',
          environment: this.config.environment,
          port: this.config.port,
          uptime: process.uptime(),
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * 注册路由规则
   */
  public registerRoute(rule: RouteRule): void {
    this.forwarder.addRoute(rule);
    globalLogger.info(`Route registered: ${rule.methods || ['*']} ${rule.path}`, {
      target: rule.target.name,
    });
  }

  /**
   * 注册多个路由
   */
  public registerRoutes(rules: RouteRule[]): void {
    rules.forEach((rule) => this.registerRoute(rule));
  }

  /**
   * 启动网关
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        globalLogger.info(`API Gateway started`, {
          host: this.config.host,
          port: this.config.port,
          environment: this.config.environment,
        });
        resolve();
      });

      this.server.on('error', (err: any) => {
        globalLogger.error('Server error', {
          error: err.message,
        });
      });
    });
  }

  /**
   * 停止网关
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          globalLogger.info('API Gateway stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取 Express 应用
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * 添加自定义中间件
   */
  public use(middleware: any): void {
    this.app.use(middleware);
  }

  /**
   * 添加自定义路由
   */
  public addRoute(path: string, handler: any): void {
    this.app.get(path, handler);
  }
}

// 导出
export default APIGateway;
