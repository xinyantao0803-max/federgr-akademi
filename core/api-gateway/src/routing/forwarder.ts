/**
 * 请求路由和转发
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { RouteRule, RouteTarget, LoadBalancingStrategy, ServiceInstance } from '../types';
import { TimeoutError, ServiceUnavailableError, GatewayError } from './error-handler';
import { globalLogger } from './logger';
import { getRequestId } from './logger';

/**
 * 负载均衡器
 */
export class LoadBalancer {
  private instances: ServiceInstance[] = [];
  private strategy: LoadBalancingStrategy;
  private currentIndex: number = 0;

  constructor(instances: ServiceInstance[], strategy: LoadBalancingStrategy = 'round-robin') {
    this.instances = instances;
    this.strategy = strategy;
  }

  /**
   * 轮询
   */
  private roundRobin(): ServiceInstance | null {
    if (this.instances.length === 0) return null;

    for (let i = 0; i < this.instances.length; i++) {
      const index = (this.currentIndex + i) % this.instances.length;
      const instance = this.instances[index];

      if (instance.isHealthy) {
        this.currentIndex = (index + 1) % this.instances.length;
        return instance;
      }
    }

    return null;
  }

  /**
   * 最小连接数
   */
  private leastConnections(): ServiceInstance | null {
    // 简化版本：假设所有健康实例连接数相同
    const healthy = this.instances.filter((i) => i.isHealthy);

    if (healthy.length === 0) return null;

    return healthy[Math.floor(Math.random() * healthy.length)];
  }

  /**
   * 权重轮询
   */
  private weighted(): ServiceInstance | null {
    const healthy = this.instances.filter((i) => i.isHealthy);

    if (healthy.length === 0) return null;

    const totalWeight = healthy.reduce((sum, i) => sum + (i.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const instance of healthy) {
      const weight = instance.weight || 1;
      if (random < weight) {
        return instance;
      }
      random -= weight;
    }

    return healthy[healthy.length - 1];
  }

  /**
   * IP Hash
   */
  private ipHash(clientIp: string): ServiceInstance | null {
    const healthy = this.instances.filter((i) => i.isHealthy);

    if (healthy.length === 0) return null;

    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash = (hash << 5) - hash + clientIp.charCodeAt(i);
      hash = hash & hash; // 转换为 32 位整数
    }

    const index = Math.abs(hash) % healthy.length;
    return healthy[index];
  }

  /**
   * 获取下一个实例
   */
  selectInstance(clientIp?: string): ServiceInstance | null {
    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobin();
      case 'least-connections':
        return this.leastConnections();
      case 'weighted':
        return this.weighted();
      case 'ip-hash':
        return this.ipHash(clientIp || '127.0.0.1');
      default:
        return this.roundRobin();
    }
  }

  /**
   * 标记实例为不健康
   */
  markUnhealthy(instanceId: string): void {
    const instance = this.instances.find((i) => i.id === instanceId);
    if (instance) {
      instance.failureCount++;
      if (instance.failureCount >= 3) {
        instance.isHealthy = false;
        globalLogger.warn(`Instance ${instanceId} marked unhealthy after ${instance.failureCount} failures`);
      }
    }
  }

  /**
   * 标记实例为健康
   */
  markHealthy(instanceId: string): void {
    const instance = this.instances.find((i) => i.id === instanceId);
    if (instance) {
      instance.isHealthy = true;
      instance.failureCount = 0;
    }
  }
}

/**
 * 路由转发器
 */
export class RouterForwarder {
  private rules: RouteRule[] = [];
  private loadBalancers: Map<string, LoadBalancer> = new Map();

  addRoute(rule: RouteRule): void {
    this.rules.push(rule);

    // 创建负载均衡器（单实例）
    const instances: ServiceInstance[] = [
      {
        id: `${rule.target.name}-0`,
        name: rule.target.name,
        url: `${rule.target.protocol}://${rule.target.host}:${rule.target.port}`,
        isHealthy: true,
        failureCount: 0,
      },
    ];

    const key = `${rule.target.name}`;
    if (!this.loadBalancers.has(key)) {
      this.loadBalancers.set(key, new LoadBalancer(instances));
    }
  }

  /**
   * 匹配路由规则
   */
  matchRoute(method: string, path: string): RouteRule | null {
    for (const rule of this.rules) {
      // 检查方法
      if (rule.methods && !rule.methods.includes(method)) {
        continue;
      }

      // 检查路径
      if (rule.pattern && rule.pattern.test(path)) {
        return rule;
      } else if (rule.path === path || path.startsWith(rule.path)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * 转发请求
   */
  async forwardRequest(req: Request, res: Response, targetUrl: string): Promise<void> {
    const requestId = getRequestId(req);
    const method = req.method;
    const path = req.path;

    try {
      // 获取完整的目标 URL
      const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query as any).toString()}` : '';

      const url = `${targetUrl}${path}${queryString}`;

      globalLogger.debug(`Forwarding request: ${method} ${path} -> ${url}`, { requestId });

      // 转发请求头（移除 hop-by-hop 头）
      const forwardedHeaders = {
        ...req.headers,
        'x-forwarded-for': req.ip || 'unknown',
        'x-forwarded-proto': req.protocol,
        'x-forwarded-host': req.hostname,
        'x-request-id': requestId,
      };

      // 移除不能转发的头
      delete (forwardedHeaders as any)['host'];
      delete (forwardedHeaders as any)['connection'];
      delete (forwardedHeaders as any)['keep-alive'];
      delete (forwardedHeaders as any)['transfer-encoding'];

      const response = await axios({
        method: method as any,
        url,
        data: req.body,
        headers: forwardedHeaders,
        timeout: 30000,
        validateStatus: () => true, // 接受所有状态码
      });

      // 转发响应头
      Object.entries(response.headers).forEach(([key, value]) => {
        if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, value as any);
        }
      });

      // 设置响应状态码
      res.status(response.status);

      // 发送响应
      res.send(response.data);
    } catch (error) {
      const err = error as AxiosError;

      globalLogger.error(`Failed to forward request: ${method} ${path}`, {
        requestId,
        error: err.message,
        code: err.code,
      });

      if (err.code === 'ECONNABORTED' || err.message === 'timeout of 30000ms exceeded') {
        throw new TimeoutError('Backend service timeout');
      }

      if (err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH') {
        throw new ServiceUnavailableError('Backend service unavailable');
      }

      throw new GatewayError(502, 'Bad Gateway: ' + err.message);
    }
  }

  /**
   * 处理请求的中间件
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const method = req.method;
      const path = req.path;

      // 匹配路由
      const route = this.matchRoute(method, path);

      if (!route) {
        // 没有匹配的路由，继续到下一个中间件
        next();
        return;
      }

      try {
        // 获取负载均衡器
        const balancerKey = `${route.target.name}`;
        const balancer = this.loadBalancers.get(balancerKey);

        if (!balancer) {
          throw new ServiceUnavailableError(`No available backend for ${route.target.name}`);
        }

        // 选择实例
        const instance = balancer.selectInstance(req.ip);

        if (!instance) {
          throw new ServiceUnavailableError(`No healthy backend available`);
        }

        // 转发请求
        await this.forwardRequest(req, res, instance.url);

        // 标记为健康
        balancer.markHealthy(instance.id);
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * 创建路由转发中间件
 */
export function createRouterMiddleware(forwarder: RouterForwarder) {
  return forwarder.middleware();
}
