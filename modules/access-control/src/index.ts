/**
 * 访问控制模块主程序入口
 * 作者: GitHub Copilot
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import AccessControlService from './services/access-control.service';
import AccessControlController from './controllers/access-control.controller';
import HardwareManager from './hardware/manager';

const app: Express = express();
const PORT = process.env.AC_SERVICE_PORT || 3003;
const HOST = process.env.AC_SERVICE_HOST || '0.0.0.0';

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 请求 ID 中间件
app.use((req: any, res: Response, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  next();
});

// 初始化服务
const hardwareManager = new HardwareManager();
const accessControlService = new AccessControlService(hardwareManager);
const accessControlController = new AccessControlController(accessControlService);

// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
  res.json({
    code: 200,
    message: 'Access Control service is running',
    timestamp: new Date(),
  });
});

// API 路由
const apiRouter = express.Router();

/**
 * 权限检查端点
 */
apiRouter.post('/check', async (req: Request, res: Response) => {
  await accessControlController.checkAccess(req, res);
});

/**
 * 处理访问请求
 */
apiRouter.post('/process', async (req: Request, res: Response) => {
  await accessControlController.processAccess(req, res);
});

/**
 * 访问日志查询
 */
apiRouter.post('/logs', async (req: Request, res: Response) => {
  await accessControlController.queryAccessLogs(req, res);
});

/**
 * 权限管理
 */
apiRouter.post('/permissions', async (req: Request, res: Response) => {
  await accessControlController.createPermission(req, res);
});

apiRouter.delete('/permissions/:id', async (req: Request, res: Response) => {
  await accessControlController.revokePermission(req, res);
});

/**
 * 设备管理
 */
apiRouter.post('/devices', async (req: Request, res: Response) => {
  await accessControlController.registerDevice(req, res);
});

apiRouter.delete('/devices/:id', async (req: Request, res: Response) => {
  await accessControlController.deregisterDevice(req, res);
});

apiRouter.post('/devices/:id/lock', async (req: Request, res: Response) => {
  await accessControlController.remoteLockControl(req, res);
});

apiRouter.get('/devices/:id/status', async (req: Request, res: Response) => {
  await accessControlController.getDeviceStatus(req, res);
});

/**
 * 区域管理
 */
apiRouter.post('/areas', async (req: Request, res: Response) => {
  await accessControlController.createArea(req, res);
});

/**
 * 黑名单管理
 */
apiRouter.post('/blacklist', async (req: Request, res: Response) => {
  await accessControlController.addToBlacklist(req, res);
});

apiRouter.delete('/blacklist/:id', async (req: Request, res: Response) => {
  await accessControlController.removeFromBlacklist(req, res);
});

/**
 * 统计数据
 */
apiRouter.get('/statistics/:userId/:areaId', async (req: Request, res: Response) => {
  await accessControlController.getStatistics(req, res);
});

app.use('/api/access-control', apiRouter);

// 错误处理中间件
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal server error',
    timestamp: new Date(),
    requestId: (req as any).id || 'unknown',
  });
});

// 启动服务
app.listen(PORT, HOST as any, () => {
  console.log(`
╔════════════════════════════════════════╗
║   FederGR Access Control Service        ║
╚════════════════════════════════════════╝

  🚀 Service started on ${HOST}:${PORT}
  📋 API Documentation: http://${HOST}:${PORT}/api/docs
  💚 Health Check: http://${HOST}:${PORT}/health

  Environment: ${process.env.NODE_ENV || 'development'}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  作者: GitHub Copilot
  版本: 1.0.0
  许可证: GPL-3.0
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await hardwareManager.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await hardwareManager.destroy();
  process.exit(0);
});

export default app;
