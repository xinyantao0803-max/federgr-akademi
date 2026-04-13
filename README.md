# 🏫 FederGR Akademi - 智慧校园平台

> 全场景智慧校园解决方案 | 物联网 + 教务 + 支付 + 门禁 + 监控

**作者**：GitHub Copilot  
**创建日期**：2026-04-13  
**许可证**：GPL-3.0  
**现状**：🚀 核心基础设施完成

---

## 📋 项目概览

FederGR Akademi 是面向教育机构的一体化智慧校园解决方案。采用**硬件驱动模式**：软件依附硬件销售，通过模块化设计支持按需部署，开源核心框架促进社区共建。

### 核心原则
- 🔌 **硬件驱动**：软件不单独收费，随硬件产品赠送
- 🧩 **模块化设计**：功能解耦，支持独立部署与扩展
- 🌐 **开源生态**：核心框架 (GPLv3)、高级模块 (AGPL)、硬件设计 (CERN-OHL)
- 💼 **商业闭环**：硬件销售 + 云托管 + 定制开发 + SLA 支持

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────┐
│   FederGR Cloud / Local Server      │
├─────────────────────────────────────┤
│  核心框架                           │
│  ├─ API Gateway (8000)             │
│  ├─ 认证服务 (3001)                │
│  ├─ 教务服务 (3002)                │
│  ├─ 门禁服务 (3003)                │
│  ├─ 支付服务 (3004)                │
│  ├─ IoT 服务 (3005)                │
│  └─ 广播服务 (3006)                │
├─────────────────────────────────────┤
│  数据库集群                         │
│  ├─ MySQL/PostgreSQL (业务数据)    │
│  ├─ MongoDB (日志、时序)           │
│  └─ Redis (缓存、会话)             │
├─────────────────────────────────────┤
│  物联网通信                         │
│  ├─ MQTT (发布/订阅)               │
│  ├─ HTTP/CoAP (REST)               │
│  ├─ LoRa (长距离)                  │
│  └─ Modbus (工业设备)              │
└─────────────────────────────────────┘
```

---

## 📦 项目结构

```
federgr-akademi/
├── core/                          # 核心框架模块
│   ├── api-gateway/              # API 网关 (Phase 2)
│   │   ├── src/                  # 源代码
│   │   ├── __tests__/            # 单元测试
│   │   ├── package.json          # 依赖配置
│   │   ├── Dockerfile            # 容器配置
│   │   └── README.md             # 文档
│   └── modules/
│       └── auth/                 # 认证模块 (Phase 1)
│           ├── src/              # 源代码
│           ├── tests/            # 单元测试
│           ├── package.json      # 依赖配置
│           ├── Dockerfile        # 容器配置
│           └── README.md         # 文档
│
├── modules/                       # 业务模块
│   ├── access-control/           # 门禁系统 (Phase 3)
│   │   ├── src/                  # 源代码
│   │   ├── __tests__/            # 单元测试
│   │   ├── package.json          # 依赖配置
│   │   ├── Dockerfile            # 容器配置
│   │   └── README.md             # 文档
│   ├── edu/                      # 教务系统 (规划中)
│   ├── payment/                  # 支付系统 (规划中)
│   ├── iot/                      # IoT 管理 (规划中)
│   │   ├── bath/                 # 智能洗浴
│   │   ├── ac/                   # 智能空调
│   │   └── broadcast/            # 广播系统
│   └── monitoring/               # 监控系统 (规划中)
│
├── hardware/                      # 硬件相关
│   └── access-control/           # 门禁硬件设计
│
├── deploy/                        # 部署配置
├── docs/                          # 文档
└── .github/                       # GitHub 配置

