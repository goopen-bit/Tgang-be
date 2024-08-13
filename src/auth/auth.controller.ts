import { Controller, Ip, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Query() query: any,
    @Ip() ip: string,
  ) {
    return this.authService.login(query, ip);
  }
}
