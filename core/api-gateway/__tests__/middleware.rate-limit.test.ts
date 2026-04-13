/**
 * 速率限制中间件测试
 * 作者: GitHub Copilot
 */

import { rateLimit, userRateLimit, ipRateLimit, apiKeyRateLimit } from '../src/middleware/rate-limit';

describe('Rate Limiting Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextCalledTimes = 0;

  beforeEach(() => {
    nextCalledTimes = 0;
    mockReq = {
      ip: '192.168.1.100',
      user: { id: 'user123' },
      headers: { 'x-api-key': 'api-key-123' },
      method: 'GET',
      path: '/api/test',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
  });

  describe('rateLimit', () => {
    it('应允许请求在限制以下通过', (done) => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: () => 'test',
      });

      const next = jest.fn(() => {
        nextCalledTimes++;
      });

      // 模拟多个请求
      for (let i = 0; i < 50; i++) {
        limiter(mockReq, mockRes, next);
      }

      expect(nextCalledTimes).toBe(50);
      expect(mockRes.status).not.toHaveBeenCalled();
      done();
    });

    it('应在超过限制时返回 429 状态码', (done) => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: () => 'test',
      });

      const next = jest.fn();

      // 超过限制的请求
      for (let i = 0; i < 10; i++) {
        limiter(mockReq, mockRes, next);
      }

      // 前5个请求应该传递
      expect(next).toHaveBeenCalledTimes(5);
      // 后面的请求应该返回 429
      expect(mockRes.status).toHaveBeenCalledWith(429);
      done();
    });

    it('应设置 X-RateLimit-* 响应头', (done) => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: () => 'test',
      });

      const next = jest.fn();
      limiter(mockReq, mockRes, next);

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '10',
        })
      );
      done();
    });
  });

  describe('userRateLimit', () => {
    it('应基于用户 ID 进行限制', (done) => {
      const limiter = userRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const next = jest.fn();

      // 相同用户的请求
      for (let i = 0; i < 10; i++) {
        const req = { ...mockReq };
        limiter(req, mockRes, next);
      }

      expect(next).toHaveBeenCalledTimes(5);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      done();
    });
  });

  describe('ipRateLimit', () => {
    it('应基于 IP 地址进行限制', (done) => {
      const limiter = ipRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const next = jest.fn();

      // 相同 IP 的请求
      for (let i = 0; i < 10; i++) {
        const req = { ...mockReq, ip: '192.168.1.100' };
        limiter(req, mockRes, next);
      }

      expect(next).toHaveBeenCalledTimes(5);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      done();
    });

    it('应允许不同 IP 的请求', (done) => {
      const limiter = ipRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const next = jest.fn();

      // 不同 IP 的请求
      for (let i = 0; i < 3; i++) {
        const req = { ...mockReq, ip: `192.168.1.${100 + i}` };
        limiter(req, mockRes, next);
      }

      expect(next).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalled();
      done();
    });
  });

  describe('apiKeyRateLimit', () => {
    it('应基于 API 密钥进行限制', (done) => {
      const limiter = apiKeyRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const next = jest.fn();

      // 相同 API 密钥的请求
      for (let i = 0; i < 10; i++) {
        const req = { 
          ...mockReq,
          headers: { 'x-api-key': 'api-key-123' }
        };
        limiter(req, mockRes, next);
      }

      expect(next).toHaveBeenCalledTimes(5);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      done();
    });

    it('应拒绝没有 API 密钥的请求', (done) => {
      const limiter = apiKeyRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const req = { ...mockReq, headers: {} };
      const next = jest.fn();

      limiter(req, mockRes, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });
});
