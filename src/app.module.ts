import { RedisModule } from '@goopen/nestjs-ioredis-provider';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/health/health.module';
import { mongoDb, mongoUrl, redisUrl } from './config/env';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUrl, {
      dbName: mongoDb,
      readPreference: 'secondaryPreferred',
    }),
    RedisModule.register({
      url: redisUrl,
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
