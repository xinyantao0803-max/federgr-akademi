/**
 * 访问控制系统类型定义
 * 作者: GitHub Copilot
 *
 * 包括门禁、权限、访问记录等类型
 */

/**
 * 门禁设备状态枚举
 */
export enum AccessDeviceStatus {
  ACTIVE = 'active',           // 正常工作
  MAINTENANCE = 'maintenance', // 维护中
  BREAKDOWN = 'breakdown',      // 故障
  OFFLINE = 'offline',          // 离线
}

/**
 * 门禁设备类型枚举
 */
export enum AccessDeviceType {
  CARD_READER = 'card_reader',     // 刷卡机
  FACIAL_RECOGNITION = 'facial',   // 人脸识别
  FINGERPRINT = 'fingerprint',     // 指纹识别
  PIN_PAD = 'pin_pad',             // 密码键盘
  MULTI_MODAL = 'multi_modal',     // 多模态 (刷卡 + 人脸)
}

/**
 * 访问结果枚举
 */
export enum AccessResult {
  GRANTED = 'granted',             // 允许通过
  DENIED = 'denied',               // 拒绝通过
  EXPIRED = 'expired',             // 权限过期
  QUOTA_EXCEEDED = 'quota_exceeded', // 配额超限
  DEVICE_ERROR = 'device_error',   // 设备错误
  NETWORK_ERROR = 'network_error', // 网络错误
}

/**
 * 用户访问类型
 */
export enum AccessType {
  CARD = 'card',           // 刷卡
  FACIAL = 'facial',       // 人脸
  FINGERPRINT = 'fingerprint', // 指纹
  PIN = 'pin',             // 密码
  MOBILE = 'mobile',       // 手机验证
}

/**
 * 门禁区域权限级别
 */
export enum PermissionLevel {
  NONE = 0,        // 无权限
  BASIC = 1,       // 基础权限 (学生)
  STAFF = 2,       // 员工权限 (教师)
  ADMIN = 3,       // 管理员权限
  SUPER_ADMIN = 4, // 超级管理员
}

/**
 * 门禁设备配置接口
 */
