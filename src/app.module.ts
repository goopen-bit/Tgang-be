import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/health/health.module';
import { mongoDb, mongoUrl } from './config/env';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MarketModule } from './market/market.module';
import { ProductModule } from './product/product.module';
import { UpgradeModule } from './upgrade/upgrade.module';
import { LabModule } from './lab/lab.module';
import { ShippingModule } from './shipping/shipping.module';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUrl, {
      dbName: mongoDb,
      readPreference: 'secondaryPreferred',
    }),
    HealthModule,
    AuthModule,
    UserModule,
    MarketModule,
    ProductModule,
    UpgradeModule,
    LabModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
