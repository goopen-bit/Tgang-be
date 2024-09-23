import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from "@nestjs/mongoose";
import { AnalyticsModule } from "../analytics/analytics.module";
import { mongoUrl, mongoDb, redisUrl, mixpanelToken } from "./env";

export const appConfigImports = [
  MongooseModule.forRoot(mongoUrl, {
    dbName: mongoDb,
    readPreference: 'secondaryPreferred',
  }),
  RedisModule.register({
    url: `${redisUrl}?family=0`,
    isGlobal: true,
  }),
  AnalyticsModule.register({
    mixpanelToken: mixpanelToken,
    isGlobal: true,
  }),
  CacheModule.register({
    isGlobal: true,
  }),
]
