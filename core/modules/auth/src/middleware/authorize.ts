/**
 * 权限检查中间件（RBAC）
 * 作者: GitHub Copilot
 */

import { Request, Response, NextFunction } from 'express';
import { checkPermission, checkAnyPermission, checkAllPermissions } from '../utils/rbac';
import { UserRole } from '../types';

/**
 * 基础权限检查中间件工厂函数
 */
function createPermissionCheck(
  permissionChecker: (role: UserRole, permissions: string[]) => boolean,
  isMultiple: boolean = false
) {
  return (permissions: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          res.status(401).json({
            code: 401,
            message: 'Unauthorized',
          });
          return;
        }

        const hasPermission = isMultiple
          ? permissionChecker(req.user.role, Array.isArray(permissions) ? permissions : [permissions])
          : checkPermission(req.user.role, permissions as string);

        if (!hasPermission) {
          res.status(403).json({
            code: 403,
            message: 'Forbidden: insufficient permissions',
            data: {
              userRole: req.user.role,
              requiredPermissions: permissions,
            },
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({
          code: 500,
          message: 'Permission check error',
        });
      }
    };
  };
}

/**
 * 检查单个权限
 * 用法: authorize('resource:action')
 */
export const authorize = createPermissionCheck(
  (role, permissions) => checkPermission(role, permissions[0]),
  false
);

/**
 * 检查任意权限（OR）
 * 用法: authorizeAny(['resource:action1', 'resource:action2'])
 */
export const authorizeAny = createPermissionCheck(checkAnyPermission, true);

/**
 * 检查所有权限（AND）
 * 用法: authorizeAll(['resource:action1', 'resource:action2'])
 */
export const authorizeAll = createPermissionCheck(checkAllPermissions, true);

/**
 * 检查用户角色
 * 用法: requireRole('admin') 或 requireRole(['admin', 'teacher'])
 */
export function requireRole(roles: UserRole | UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
        });
        return;
      }

      const rolesArray = Array.isArray(roles) ? roles : [roles];

      if (!rolesArray.includes(req.user.role)) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden: insufficient role level',
          data: {
            userRole: req.user.role,
            requiredRoles: rolesArray,
          },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Role check error',
      });
    }
  };
}

/**
 * 检查用户权限级别（管理员级别检查）
 * 用法: requireMinimumRole('teacher') - 要求至少是教师级别
 */
export function requireMinimumRole(minimumRole: UserRole) {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 6,
    [UserRole.ADMIN]: 5,
    [UserRole.TEACHER]: 3,
    [UserRole.STUDENT]: 2,
    [UserRole.PARENT]: 1,
    [UserRole.VISITOR]: 0,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
        });
        return;
      }

      const userLevel = roleHierarchy[req.user.role] || 0;
      const minimumLevel = roleHierarchy[minimumRole] || 0;

      if (userLevel < minimumLevel) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden: insufficient role level',
          data: {
            userRole: req.user.role,
            minimumRole,
          },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Role level check error',
      });
    }
  };
}

/**
 * 检查是否是自己的资源或管理员
 * 用法: checkResourceOwnership() 在路由处理器中
 */
export function isResourceOwner(
  requestUserId: string,
  targetUserId: string,
  userRole: UserRole
): boolean {
  return requestUserId === targetUserId || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
}

/**
 * 中间件：检查是否是自己的资源或管理员
 * 从 req.params.userId 或 req.body.userId 获取目标用户ID
 */
export function checkOwnershipOrAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      });
      return;
    }

    const targetUserId = req.params.userId || req.body.userId;

    if (!targetUserId) {
      next();
      return;
    }

    if (!isResourceOwner(req.user.userId, targetUserId, req.user.role)) {
      res.status(403).json({
        code: 403,
        message: 'Forbidden: cannot access other users resources',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Ownership check error',
    });
  }
}
