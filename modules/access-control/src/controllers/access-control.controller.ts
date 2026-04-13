/**
 * 访问控制 REST API 控制器
 * 作者: GitHub Copilot
 *
 * 提供以下端点:
 * - POST /api/access-control/check - 检查访问权限
 * - POST /api/access-control/logs - 查询访问日志
 * - POST /api/access-control/permissions - 创建权限
 * - DELETE /api/access-control/permissions/:id - 撤销权限
 * - POST /api/access-control/devices - 注册设备
 * - DELETE /api/access-control/devices/:id - 注销设备
 * - POST /api/access-control/areas - 创建区域
 * - POST /api/access-control/blacklist - 添加黑名单
 * - GET /api/access-control/statistics - 获取统计
 */

import { Request, Response } from 'express';
import {
  AccessControlRequest,
  AccessLogQuery,
  CreateAccessPermissionDTO,
  ApiResponse,
} from '../types';
import AccessControlService from '../services/access-control.service';

/**
 * 访问控制 API 控制器
 */
export class AccessControlController {
  constructor(private accessControlService: AccessControlService) {}

  /**
   * 检查用户访问权限
   * POST /api/access-control/check
   */
  async checkAccess(req: Request, res: Response): Promise<void> {
    try {
      const { userId, areaId, permissionLevel } = req.body;

      const { allowed, reason } = await this.accessControlService.checkAccessPermission(
        userId,
        areaId,
        permissionLevel
      );

      const response: ApiResponse<any> = {
        code: allowed ? 200 : 403,
        message: allowed ? 'Access granted' : 'Access denied',
        data: { allowed, reason },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      };

      res.status(response.code).json(response);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 处理访问请求 (从硬件设备推送的请求)
   * POST /api/access-control/process
   */
  async processAccess(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, accessType, identifier, timestamp } = req.body;

      const request: AccessControlRequest = {
        deviceId,
        accessType,
        identifier,
        timestamp: new Date(timestamp),
      };

      const response = await this.accessControlService.processAccessRequest(request, deviceId);

      res.json({
        code: 200,
        message: 'Access request processed',
        data: response,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 查询访问日志
   * POST /api/access-control/logs
   */
  async queryAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const query: AccessLogQuery = {
        schoolId: req.user?.schoolId || req.body.schoolId,
        userId: req.body.userId,
        deviceId: req.body.deviceId,
        areaId: req.body.areaId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        accessResult: req.body.accessResult,
        direction: req.body.direction,
        limit: req.body.limit || 100,
        offset: req.body.offset || 0,
      };

      const result = await this.accessControlService.queryAccessLogs(query);

      res.json({
        code: 200,
        message: 'Access logs retrieved',
        data: result,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 创建用户访问权限
   * POST /api/access-control/permissions
   */
  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateAccessPermissionDTO = req.body;
      const schoolId = req.user?.schoolId || 'default';

      const permission = await this.accessControlService.createAccessPermission(dto, schoolId);

      res.status(201).json({
        code: 201,
        message: 'Permission created',
        data: permission,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 撤销用户访问权限
   * DELETE /api/access-control/permissions/:id
   */
  async revokePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.accessControlService.revokeAccessPermission(id);

      res.json({
        code: 200,
        message: 'Permission revoked',
        data: { permissionId: id },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 注册门禁设备
   * POST /api/access-control/devices
   */
  async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = req.body;

      await this.accessControlService.registerDevice(device);

      res.status(201).json({
        code: 201,
        message: 'Device registered',
        data: { deviceId: device.id },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 注销门禁设备
   * DELETE /api/access-control/devices/:id
   */
  async deregisterDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.accessControlService.deregisterDevice(id);

      res.json({
        code: 200,
        message: 'Device deregistered',
        data: { deviceId: id },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 远程操作门禁 (打开/关闭)
   * POST /api/access-control/devices/:id/lock
   */
  async remoteLockControl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'open' 或 'close'

      if (!['open', 'close'].includes(action)) {
        res.status(400).json({
          code: 400,
          message: 'Invalid action',
          errors: [{ field: 'action', message: 'Action must be "open" or "close"' }],
          timestamp: new Date(),
          requestId: req.id || 'unknown',
        });
        return;
      }

      const result = await this.accessControlService.remoteLockControl(id, action);

      res.json({
        code: result ? 200 : 400,
        message: result ? 'Lock control successful' : 'Lock control failed',
        data: { deviceId: id, action, success: result },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 创建访问区域
   * POST /api/access-control/areas
   */
  async createArea(req: Request, res: Response): Promise<void> {
    try {
      const area = req.body;

      await this.accessControlService.createAccessArea(area);

      res.status(201).json({
        code: 201,
        message: 'Area created',
        data: area,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 添加黑名单
   * POST /api/access-control/blacklist
   */
  async addToBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const entry = req.body;

      await this.accessControlService.addToBlacklist(entry);

      res.status(201).json({
        code: 201,
        message: 'Blacklist entry added',
        data: entry,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 从黑名单移除
   * DELETE /api/access-control/blacklist/:id
   */
  async removeFromBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.accessControlService.removeFromBlacklist(id);

      res.json({
        code: 200,
        message: 'Blacklist entry removed',
        data: { entryId: id },
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 获取访问统计
   * GET /api/access-control/statistics/:userId/:areaId
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { userId, areaId } = req.params;
      const { date } = req.query;

      const statistics = await this.accessControlService.getAccessStatistics(
        userId,
        areaId,
        new Date(date as string)
      );

      res.json({
        code: 200,
        message: 'Statistics retrieved',
        data: statistics,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }

  /**
   * 获取设备状态
   * GET /api/access-control/devices/:id/status
   */
  async getDeviceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const status = this.accessControlService.getDeviceStatus(id);

      res.json({
        code: 200,
        message: 'Device status retrieved',
        data: status,
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        errors: [{ field: 'error', message: String(error) }],
        timestamp: new Date(),
        requestId: req.id || 'unknown',
      });
    }
  }
}

export default AccessControlController;
