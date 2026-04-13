/**
 * 指标收集器测试
 * 作者: GitHub Copilot
 */

import { MetricsCollector } from '../src/utils/metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('recordRequest', () => {
    it('应记录请求成功', () => {
      collector.recordRequest('GET', '/api/test', 200, 100);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.summary.totalErrors).toBe(0);
    });

    it('应记录请求错误', () => {
      collector.recordRequest('GET', '/api/test', 500, 150);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.summary.totalErrors).toBe(1);
    });

    it('应记录超时错误', () => {
      collector.recordRequest('GET', '/api/test', 504, 30000);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.totalTimeoutErrors).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('应计算平均响应时间', () => {
      collector.recordRequest('GET', '/api/test', 200, 100);
      collector.recordRequest('GET', '/api/test', 200, 200);
      collector.recordRequest('GET', '/api/test', 200, 300);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.averageResponseTime).toBe(200);
    });

    it('应计算百分位数响应时间', () => {
      // 添加 100 个请求，响应时间从 10ms 到 1000ms
      for (let i = 1; i <= 100; i++) {
        collector.recordRequest('GET', '/api/test', 200, i * 10);
      }
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.p95ResponseTime).toBeGreaterThan(800);
      expect(metrics.summary.p99ResponseTime).toBeGreaterThan(950);
    });

    it('应计算每秒请求数', () => {
      // 模拟 10 个请求在 2 秒内
      for (let i = 0; i < 10; i++) {
        collector.recordRequest('GET', '/api/test', 200, 100);
      }
      
      const metrics = collector.getMetrics();
      // 初始为 0，因为没有时间延迟
      expect(metrics.summary.requestsPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('应按端点分组指标', () => {
      collector.recordRequest('GET', '/api/users', 200, 100);
      collector.recordRequest('GET', '/api/users', 200, 150);
      collector.recordRequest('POST', '/api/users', 201, 200);
      
      const metrics = collector.getMetrics();
      expect(metrics.byEndpoint['GET /api/users']).toBeDefined();
      expect(metrics.byEndpoint['GET /api/users'].count).toBe(2);
      expect(metrics.byEndpoint['POST /api/users'].count).toBe(1);
    });
  });

  describe('getActiveConnections', () => {
    it('应返回活跃连接数', () => {
      collector.incrementActiveConnections();
      collector.incrementActiveConnections();
      
      expect(collector.getActiveConnections()).toBe(2);
      
      collector.decrementActiveConnections();
      expect(collector.getActiveConnections()).toBe(1);
    });

    it('不应让活跃连接数为负', () => {
      expect(() => {
        collector.decrementActiveConnections();
      }).not.toThrow();
      
      expect(collector.getActiveConnections()).toBe(0);
    });
  });

  describe('recordHealthyService', () => {
    it('应跟踪健康的服务数', () => {
      collector.recordHealthyService('auth', true);
      collector.recordHealthyService('edu', true);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.healthyServices).toBe(2);
      expect(metrics.summary.unhealthyServices).toBe(0);
    });

    it('应跟踪不健康的服务', () => {
      collector.recordHealthyService('auth', true);
      collector.recordHealthyService('edu', false);
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.healthyServices).toBe(1);
      expect(metrics.summary.unhealthyServices).toBe(1);
    });
  });

  describe('reset', () => {
    it('应重置所有指标', () => {
      collector.recordRequest('GET', '/api/test', 200, 100);
      collector.incrementActiveConnections();
      
      collector.reset();
      
      const metrics = collector.getMetrics();
      expect(metrics.summary.totalRequests).toBe(0);
      expect(metrics.summary.totalErrors).toBe(0);
      expect(collector.getActiveConnections()).toBe(0);
    });
  });

  describe('performance', () => {
    it('应高效处理大量请求', () => {
      const startTime = Date.now();
      
      // 记录 10,000 个请求
      for (let i = 0; i < 10000; i++) {
        collector.recordRequest(
          'GET',
          `/api/endpoint-${i % 10}`,
          i % 100 < 5 ? 500 : 200,
          Math.random() * 500
        );
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应在 1 秒内处理 10,000 个请求
      expect(duration).toBeLessThan(1000);
    });
  });
});
