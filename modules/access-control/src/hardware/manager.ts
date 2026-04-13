/**
 * 硬件管理器 - 设备连接和通信管理
 * 作者: GitHub Copilot
 */

import { AccessDevice, DeviceHeartbeat, AccessControlRequest, AccessControlResponse } from '../types';
import { HardwareAdapter, HardwareAdapterFactory } from './adapter';

/**
 * 硬件管理器 - 统一管理所有硬件设备连接
 */
export class HardwareManager {
  private adapters: Map<string, HardwareAdapter> = new Map();
  private deviceHeartbeatMap: Map<string, DeviceHeartbeat> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timer> = new Map();

  /**
   * 注册设备
   */
  async registerDevice(device: AccessDevice): Promise<void> {
    const adapter = HardwareAdapterFactory.createAdapter(device);
    this.adapters.set(device.id, adapter);

    try {
      await adapter.connect();
      console.log(`✓ Device registered: ${device.id}`);
    } catch (error) {
      console.error(`✗ Failed to register device ${device.id}: ${error}`);
      throw error;
    }
  }

  /**
   * 注销设备
   */
  async deregisterDevice(deviceId: string): Promise<void> {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // 停止心跳监控
    this.stopHeartbeat(deviceId);

    // 断开连接
    await adapter.disconnect();
    this.adapters.delete(deviceId);
    console.log(`✓ Device deregistered: ${deviceId}`);
  }

  /**
   * 发送访问控制请求
   */
  async sendAccessControl(
    deviceId: string,
    request: AccessControlRequest
  ): Promise<AccessControlResponse> {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      return await adapter.sendAccessControl(request);
    } catch (error) {
      console.error(`✗ Access control failed for device ${deviceId}: ${error}`);
      throw error;
    }
  }

  /**
   * 启动设备心跳监控
   */
  startHeartbeat(deviceId: string, interval: number = 30000): void {
    // 防止重复启动
    if (this.heartbeatIntervals.has(deviceId)) {
      console.warn(`Heartbeat already started for device ${deviceId}`);
      return;
    }

    const timer = setInterval(async () => {
      try {
        const adapter = this.adapters.get(deviceId);
        if (adapter) {
          const heartbeat = await adapter.receiveHeartbeat();
          this.deviceHeartbeatMap.set(deviceId, heartbeat);
          console.log(`♥ Heartbeat received from ${deviceId}`);
        }
      } catch (error) {
        console.error(`✗ Heartbeat failed for device ${deviceId}: ${error}`);
      }
    }, interval);

    this.heartbeatIntervals.set(deviceId, timer);
  }

  /**
   * 停止设备心跳监控
   */
  stopHeartbeat(deviceId: string): void {
    const timer = this.heartbeatIntervals.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatIntervals.delete(deviceId);
      console.log(`✓ Heartbeat stopped for device ${deviceId}`);
    }
  }

  /**
   * 获取最后一次心跳信息
   */
  getLastHeartbeat(deviceId: string): DeviceHeartbeat | undefined {
    return this.deviceHeartbeatMap.get(deviceId);
  }

  /**
   * 检查设备是否在线
   */
  isDeviceOnline(deviceId: string): boolean {
    const heartbeat = this.deviceHeartbeatMap.get(deviceId);
    if (!heartbeat) return false;

    // 如果最后心跳在 2 分钟内，视为在线
    const timeSinceLastHeartbeat = Date.now() - new Date(heartbeat.timestamp).getTime();
    return timeSinceLastHeartbeat < 120000;
  }

  /**
   * 远程操作门禁
   */
  async remoteLockControl(deviceId: string, action: 'open' | 'close'): Promise<boolean> {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      return await adapter.remoteLockControl(action);
    } catch (error) {
      console.error(`✗ Lock control failed for device ${deviceId}: ${error}`);
      throw error;
    }
  }

  /**
   * 批量启动所有设备的心跳
   */
  startAllHeartbeats(interval: number = 30000): void {
    for (const deviceId of this.adapters.keys()) {
      this.startHeartbeat(deviceId, interval);
    }
  }

  /**
   * 批量停止所有设备的心跳
   */
  stopAllHeartbeats(): void {
    for (const deviceId of this.heartbeatIntervals.keys()) {
      this.stopHeartbeat(deviceId);
    }
  }

  /**
   * 获取所有设备的在线状态
   */
  getAllDeviceStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    for (const deviceId of this.adapters.keys()) {
      status.set(deviceId, this.isDeviceOnline(deviceId));
    }
    return status;
  }

  /**
   * 销毁管理器，释放所有资源
   */
  async destroy(): Promise<void> {
    // 停止所有心跳
    this.stopAllHeartbeats();

    // 断开所有设备
    const deviceIds = Array.from(this.adapters.keys());
    for (const deviceId of deviceIds) {
      await this.deregisterDevice(deviceId);
    }

    console.log('✓ Hardware manager destroyed');
  }
}

export default HardwareManager;
