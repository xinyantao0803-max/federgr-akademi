/**
 * 认证业务服务
 * 作者: GitHub Copilot
 */

import { IUser, AuthRequest, UserRole, AuthMethod } from '../types';
import { hashPassword, verifyPassword, generateTemporaryPassword, validatePasswordStrength } from '../utils/password';
import { generateToken, refreshAccessToken, TokenType } from '../utils/jwt';

// 模拟数据库（实际应该使用真实数据库）
const usersDatabase: Map<string, IUser> = new Map();

export class AuthService {
  /**
   * 用户注册
   */
  static async register(data: {
    username: string;
    password: string;
    email: string;
    fullName: string;
    schoolId: string;
    role?: UserRole;
  }): Promise<{ success: boolean; message: string; user?: Partial<IUser> }> {
    // 检查密码强度
    const passwordCheck = validatePasswordStrength(data.password);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message || 'Weak password' };
    }

    // 检查用户是否已存在
    const existingUser = Array.from(usersDatabase.values()).find(
      (u) => u.username === data.username && u.schoolId === data.schoolId
    );

    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    // 创建新用户
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await hashPassword(data.password);

    const newUser: IUser = {
      id: userId,
      schoolId: data.schoolId,
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      role: data.role || UserRole.STUDENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersDatabase.set(userId, newUser);

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return {
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  /**
   * 用户登录
   */
  static async login(data: AuthRequest): Promise<{
    success: boolean;
    message: string;
    data?: {
      accessToken: string;
      refreshToken: string;
      user: Partial<IUser>;
    };
  }> {
    // 查找用户
    const user = Array.from(usersDatabase.values()).find(
      (u) => u.username === data.username && (!data.schoolId || u.schoolId === data.schoolId)
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    // 检查用户是否活跃
    if (!user.isActive) {
      return {
        success: false,
        message: 'User account is inactive',
      };
    }

    // 验证密码
    if (!user.passwordHash) {
      return {
        success: false,
        message: 'User authentication failed',
      };
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash);

    if (!passwordValid) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    usersDatabase.set(user.id, user);

    // 生成令牌
    const accessToken = generateToken(
      {
        userId: user.id,
        schoolId: user.schoolId,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      TokenType.ACCESS
    );

    const refreshToken = generateToken(
      {
        userId: user.id,
        schoolId: user.schoolId,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      TokenType.REFRESH
    );

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
    };
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    message: string;
    data?: { accessToken: string };
  }> {
    const newAccessToken = refreshAccessToken(refreshToken);

    if (!newAccessToken) {
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken },
    };
  }

  /**
   * 修改密码
   */
  static async changePassword(data: {
    userId: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const user = usersDatabase.get(data.userId);

    if (!user || !user.passwordHash) {
      return { success: false, message: 'User not found' };
    }

    // 验证旧密码
    const oldPasswordValid = await verifyPassword(data.oldPassword, user.passwordHash);

    if (!oldPasswordValid) {
      return { success: false, message: 'Old password is incorrect' };
    }

    // 检查新密码强度
    const passwordCheck = validatePasswordStrength(data.newPassword);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message || 'Weak password' };
    }

    // 更新密码
    user.passwordHash = await hashPassword(data.newPassword);
    user.updatedAt = new Date();
    usersDatabase.set(data.userId, user);

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * 重置密码（需要管理员权限）
   */
  static async resetPassword(data: { userId: string; adminId: string }): Promise<{
    success: boolean;
    message: string;
    data?: { temporaryPassword: string };
  }> {
    const user = usersDatabase.get(data.userId);
    const admin = usersDatabase.get(data.adminId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!admin || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(admin.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    // 生成临时密码
    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await hashPassword(temporaryPassword);
    user.updatedAt = new Date();
    usersDatabase.set(data.userId, user);

    return {
      success: true,
      message: 'Password reset successfully',
      data: { temporaryPassword },
    };
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: Partial<IUser>;
  }> {
    const user = usersDatabase.get(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      success: true,
      message: 'User info retrieved',
      data: userWithoutPassword,
    };
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(
    userId: string,
    updates: Partial<Pick<IUser, 'email' | 'fullName' | 'metadata'>>
  ): Promise<{ success: boolean; message: string }> {
    const user = usersDatabase.get(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    Object.assign(user, updates);
    user.updatedAt = new Date();
    usersDatabase.set(userId, user);

    return { success: true, message: 'User info updated' };
  }

  /**
   * 禁用用户账户
   */
  static async disableUser(userId: string, adminId: string): Promise<{ success: boolean; message: string }> {
    const user = usersDatabase.get(userId);
    const admin = usersDatabase.get(adminId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!admin || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(admin.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    user.isActive = false;
    user.updatedAt = new Date();
    usersDatabase.set(userId, user);

    return { success: true, message: 'User disabled' };
  }

  /**
   * 启用用户账户
   */
  static async enableUser(userId: string, adminId: string): Promise<{ success: boolean; message: string }> {
    const user = usersDatabase.get(userId);
    const admin = usersDatabase.get(adminId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!admin || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(admin.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    user.isActive = true;
    user.updatedAt = new Date();
    usersDatabase.set(userId, user);

    return { success: true, message: 'User enabled' };
  }
}
