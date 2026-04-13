/**
 * 认证模块入口
 * 作者: GitHub Copilot
 */

import express from 'express';
import authController from './controllers/auth.controller';

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/auth', authController);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    message: 'Auth module is running',
    timestamp: Date.now(),
  });
});

export default app;
