/**
 * 健康检查系统
 * 作者: GitHub Copilot
 */

import axios from 'axios';
import { ServiceInstance, HealthCheckConfig } from '../types';
import { globalLogger } from '../middleware/logger';

/**
 * 健康检查管理器
 */
export class HealthCheckManager {
  private instances: Map<string, ServiceInstance> = new Map();
  private config: HealthCheckConfig;
  private intervalId?: NodeJS.Timeout;

  constructor(instances: ServiceInstance[], config: HealthCheckConfig) {
    this.config = config;

    instances.forEach((instance) => {
      this.instances.set(instance.id, instance);
    });
  }

  /**
   * 启动健康检查
   */
  start(): void {
    if (!this.config.enabled) {
      return;
    }

    globalLogger.info('Starting health check', { interval: `${this.config.interval}ms` });

    // 立即执行一次
    this.checkAll();

    // 定期检查
    this.intervalId = setInterval(() => {
      this.checkAll();
    }, this.config.interval);
  }

  /**
   * 停止健康检查
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      globalLogger.info('Health check stopped');
    }
  }

  /**
   * 检查所有实例
   */
  private async checkAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map((instance) => this.checkInstance(instance));

    await Promise.all(promises);
  }

  /**
   * 检查单个实例
   */
  private async checkInstance(instance: ServiceInstance): Promise<void> {
    try {
      const url = `${instance.url}${this.config.path || '/health'}`;
      const timeout = this.config.timeout || 5000;

      const response = await axios.get(url, {
        timeout,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) {
        this.handleHealthyResponse(instance);
      } else {
        this.handleUnhealthyResponse(instance);
      }
    } catch (error) {
      this.handleUnhealthyResponse(instance, error as any);
    }
  }

  /**
   * 处理健康响应
   */
  private handleHealthyResponse(instance: ServiceInstance): void {
    if (!instance.isHealthy) {
      // 从不健康变为健康
      const consecutiveHealthyChecks = instance.failureCount === 0 ? 1 : instance.failureCount;

      if (consecutiveHealthyChecks >= this.config.healthyThreshold) {
        instance.isHealthy = true;
        instance.failureCount = 0;
        instance.lastHealthCheck = Date.now();

        globalLogger.info(`Instance ${instance.id} recovered`, {
          url: instance.url,
        });
      } else {
        instance.failureCount++;
      }
    } else {
      instance.failureCount = 0;
      instance.lastHealthCheck = Date.now();
    }
  }

  /**
   * 处理不健康响应
   */
  private handleUnhealthyResponse(instance: ServiceInstance, error?: any): void {
    instance.failureCount++;

    if (
      instance.isHealthy &&
      instance.failureCount >= this.config.unhealthyThreshold
    ) {
      instance.isHealthy = false;

      globalLogger.warn(`Instance ${instance.id} marked unhealthy`, {
        url: instance.url,
        failureCount: instance.failureCount,
        error: error?.message,
      });
    }

    instance.lastHealthCheck = Date.now();
  }

  /**
   * 获取实例状态
   */
  getInstanceStatus(instanceId: string): ServiceInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * 获取所有实例状态
   */
  getAllInstancesStatus(): ServiceInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * 获取健康统计
   */
  getHealthStats(): { healthy: number; unhealthy: number; total: number } {
    const instances = Array.from(this.instances.values());
    const healthy = instances.filter((i) => i.isHealthy).length;
    const unhealthy = instances.filter((i) => !i.isHealthy).length;

    return {
      healthy,
      unhealthy,
      total: instances.length,
    };
  }
}

/**
 * 健康检查报告
 */
export function createHealthCheckEndpoint() {
  return (healthCheckManagers: Map<string, HealthCheckManager>) => {
    return (req: any, res: any) => {
      const allStatus = Array.from(healthCheckManagers.values()).flatMap((manager) =>
        manager.getAllInstancesStatus()
      );

      const stats = {
        timestamp: Date.now(),
        healthy: allStatus.filter((i) => i.isHealthy).length,
        unhealthy: allStatus.filter((i) => !i.isHealthy).length,
        total: allStatus.length,
        instances: allStatus.map((instance) => ({
          id: instance.id,
          name: instance.name,
          url: instance.url,
          isHealthy: instance.isHealthy,
          failureCount: instance.failureCount,
          lastHealthCheck: instance.lastHealthCheck,
        })),
      };

      res.json(stats);
    };
  };
}
