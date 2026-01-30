import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'healthy',
      cpuUsage: os.loadavg()[0],
      freeMem: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
      dbConnection: 'connected', // 实际从 TypeORM 获取
      activeClients: 45, // 实际从 Socket.io 获取
    };
  }
}
