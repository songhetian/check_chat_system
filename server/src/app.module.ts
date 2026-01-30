import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost', // 实际部署时可从配置文件读取
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'smart_cs_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // 生产环境建议关闭，由 docs/database.sql 维护
    }),
    // 模块将在此处按需注入
  ],
})
export class AppModule {}
