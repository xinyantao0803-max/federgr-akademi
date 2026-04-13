/**
 * 密码处理工具
 * 作者: GitHub Copilot
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成临时密码（用于忘记密码重置等）
 */
export function generateTemporaryPassword(length: number = 12): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return password;
}

/**
 * 验证密码强度
 * 强度检查：
 * - 最少8字符
 * - 包含大小写字母、数字、特殊符号
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码需包含特殊符号' };
  }

  return { valid: true };
}