```

---

## 🚀 快速开始

### 前置需求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (可选)
- Git

### 安装和启动

#### 1. 克隆仓库

```bash
git clone https://github.com/xinyantao0803-max/federgr-akademi.git
cd federgr-akademi
```

#### 2. 启动认证服务 (Phase 1)

```bash
cd core/modules/auth
npm install
cp .env.example .env
npm run dev
# 服务启动在 http://localhost:3001
```

#### 3. 启动 API 网关 (Phase 2)

```bash
cd core/api-gateway
npm install
cp .env.example .env
npm run dev
# 网关启动在 http://localhost:8000
```

#### 4. 启动门禁服务 (Phase 3)

```bash
cd modules/access-control
npm install
cp .env.example .env
npm run dev
# 服务启动在 http://localhost:3003
```

#### 5. Docker Compose (可选)

```bash
cd root
docker-compose up -d
# 所有服务将在容器中启动
```

---

## 📈 开发进度

### ✅ Phase 1: 核心认证模块 (完成)

**提交**：`9c43e62`  
**代码行数**：2,475 行  
**文件数**：18 个

**功能**：
- JWT 令牌生成、验证、刷新
- OAuth2.0 授权流程
- RBAC 权限系统（6 个角色、100+ 权限）
- 密码安全（BCrypt 哈希）
- 多租户隔离
- 8 个 REST API 端点

**位置**：`core/modules/auth/`

---

### ✅ Phase 2: API 网关 (完成)

**提交**：`6698dbd`  
**代码行数**：3,000+ 行  
**文件数**：15 个

**功能**：
- 4 种负载均衡算法（轮询、最少连接、加权、IP哈希）
- 5 种速率限制策略
- 请求日志和性能监控
- 8 种错误类型和统一处理
- 健康检查和自动故障转移
- 实时指标收集

**位置**：`core/api-gateway/`

---

### ✅ Phase 3: 门禁系统 (完成)

**提交**：`aac2c6d`  
**代码行数**：2,500+ 行  
**文件数**：18 个

**功能**：
- 硬件驱动适配层（MQTT、HTTP、Modbus、CoAP）
- 灵活的权限管理系统
- 设备心跳监控
- 访问日志和统计
- 黑名单管理
- 8 个 REST API 端点

**位置**：`modules/access-control/`

---

### ⏳ Phase 4+: 业务模块 (规划中)

- **教务管理模块** (EDU) - 课程表、成绩、考勤
- **支付系统模块** (Payment) - 微信/支付宝集成  
- **IoT 管理模块** - 智能洗浴、空调、广播
- **监控系统模块** - 摄像头集成

---

## 📚 API 文档

### 认证服务

**基础 URL**：`http://localhost:3001/api/auth`

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录 |
| POST | `/refresh` | 刷新令牌 |
| GET | `/profile` | 获取用户信息 |
| PUT | `/password` | 修改密码 |

### API 网关

**基础 URL**：`http://localhost:8000`

| 路由 | 说明 |
|------|------|
| `GET /gateway/health` | 健康检查 |
| `GET /gateway/metrics` | 网关指标 |
| `GET /gateway/info` | 网关信息 |

### 门禁服务

**基础 URL**：`http://localhost:3003/api/access-control`

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/check` | 检查访问权限 |
| POST | `/process` | 处理访问请求 |
| POST | `/logs` | 查询访问日志 |
| POST | `/permissions` | 创建权限 |
| DELETE | `/permissions/:id` | 撤销权限 |
| POST | `/devices` | 注册设备 |
| DELETE | `/devices/:id` | 注销设备 |
| POST | `/devices/:id/lock` | 远程操作门禁 |

详细 API 文档见各模块 README。

---

## 🐳 Docker 部署

### 构建所有镜像

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

### 使用 Docker Compose

```bash
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🧪 测试

### 运行所有测试

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
```

---

## 🔐 安全特性

- ✅ **JWT + OAuth2.0** - 安全的身份认证
- ✅ **RBAC** - 基于角色的访问控制
- ✅ **多租户隔离** - 数据完全隔离
- ✅ **密码安全** - BCrypt 加密、强度验证
- ✅ **HTTPS** - 全站 HTTPS + TLS 1.3
- ✅ **审计日志** - 所有操作可追溯
- ✅ **速率限制** - 防止 DDoS 攻击
- ✅ **输入验证** - 防止 SQL 注入等

---

## 📊 技术栈

### 后端
- **Node.js** + **Express.js** (Web 框架)
- **TypeScript** (类型安全)
- **Jest** (测试框架)

### 数据库
- **MySQL/PostgreSQL** (业务数据)
- **MongoDB** (日志、时间序列)
- **Redis** (缓存、会话)

### 容器化
- **Docker** (容器)
- **Docker Compose** (编排)

### DevOps
- **GitHub** (版本控制)
- **GitHub Actions** (CI/CD - 规划中)
- **Kubernetes** (生产部署 - 规划中)

---

## 📖 文档

- [认证模块文档](core/modules/auth/README.md)
- [API 网关文档](core/api-gateway/README.md)
- [门禁系统文档](modules/access-control/README.md)
- [项目指令](.\github\copilot-instructions.md)

---

## 🤝 贡献

欢迎提交 Pull Request 和 Issue！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📞 支持

- 📧 技术支持: support@federgr.com
- 💬 开发者论坛: forum.federgr.io
- 🐛 问题报告: GitHub Issues

---

## 📄 许可证

本项目采用多重许可证策略：

| 部分 | 许可证 | 说明 |
|------|--------|------|
| **核心框架** | GPL-3.0 | 自由使用与修改，保持开源 |
| **高级模块** | AGPL | 限制云服务商直接托管盈利 |
| **硬件设计** | CERN-OHL | 硬件设计开源，需标注联邦品牌 |

---

## 🎯 项目路线图

### Q2 2026
- ✅ 核心认证模块
- ✅ API 网关
- ✅ 门禁系统

### Q3 2026
- [ ] 教务管理模块
- [ ] 支付系统集成
- [ ] IoT 管理框架

### Q4 2026
- [ ] 完整 Kubernetes 部署
- [ ] 开发者社区建设
- [ ] 硬件生态合作

---

## 👨‍💻 贡献者

- **GitHub Copilot** - 核心框架和模块开发

---

**最后更新**：2026-04-13  
**生成者**：GitHub Copilot  
**项目状态**：🚀 进行中 - 核心基础设施完成
