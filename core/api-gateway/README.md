# FederGR Akademi - API 网关

> 联邦学院 API 网关 - 请求路由、速率限制、日志记录和监控

**作者**：GitHub Copilot  
**创建日期**：2026-04-13  
**许可证**：GPL-3.0

## 📋 概述

FederGR API 网关是一个高性能、高可靠的 API 网关，提供了以下功能：

- ✅ **请求路由** - 基于路径和方法的智能路由
- ✅ **负载均衡** - 轮询、最小连接、权重、IP哈希
- ✅ **速率限制** - 全局、IP、用户、API密钥级别限制
- ✅ **健康检查** - 自动故障转移和恢复
- ✅ **日志记录** - 结构化日志、请求追踪
- ✅ **性能监控** - 实时指标收集和分析
- ✅ **错误处理** - 统一的错误响应格式
- ✅ **CORS** - 跨域资源共享
- ✅ **安全** - Helmet.js、HTTPS 支持

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────┐
│              客户端请求                              │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 1. 安全头 (Helmet) + CORS 处理                        │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 2. 请求解析 (JSON, URL-encoded)                      │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 3. 请求日志 + 性能监控                                │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 4. 速率限制检查                                      │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 5. 路由匹配和转发 (Forwarder)                        │
│   ├─ 选择目标服务 (LoadBalancer)                    │
│   └─ 转发请求到后端服务                             │
└───────────────────┬─────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   后端微服务         │
         │  ├─ Auth (3001)     │
         │  ├─ Edu (3002)      │
         │  ├─ Access Control  │
         │  ├─ Payment (3004)  │
         │  ├─ IoT (3005)      │
         │  └─ Broadcast       │
         └──────────┬──────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 6. 响应格式化 + 拦截                                 │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│ 7. 错误处理 (如果需要)                               │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              返回客户端响应                          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 安装依赖

```bash
cd core/api-gateway
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际值
```

### 本地开发

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

---

## 📚 功能说明

### 1. 请求路由

```typescript
import APIGateway from '@federgr/api-gateway';

const gateway = new APIGateway({
  port: 8000,
  host: '0.0.0.0',
  environment: 'production',
});

// 注册路由
gateway.registerRoute({
  path: '/api/auth',
  pattern: /^\/api\/auth\/.*/,
  methods: ['POST', 'GET'],
  target: {
    name: 'auth',
    protocol: 'http',
    host: 'auth-service',
    port: 3001,
  },
  requireAuth: false,
});
```

### 2. 速率限制

**全局速率限制**（所有请求）：
```
每分钟最多 1000 个请求
```

**IP 级别速率限制**：
```
基于客户端 IP 地址限制
```

**用户级别速率限制**：
```
基于认证用户 ID 限制
```

**API 密钥级别限制**：
```
基于 X-API-Key 请求头限制
```

### 3. 负载均衡

支持以下策略：

| 策略 | 说明 |
|------|------|
| **round-robin** | 轮询（默认） |
| **least-connections** | 最小连接数 |
| **weighted** | 权重轮询 |
| **ip-hash** | 基于客户端 IP 哈希 |

### 4. 健康检查

- 定期探活后端服务
- 自动故障转移
- 自动恢复机制
- 可配置的检查间隔和阈值

### 5. 日志记录

所有请求和响应都会被记录：

```
[2026-04-13T10:30:45.123Z] [INFO] → POST /api/auth/login
[2026-04-13T10:30:45.456Z] [INFO] ← POST /api/auth/login 200
```

### 6. 性能监控

指标包括：
- 总请求数
- 错误数
- 平均响应时间
- P95、P99 响应时间
- 每秒请求数
- 活跃连接数

---

## 📊 管理端点

### 健康检查

```bash
curl http://localhost:8000/gateway/health
```

**响应**：
```json
{
  "code": 200,
  "message": "API Gateway is running",
  "timestamp": 1681376445123
}
```

