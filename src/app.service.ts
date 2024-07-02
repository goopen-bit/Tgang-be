import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: process.env.npm_package_name,
      uptime: process.uptime(),
      version: process.env.npm_package_version,
    };
  }
}
