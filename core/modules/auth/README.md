# FederGR Akademi - Core Auth Module

> 联邦学院核心认证模块 - OAuth2.0 + JWT + RBAC

**作者**：GitHub Copilot  
**创建日期**：2026-04-13  
**许可证**：GPL-3.0

## 📋 概述

FederGR 核心认证模块提供了完整的用户认证、授权和权限管理系统，支持：

- ✅ **OAuth2.0 + JWT** 令牌认证
- ✅ **RBAC** 角色基访问控制
- ✅ **多租户隔离** 数据安全
- ✅ **密码加密** BCrypt 哈希
- ✅ **令牌刷新** 长期会话管理
- ✅ **权限中间件** 即插即用

---

## 🏗️ 架构

### 目录结构

```
core/modules/auth/
├── src/
│   ├── controllers/      # HTTP 路由处理
│   ├── services/         # 业务逻辑
│   ├── middleware/       # Express 中间件
│   │   ├── authenticate.ts    # JWT 认证
│   │   └── authorize.ts       # RBAC 权限
│   ├── utils/            # 工具函数
│   │   ├── jwt.ts          # JWT 生成/验证
│   │   ├── password.ts     # 密码加密/验证
│   │   └── rbac.ts         # 权限管理
│   ├── types/            # TypeScript 类型定义
│   └── index.ts          # 模块入口
├── tests/                # 单元测试
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### 核心功能模块

| 模块 | 功能 |
|------|------|
| **JWT 工具** | 令牌生成、验证、刷新、过期检查 |
| **密码工具** | 加密、验证、强度检查、临时密码生成 |
| **RBAC 管理** | 权限定义、检查、角色层级比较 |
| **中间件** | JWT 认证、RBAC 授权、多租户隔离 |
| **认证服务** | 注册、登录、密码管理、用户管理 |

---

## 🚀 快速开始

### 安装依赖

```bash
cd core/modules/auth
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

### 运行测试

```bash
npm test
npm run test:coverage
```

---

## 📚 API 文档

### 认证端点

#### 1. 用户注册

```http
POST /auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "SecurePassword123!",
  "email": "user@example.com",
  "fullName": "John Doe",
  "schoolId": "school_001",
  "role": "student"
}

Response 201:
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "id": "user_xxxxx",
    "username": "user@example.com",
    "fullName": "John Doe",
    "role": "student"
  }
}
```

#### 2. 用户登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "SecurePassword123!",
  "schoolId": "school_001"
}

Response 200:
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_xxxxx",
      "username": "user@example.com",
      "role": "student"
    },
    "expiresIn": 1800
  }
}
```

#### 3. 刷新令牌

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response 200:
{
  "code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 4. 获取用户信息

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response 200:
{
  "code": 200,
  "message": "User info retrieved",
  "data": {
    "id": "user_xxxxx",
    "username": "user@example.com",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "student",
    "isActive": true
  }
}
```

#### 5. 修改密码

```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "oldPassword": "SecurePassword123!",
  "newPassword": "NewSecurePassword456!"
}

Response 200:
{
  "code": 200,
  "message": "Password changed successfully"
}
```

#### 6. 重置用户密码（管理员）

```http
POST /auth/reset-password/:userId
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response 200:
{
  "code": 200,
  "message": "Password reset successfully",
  "data": {
    "temporaryPassword": "TempPass123456!"
  }
}
```

---

## 🔐 使用中间件

### 在其他模块中集成认证

```typescript
import express from 'express';
import { authenticateJWT, validateTenant } from '@federgr/core-auth';
import { authorize, requireRole } from '@federgr/core-auth';

const app = express();

// 保护的端点
app.get('/protected-resource',
  authenticateJWT,      // JWT 认证
  validateTenant,       // 多租户隔离
  authorize('resource:read'),  // 权限检查
  (req, res) => {
    res.json({
      message: 'Authorized access',
      user: req.user
    });
  }
);

// 仅管理员可访问
app.delete('/admin-only',
  authenticateJWT,
  requireRole(['admin', 'super_admin']),
  (req, res) => {
    res.json({ message: 'Admin action' });
  }
);
```

