/**
 * JWT 令牌工具函数
 * 作者: GitHub Copilot
 */

import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { JWTPayload, TokenType } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '30m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * 生成 JWT 令牌
 */
export function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  type: TokenType = TokenType.ACCESS,
  expiresIn?: string
): string {
  const expiry = expiresIn || (type === TokenType.ACCESS ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY);

  const options: SignOptions = {
    expiresIn: expiry,
    algorithm: 'HS256',
  };

  return jwt.sign(
    {
      ...payload,
      type,
    },
    JWT_SECRET,
    options
  );
}

/**
 * 验证 JWT 令牌
 */
export function verifyToken(token: string, type?: TokenType): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: ['HS256'],
    };

    const decoded = jwt.verify(token, JWT_SECRET, options) as JWTPayload;

    // 检查令牌类型
    if (type && decoded.type !== type) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 刷新访问令牌
 */
export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyToken(refreshToken, TokenType.REFRESH);

  if (!payload) {
    return null;
  }

  // 生成新的访问令牌
  const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: payload.userId,
    schoolId: payload.schoolId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
    type: TokenType.ACCESS,
  };

  return generateToken(newPayload, TokenType.ACCESS);
}

/**
 * 解析令牌（不验证签名，仅解析）
 */
export function parseToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 获取令牌剩余时间（秒）
 */
export function getRemainingTime(token: string): number | null {
  const payload = parseToken(token);

  if (!payload || !payload.exp) {
    return null;
  }

  const expiresIn = payload.exp * 1000 - Date.now();
  return expiresIn > 0 ? Math.floor(expiresIn / 1000) : null;
}

/**
 * 检查令牌是否即将过期（默认5分钟内）
 */
export function isTokenExpiringSoon(token: string, threshold: number = 300): boolean {
  const remaining = getRemainingTime(token);
  return remaining !== null && remaining < threshold;
}
