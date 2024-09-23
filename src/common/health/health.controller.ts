import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private service: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      this.service.pingMongodb(),
      this.service.pingRedis(),
    ]);
  }
}
