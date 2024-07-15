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
import { ProductModule } from "./product/product.module";
import { UpgradeModule } from "./upgrade/upgrade.module";
import { LabModule } from "./lab/lab.module";

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
    ProductModule,
    UpgradeModule,
    LabModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
