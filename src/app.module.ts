import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./common/health/health.module";
import { mongoDb, mongoUrl, redisUrl } from "./config/env";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { MarketModule } from "./market/market.module";
import { CustomerModule } from "./customer/customer.module";
import { ProductModule } from "./product/product.module";
import { UpgradeModule } from "./upgrade/upgrade.module";

@Module({
  imports: [
    MongooseModule.forRoot(mongoUrl, {
      dbName: mongoDb,
      readPreference: "secondaryPreferred",
    }),
    RedisModule.register({
      url: redisUrl,
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    UserModule,
    MarketModule,
    CustomerModule,
    ProductModule,
    UpgradeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
