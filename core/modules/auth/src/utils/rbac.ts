/**
 * RBAC（角色基访问控制）权限管理
 * 作者: GitHub Copilot
 */

import { UserRole, RolePermissions, PermissionCheckResult } from '../types';

/**
 * 角色与权限映射
 * 定义了每个角色拥有的权限
 */
export const rolePermissionsMap: RolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    // 系统管理
    'system:config:read',
    'system:config:write',
    'system:users:manage',
    'system:roles:manage',
    'system:audit:read',

    // 硬件管理
    'hardware:manage',
    'hardware:config',

    // 所有模块的完全权限
    'access-control:*',
    'edu:*',
    'iot:*',
    'payment:*',
    'broadcast:*',
  ],

  [UserRole.ADMIN]: [
    // 学校管理
    'school:config:read',
    'school:config:write',
    'school:users:read',
    'school:users:write',
    'school:users:delete',
    'school:roles:read',
    'school:audit:read',

    // 硬件管理（学校级别）
    'hardware:read',
    'hardware:write',

    // 模块权限
    'access-control:read',
    'access-control:write',
    'edu:read',
    'edu:write',
    'iot:read',
    'iot:write',
    'payment:read',
    'payment:audit',
    'broadcast:read',
    'broadcast:write',
  ],

  [UserRole.TEACHER]: [
    // 教学相关
    'edu:courses:read',
    'edu:courses:write', // 自己的课程
    'edu:grades:write', // 录入成绩
    'edu:students:read', // 查看班级学生
    'edu:attendance:read', // 查看考勤
    'access-control:read', // 查看门禁统计

    // 支付相关
    'payment:read',
    'broadcast:read', // 接收广播

    // IoT 相关
    'iot:read',
    'iot:classroom:control', // 控制教室设备
  ],

  [UserRole.STUDENT]: [
    // 学生权限
    'edu:courses:read', // 查看课表
    'edu:grades:read', // 查看成绩
    'edu:attendance:read', // 查看自己的考勤
    'payment:read', // 查看账户
    'payment:recharge', // 充值
    'broadcast:read', // 接收广播

    // IoT 相关（有限权限）
    'iot:read',
    'iot:dorm:bath:reserve', // 预约洗浴
    'iot:dorm:bath:control', // 控制自己的洗浴
    'iot:dorm:ac:read', // 查看宿舍空调
    'iot:dorm:ac:control', // 控制宿舍空调
  ],

  [UserRole.PARENT]: [
    // 家长权限
    'edu:grades:read', // 查看子女成绩
    'edu:attendance:read', // 查看子女考勤
    'payment:read', // 查看账户消费记录
    'access-control:read', // 查看子女门禁记录
    'broadcast:read', // 接收广播
  ],

  [UserRole.VISITOR]: [
    // 访客权限（最小化）
    'access-control:request', // 申请访问权限
    'broadcast:read', // 接收广播
  ],
};

/**
 * 检查用户是否拥有特定权限
 */
export function checkPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissionsMap[role] || [];

  // 检查精确匹配
  if (permissions.includes(permission)) {
    return true;
  }

  // 检查通配符匹配（如 "edu:*"）
  const resourceParts = permission.split(':');
  for (const perm of permissions) {
    if (perm.endsWith(':*')) {
      const permParts = perm.split(':');
      if (permParts[0] === resourceParts[0]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 获取用户的所有权限
 */
export function getUserPermissions(role: UserRole): string[] {
  return rolePermissionsMap[role] || [];
}

/**
 * 检查用户是否拥有任意一个权限
 */
export function checkAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((perm) => checkPermission(role, perm));
}

/**
 * 检查用户是否拥有所有权限
 */
export function checkAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((perm) => checkPermission(role, perm));
}

/**
 * 检查用户是否可以访问特定资源
 */
export function checkResourceAccess(
  role: UserRole,
  resource: string,
  action: string
): PermissionCheckResult {
  const permission = `${resource}:${action}`;

  if (checkPermission(role, permission)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `User role '${role}' does not have permission '${permission}'`,
  };
}

/**
 * 根据权限过滤用户可以执行的操作列表
 */
export function filterActions(role: UserRole, resource: string, actions: string[]): string[] {
  return actions.filter((action) => {
    const permission = `${resource}:${action}`;
    return checkPermission(role, permission);
  });
}

/**
 * 比较两个角色的权限级别
 * 返回值: 1=role1权限更高, -1=role2权限更高, 0=相同
 */
export function compareRoles(role1: UserRole, role2: UserRole): number {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 6,
    [UserRole.ADMIN]: 5,
    [UserRole.TEACHER]: 3,
    [UserRole.STUDENT]: 2,
    [UserRole.PARENT]: 1,
    [UserRole.VISITOR]: 0,
  };

  const level1 = roleHierarchy[role1] || 0;
  const level2 = roleHierarchy[role2] || 0;

  if (level1 > level2) return 1;
  if (level1 < level2) return -1;
  return 0;
}
