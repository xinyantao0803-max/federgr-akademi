/**
 * JWT 工具单元测试
 * 作者: GitHub Copilot
 */

import { generateToken, verifyToken, refreshAccessToken, isTokenExpiringSoon, TokenType } from '../../src/utils/jwt';
import { UserRole, JWTPayload } from '../../src/types';

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test-user-123',
    schoolId: 'school-001',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.STUDENT,
  };

  describe('generateToken', () => {
    it('should generate a valid access token', () => {
      const token = generateToken(testPayload, TokenType.ACCESS);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 格式: header.payload.signature
    });

    it('should generate a valid refresh token', () => {
      const token = generateToken(testPayload, TokenType.REFRESH);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should assign correct token type to payload', () => {
      const accessToken = generateToken(testPayload, TokenType.ACCESS);
      const verified = verifyToken(accessToken);
      expect(verified?.type).toBe(TokenType.ACCESS);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(testPayload, TokenType.ACCESS);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(testPayload.userId);
      expect(verified?.schoolId).toBe(testPayload.schoolId);
      expect(verified?.username).toBe(testPayload.username);
    });

    it('should return null for invalid token', () => {
      const verified = verifyToken('invalid.token.here');
      expect(verified).toBeNull();
    });

    it('should validate token type', () => {
      const accessToken = generateToken(testPayload, TokenType.ACCESS);
      const verified = verifyToken(accessToken, TokenType.ACCESS);
      expect(verified).toBeDefined();

      const verifiedWrongType = verifyToken(accessToken, TokenType.REFRESH);
      expect(verifiedWrongType).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Create a token that expires in 0.1 seconds
      const token = generateToken(testPayload, TokenType.ACCESS, '0.1s');
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const verified = verifyToken(token);
      expect(verified).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from refresh token', () => {
      const refreshToken = generateToken(testPayload, TokenType.REFRESH);
      const newAccessToken = refreshAccessToken(refreshToken);

      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(refreshToken);

      const verified = verifyToken(newAccessToken!);
      expect(verified?.type).toBe(TokenType.ACCESS);
    });

    it('should return null for invalid refresh token', () => {
      const newToken = refreshAccessToken('invalid.token.here');
      expect(newToken).toBeNull();
    });

    it('should not work with access token as refresh token', () => {
      const accessToken = generateToken(testPayload, TokenType.ACCESS);
      const result = refreshAccessToken(accessToken);
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should detect token expiring soon', async () => {
      const token = generateToken(testPayload, TokenType.ACCESS, '2s');
      
      // Token should not be expiring in first second
      expect(isTokenExpiringSoon(token, 1)).toBe(false);

      // Wait 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Now it should be expiring soon (less than 1 second left)
      expect(isTokenExpiringSoon(token, 1)).toBe(true);
    });

    it('should use default threshold of 5 minutes', () => {
      const token = generateToken(testPayload, TokenType.ACCESS, '4m');
      // 4 minutes = 240 seconds, which is less than 5 minutes (300 seconds)
      expect(isTokenExpiringSoon(token)).toBe(true);
    });
  });
});
