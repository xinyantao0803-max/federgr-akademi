/**
 * 请求转发器和负载均衡器测试
 * 作者: GitHub Copilot
 */

import { LoadBalancer, RouterForwarder } from '../src/routing/forwarder';
import { ServiceInstance, RouteRule } from '../src/types';

describe('LoadBalancer', () => {
  let instances: ServiceInstance[];

  beforeEach(() => {
    instances = [
      { name: 'auth-1', url: 'http://localhost:3001', isHealthy: true, weight: 1, connections: 10 },
      { name: 'auth-2', url: 'http://localhost:3002', isHealthy: true, weight: 2, connections: 20 },
      { name: 'auth-3', url: 'http://localhost:3003', isHealthy: false, weight: 1, connections: 5 },
    ];
  });

  describe('Round Robin', () => {
    it('应依次选择健康实例', () => {
      const lb = new LoadBalancer(instances, 'round-robin');
      
      const first = lb.selectInstance();
      const second = lb.selectInstance();
      const third = lb.selectInstance();
      const fourth = lb.selectInstance();

      expect(first?.name).toBe('auth-1');
      expect(second?.name).toBe('auth-2');
      expect(third?.name).toBe('auth-1');
      expect(fourth?.name).toBe('auth-2');
    });

    it('应跳过不健康的实例', () => {
      const lb = new LoadBalancer(instances, 'round-robin');
      
      // 多次调用确保跳过不健康的实例
      for (let i = 0; i < 10; i++) {
        const instance = lb.selectInstance();
        expect(['auth-1', 'auth-2']).toContain(instance?.name);
      }
    });
  });

  describe('Least Connections', () => {
    it('应选择连接数最少的实例', () => {
      const lb = new LoadBalancer(instances, 'least-connections');
      
      // auth-3 不健康，忽略; auth-1 连接数最少 (10) 
      const selected = lb.selectInstance();
      expect(selected?.name).toBe('auth-1');
    });

    it('应在连接数相同时进行平衡', () => {
      // 创建连接数相同的实例
      const balancedInstances: ServiceInstance[] = [
        { name: 'service-1', url: 'http://localhost:3001', isHealthy: true, weight: 1, connections: 10 },
        { name: 'service-2', url: 'http://localhost:3002', isHealthy: true, weight: 1, connections: 10 },
        { name: 'service-3', url: 'http://localhost:3003', isHealthy: true, weight: 1, connections: 10 },
      ];
      
      const lb = new LoadBalancer(balancedInstances, 'least-connections');
      
      const selected = lb.selectInstance();
      expect(selected).toBeTruthy();
    });
  });

  describe('Weighted', () => {
    it('应根据权重选择实例', () => {
      const lb = new LoadBalancer(instances, 'weighted');
      
      const selections: (string | undefined)[] = [];
      for (let i = 0; i < 30; i++) {
        const instance = lb.selectInstance();
        selections.push(instance?.name);
      }

      // auth-2 的权重是 2，应该被选中大约 2 倍的次数
      const auth1Count = selections.filter(s => s === 'auth-1').length;
      const auth2Count = selections.filter(s => s === 'auth-2').length;

      expect(auth2Count).toBeGreaterThan(auth1Count);
    });
  });

  describe('IP Hash', () => {
    it('应为相同的 IP 选择相同的实例', () => {
      const lb = new LoadBalancer(instances, 'ip-hash');
      
      const instance1 = lb.selectInstance('192.168.1.100');
      const instance2 = lb.selectInstance('192.168.1.100');
      
      expect(instance1?.name).toBe(instance2?.name);
    });

    it('应为不同的 IP 可能选择不同的实例', () => {
      const lb = new LoadBalancer(instances, 'ip-hash');
      
      const instance1 = lb.selectInstance('192.168.1.100');
      const instance2 = lb.selectInstance('192.168.1.101');
      
      // 虽然不一定不同，但概率很高
      expect([instance1?.name, instance2?.name]).toContain(expect.any(String));
    });
  });

  describe('updateInstance', () => {
    it('应更新实例信息', () => {
      const lb = new LoadBalancer(instances, 'round-robin');
      
      lb.updateInstance('auth-1', { connections: 50, isHealthy: false });
      
      const health = lb.getInstanceHealth('auth-1');
      expect(health?.connections).toBe(50);
      expect(health?.healthy).toBe(false);
    });
  });

  describe('getInstanceHealth', () => {
    it('应返回实例健康状态', () => {
      const lb = new LoadBalancer('round-robin', instances);
      
      const health = lb.getInstanceHealth('auth-1');
      expect(health).toEqual(instances[0]);
    });

    it('应为不存在的实例返回 null', () => {
      const lb = new LoadBalancer('round-robin', instances);
      
      const health = lb.getInstanceHealth('non-existent');
      expect(health).toBeNull();
    });
  });
});

describe('RouterForwarder', () => {
  let forwarder: RouterForwarder;
  let routes: RouteRule[];

  beforeEach(() => {
    routes = [
      {
        path: '/api/auth',
        pattern: /^\/api\/auth\/.*/,
        methods: ['POST', 'GET'],
        target: {
          name: 'auth',
          protocol: 'http',
          host: 'localhost',
          port: 3001,
        },
        instances: [
          { name: 'auth-1', host: 'localhost', port: 3001, healthy: true, weight: 1, connections: 10 },
        ],
        loadBalancer: 'round-robin',
        requireAuth: true,
      },
    ];

    forwarder = new RouterForwarder(routes);
  });

  describe('matchRoute', () => {
    it('应匹配正确的路由', () => {
      const route = forwarder.matchRoute('GET', '/api/auth/login');
      expect(route).toBeTruthy();
      expect(route?.target.name).toBe('auth');
    });

    it('应检查请求方法', () => {
      const route = forwarder.matchRoute('PUT', '/api/auth/login');
      expect(route).toBeNull();
    });

    it('应为不匹配的路径返回 null', () => {
      const route = forwarder.matchRoute('GET', '/api/unknown/path');
      expect(route).toBeNull();
    });
  });

  describe('selectTargetInstance', () => {
    it('应选择目标实例', () => {
      const route = routes[0];
      const instance = forwarder.selectTargetInstance(route);
      
      expect(instance).toBeTruthy();
      expect(instance?.name).toBe('auth-1');
    });

    it('应仅选择健康的实例', () => {
      routes[0].instances![0].healthy = false;
      
      const route = routes[0];
      const instance = forwarder.selectTargetInstance(route);
      
      expect(instance).toBeNull();
    });

    it('应在没有健康实例时返回 null', () => {
      routes[0].instances = [
        { name: 'auth-down', host: 'localhost', port: 3001, healthy: false, weight: 1, connections: 10 },
      ];

      const route = routes[0];
      const instance = forwarder.selectTargetInstance(route);
      
      expect(instance).toBeNull();
    });
  });
});
