import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // 记录 userId -> socketId 的映射，用于排他性检查
  private userSocketMap = new Map<number, string>();

  // 当用户上线时，记录其 Socket ID 与用户 ID 的映射
  @SubscribeMessage('register')
  handleRegister(@MessageBody() data: { userId: number; role: string }, @ConnectedSocket() client: Socket) {
    // 1. 检查该用户是否已经在其他地方登录
    const existingSocketId = this.userSocketMap.get(data.userId);
    if (existingSocketId && existingSocketId !== client.id) {
      // 2. 向旧设备发送“强制下线”指令
      this.server.to(existingSocketId).emit('force-logout', {
        reason: '您的账号在另一台设备上登录，您已被强制下线。'
      });
      console.log(`User ${data.userId} kicked out old session: ${existingSocketId}`);
    }

    // 3. 更新当前的映射关系
    this.userSocketMap.set(data.userId, client.id);
    
    client.join(`role:${data.role}`);
    client.join(`user:${data.userId}`);
    console.log(`User ${data.userId} registered with new socket ${client.id}`);
  }

  // 当连接断开时，清理映射（可选，建议保留直到新连接替换）
  handleDisconnect(client: Socket) {
    // 逻辑：如果断开的是当前记录的 socket，则清理
    // 避免误清理已被新连接覆盖的记录
  }

  // 主管对客服发起“私密指导”
  @SubscribeMessage('supervisor-whisper')
  handleWhisper(@MessageBody() data: { agentId: number; message: string }) {
    this.server.to(`user:${data.agentId}`).emit('on-whisper', {
      content: data.message,
      from: '主管指导'
    });
  }

  // 客服发起求助（增加文字内容）
  @SubscribeMessage('request-help')
  handleRequestHelp(@MessageBody() data: { agentId: number; content: string; screenshot?: string }) {
    this.server.to(`role:supervisor`).emit('on-help-request', {
      agentId: data.agentId,
      content: data.content,
      screenshot: data.screenshot
    });
  }

  // 存储用户最后心跳时间
  private lastHeartbeat = new Map<number, number>();

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@MessageBody() data: { userId: number }) {
    this.lastHeartbeat.set(data.userId, Date.now());
  }

  // 定时检查心跳（每 10 秒执行一次）
  checkLiveness() {
    const now = Date.now();
    this.lastHeartbeat.forEach((time, userId) => {
      if (now - time > 15000) { // 超过 15 秒没心跳
        this.server.emit('on-status-change', { 
          userId, 
          status: 'offline', 
          isUnexpected: true // 标记为非正常退出
        });
        this.lastHeartbeat.delete(userId);
      }
    });
  }
}
