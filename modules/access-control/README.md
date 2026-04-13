# FederGR Akademi - 访问控制模块

> 联邦学院智慧校园 - 门禁管理系统

**作者**：GitHub Copilot  
**创建日期**：2026-04-13  
**许可证**：GPL-3.0  
**版本**：1.0.0

---

## 📋 概述

访问控制模块是 FederGR Akademi 智慧校园平台的核心模块，提供全方位的门禁管理和访问控制功能。支持多种门禁设备、灵活的权限管理、详细的访问记录，以及实时硬件监控。

### 核心功能

- ✅ **多类型门禁设备支持** - 刷卡、人脸识别、指纹、密码、多模态
- ✅ **灵活的权限管理** - 基于区域和角色的权限控制 (RBAC)
- ✅ **实时硬件通信** - MQTT、HTTP、Modbus、CoAP 协议支持
- ✅ **完整的访问日志** - 所有进出记录详细记录，支持查询和统计
- ✅ **黑名单管理** - 支持用户和卡号的黑名单管理
- ✅ **配额管理** - 支持日配额和周配额限制
- ✅ **设备监控** - 实时心跳检测、故障预警
- ✅ **远程控制** - 支持远程打开/关闭门禁
- ✅ **业务时间管理** - 按区域配置营业时间
- ✅ **安全审计** - 所有操作都有审计日志

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────┐
│   门禁硬件设备 (各种协议)                             │
│  ├─ 刷卡机 (Card Reader)                             │
│  ├─ 人脸识别 (Facial Recognition)                    │
│  ├─ 指纹识别 (Fingerprint)                           │
│  ├─ 密码键盘 (PIN Pad)                               │
│  └─ 多模态设备 (Multi-Modal)                         │
└────────────┬──────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────┐
│   | 硬件适配层 (HardwareAdapter)                     │
│   ├─ MQTT 适配器 (物联网网关)                        │
│   ├─ HTTP 适配器 (REST API)                          │
│   ├─ Modbus 适配器 (工业参考)                        │
│   └─ CoAP 适配器 (低功耗设备)                        │
└────────────┬──────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────┐
│   硬件管理器 (HardwareManager)                        │
│   ├─ 设备连接管理                                    │
│   ├─ 心跳监控                                        │
│   ├─ 健康检查                                        │
│   └─ 故障转移                                        │
└────────────┬──────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────┐
│   访问控制业务服务 (AccessControlService)             │
│   ├─ 权限检查                                        │
│   ├─ 配额管理                                        │
│   ├─ 黑名单检查                                      │
│   ├─ 访问日志记录                                    │
│   └─ 统计分析                                        │
└────────────┬──────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────┐
│   REST API 控制器 (AccessControlController)          │
│   ├─ /check - 权限检查                               │
│   ├─ /process - 访问请求处理                         │
│   ├─ /logs - 访问日志查询                            │
│   ├─ /permissions - 权限管理                         │
│   ├─ /devices - 设备管理                             │
│   └─ /statistics - 统计数据                          │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 安装依赖

```bash
cd modules/access-control
npm install
```

### 配置环境