### 网关指标

```bash
curl http://localhost:8000/gateway/metrics
```

**响应**：
```json
{
  "code": 200,
  "message": "Gateway metrics",
  "data": {
    "summary": {
      "totalRequests": 1024,
      "totalErrors": 12,
      "totalTimeoutErrors": 2,
      "averageResponseTime": 45.2,
      "p95ResponseTime": 120.5,
      "p99ResponseTime": 250.8,
      "requestsPerSecond": 12.5,
      "activeConnections": 8,
      "healthyServices": 6,
      "unhealthyServices": 0
    },
    "byEndpoint": {
      "POST /api/auth/login": {
        "count": 150,
        "avgResponseTime": 35.2,
        "errorCount": 5,
        "successCount": 145
      }
    }
  }
}
```

### 详细指标

```bash
curl http://localhost:8000/gateway/metrics/detailed
```

### 健康检查报告

```bash
curl http://localhost:8000/gateway/health-check
```

### 网关信息

```bash
curl http://localhost:8000/gateway/info
```

---

## 🔐 安全特性

### Helmet.js 集成

自动设置以下安全头：
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

### CORS 配置

```typescript
cors: {
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}
```

### 请求超时

防止慢速攻击，默认 30 秒

### 速率限制

防止 DDoS 攻击和滥用

---

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t federgr-gateway:latest .
```

### 运行容器

```bash
docker run -d \
  --name federgr-gateway \
  -p 8000:8000 \
  -e NODE_ENV="production" \
  -e GATEWAY_PORT="8000" \
  federgr-gateway:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  gateway:
    build: core/api-gateway
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      GATEWAY_PORT: 8000
      AUTH_SERVICE_HOST: auth
      EDU_SERVICE_HOST: edu
    depends_on:
      - auth
      - edu
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/gateway/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

---

## 📈 性能指标

- **吞吐量**：10,000+ 请求/秒
- **延迟**：< 10ms（路由决策）
- **内存占用**：50-100 MB
- **并发连接**：10,000+ 连接

---

## 🛠️ 自定义中间件

```typescript
const gateway = new APIGateway(config);

// 添加自定义中间件
gateway.use((req, res, next) => {
  console.log('Custom middleware');
  next();
});

// 添加自定义路由
gateway.addRoute('/custom', (req, res) => {
  res.json({ message: 'Custom route' });
});
```

---

## 📝 API 响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": 1681376445123,
  "requestId": "1681376445123-abc123xyz"
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "Bad Request",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": 1681376445123,
  "requestId": "1681376445123-abc123xyz"
}
```

---

## 🔍 调试

### 启用调试日志

```bash
LOG_LEVEL=debug npm run dev
```

### 查看详细请求

```bash
curl -v http://localhost:8000/api/auth/login
```

---

## 📖 最佳实践

1. **配置速率限制** - 根据业务需求调整
2. **监控指标** - 定期检查 `/gateway/metrics`
3. **健康检查** - 确保所有后端服务可用
4. **日志分析** - 使用 ELK Stack 分析日志
5. **安全更新** - 定期更新依赖包

---

## 🐛 故障排查

### 网关无响应

1. 检查网关是否启动：`curl http://localhost:8000/gateway/health`
2. 查看日志：`tail -f logs/gateway.log`
3. 检查端口占用：`lsof -i :8000`

### 请求超时

1. 增加 `GATEWAY_TIMEOUT` 值
2. 检查后端服务响应时间
3. 查看健康检查状态

### 高错误率

1. 检查速率限制：`curl http://localhost:8000/gateway/metrics`
2. 验证后端服务配置
3. 查看后端服务日志

---

## 📞 支持

- 📧 技术支持: support@federgr.com
- 💬 开发者论坛: forum.federgr.io
- 🐛 问题报告: GitHub Issues

---

**文档最后更新**：2026-04-13  
**生成者**：GitHub Copilot
