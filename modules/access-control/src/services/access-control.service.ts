/**
 * 访问控制服务 - 业务逻辑层
 * 作者: GitHub Copilot
 *
 * 处理门禁权限检查、访问记录、配额管理等核心业务逻辑
 */

import {
  AccessDevice,
  AccessArea,
  UserAccessPermission,
  AccessLog,
  AccessStatistics,
  BlacklistEntry,
  AccessControlRequest,
  AccessControlResponse,
  AccessResult,
  PermissionLevel,
  CreateAccessPermissionDTO,
  AccessLogQuery,
  AccessLogQueryResult,
} from '../types';
import HardwareManager from '../hardware/manager';

/**
 * 访问控制业务服务
 */
export class AccessControlService {
  private hardwareManager: HardwareManager;

  // 模拟数据存储 (实际应使用数据库)
  private devices: Map<string, AccessDevice> = new Map();
  private areas: Map<string, AccessArea> = new Map();
  private permissions: Map<string, UserAccessPermission> = new Map();
  private accessLogs: AccessLog[] = [];
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private quotaUsage: Map<string, { daily: number; weekly: number }> = new Map();

  constructor(hardwareManager: HardwareManager) {
    this.hardwareManager = hardwareManager;
  }

  /**
   * 检查用户是否在黑名单中
   */
  isBlacklisted(userId?: string, cardNumber?: string): boolean {
    if (userId) {
      for (const [, entry] of this.blacklist) {
        if (entry.userId === userId && entry.isActive) {
          const now = new Date();
          if (!entry.endDate || now < entry.endDate) {
            return true;
          }
        }
      }
    }

    if (cardNumber) {
      for (const [, entry] of this.blacklist) {
        if (entry.cardNumber === cardNumber && entry.isActive) {
          const now = new Date();
          if (!entry.endDate || now < entry.endDate) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 检查用户访问权限
   */
  async checkAccessPermission(
    userId: string | undefined,
    areaId: string,
    permissionLevel: PermissionLevel = PermissionLevel.BASIC
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 检查黑名单
    if (this.isBlacklisted(userId)) {
      return { allowed: false, reason: 'User is blacklisted' };
    }

    // 检查区域权限
    const area = this.areas.get(areaId);
    if (!area) {
      return { allowed: false, reason: 'Area not found' };
    }

    // 访客不需要权限检查
    if (!userId) {
      return { allowed: area.requiredPermissionLevel === PermissionLevel.NONE };
    }

    // 查找用户权限
    const userPermissions = Array.from(this.permissions.values()).filter(
      (p) => p.userId === userId && p.areaId === areaId && p.isActive
    );

    if (userPermissions.length === 0) {
      return { allowed: false, reason: 'No permission for this area' };
    }

    const permission = userPermissions[0];

    // 检查权限级别
    if (permission.permissionLevel < area.requiredPermissionLevel) {
      return { allowed: false, reason: 'Insufficient permission level' };
    }

    // 检查权限有效期
    const now = new Date();
    if (now < permission.startDate || now > permission.endDate) {
      return { allowed: false, reason: 'Permission expired' };
    }

    // 检查配额
    if (!await this.checkQuota(userId, areaId)) {
      return { allowed: false, reason: 'Daily or weekly quota exceeded' };
    }

    return { allowed: true };
  }

  /**
   * 检查访问配额
   */
  private async checkQuota(userId: string, areaId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const quotaKey = `${userId}-${areaId}-${today}`;

    const permission = Array.from(this.permissions.values()).find(
      (p) => p.userId === userId && p.areaId === areaId && p.isActive
    );

    if (!permission) return false;

    const usage = this.quotaUsage.get(quotaKey) || { daily: 0, weekly: 0 };

    // 检查日配额
    if (permission.dailyQuota && usage.daily >= permission.dailyQuota) {
      return false;
    }

    // 检查周配额 (简化实现)
    if (permission.weeklyQuota && usage.weekly >= permission.weeklyQuota) {
      return false;
    }

    return true;
  }

  /**
   * 更新配额使用
   */
  private updateQuotaUsage(userId: string, areaId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const quotaKey = `${userId}-${areaId}-${today}`;

    const usage = this.quotaUsage.get(quotaKey) || { daily: 0, weekly: 0 };
    usage.daily++;
    usage.weekly++;

    this.quotaUsage.set(quotaKey, usage);
  }

  /**
   * 处理访问请求
   */
  async processAccessRequest(
    request: AccessControlRequest,
    deviceId: string
  ): Promise<AccessControlResponse> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        result: AccessResult.DEVICE_ERROR,
        message: 'Device not found',
        timestamp: new Date(),
      };
    }

    try {
      // 发送到硬件设备验证
      const hardwareResponse = await this.hardwareManager.sendAccessControl(deviceId, request);

      // 记录访问日志
      await this.recordAccessLog(deviceId, request, hardwareResponse);

      // 如果访问被允许，更新配额
      if (hardwareResponse.result === AccessResult.GRANTED && hardwareResponse.userId) {
        const area = Array.from(this.areas.values()).find(
          (a) => a.devices.includes(deviceId)
        );
        if (area) {
          this.updateQuotaUsage(hardwareResponse.userId, area.id);
        }
      }

      return hardwareResponse;
    } catch (error) {
      return {
        result: AccessResult.DEVICE_ERROR,
        message: `Device error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 记录访问日志
   */
  private async recordAccessLog(
    deviceId: string,
    request: AccessControlRequest,
    response: AccessControlResponse
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    const area = Array.from(this.areas.values()).find(
      (a) => a.devices.includes(deviceId)
    );

    const log: AccessLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      schoolId: device?.schoolId || 'unknown',
      deviceId,
      userId: response.userId,
      accessType: request.accessType,
      accessResult: response.result,
      accessTime: request.timestamp,
      areaId: area?.id || 'unknown',
      direction: Math.random() > 0.5 ? 'IN' : 'OUT',
      deviceName: device?.name || 'Unknown Device',
      userName: response.userId || 'Unknown User',
      errorMessage: response.result !== AccessResult.GRANTED ? response.message : undefined,
    };

    this.accessLogs.push(log);

    // 这里应该异步写入数据库
    console.log(`[ACCESS LOG] ${log.deviceName} - ${log.userName} - ${log.accessResult}`);
  }

  /**
   * 查询访问日志
   */
  async queryAccessLogs(query: AccessLogQuery): Promise<AccessLogQueryResult> {
    let results = this.accessLogs.filter((log) => {
      if (query.schoolId && log.schoolId !== query.schoolId) return false;
      if (query.userId && log.userId !== query.userId) return false;
      if (query.deviceId && log.deviceId !== query.deviceId) return false;
      if (query.areaId && log.areaId !== query.areaId) return false;
      if (query.accessResult && log.accessResult !== query.accessResult) return false;
      if (query.direction && log.direction !== query.direction) return false;

      if (query.startDate && log.accessTime < query.startDate) return false;
      if (query.endDate && log.accessTime > query.endDate) return false;

      return true;
    });

    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    results = results.slice(offset, offset + limit);

    return { total, data: results };
  }

  /**
   * 创建用户访问权限
   */
  async createAccessPermission(
    dto: CreateAccessPermissionDTO,
    schoolId: string
  ): Promise<UserAccessPermission> {
    const permission: UserAccessPermission = {
      id: `perm-${Date.now()}-${Math.random()}`,
      schoolId,
      userId: dto.userId,
      areaId: dto.areaId,
      permissionLevel: dto.permissionLevel,
      cardNumber: dto.cardNumber,
      faceData: dto.faceData,
      fingerprintData: dto.fingerprintData,
      pinCode: dto.pinCode, // 实际应加密
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: true,
      dailyQuota: dto.dailyQuota || 0,
      weeklyQuota: dto.weeklyQuota || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };

    this.permissions.set(permission.id, permission);
    return permission;
  }

  /**
   * 撤销用户访问权限
   */
  async revokeAccessPermission(permissionId: string): Promise<void> {
    const permission = this.permissions.get(permissionId);
    if (permission) {
      permission.isActive = false;
      permission.updatedAt = new Date();
      this.permissions.set(permissionId, permission);
    }
  }

  /**
   * 注册设备
   */
  async registerDevice(device: AccessDevice): Promise<void> {
    this.devices.set(device.id, device);
    await this.hardwareManager.registerDevice(device);
    this.hardwareManager.startHeartbeat(device.id, 30000);
  }

  /**
   * 注销设备
   */
  async deregisterDevice(deviceId: string): Promise<void> {
    this.devices.delete(deviceId);
    await this.hardwareManager.deregisterDevice(deviceId);
  }

  /**
   * 创建访问区域
   */
  async createAccessArea(area: AccessArea): Promise<void> {
    this.areas.set(area.id, area);
  }

  /**
   * 添加黑名单条目
   */
  async addToBlacklist(entry: BlacklistEntry): Promise<void> {
    this.blacklist.set(entry.id, entry);
  }

  /**
   * 从黑名单移除
   */
  async removeFromBlacklist(entryId: string): Promise<void> {
    this.blacklist.delete(entryId);
  }

  /**
   * 获取访问统计
   */
  async getAccessStatistics(userId: string, areaId: string, date: Date): Promise<AccessStatistics> {
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = this.accessLogs.filter(
      (log) =>
        log.userId === userId &&
        log.areaId === areaId &&
        log.accessTime.toISOString().split('T')[0] === dateStr
    );

    const stats: AccessStatistics = {
      id: `stats-${userId}-${areaId}-${dateStr}`,
      schoolId: dayLogs[0]?.schoolId || 'unknown',
      userId,
      areaId,
      date,
      totalAccess: dayLogs.length,
      accessIn: dayLogs.filter((l) => l.direction === 'IN').length,
      accessOut: dayLogs.filter((l) => l.direction === 'OUT').length,
      deniedCount: dayLogs.filter((l) => l.accessResult === AccessResult.DENIED).length,
      allowedCount: dayLogs.filter((l) => l.accessResult === AccessResult.GRANTED).length,
    };

    return stats;
  }

  /**
   * 远程操作门禁
   */
  async remoteLockControl(deviceId: string, action: 'open' | 'close'): Promise<boolean> {
    return this.hardwareManager.remoteLockControl(deviceId, action);
  }

  /**
   * 获取设备在线状态
   */
  getDeviceStatus(deviceId: string): { online: boolean; lastHeartbeat?: Date } {
    const isOnline = this.hardwareManager.isDeviceOnline(deviceId);
    const heartbeat = this.hardwareManager.getLastHeartbeat(deviceId);

    return {
      online: isOnline,
      lastHeartbeat: heartbeat ? new Date(heartbeat.timestamp) : undefined,
    };
  }
}

export default AccessControlService;
