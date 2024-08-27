import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/health/health.module';
import { mixpanelToken, mongoDb, mongoUrl, redisUrl } from './config/env';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MarketModule } from './market/market.module';
import { UpgradeModule } from './upgrade/upgrade.module';
import { LabModule } from './lab/lab.module';
import { ShippingModule } from './shipping/shipping.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RedisModule } from '@goopen/nestjs-ioredis-provider';

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
    AnalyticsModule.register({
      mixpanelToken: mixpanelToken,
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    UserModule,
    MarketModule,
    UpgradeModule,
    LabModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