```bash
cp .env.example .env
# 编辑 .env 文件配置实际參數
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

## 📚 API 文档

### 1. 权限检查

**URL**: `POST /api/access-control/check`

**请求体**:
```json
{
  "userId": "user123",
  "areaId": "area-dormitory",
  "permissionLevel": 1
}
```

**响应** (允许通过):
```json
{
  "code": 200,
  "message": "Access granted",
  "data": {
    "allowed": true
  }
}
```

**响应** (拒绝):
```json
{
  "code": 403,
  "message": "Access denied",
  "data": {
    "allowed": false,
    "reason": "Daily quota exceeded"
  }
}
```

### 2. 处理访问请求

**URL**: `POST /api/access-control/process`

从硬件设备推送的访问请求，由系统处理验证。

**请求体**:
```json
{
  "deviceId": "device-001",
  "accessType": "card",
  "identifier": "4100001234567890",
  "timestamp": "2026-04-13T10:30:45.000Z"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "Access request processed",
  "data": {
    "result": "granted",
    "userId": "user123",
    "message": "Access granted"
  }
}
```

### 3. 访问日志查询

**URL**: `POST /api/access-control/logs`

**请求体**:
```json
{
  "userId": "user123",
  "areaId": "area-dormitory",
  "startDate": "2026-04-13T00:00:00.000Z",
  "endDate": "2026-04-13T23:59:59.000Z",
  "limit": 50,
  "offset": 0
}
```

**响应**:
```json
{
  "code": 200,
  "message": "Access logs retrieved",
  "data": {
    "total": 25,
    "data": [
      {
        "id": "log-xxxx",
        "deviceId": "device-001",
        "userId": "user123",
        "accessType": "card",
        "accessResult": "granted",
        "accessTime": "2026-04-13T10:30:45.000Z",
        "direction": "IN",
        "deviceName": "Dormitory 1F"
      }
    ]
  }
}
```

### 4. 创建访问权限

**URL**: `POST /api/access-control/permissions`

**请求体**:
```json
{
  "userId": "user123",
  "areaId": "area-dormitory",
  "permissionLevel": 1,
  "cardNumber": "4100001234567890",
  "startDate": "2026-04-13T00:00:00.000Z",
  "endDate": "2026-06-13T00:00:00.000Z",
  "dailyQuota": 100,
  "weeklyQuota": 1000
}
```

### 5. 设备管理

#### 注册设备
**URL**: `POST /api/access-control/devices`

#### 注销设备
**URL**: `DELETE /api/access-control/devices/:id`

#### 远程操作门禁
**URL**: `POST /api/access-control/devices/:id/lock`

**请求体**:
```json
{
  "action": "open"  // 或 "close"
}
```

#### 获取设备状态
**URL**: `GET /api/access-control/devices/:id/status`

### 6. 黑名单管理

#### 添加黑名单
**URL**: `POST /api/access-control/blacklist`

#### 移除黑名单
**URL**: `DELETE /api/access-control/blacklist/:id`

### 7. 访问统计

**URL**: `GET /api/access-control/statistics/:userId/:areaId?date=2026-04-13`

---

## 🔐 硬件集成指南

### MQTT 设备 (推荐)

用于 FederGR IoT 网关，适合现代物联网部署。

```typescript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker:1883');

client.subscribe('devices/{deviceId}/process-request', (err) => {
  if (!err) {
    console.log('Subscribed to access control requests');
  }
});

client.on('message', (topic, message) => {
  const request = JSON.parse(message);
  // 发送到服务器处理
  fetch('http://localhost:3003/api/access-control/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
});
```

### HTTP 设备

用于支持 REST API 的门禁设备。

```bash
curl -X POST http://localhost:3003/api/access-control/process \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "accessType": "card",
    "identifier": "4100001234567890",
    "timestamp": "2026-04-13T10:30:45.000Z"
  }'
```

### Modbus 设备

用于工业门禁控制器。

```python
import minimalmodbus

