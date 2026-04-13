/**
 * 网关指标收集和监控
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import { GatewayMetrics } from '../types';

interface ResponseMetric {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
}

/**
 * 指标收集器
 */
export class MetricsCollector {
  private metrics: ResponseMetric[] = [];
  private maxMetrics: number = 10000;
  private startTime: number = Date.now();

  /**
   * 记录响应指标
   */
  recordResponse(method: string, path: string, statusCode: number, responseTime: number): void {
    this.metrics.push({
      method,
      path,
      statusCode,
      responseTime,
    });

    // 保持指标大小
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): GatewayMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;

    // 计算过去 60 秒的请求
    const recentMetrics = this.metrics.filter(
      (m) => now - uptime <= 60000
    );

    const totalRequests = this.metrics.length;
    const totalErrors = this.metrics.filter((m) => m.statusCode >= 400).length;
    const totalTimeoutErrors = this.metrics.filter((m) => m.statusCode === 504).length;

    // 计算响应时间统计
    const responseTimes = this.metrics.map((m) => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const requestsPerSecond = recentMetrics.length / 60;

    return {
      totalRequests,
      totalErrors,
      totalTimeoutErrors,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      activeConnections: 0, // TODO: 实现连接追踪
      healthyServices: 0, // TODO: 从健康检查获取
      unhealthyServices: 0, // TODO: 从健康检查获取
    };
  }

  /**
   * 按端点获取指标
   */
  getEndpointMetrics(): Record<string, {
    count: number;
    avgResponseTime: number;
    errorCount: number;
    successCount: number;
  }> {
    const byEndpoint: Record<string, ResponseMetric[]> = {};

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!byEndpoint[key]) {
        byEndpoint[key] = [];
      }
      byEndpoint[key].push(metric);
    }

    const result: Record<string, any> = {};

    for (const [endpoint, metrics] of Object.entries(byEndpoint)) {
      const count = metrics.length;
      const avgResponseTime = metrics.reduce((a, m) => a + m.responseTime, 0) / count;
      const errorCount = metrics.filter((m) => m.statusCode >= 400).length;
      const successCount = count - errorCount;

      result[endpoint] = {
        count,
        avgResponseTime,
        errorCount,
        successCount,
      };
    }

    return result;
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = [];
    this.startTime = Date.now();
  }

  /**
   * 获取原始指标数据
   */
  getRawMetrics(limit: number = 100): ResponseMetric[] {
    return this.metrics.slice(-limit);
  }
}

// 全局指标收集器
export const globalMetricsCollector = new MetricsCollector();

/**
 * 指标收集中间件
 */
export function metricsCollector() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const method = req.method;
    const path = req.path;

    // 拦截响应
    const originalSend = res.send;

    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 记录指标
      globalMetricsCollector.recordResponse(method, path, statusCode, responseTime);

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * 创建指标端点
 */
export function createMetricsEndpoint() {
  return (_req: Request, res: Response): void => {
    const metrics = globalMetricsCollector.getMetrics();
    const endpointMetrics = globalMetricsCollector.getEndpointMetrics();

    res.json({
      code: 200,
      message: 'Gateway metrics',
      data: {
        summary: metrics,
        byEndpoint: endpointMetrics,
        timestamp: Date.now(),
      },
    });
  };
}

/**
 * 创建详细指标端点
 */
export function createDetailedMetricsEndpoint() {
  return (_req: Request, res: Response): void => {
    const rawMetrics = globalMetricsCollector.getRawMetrics(1000);

    res.json({
      code: 200,
      message: 'Gateway detailed metrics',
      data: {
        metrics: rawMetrics,
        count: rawMetrics.length,
        timestamp: Date.now(),
      },
    });
  };
}
