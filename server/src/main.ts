import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 开启跨域，供局域网客户端连接
  await app.listen(3000, '0.0.0.0'); // 监听局域网所有 IP
  console.log(`Smart-CS Server is running on: ${await app.getUrl()}`);
}
bootstrap();
