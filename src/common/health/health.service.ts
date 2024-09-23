import { RedisHealthIndicator } from '@goopen/nestjs-ioredis-provider';
import { Injectable } from '@nestjs/common';
import { MongooseHealthIndicator } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private mongoose: MongooseHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  pingMongodb() {
    return () => this.mongoose.pingCheck('mongodb');
  }

  pingRedis() {
    return () => this.redis.isHealthy('redis');
  }
}
