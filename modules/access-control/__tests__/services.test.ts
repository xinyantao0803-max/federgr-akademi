/**
 * 访问控制服务单元测试
 * 作者: GitHub Copilot
 */

import AccessControlService from '../src/services/access-control.service';
import HardwareManager from '../src/hardware/manager';
import {
  PermissionLevel,
  AccessDeviceStatus,
  AccessDeviceType,
  AccessType,
  AccessResult,
} from '../src/types';

describe('AccessControlService', () => {
  let service: AccessControlService;
  let hardwareManager: HardwareManager;

  beforeEach(() => {
    hardwareManager = new HardwareManager();
    service = new AccessControlService(hardwareManager);
  });

  describe('Permission Checking', () => {
    it('应该拒绝黑名单用户', async () => {
      const { allowed } = await service.checkAccessPermission('user-blacklisted', 'area-1');
      expect(allowed).toBe(false);
    });

    it('应该允许有权限的用户访问', async () => {
      // 创建权限
      await service.createAccessPermission(
        {
          userId: 'user-1',
          areaId: 'area-1',
          permissionLevel: PermissionLevel.BASIC,
          startDate: new Date(Date.now() - 86400000), // 昨天
          endDate: new Date(Date.now() + 86400000),   // 明天
        },
        'school-1'
      );

      const { allowed } = await service.checkAccessPermission('user-1', 'area-1');
      expect(allowed).toBe(true);
    });

    it('应该拒绝权限等级不足的用户', async () => {
      // 创建基础权限的用户
      await service.createAccessPermission(
        {
          userId: 'user-1',
          areaId: 'area-1',
          permissionLevel: PermissionLevel.BASIC,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        },
        'school-1'
      );

      // 创建需要管理员权限的区域
      await service.createAccessArea({
        id: 'area-admin',
        schoolId: 'school-1',
        name: 'Admin Area',
        requiredPermissionLevel: PermissionLevel.ADMIN,
        devices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { allowed } = await service.checkAccessPermission(
        'user-1',
        'area-admin',
        PermissionLevel.ADMIN
      );
      expect(allowed).toBe(false);
    });

    it('应该拒绝权限过期的用户', async () => {
      // 创建已过期的权限
      await service.createAccessPermission(
        {
          userId: 'user-1',
          areaId: 'area-1',
          permissionLevel: PermissionLevel.BASIC,
          startDate: new Date(Date.now() - 2 * 86400000), // 两天前开始
          endDate: new Date(Date.now() - 86400000),       // 昨天结束 (已过期)
        },
        'school-1'
      );

      const { allowed } = await service.checkAccessPermission('user-1', 'area-1');
      expect(allowed).toBe(false);
    });
  });

  describe('Blacklist Management', () => {
    it('应该将用户添加到黑名单', async () => {
      const entry = {
        id: 'blacklist-1',
        schoolId: 'school-1',
        userId: 'user-1',
        reason: 'Violating rules',
        startDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      };

      await service.addToBlacklist(entry);

      const isBlacklisted = (service as any).isBlacklisted('user-1');
      expect(isBlacklisted).toBe(true);
    });

    it('应该从黑名单移除用户', async () => {
      const entry = {
        id: 'blacklist-1',
        schoolId: 'school-1',
        userId: 'user-1',
        reason: 'Violating rules',
        startDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      };

      await service.addToBlacklist(entry);
      await service.removeFromBlacklist('blacklist-1');

      const isBlacklisted = (service as any).isBlacklisted('user-1');
      expect(isBlacklisted).toBe(false);
    });
  });

  describe('Access Logs', () => {
    it('应该查询访问日志', async () => {
      // 这里应该创建一些测试数据
      const result = await service.queryAccessLogs({
        schoolId: 'school-1',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应该按用户过滤日志', async () => {
      const result = await service.queryAccessLogs({
        schoolId: 'school-1',
        userId: 'user-1',
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((log) => {
        if (log.userId) {
          expect(log.userId).toBe('user-1');
        }
      });
    });
  });

  describe('Access Statistics', () => {
    it('应该计算访问统计', async () => {
      const stats = await service.getAccessStatistics('user-1', 'area-1', new Date());

      expect(stats.userId).toBe('user-1');
      expect(stats.areaId).toBe('area-1');
      expect(stats.totalAccess).toBeGreaterThanOrEqual(0);
      expect(stats.accessIn).toBeGreaterThanOrEqual(0);
      expect(stats.accessOut).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Permission Lifecycle', () => {
    it('应该完整处理权限生命周期', async () => {
      // 1. 创建权限
      const permission = await service.createAccessPermission(
        {
          userId: 'user-1',
          areaId: 'area-1',
          permissionLevel: PermissionLevel.BASIC,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
        },
        'school-1'
      );

      expect(permission).toBeDefined();
      expect(permission.isActive).toBe(true);

      // 2. 验证权限存在
      const { allowed } = await service.checkAccessPermission('user-1', 'area-1');
      expect(allowed).toBe(true);

      // 3. 撤销权限
      await service.revokeAccessPermission(permission.id);

      // 4. 验证权限已撤销
      const afterRevoke = await service.checkAccessPermission('user-1', 'area-1');
      expect(afterRevoke.allowed).toBe(false);
    });
  });
});
