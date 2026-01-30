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

  // 当用户上线时，记录其 Socket ID 与用户 ID 的映射
  @SubscribeMessage('register')
  handleRegister(@MessageBody() data: { userId: number; role: string }, @ConnectedSocket() client: Socket) {
    client.join(`role:${data.role}`);
    client.join(`user:${data.userId}`);
    console.log(`User ${data.userId} registered with socket ${client.id}`);
  }

  // 主管对客服发起“震屏提醒”
  @SubscribeMessage('shake-screen')
  handleShakeScreen(@MessageBody() data: { targetAgentId: number; message: string }) {
    this.server.to(`user:${data.targetAgentId}`).emit('on-shake', {
      from: '主管',
      message: data.message,
    });
  }

  // 客服发起求助
  @SubscribeMessage('request-help')
  handleRequestHelp(@MessageBody() data: { agentId: number; deptId: number; content: string }) {
    // 发送给本部门的所有主管
    this.server.to(`role:supervisor`).emit('on-help-request', {
      agentId: data.agentId,
      content: data.content,
    });
  }

  // 状态同步
  @SubscribeMessage('status-update')
  handleStatusUpdate(@MessageBody() data: { userId: number; status: string }) {
    this.server.emit('on-status-change', data); // 广播状态变化给所有监控端
  }
}