export interface AccessDevice {
  id: string;
  schoolId: string;
  name: string;                    // 设备名称 (e.g., "宿舍1楼门禁")
  type: AccessDeviceType;          // 设备类型
  location: string;                // 设备位置 (e.g., "A栋宿舍一楼")
  serialNumber: string;            // 序列号
  firmwareVersion: string;         // 固件版本
  status: AccessDeviceStatus;      // 设备状态
  ipAddress?: string;              // IP 地址
  port?: number;                   // 通信端口
  hardwareId: string;              // 硬件认证 ID (联邦硬件密钥)
  areaId: string;                  // 所属区域 ID
  config: DeviceConfig;            // 设备配置
  isOnline: boolean;               // 是否在线
  lastHeartbeat?: Date;            // 最后心跳时间
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 设备配置接口
 */
export interface DeviceConfig {
  timeout: number;                 // 识别超时时间 (秒)
  maxRetries: number;              // 最大重试次数
  alarmOnFailure: boolean;         // 失败时报警
  enableOfflineMode: boolean;      // 启用离线模式
  offlineCacheDuration: number;    // 离线缓存时长 (小时)
  updateFirmwareAuto: boolean;     // 自动更新固件
}

/**
 * 门禁区域接口
 */
export interface AccessArea {
  id: string;
  schoolId: string;
  name: string;                    // 区域名称 (e.g., "宿舍区", "图书馆")
  description?: string;
  parentAreaId?: string;           // 上级区域 ID (树形结构)
  devices: string[];               // 该区域的设备 ID 列表
  requiredPermissionLevel: PermissionLevel;
  businessHours?: BusinessHours;   // 营业时间
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 营业时间配置
 */
export interface BusinessHours {
  monday?: TimeRange [];
  tuesday?: TimeRange [];
  wednesday?: TimeRange [];
  thursday?: TimeRange [];
  friday?: TimeRange [];
  saturday?: TimeRange [];
  sunday?: TimeRange [];
}

/**
 * 时间范围
 */
export interface TimeRange {
  start: string;  // HH:mm 格式
  end: string;
}

/**
 * 用户访问权限接口
 */
export interface UserAccessPermission {
  id: string;
  schoolId: string;
  userId: string;                  // 用户 ID
  areaId: string;                  // 区域 ID
  permissionLevel: PermissionLevel; // 权限级别
  cardNumber?: string;             // 刷卡号
  faceData?: string;               // 人脸数据 (Base64 编码)
  fingerprintData?: string;        // 指纹数据 (Base64 编码)
  pinCode?: string;                // 密码 (加密存储)
  startDate: Date;                 // 权限开始日期
  endDate: Date;                   // 权限结束日期
  isActive: boolean;               // 是否激活
  dailyQuota?: number;             // 每日进出配额 (0 = 无限制)
  weeklyQuota?: number;            // 每周进出配额 (0 = 无限制)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // 创建者 ID
}

/**
 * 访问记录接口
 */
export interface AccessLog {
  id: string;
  schoolId: string;
  deviceId: string;                // 设备 ID
  userId?: string;                 // 用户 ID (访客时为 null)
  cardNumber?: string;             // 刷卡号 (仅刷卡时记录)
  accessType: AccessType;          // 访问类型
  accessResult: AccessResult;      // 访问结果
  accessTime: Date;                // 访问时间
  areaId: string;                  // 区域 ID
  direction: 'IN' | 'OUT';        // 进出方向
  deviceName: string;              // 设备名称 (冗余存储用于报表)
  userName?: string;               // 用户名 (冗余存储用于报表)
  errorMessage?: string;           // 错误信息 (失败原因)
  extraData?: Record<string, any>; // 额外数据
}

/**
 * 访问统计接口
 */
export interface AccessStatistics {
  id: string;
  schoolId: string;
  userId: string;
  areaId: string;
  date: Date;
  totalAccess: number;             // 总进出次数
  accessIn: number;                // 进入次数
  accessOut: number;               // 离开次数
  deniedCount: number;             // 拒绝次数
  allowedCount: number;            // 允许次数
}

/**
 * 设备心跳包
 */
export interface DeviceHeartbeat {
  deviceId: string;
  hardwareId: string;              // 硬件认证 ID
  timestamp: Date;
  status: AccessDeviceStatus;
  memoryUsage: number;             // 内存使用率 (%)
  cpuUsage?: number;               // CPU 使用率 (%)
  temperature?: number;            // 温度 (摄氏度)
  uptime: number;                  // 运行时长 (秒)
  firmwareVersion: string;
  eventCount?: number;             // 该周期内的事件数
}

/**
 * 访问控制请求
 */
export interface AccessControlRequest {
  deviceId: string;
  accessType: AccessType;
  identifier: string;              // 识别符 (卡号、人脸数据、指纹数据等)
  timestamp: Date;
  signedData?: string;             // 请求签名数据
}

/**
 * 访问控制响应
 */
export interface AccessControlResponse {
  result: AccessResult;
  userId?: string;
  areaId?: string;
  message: string;
  timestamp: Date;
  allowedTime?: number;            // 允许通过的时间 (秒)
}

/**
 * 黑名单条目
 */
export interface BlacklistEntry {
  id: string;
  schoolId: string;
  userId?: string;
  cardNumber?: string;
  reason: string;
  startDate: Date;
  endDate?: Date;                  // null 表示永久黑名单
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * 访问请求创建DTO
 */
export interface CreateAccessPermissionDTO {
  userId: string;
  areaId: string;
  permissionLevel: PermissionLevel;
  cardNumber?: string;
  faceData?: string;
  fingerprintData?: string;
  pinCode?: string;
  startDate: Date;
  endDate: Date;
  dailyQuota?: number;
  weeklyQuota?: number;
}

/**
 * 门禁访问查询条件
 */
export interface AccessLogQuery {
  schoolId: string;
  userId?: string;
  deviceId?: string;
  areaId?: string;
  startDate?: Date;
  endDate?: Date;
  accessResult?: AccessResult;
  direction?: 'IN' | 'OUT';
  limit?: number;
  offset?: number;
}

/**
 * 门禁访问查询结果
 */
export interface AccessLogQueryResult {
  total: number;
  data: AccessLog[];
}

/**
 * API 响应格式
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  timestamp: Date;
  requestId: string;
}
