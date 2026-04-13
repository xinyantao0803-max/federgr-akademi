/**
 * 认证控制器
 * 作者: GitHub Copilot
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticateJWT } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { UserRole } from '../types';

const router = Router();

/**
 * POST /auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, fullName, schoolId, role } = req.body;

    // 验证输入
    if (!username || !password || !email || !fullName || !schoolId) {
      res.status(400).json({
        code: 400,
        message: 'Missing required fields',
      });
      return;
    }

    const result = await AuthService.register({
      username,
      password,
      email,
      fullName,
      schoolId,
      role,
    });

    res.status(result.success ? 201 : 400).json({
      code: result.success ? 201 : 400,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Registration error',
    });
  }
});

/**
 * POST /auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, schoolId } = req.body;

    if (!username || !password) {
      res.status(400).json({
        code: 400,
        message: 'Missing username or password',
      });
      return;
    }

    const result = await AuthService.login({
      username,
      password,
      schoolId,
    });

    res.status(result.success ? 200 : 401).json({
      code: result.success ? 200 : 401,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Login error',
    });
  }
});

/**
 * POST /auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        code: 400,
        message: 'Missing refresh token',
      });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.status(result.success ? 200 : 401).json({
      code: result.success ? 200 : 401,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Token refresh error',
    });
  }
});

/**
 * GET /auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      });
      return;
    }

    const result = await AuthService.getUserInfo(req.user.userId);

    res.status(result.success ? 200 : 404).json({
      code: result.success ? 200 : 404,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Get user info error',
    });
  }
});

/**
 * PUT /auth/me
 * 更新当前用户信息
 */
router.put('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      });
      return;
    }

    const { email, fullName, metadata } = req.body;

    const result = await AuthService.updateUserInfo(req.user.userId, {
      email,
      fullName,
      metadata,
    });

    res.status(result.success ? 200 : 400).json({
      code: result.success ? 200 : 400,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Update user info error',
    });
  }
});

/**
 * POST /auth/change-password
 * 修改密码
 */
router.post('/change-password', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        code: 400,
        message: 'Missing password fields',
      });
      return;
    }

    const result = await AuthService.changePassword({
      userId: req.user.userId,
      oldPassword,
      newPassword,
    });

    res.status(result.success ? 200 : 400).json({
      code: result.success ? 200 : 400,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Change password error',
    });
  }
});

/**
 * POST /auth/reset-password/:userId
 * 重置用户密码（管理员）
 */
router.post(
  '/reset-password/:userId',
  authenticateJWT,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await AuthService.resetPassword({
        userId: req.params.userId,
        adminId: req.user.userId,
      });

      res.status(result.success ? 200 : 400).json({
        code: result.success ? 200 : 400,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Reset password error',
      });
    }
  }
);

/**
 * POST /auth/disable/:userId
 * 禁用用户（管理员）
 */
router.post(
  '/disable/:userId',
  authenticateJWT,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await AuthService.disableUser(req.params.userId, req.user.userId);

      res.status(result.success ? 200 : 400).json({
        code: result.success ? 200 : 400,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Disable user error',
      });
    }
  }
);

/**
 * POST /auth/enable/:userId
 * 启用用户（管理员）
 */
router.post(
  '/enable/:userId',
  authenticateJWT,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await AuthService.enableUser(req.params.userId, req.user.userId);

      res.status(result.success ? 200 : 400).json({
        code: result.success ? 200 : 400,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Enable user error',
      });
    }
  }
);

export default router;