---

## 📖 权限模型 (RBAC)

### 角色层级

| 角色 | 级别 | 权限范围 |
|------|------|---------|
| SUPER_ADMIN | 6 | 系统全权限 |
| ADMIN | 5 | 学校全权限 |
| TEACHER | 3 | 教学与课程管理 |
| STUDENT | 2 | 学生自服务权限 |
| PARENT | 1 | 家长查看权限 |
| VISITOR | 0 | 访客最小权限 |

### 权限格式

权限采用 `资源:操作` 格式：

```
user:read          # 读取用户信息
user:write         # 修改用户信息
course:*           # 课程相关所有操作
admin:config:read  # 系统配置读取
```

### 权限检查

```typescript
import { checkPermission, checkAnyPermission } from './utils/rbac';

// 检查单个权限
if (checkPermission(userRole, 'course:write')) {
  // 有权限
}

// 检查多个权限（OR）
if (checkAnyPermission(userRole, ['course:write', 'course:publish'])) {
  // 至少有一个权限
}
```

---

## 🛡️ 安全最佳实践

### 密码强度要求

- 最少 8 个字符
- 至少包含大写字母
- 至少包含小写字母
- 至少包含数字
- 至少包含特殊符号

### JWT 令牌配置

- **Access Token 过期**：30 分钟（可配置）
- **Refresh Token 过期**：7 天（可配置）
- **签名算法**：HS256
- **密钥长度**：建议 32+ 字符

### 部署安全清单

- [ ] 更改 `JWT_SECRET` 为强随机字符串
- [ ] 启用 HTTPS/TLS
- [ ] 配置 CORS 白名单
- [ ] 启用审计日志
- [ ] 定期轮换 JWT 密钥
- [ ] 监控异常登录活动
- [ ] 实施速率限制
- [ ] 使用强密码策略

---

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t federgr-auth:latest .
```

### 运行容器

```bash
docker run -d \
  --name federgr-auth \
  -p 3001:3001 \
  -e JWT_SECRET="your-secret-key" \
  -e NODE_ENV="production" \
  federgr-auth:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  auth:
    build: core/modules/auth
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

---

## 📊 性能指标

- JWT 验证：< 1ms
- 密码哈希（注册）：~100ms
- 密码验证（登录）：~100ms
- 权限检查：< 0.1ms
- 并发用户支持：1000+ (取决于硬件)

---

## 🧪 单元测试

```bash
npm test

# 查看覆盖率
npm run test:coverage
```

示例测试：

```typescript
describe('JWT Utils', () => {
  it('should generate valid token', () => {
    const token = generateToken({
      userId: 'user1',
      schoolId: 'school1',
      username: 'test',
      role: UserRole.STUDENT
    });
    
    const payload = verifyToken(token);
    expect(payload).toBeDefined();
    expect(payload?.userId).toBe('user1');
  });
});
```

---

## 🔄 扩展集成

### 与其他模块集成

1. **门禁模块** (`modules/access-control/`)
   - 使用认证模块验证用户身份
   - 通过 RBAC 检查进出权限

2. **教务模块** (`modules/edu/`)
   - 区分学生、教师、家长权限
   - 实施数据级别的多租户隔离

3. **支付模块** (`modules/payment/`)
   - 验证投单身份
   - 记录操作审计日志

---

## 📝 许可证

- **GPL-3.0** - 核心框架开源
- [查看完整许可证](.../../LICENSE)

---

## 👥 贡献指南

欢迎贡献代码！请：

1. 创建功能分支 (`git checkout -b feature/amazing-feature`)
2. 提交更改 (`git commit -m 'Add amazing feature'`)
3. 推送到分支 (`git push origin feature/amazing-feature`)
4. 开启 Pull Request

---

## 📞 支持

- 📧 技术支持: support@federgr.com
- 💬 开发者论坛: forum.federgr.io
- 🐛 问题报告: GitHub Issues

---

**文档最后更新**：2026-04-13  
**生成者**：GitHub Copilot
