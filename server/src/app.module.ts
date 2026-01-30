import { Module, Get, Controller, Res } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './modules/events/events.gateway';
import { WordsController } from './modules/words/words.controller';
import { HealthController } from './modules/health.controller';
import { join } from 'path';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getApp(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'setup-wizard.html'));
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_NAME || 'smart_cs_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
  ],
  controllers: [AppController, WordsController, HealthController],
  providers: [EventsGateway],
})
export class AppModule {}
