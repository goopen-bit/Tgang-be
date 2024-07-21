import { Injectable } from '@nestjs/common';
import { MongooseHealthIndicator } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private mongoose: MongooseHealthIndicator,
  ) {}

  pingMongodb() {
    return () => this.mongoose.pingCheck('mongodb');
  }
}
