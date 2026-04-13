# FederGR Akademi 开发指南

> 智慧校园平台 - 开发文档 | 架构 | 部署

**版本**：1.0.0  
**最后更新**：2026-04-13  
**作者**：GitHub Copilot

---

## 📋 目录

1. [项目概览](#项目概览)
2. [开发环境](#开发环境)
3. [模块架构](#模块架构)
4. [本地开发](#本地开发)
5. [测试指南](#测试指南)
6. [部署指南](#部署指南)
7. [常见问题](#常见问题)

---

## 项目概览

### 项目结构

FederGR Akademi 采用微服务架构，分为以下层次：

```
┌─────────────────────┐
│   前端应用          │ (React/Vue Web, WeChat/Alipay Mini Apps)
└──────────────┬──────┘
               │
┌──────────────▼──────────────────────────────────────┐
│   API 网关 (Port 8000)                              │
│   - 请求路由、负载均衡、限流、日志、监控           │
└──────────────┬──────────────────────────────────────┘
               │
     ┌─────────┼─────────┬─────────┬─────────┐
     │         │         │         │         │
  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
  │认证 │  │教务 │  │门禁 │  │支付 │  │IoT  │
  │3001 │  │3002 │  │3003 │  │3004 │  │3005 │
  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
     │       │       │       │       │
     └───────┼───────┼───────┼───────┘
             │
    ┌────────▼────────────────────┐
    │  数据库层                    │
    │  ├─ MySQL/PostgreSQL        │
    │  ├─ MongoDB                 │
    │  ├─ Redis                   │
    │  └─ MQTT                    │
    └─────────────────────────────┘
```

### 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 运行时 | Node.js | 18+ |
| 语言 | TypeScript | 5.3+ |
| Web 框架 | Express.js | 4.18+ |
| 数据库 | MySQL/MongoDB | 8.0/6.0 |
| 缓存 | Redis | 7.0 |
| 测试 | Jest | 29.7+ |
| 容器 | Docker | 24.0+ |

---

## 开发环境

### 前置需求

```bash
# Node.js 版本检查
node -v  # >= 18.0.0

# npm 版本检查
npm -v   # >= 9.0.0

# Git 版本检查
git --version
```

### 环境设置

1. **克隆仓库**

```bash
git clone https://github.com/xinyantao0803-max/federgr-akademi.git
cd federgr-akademi
git checkout feature/auth-system
```

2. **安装依赖**

```bash
# 认证服务
cd core/modules/auth
npm install

# API 网关
cd core/api-gateway
npm install

# 门禁服务
cd modules/access-control
npm install
```

3. **配置环境变量**

```bash
# 在每个模块目录中
cp .env.example .env
# 编辑 .env 填入实际配置
```

4. **启动数据库** (使用 Docker)

```bash
docker-compose up -d mysql mongodb redis mqtt
```

---

## 模块架构

### Phase 1: 认证模块 (core/modules/auth/)

**职责**：用户身份验证、权限管理

**API 端点**：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/password` - 修改密码

**核心类**：
- `AuthService` - 认证业务逻辑
- `AuthController` - REST 控制器
- `JwtUtils` - JWT 令牌管理
- `RbacUtils` - RBAC 权限系统

**数据模型**：
```typescript
interface User {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  roles: UserRole[];
  schoolId: string;
  isActive: boolean;
  createdAt: Date;
}

interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}
```

### Phase 2: API 网关 (core/api-gateway/)

**职责**：请求路由、负载均衡、限流、日志

**主要组件**：
- `APIGateway` - 网关主类
- `LoadBalancer` - 负载均衡器 (4种策略)
- `RateLimiter` - 速率限制 (5种策略)
- `Logger` - 请求日志
- `MetricsCollector` - 指标收集
- `HealthCheckManager` - 健康检查

**特性**：
- 轮询、最少连接、加权、IP哈希负载均衡
- 全局、IP、用户、API密钥、严格限流
- 请求追踪和性能监控
- 自动故障转移

### Phase 3: 门禁系统 (modules/access-control/)

**职责**：门禁设备管理、访问控制、审计日志

**核心类**：
- `AccessControlService` - 业务服务
- `AccessControlController` - REST 控制器
- `HardwareAdapter` - 硬件驱动适配
- `HardwareManager` - 硬件管理器

**支持的硬件协议**：
- MQTT (物联网网关)
- HTTP (REST API)
- Modbus (工业设备)
- CoAP (低功耗设备)

**数据模型**：
```typescript
interface AccessDevice {
  id: string;
  name: string;
  type: AccessDeviceType;
  location: string;
  status: AccessDeviceStatus;
  hardwareId: string;
  isOnline: boolean;
  lastHeartbeat: Date;
}

interface AccessLog {
  id: string;
  deviceId: string;
  userId: string;
  accessType: AccessType;
  accessResult: AccessResult;
  accessTime: Date;
  direction: 'IN' | 'OUT';
}
```

---

## 本地开发

### 启动服务

**终端 1 - 认证服务**
```bash
cd core/modules/auth
npm run dev
# 启动在 http://localhost:3001
```

**终端 2 - API 网关**
```bash
cd core/api-gateway
npm run dev
# 启动在 http://localhost:8000
```

**终端 3 - 门禁服务**
```bash
cd modules/access-control
npm run dev
# 启动在 http://localhost:3003
```

### 测试 API

使用 curl 或 Postman 测试：

```bash
# 1. 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "phone": "13800138000"
  }'

# 2. 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. 检查权限 (通过网关)
curl -X POST http://localhost:8000/api/access-control/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "userId": "user123",
    "areaId": "area-001"
  }'
```

---

## 测试指南

### 运行单元测试

```bash
# 认证服务
cd core/modules/auth
npm test

# API 网关
cd core/api-gateway
npm test

# 门禁服务
cd modules/access-control
npm test
```

### 生成覆盖率报告

```bash
npm run test:coverage
# 查看报告: coverage/lcov-report/index.html
```

### 编写新测试

创建测试文件 `__tests__/my-feature.test.ts`：

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

运行测试：
```bash
npm test
```

---

## 部署指南

### Docker 部署

1. **构建镜像**

```bash
# 认证服务
cd core/modules/auth
docker build -t federgr-auth:latest .

# API 网关
cd core/api-gateway
docker build -t federgr-gateway:latest .

# 门禁服务
cd modules/access-control
docker build -t federgr-access-control:latest .
```

2. **使用 Docker Compose**

```bash
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f auth

# 停止服务
docker-compose down
```

3. **环境变量配置**

编辑 `docker-compose.yml` 中的 environment 部分：

```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: mysql://user:password@mysql:3306/db
  JWT_SECRET: your-secret-key
```

### Kubernetes 部署 (规划中)

将发布 Helm Charts 用于 Kubernetes 部署。

---

## 常见问题

### Q1: 服务启动失败

**症状**：`Error: listen EADDRINUSE :::3001`

**解决方案**：
```bash
# 查找进程
netstat -ano | findstr :3001

# 杀死进程 (Windows)
taskkill /PID <PID> /F

# 或改变端口
export AUTH_SERVICE_PORT=3101
npm run dev
```

### Q2: 数据库连接失败

**症状**：`Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决方案**：
```bash
# 检查 MySQL 是否运行
docker-compose ps mysql

# 确保 .env 配置正确
cat .env | grep DATABASE_URL
```

### Q3: JWT token 验证失败

**症状**：`401 Unauthorized`

**解决方案**：
1. 检查 token 是否过期
2. 确保使用正确的 JWT_SECRET
3. 验证 Authorization 请求头格式：`Bearer {token}`

### Q4: 跨域 (CORS) 错误

**症状**：`Access to XMLHttpRequest has been blocked by CORS policy`

**解决方案**：
编辑 `docker-compose.yml`：
```yaml
environment:
  CORS_ORIGIN: "http://your-domain.com"
```

---

## 贡献指南

### 代码风格

遵循 ESLint 和 Prettier 配置：

```bash
# 检查代码
npm run lint

# 格式化代码
npm run format
```

### 提交流程

1. 创建特性分支
```bash
git checkout -b feature/my-feature
```

2. 提交更改
```bash
git commit -m "feat: add my feature"
```

3. 推送到远程
```bash
git push origin feature/my-feature
```

4. 创建 Pull Request

### 提交规范

使用 Conventional Commits：

- `feat:` - 新功能
- `fix:` - bug 修复
- `docs:` - 文档
- `style:` - 代码风格
- `refactor:` - 重构
- `test:` - 测试
- `chore:` - 构建、依赖更新

---

## 性能优化建议

1. **缓存策略**：使用 Redis 缓存频繁访问的数据
2. **连接池**：配置数据库连接池大小
3. **限流**：根据业务调整限流参数
4. **监控**：使用 Prometheus + Grafana 监控性能

---

## 安全检查清单

- [ ] 修改所有默认密码
- [ ] 配置 HTTPS 和 TLS
- [ ] 启用 JWT 签名验证
- [ ] 实施 RBAC 权限检查
- [ ] 添加审计日志
- [ ] 定期更新依赖包
- [ ] 进行代码安全审查

---

## 联系方式

- 📧 技术问题: support@federgr.com
- 🐛 bug 报告: GitHub Issues
- 💬 讨论: GitHub Discussions

---

**文档最后更新**：2026-04-13  
**生成者**：GitHub Copilot