meter = minimalmodbus.Instrument('COM3', 1)
# 读取状态寄存器
status = meter.read_register(0x1000)
# 写入控制寄存器 (打开门)
meter.write_register(0x2000, 1)
```

---

## 👥 权限级别

| 级别 | 值 | 说明 |
|------|-----|------|
| NONE | 0 | 无权限 |
| BASIC | 1 | 基础权限（学生） |
| STAFF | 2 | 员工权限（教师） |
| ADMIN | 3 | 管理员权限 |
| SUPER_ADMIN | 4 | 超级管理员 |

---

## 📊 数据模型

### 门禁设备 (AccessDevice)

| 字段 | 类型 | 说明 |
|------|-----|------|
| id | string | 设备唯一标识 |
| name | string | 设备名称 |
| type | enum | 设备类型 (刷卡、人脸等) |
| location | string | 位置 |
| status | enum | 状态 (在线、离线、故障) |
| hardwareId | string | 硬件认证 ID |
| isOnline | boolean | 是否在线 |
| lastHeartbeat | Date | 最后心跳时间 |

### 访问权限 (UserAccessPermission)

| 字段 | 类型 | 说明 |
|------|-----|------|
| id | string | 权限 ID |
| userId | string | 用户 ID |
| areaId | string | 区域 ID |
| permissionLevel | enum | 权限级别 |
| cardNumber | string | 卡号 |
| startDate | Date | 权限开始时间 |
| endDate | Date | 权限结束时间 |
| dailyQuota | number | 每日配额 |
| isActive | boolean | 是否激活 |

### 访问记录 (AccessLog)

| 字段 | 类型 | 说明 |
|------|-----|------|
| id | string | 记录 ID |
| deviceId | string | 设备 ID |
| userId | string | 用户 ID |
| accessType | enum | 访问类型 |
| accessResult | enum | 访问结果 |
| accessTime | Date | 访问时间 |
| direction | enum | 进出方向 (IN/OUT) |

---

## 🧪 单元测试

运行所有测试:

```bash
npm test
```

生成代码覆盖率报告:

```bash
npm run test:coverage
```

---

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t federgr-access-control:latest .
```

### 运行容器

```bash
docker run -d \
  --name ac-service \
  -p 3003:3003 \
  -e NODE_ENV="production" \
  -e AC_SERVICE_PORT="3003" \
  federgr-access-control:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  access-control:
    build: modules/access-control
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
      AC_SERVICE_PORT: 3003
      AUTH_SERVICE_URL: http://auth:3001
      MQTT_BROKER_URL: mqtt://mqtt:1883
    depends_on:
      - mqtt
      - auth
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

---

## ⚙️ 配置

所有配置都通过环境变量管理：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| AC_SERVICE_PORT | 服务端口 | 3003 |
| AC_SERVICE_HOST | 服务主机 | 0.0.0.0 |
| AUTH_SERVICE_URL | 认证服务地址 | http://localhost:3001 |
| MQTT_BROKER_URL | MQTT 代理 URL | mqtt://localhost:1883 |
| LOG_LEVEL | 日志级别 | info |
| HEARTBEAT_INTERVAL | 心跳间隔 (ms) | 30000 |

---

## 🔍 监控和维护

### 健康检查

```bash
curl http://localhost:3003/health
```

### 设备状态

```bash
curl http://localhost:3003/api/access-control/devices/{deviceId}/status
```

### 日志查询

查看最近 100 条访问记录：

```bash
curl -X POST http://localhost:3003/api/access-control/logs \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-1",
    "limit": 100,
    "offset": 0
  }'
```

---

## 🐛 故障排查

### 设备离线

1. 检查网络连接：`ping <device-ip>`
2. 查看心跳日志：`grep "Heartbeat" logs/access-control.log`
3. 验证硬件认证 ID 是否正确

### 访问被拒绝

1. 检查用户权限是否存在
2. 验证权限未过期
3. 检查是否在黑名单中
4. 检查配额是否超限

### 高误识率

1. 检查设备故障日志
2. 验证硬件配置是否正确
3. 考虑增加识别阈值

---

## 📖 最佳实践

1. **定期备份** - 定期备份访问控制配置和日志
2. **监控心跳** - 设置告警监控设备离线
3. **日志分析** - 定期分析访问日志发现异常
4. **权限审计** - 定期审计用户权限
5. **安全更新** - 及时更新硬件固件

---

## 📞 支持

- 📧 技术支持: support@federgr.com
- 💬 开发者论坛: forum.federgr.io
- 🐛 问题报告: GitHub Issues

---

**文档最后更新**：2026-04-13  
**生成者**：GitHub Copilot  
**许可证**：GPL-3.0
